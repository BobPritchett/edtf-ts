import { formatCalendarDate, shiftCalendarDate, type CalendarDate } from '../calendar.js';
import type {
  ParseResult,
  EDTFDate,
  EDTFSeason,
  EDTFSet,
  EDTFList,
  EDTFInterval,
} from '../types/index.js';
import {
  calculateEpochMs,
  yearStartMs,
  yearEndMs,
  dateFromMs,
  needsClamping,
  daysInMonth,
} from '../core-utils/date-helpers.js';
import { DATE_MIN_MS, DATE_MAX_MS } from '../types/index.js';
import { parseLevel1Date, parseSeason } from './level1.js';
import { DEFAULT_SEASON_MAPPINGS } from '../normalization/season.js';

/**
 * Parse EDTF Level 2 strings
 * Level 2 adds: sets, lists, exponential years, significant digits,
 * partial qualification, and extended seasons
 */
export function parseLevel2(input: string): ParseResult {
  input = input.trim();

  // Try to parse as set (enclosed in [])
  if (input.startsWith('[') && input.endsWith(']')) {
    return parseSet(input);
  }

  // Try to parse as list (enclosed in {})
  if (input.startsWith('{') && input.endsWith('}')) {
    return parseList(input);
  }

  if (input.includes('/')) return parseLevel2Interval(input);

  // Try to parse exponential year with optional significant digits (Y-17E7 or Y3388E2S3 format)
  if (/^Y-?\d+E\d+/.test(input)) {
    return parseExponentialYear(input);
  }

  // Try to parse extended year with significant digits (Y171010000S3 format)
  if (/^Y-?\d+S\d/.test(input)) {
    return parseExtendedYearSignificantDigits(input);
  }

  // Try to parse significant digits (1950S2 format - 4-digit year)
  if (/^\d{4}S\d/.test(input)) {
    return parseSignificantDigits(input);
  }

  if (/^-?\d{4}-(?:2[5-9]|3\d|4[01])[?~%]?$/.test(input)) return parseExtendedSeason(input);

  // Try to parse partial qualification
  // Individual: ?2004-06-~11 or 2004-~06-11 (qualifier before component)
  // Group: 2004?-06-11 or 2004-06~-11 (qualifier after component)
  if (
    /^[?~%]/.test(input) ||
    /-[?~%]\d{2}/.test(input) ||
    /\d{4}[?~%]/.test(input) ||
    /\d{2}[?~%]/.test(input)
  ) {
    return parsePartialQualification(input);
  }

  // Try to parse extended season (25-41 range)
  if (/^-?\d{4}-[234]\d/.test(input)) {
    const seasonNum = Number(input.match(/-([234]\d)/)![1]);
    if (seasonNum >= 21 && seasonNum <= 41) {
      return parseExtendedSeason(input);
    }
  }

  // Fall back to Level 1 parsing
  return { success: false, errors: [{ code: 'NOT_LEVEL_2', message: 'Not a Level 2 feature' }] };
}

/**
 * Parse Level 2 interval with partial qualifications
 * Formats:
 * - 2004-06-~01/2004-06-~20 (qualified day components)
 * - 2004-~06/2004-~08 (qualified month components)
 * - ?2004-06/2004-08 (qualified year at start)
 */
function parseLevel2Interval(input: string): ParseResult<EDTFInterval> {
  const parts = input.split('/');

  if (parts.length !== 2) {
    return {
      success: false,
      errors: [
        {
          code: 'INVALID_INTERVAL',
          message: 'Interval must have exactly one "/" separator',
        },
      ],
    };
  }

  const startStr = parts[0]!.trim();
  const endStr = parts[1]!.trim();

  let start: EDTFDate | EDTFSeason | null = null;
  let end: EDTFDate | EDTFSeason | null = null;
  let openStart = false;
  let openEnd = false;

  // Parse start
  if (startStr === '..') {
    openStart = true;
  } else if (startStr === '') {
    start = null; // Unknown start
  } else {
    const startResult = parseIntervalEndpoint(startStr);

    if (!startResult.success) {
      return {
        success: false,
        errors: startResult.errors.map((err) => ({
          ...err,
          message: `Invalid interval start: ${err.message}`,
        })),
      };
    }
    start = startResult.value as EDTFDate | EDTFSeason;
  }

  // Parse end
  if (endStr === '..') {
    openEnd = true;
  } else if (endStr === '') {
    end = null; // Unknown end
  } else {
    const endResult = parseIntervalEndpoint(endStr);

    if (!endResult.success) {
      return {
        success: false,
        errors: endResult.errors.map((err) => ({
          ...err,
          message: `Invalid interval end: ${err.message}`,
        })),
      };
    }
    end = endResult.value as EDTFDate | EDTFSeason;
  }

  // Validate interval order (if both endpoints are known and not open)
  if (start && end && !openStart && !openEnd) {
    if (start.minMs > end.maxMs) {
      return {
        success: false,
        errors: [
          {
            code: 'INVALID_INTERVAL_ORDER',
            message: 'Interval start must be before or equal to end',
          },
        ],
      };
    }
  }

  const edtfInterval: EDTFInterval = {
    type: 'Interval',
    level: 2,
    edtf: input,
    precision: start?.precision || end?.precision || 'year',
    start,
    end,
    ...(openStart && { openStart }),
    ...(openEnd && { openEnd }),
    get min() {
      if (this.openStart) return new Date(-8640000000000000);
      return this.start ? this.start.min : new Date(-8640000000000000);
    },
    get max() {
      if (this.openEnd) return new Date(8640000000000000);
      return this.end ? this.end.max : new Date(8640000000000000);
    },
    get minMs() {
      if (openStart) return DATE_MIN_MS;
      return start ? start.minMs : DATE_MIN_MS;
    },
    get maxMs() {
      if (openEnd) return DATE_MAX_MS;
      return end ? end.maxMs : DATE_MAX_MS;
    },
    toJSON() {
      return {
        type: this.type,
        level: this.level,
        edtf: this.edtf,
        precision: this.precision,
        start: this.start?.toJSON(),
        end: this.end?.toJSON(),
        ...(this.openStart && { openStart: this.openStart }),
        ...(this.openEnd && { openEnd: this.openEnd }),
      };
    },
  };

  return {
    success: true,
    value: edtfInterval,
    level: 2,
  };
}

/**
 * Parse a set (one of a set)
 * Format: [1667,1668,1670..1672] or [..1760-12] or [1760-12..]
 */
function parseSet(input: string): ParseResult<EDTFSet> {
  const content = input.slice(1, -1); // Remove [ and ]

  const values: (EDTFDate | EDTFSeason)[] = [];
  let earlier = false;
  let later = false;

  if (/\s/.test(content))
    return {
      success: false,
      errors: [{ code: 'INVALID_SET', message: 'Whitespace is not allowed inside an EDTF set' }],
    };
  const parts = content.split(',');
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i]!;
    if (i === 0 && part.startsWith('..')) {
      earlier = true;
      part = part.slice(2);
    }
    if (i === parts.length - 1 && part.endsWith('..')) {
      later = true;
      part = part.slice(0, -2);
    }
    if (!part)
      return { success: false, errors: [{ code: 'INVALID_SET', message: 'Empty set member' }] };
    const endpoints = part.split('..');
    if (endpoints.length > 2)
      return { success: false, errors: [{ code: 'INVALID_RANGE', message: 'Malformed range' }] };
    const firstResult = parseSetValue(endpoints[0]!);
    if (!firstResult.success) return firstResult;
    if (endpoints.length === 1) {
      values.push(firstResult.value);
      continue;
    }
    const lastResult = parseSetValue(endpoints[1]!);
    if (!lastResult.success) return lastResult;
    const first = firstResult.value,
      last = lastResult.value;
    if (
      first.type !== 'Date' ||
      last.type !== 'Date' ||
      first.precision !== last.precision ||
      /[X?~%]/.test(part) ||
      first.minMs > last.maxMs
    )
      return {
        success: false,
        errors: [
          {
            code: 'INVALID_RANGE',
            message: 'Range endpoints must be ordered exact dates of equal precision',
          },
        ],
      };
    let current = { year: first.year, month: first.month, day: first.day } as CalendarDate;
    while (true) {
      const value = parseLevel1Date(formatCalendarDate(current));
      if (!value.success) return value;
      values.push(value.value);
      if (value.value.minMs >= last.minMs) break;
      current = shiftCalendarDate(current, 1);
    }
  }

  if (values.length === 0) {
    return {
      success: false,
      errors: [{ code: 'EMPTY_SET', message: 'Set cannot be empty' }],
    };
  }

  // Calculate min/max from values using bigint
  const allMinMs = values.map((v) => v.minMs);
  const allMaxMs = values.map((v) => v.maxMs);
  const calculatedMinMs = allMinMs.reduce((a, b) => (a < b ? a : b));
  const calculatedMaxMs = allMaxMs.reduce((a, b) => (a > b ? a : b));

  const finalMinMs = earlier ? DATE_MIN_MS : calculatedMinMs;
  const finalMaxMs = later ? DATE_MAX_MS : calculatedMaxMs;

  const edtfSet: EDTFSet = {
    type: 'Set',
    level: 2,
    edtf: input,
    precision: values[0]!.precision,
    values,
    ...(earlier && { earlier }),
    ...(later && { later }),
    get min() {
      return dateFromMs(finalMinMs);
    },
    get max() {
      return dateFromMs(finalMaxMs);
    },
    get minMs() {
      return finalMinMs;
    },
    get maxMs() {
      return finalMaxMs;
    },
    toJSON() {
      return {
        type: this.type,
        values: this.values.map((v) => v.toJSON()),
        ...(this.earlier && { earlier: true }),
        ...(this.later && { later: true }),
      };
    },
    toString() {
      return this.edtf;
    },
  };

  return { success: true, value: edtfSet, level: 2 };
}

/**
 * Parse a list (all members)
 * Format: {1667,1668,1670..1672} or {..1760-12} or {1760-12..}
 */
function parseList(input: string): ParseResult<EDTFList> {
  // List parsing is very similar to Set parsing
  const setInput = '[' + input.slice(1, -1) + ']';
  const setResult = parseSet(setInput);

  if (!setResult.success) {
    return setResult;
  }

  const setValue = setResult.value as EDTFSet;
  const edtfList: EDTFList = {
    ...setValue,
    type: 'List',
    edtf: input,
    toJSON() {
      return {
        type: this.type,
        values: this.values.map((v) => v.toJSON()),
        ...(this.earlier && { earlier: true }),
        ...(this.later && { later: true }),
      };
    },
  };

  return { success: true, value: edtfList, level: 2 };
}

/**
 * Helper to parse a single value in a set/list
 */
function parseSetValue(value: string): ParseResult<EDTFDate | EDTFSeason> {
  // Seasons with Level 1 qualifiers (21-24 with optional ?/~/%)
  if (/^\d{4}-2[1-4][?~%]?$/.test(value)) {
    return parseSeason(value);
  }

  // Extended seasons without qualifiers (21-41)
  if (/^-?\d{4}-[234]\d[?~%]?$/.test(value)) {
    return parseExtendedSeason(value);
  }

  // Exponential year notation
  if (/^Y-?\d+E\d+/.test(value)) {
    return parseExponentialYear(value);
  }

  // Extended year with significant digits
  if (/^Y-?\d{5,}S\d+/.test(value)) {
    return parseExtendedYearSignificantDigits(value);
  }

  // Significant digits (4-digit year)
  if (/^\d{4}S\d$/.test(value)) {
    return parseSignificantDigits(value);
  }

  // Partial qualifications (Level 2)
  const hasPartialQualification =
    /^[?~%]/.test(value) ||
    /-[?~%]\d{2}/.test(value) ||
    /\d{4}[?~%]-/.test(value) ||
    /\d{2}[?~%]-/.test(value);

  if (hasPartialQualification) {
    return parsePartialQualification(value);
  }

  // Fall back to Level 1 date parsing (handles unspecified digits and trailing qualifiers)
  return parseLevel1Date(value);
}

/**
 * Parse exponential year notation with optional significant digits
 * Format: Y-17E7 means -17 * 10^7 = -170,000,000
 * Format: Y3388E2S3 means 3388 * 10^2 = 338800 with 3 significant digits
 */
function parseExponentialYear(input: string): ParseResult<EDTFDate> {
  const match = input.match(/^Y(-?\d+)E(\d+)(?:S(\d+))?$/);
  if (!match) {
    return {
      success: false,
      errors: [{ code: 'INVALID_EXPONENTIAL', message: 'Invalid exponential year format' }],
    };
  }

  const base = parseInt(match[1]!, 10);
  const exponent = parseInt(match[2]!, 10);
  const sigDigits = match[3] ? parseInt(match[3], 10) : undefined;
  const year = base * Math.pow(10, exponent);
  if (!Number.isSafeInteger(year))
    return {
      success: false,
      errors: [
        { code: 'YEAR_OUT_OF_RANGE', message: 'Year must be representable as a safe integer' },
      ],
    };

  const minMsValue = yearStartMs(year);
  const maxMsValue = yearEndMs(year);
  const isClamped = needsClamping(minMsValue) || needsClamping(maxMsValue);

  const edtfDate: EDTFDate = {
    type: 'Date',
    level: 2,
    edtf: input,
    precision: 'year',
    year,
    exponential: exponent,
    ...(sigDigits !== undefined && { significantDigitsYear: sigDigits }),
    ...(isClamped && { isBoundsClamped: true }),
    get min() {
      return dateFromMs(minMsValue);
    },
    get max() {
      return dateFromMs(maxMsValue);
    },
    get minMs() {
      return minMsValue;
    },
    get maxMs() {
      return maxMsValue;
    },
    toJSON() {
      const result: any = {
        type: this.type,
        year: this.year,
        exponential: this.exponential,
      };
      if (this.significantDigitsYear !== undefined) {
        result.significantDigits = this.significantDigitsYear;
      }
      if (this.isBoundsClamped) result.isBoundsClamped = this.isBoundsClamped;
      return result;
    },
    toString() {
      return this.edtf;
    },
  };

  return { success: true, value: edtfDate, level: 2 };
}

/**
 * Parse extended year with significant digits
 * Format: Y171010000S3 means year 171010000 with 3 significant digits
 */
function parseExtendedYearSignificantDigits(input: string): ParseResult<EDTFDate> {
  const match = input.match(/^Y(-?\d{5,})S(\d+)$/);
  if (!match) {
    return {
      success: false,
      errors: [
        {
          code: 'INVALID_EXTENDED_YEAR',
          message: 'Invalid extended year with significant digits format',
        },
      ],
    };
  }

  const year = parseInt(match[1]!, 10);
  const sigDigits = parseInt(match[2]!, 10);
  if (!Number.isSafeInteger(year))
    return {
      success: false,
      errors: [
        { code: 'YEAR_OUT_OF_RANGE', message: 'Year must be representable as a safe integer' },
      ],
    };

  const minMsValue = yearStartMs(year);
  const maxMsValue = yearEndMs(year);
  const isClamped = needsClamping(minMsValue) || needsClamping(maxMsValue);

  const edtfDate: EDTFDate = {
    type: 'Date',
    level: 2,
    edtf: input,
    precision: 'year',
    year,
    significantDigitsYear: sigDigits,
    ...(isClamped && { isBoundsClamped: true }),
    get min() {
      return dateFromMs(minMsValue);
    },
    get max() {
      return dateFromMs(maxMsValue);
    },
    get minMs() {
      return minMsValue;
    },
    get maxMs() {
      return maxMsValue;
    },
    toJSON() {
      const result: any = {
        type: this.type,
        year: this.year,
        significantDigits: this.significantDigitsYear,
      };
      if (this.isBoundsClamped) result.isBoundsClamped = this.isBoundsClamped;
      return result;
    },
    toString() {
      return this.edtf;
    },
  };

  return { success: true, value: edtfDate, level: 2 };
}

/**
 * Parse significant digits
 * Format: 1950S2 means the year 1950 with 2 significant digits (represents century)
 */
function parseSignificantDigits(input: string): ParseResult<EDTFDate> {
  const match = input.match(/^(\d{4})S(\d)$/);
  if (!match) {
    return {
      success: false,
      errors: [
        { code: 'INVALID_SIGNIFICANT_DIGITS', message: 'Invalid significant digits format' },
      ],
    };
  }

  const year = parseInt(match[1]!, 10);
  const sigDigits = parseInt(match[2]!, 10);

  const minMsValue = yearStartMs(year);
  const maxMsValue = yearEndMs(year);

  const edtfDate: EDTFDate = {
    type: 'Date',
    level: 2,
    edtf: input,
    precision: 'year',
    year,
    significantDigitsYear: sigDigits,
    get min() {
      return dateFromMs(minMsValue);
    },
    get max() {
      return dateFromMs(maxMsValue);
    },
    get minMs() {
      return minMsValue;
    },
    get maxMs() {
      return maxMsValue;
    },
    toJSON() {
      return {
        type: this.type,
        year: this.year,
        significantDigits: this.significantDigitsYear,
      };
    },
    toString() {
      return this.edtf;
    },
  };

  return { success: true, value: edtfDate, level: 2 };
}

/**
 * Parse partial qualification
 * Individual component qualification (qualifier to left):
 * - ?2004-06-~11 means uncertain year, approximate day
 * - ?2004-~06 means uncertain year, approximate month
 * - 2004-~06-11 means only approximate month
 * Group qualification (qualifier to right applies to component and all to left):
 * - 2004?-06-11 means uncertain year
 * - 2004-06~-11 means approximate year and month
 * - 2004-06-11% means uncertain and approximate year, month, and day
 */
function parsePartialQualification(input: string): ParseResult<EDTFDate> {
  // Pattern: [?~%]?YYYY[?~%]?[-[?~%]?MM[?~%]?[-[?~%]?DD[?~%]?]]
  // Supports qualifiers both before (individual) and after (group) components
  const match = input.match(
    /^([?~%])?(-?\d{4})([?~%])?(?:-([?~%])?(\d{2})([?~%])?(?:-([?~%])?(\d{2})([?~%])?)?)?$/
  );

  if (!match) {
    return {
      success: false,
      errors: [
        {
          code: 'INVALID_FORMAT',
          message: `Invalid partial qualification format: ${input}`,
          suggestion:
            'Use format like ?2004-06-~11 (uncertain year, approximate day) or 2004?-06-11 (uncertain year)',
        },
      ],
    };
  }

  const yearQualBefore = match[1];
  const year = parseInt(match[2]!, 10);
  const yearQualAfter = match[3];
  const monthQualBefore = match[4];
  const month = match[5] ? parseInt(match[5], 10) : undefined;
  const monthQualAfter = match[6];
  const dayQualBefore = match[7];
  const day = match[8] ? parseInt(match[8], 10) : undefined;
  const dayQualAfter = match[9];

  // Validate month
  if (month !== undefined && (month < 1 || month > 12)) {
    return {
      success: false,
      errors: [
        {
          code: 'INVALID_MONTH',
          message: `Month must be 01-12, got: ${match[5]}`,
        },
      ],
    };
  }

  // Validate day
  if (day !== undefined && month !== undefined) {
    const maxDay = daysInMonth(year, month);
    if (day < 1 || day > maxDay) {
      return {
        success: false,
        errors: [
          {
            code: 'INVALID_DAY',
            message: `Day must be 01-${maxDay} for ${year}-${String(month).padStart(2, '0')}, got: ${match[8]}`,
          },
        ],
      };
    }
  }

  // Handle qualifications
  // Individual qualification (qualifier before component): applies only to that component
  // Group qualification (qualifier after component): applies to that component AND all to the left

  let yearQualification: import('../types/index.js').Qualification | undefined;
  let monthQualification: import('../types/index.js').Qualification | undefined;
  let dayQualification: import('../types/index.js').Qualification | undefined;

  // Combine every qualifier that applies to a component; a later group cannot erase an earlier qualifier.
  const combine = (...chars: (string | undefined)[]) => {
    const uncertain = chars.some((c) => c === '?' || c === '%');
    const approximate = chars.some((c) => c === '~' || c === '%');
    return uncertain && approximate
      ? { uncertainApproximate: true }
      : uncertain
        ? { uncertain: true }
        : approximate
          ? { approximate: true }
          : undefined;
  };
  yearQualification = combine(yearQualBefore, yearQualAfter, monthQualAfter, dayQualAfter);
  monthQualification = combine(monthQualBefore, monthQualAfter, dayQualAfter);
  dayQualification = combine(dayQualBefore, dayQualAfter);

  // Pre-calculate bounds
  const minMonth = month ?? 1;
  const maxMonth = month ?? 12;
  const minDay = day ?? 1;
  const maxDay = day ?? daysInMonth(year, maxMonth);
  const minMsValue = calculateEpochMs(year, minMonth, minDay, 0, 0, 0, 0);
  const maxMsValue = calculateEpochMs(year, maxMonth, maxDay, 23, 59, 59, 999);

  const edtfDate: EDTFDate = {
    type: 'Date',
    level: 2,
    edtf: input,
    precision: day ? 'day' : month ? 'month' : 'year',
    year,
    ...(month !== undefined && { month }),
    ...(day !== undefined && { day }),
    ...(yearQualification && { yearQualification }),
    ...(monthQualification && { monthQualification }),
    ...(dayQualification && { dayQualification }),
    get min() {
      return dateFromMs(minMsValue);
    },
    get max() {
      return dateFromMs(maxMsValue);
    },
    get minMs() {
      return minMsValue;
    },
    get maxMs() {
      return maxMsValue;
    },
    toJSON() {
      const result: any = { type: this.type, year: this.year };
      if (this.month !== undefined) result.month = this.month;
      if (this.day !== undefined) result.day = this.day;
      if (this.yearQualification) result.yearQualification = this.yearQualification;
      if (this.monthQualification) result.monthQualification = this.monthQualification;
      if (this.dayQualification) result.dayQualification = this.dayQualification;
      return result;
    },
    toString() {
      return this.edtf;
    },
  };

  return { success: true, value: edtfDate, level: 2 };
}

/**
 * Parse a qualification character into a Qualification object
 */
function parseQualificationChar(char: string): import('../types/index.js').Qualification {
  switch (char) {
    case '?':
      return { uncertain: true };
    case '~':
      return { approximate: true };
    case '%':
      return { uncertainApproximate: true };
    default:
      return {};
  }
}

/**
 * Parse extended seasons (Level 2)
 * 25-28: Southern Hemisphere seasons
 * 29-32: Meteorological seasons
 * 33-36: Quarters
 * 37-39: Quadrimesters
 * 40-41: Semestrals
 */
function parseExtendedSeason(input: string): ParseResult<EDTFSeason> {
  const match = input.match(/^(-?\d{4})-([234]\d)([?~%])?$/);
  if (!match) {
    return {
      success: false,
      errors: [{ code: 'INVALID_SEASON', message: 'Invalid season format' }],
    };
  }

  const year = parseInt(match[1]!, 10);
  const season = parseInt(match[2]!, 10);

  // Validate season range
  if (season < 21 || season > 41) {
    return {
      success: false,
      errors: [{ code: 'INVALID_SEASON', message: `Season must be 21-41, got ${season}` }],
    };
  }

  const mapping = DEFAULT_SEASON_MAPPINGS[season];
  if (!mapping) {
    return {
      success: false,
      errors: [{ code: 'INVALID_SEASON', message: `Unknown season code: ${season}` }],
    };
  }

  const startYear = year;
  const endYear = mapping.endMonth >= mapping.startMonth ? year : year + 1;
  const startMsValue = calculateEpochMs(startYear, mapping.startMonth, 1, 0, 0, 0, 0);
  const endDay = daysInMonth(endYear, mapping.endMonth);
  const endMsValue = calculateEpochMs(endYear, mapping.endMonth, endDay, 23, 59, 59, 999);

  const edtfSeason: EDTFSeason = {
    type: 'Season',
    level: season >= 25 ? 2 : 1,
    edtf: input,
    precision: 'month',
    ...(match[3] ? { qualification: parseQualificationChar(match[3]) } : {}),
    year,
    season,
    get min() {
      return dateFromMs(startMsValue);
    },
    get max() {
      return dateFromMs(endMsValue);
    },
    get minMs() {
      return startMsValue;
    },
    get maxMs() {
      return endMsValue;
    },
    toJSON() {
      return {
        type: this.type,
        year: this.year,
        season: this.season,
      };
    },
    toString() {
      return this.edtf;
    },
  };

  return { success: true, value: edtfSeason, level: season >= 25 ? 2 : 1 };
}

// Exports are handled via imports from level1

function parseIntervalEndpoint(input: string): ParseResult<EDTFDate | EDTFSeason> {
  if (/^-?\d{4}-(?:2[1-9]|3\d|4[01])[?~%]?$/.test(input)) return parseExtendedSeason(input);
  const basic = parseLevel1Date(input);
  return basic.success ? basic : parsePartialQualification(input);
}
