import type {
  ParseResult,
  EDTFDate,
  EDTFSeason,
  EDTFInterval,
  Qualification,
  UnspecifiedDigits,
  EDTFLevel,
} from '../types/index.js';
import {
  calculateEpochMs,
  yearStartMs,
  yearEndMs,
  dateFromMs,
  needsClamping,
  daysInMonth,
  isLeapYear,
} from '../core-utils/date-helpers.js';

/**
 * Determine the correct EDTF level for unspecified digit patterns.
 *
 * Level 1 unspecified (fully unspecified at component boundaries):
 * - XXXX (year only)
 * - 201X, 20XX (partial year, no month/day)
 * - XXXX-XX (year and month)
 * - XXXX-XX-XX (year, month, and day)
 * - 1985-XX (specific year, unspecified month)
 * - 1985-04-XX (specific year and month, unspecified day)
 * - 1985-XX-XX (specific year, unspecified month and day)
 *
 * Level 2 unspecified (partial unspecified within components, or mixed patterns):
 * - 156X-12-25 (partial year with specific month/day)
 * - 15XX-12-25 (partial year with specific month/day)
 * - 1XXX-XX (partial year with unspecified month)
 * - 1XXX-12 (partial year with specific month)
 * - XXXX-12-XX (fully unspecified year with specific month)
 * - 1984-1X (partial unspecified month)
 */
function determineUnspecifiedLevel(
  yearStr: string,
  monthStr?: string,
  _dayStr?: string
): EDTFLevel {
  const hasUnspecifiedYear = yearStr.includes('X');

  // If no month component, it's Level 1 (year-only patterns like XXXX, 201X, 20XX)
  if (!monthStr) {
    return 1;
  }

  // Level 1: Fully specified year with any unspecified month/day (1985-XX, 1985-04-XX, 1985-XX-XX)
  if (!hasUnspecifiedYear) {
    // Check for partial unspecified month (1984-1X) which is Level 2
    if (monthStr.includes('X') && monthStr !== 'XX') {
      return 2;
    }
    // Otherwise it's Level 1 (1985-XX, 1985-04-XX, 1985-XX-XX)
    return 1;
  }

  // Level 1: Fully unspecified year (XXXX) with fully unspecified month (XX)
  // e.g., XXXX-XX, XXXX-XX-XX
  if (yearStr === 'XXXX' && monthStr === 'XX') {
    return 1;
  }

  // Level 2: Partial unspecified year with any month (156X-12, 15XX-12, 1XXX-12, 1XXX-XX)
  if (hasUnspecifiedYear && yearStr !== 'XXXX') {
    return 2;
  }

  // Level 2: Fully unspecified year (XXXX) with specific month (XXXX-12, XXXX-12-XX)
  if (yearStr === 'XXXX' && monthStr && monthStr !== 'XX') {
    return 2;
  }

  return 1;
}

/**
 * Parse EDTF Level 1 strings
 * Level 1 adds: uncertainty, approximation, unspecified digits,
 * extended intervals, seasons, and extended years
 */
export function parseLevel1(input: string): ParseResult {
  input = input.trim();

  // Try to parse as interval first (contains '/')
  if (input.includes('/')) {
    return parseLevel1Interval(input);
  }

  // Try to parse as season (format: YYYY-2X where X is 0-9, but will validate 1-4)
  if (/^\d{4}-2\d/.test(input)) {
    return parseSeason(input);
  }

  // Parse as date with possible qualifications
  return parseLevel1Date(input);
}

/**
 * Parse Level 1 date with uncertainty, approximation, and unspecified digits
 * Exported for use in Level 2 parser
 * Formats:
 * - 1984? (uncertain year)
 * - 2004-06~ (approximate month)
 * - 2004-06-11% (uncertain and approximate)
 * - 201X (unspecified digit)
 * - 20XX (unspecified digits)
 * - 1985-XX-XX (fully unspecified month and day)
 * - Y170000002 (year exceeding 4 digits)
 * - Y-170000002 (negative year exceeding 4 digits)
 */
export function parseLevel1Date(input: string): ParseResult<EDTFDate> {
  // Extract qualification symbols from the end
  const qualification: Qualification = {};
  let dateStr = input;

  // Check for qualification at the end
  const qualMatch = input.match(/^(.+?)([?~%])$/);
  if (qualMatch) {
    dateStr = qualMatch[1]!;
    const qual = qualMatch[2]!;
    if (qual === '?') {
      qualification.uncertain = true;
    } else if (qual === '~') {
      qualification.approximate = true;
    } else if (qual === '%') {
      qualification.uncertainApproximate = true;
    }
  }

  // Check for extended year format (Y prefix)
  const extendedYearMatch = dateStr.match(/^Y(-?\d{5,})$/);
  if (extendedYearMatch) {
    const year = parseInt(extendedYearMatch[1]!, 10);
    const minMsValue = yearStartMs(year);
    const maxMsValue = yearEndMs(year);
    const isClamped = needsClamping(minMsValue) || needsClamping(maxMsValue);

    const edtfDate: EDTFDate = {
      type: 'Date',
      level: 1,
      edtf: input,
      precision: 'year',
      year,
      significantDigits: extendedYearMatch[1]!.replace('-', '').length,
      ...(Object.keys(qualification).length > 0 && { qualification }),
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
        };
        if (this.month !== undefined) result.month = this.month;
        if (this.day !== undefined) result.day = this.day;
        if (this.qualification) result.qualification = this.qualification;
        if (this.unspecified) result.unspecified = this.unspecified;
        if (this.isBoundsClamped) result.isBoundsClamped = this.isBoundsClamped;
        return result;
      },
      toString() {
        return this.edtf;
      },
    };
    return { success: true, value: edtfDate, level: 1 };
  }

  // Match date with possible X for unspecified digits
  // Supports: YYYY, YYYY-MM, YYYY-MM-DD with X in any position
  const match = dateStr.match(/^(-?[X\d]{4})(?:-([X\d]{2})(?:-([X\d]{2}))?)?$/);

  if (!match) {
    return {
      success: false,
      errors: [
        {
          code: 'INVALID_FORMAT',
          message: `Invalid Level 1 date format: ${input}`,
          suggestion:
            'Use format: YYYY, YYYY-MM, or YYYY-MM-DD (with optional ?, ~, or % and X for unspecified digits)',
        },
      ],
    };
  }

  const yearStr = match[1]!;
  const monthStr = match[2];
  const dayStr = match[3];

  // Track unspecified digits
  const unspecified: UnspecifiedDigits = {};
  const hasUnspecified = yearStr.includes('X') || monthStr?.includes('X') || dayStr?.includes('X');

  let year: number | string;
  let month: number | string | undefined;
  let day: number | string | undefined;

  // Parse year
  if (yearStr.includes('X')) {
    year = yearStr;
    unspecified.year = yearStr;
  } else {
    year = parseInt(yearStr, 10);
  }

  // Parse month
  if (monthStr) {
    if (monthStr === 'XX') {
      month = 'XX';
      unspecified.month = 'XX';
    } else if (monthStr.includes('X')) {
      month = monthStr;
      unspecified.month = monthStr;
    } else {
      month = parseInt(monthStr, 10);
      // Validate month only if fully specified
      if (month < 1 || month > 12) {
        return {
          success: false,
          errors: [
            {
              code: 'INVALID_MONTH',
              message: `Month must be 01-12, got: ${monthStr}`,
            },
          ],
        };
      }
    }
  }

  // Parse day
  if (dayStr) {
    if (dayStr === 'XX') {
      day = 'XX';
      unspecified.day = 'XX';
    } else if (dayStr.includes('X')) {
      day = dayStr;
      unspecified.day = dayStr;
    } else {
      day = parseInt(dayStr, 10);
      // Validate day only if both month and day are fully specified
      if (typeof month === 'number' && typeof year === 'number') {
        const maxDay = daysInMonth(year, month);
        if (day < 1 || day > maxDay) {
          return {
            success: false,
            errors: [
              {
                code: 'INVALID_DAY',
                message: `Day must be 01-${maxDay} for ${year}-${String(month).padStart(2, '0')}, got: ${dayStr}`,
              },
            ],
          };
        }
      }
    }
  }

  // Determine precision
  let precision: 'year' | 'month' | 'day';
  if (day !== undefined) {
    precision = 'day';
  } else if (month !== undefined) {
    precision = 'month';
  } else {
    precision = 'year';
  }

  // Pre-calculate bounds for closure
  const boundsResult = calculateBounds(year, month, day);

  // Determine the correct level for unspecified patterns
  const level = hasUnspecified ? determineUnspecifiedLevel(yearStr, monthStr, dayStr) : 1;

  const edtfDate: EDTFDate = {
    type: 'Date',
    level,
    edtf: input,
    precision,
    year,
    ...(month !== undefined && { month }),
    ...(day !== undefined && { day }),
    ...(Object.keys(qualification).length > 0 && { qualification }),
    ...(hasUnspecified && { unspecified }),
    get min() {
      return dateFromMs(boundsResult.minMs);
    },
    get max() {
      return dateFromMs(boundsResult.maxMs);
    },
    get minMs() {
      return boundsResult.minMs;
    },
    get maxMs() {
      return boundsResult.maxMs;
    },
    toJSON() {
      const result: any = {
        type: this.type,
        year: this.year,
      };
      if (this.month !== undefined) result.month = this.month;
      if (this.day !== undefined) result.day = this.day;
      if (this.qualification) result.qualification = this.qualification;
      if (this.unspecified) result.unspecified = this.unspecified;
      return result;
    },
    toString() {
      return this.edtf;
    },
  };

  return { success: true, value: edtfDate, level };
}

/**
 * Parse a season
 * Format: YYYY-21 (Spring), YYYY-22 (Summer), YYYY-23 (Autumn), YYYY-24 (Winter)
 * Can have qualification: 2001-21? or 2001-22~
 */
export function parseSeason(input: string): ParseResult<EDTFSeason> {
  // Extract qualification
  const qualification: Qualification = {};
  let seasonStr = input;

  const qualMatch = input.match(/^(.+?)([?~%])$/);
  if (qualMatch) {
    seasonStr = qualMatch[1]!;
    const qual = qualMatch[2]!;
    if (qual === '?') {
      qualification.uncertain = true;
    } else if (qual === '~') {
      qualification.approximate = true;
    } else if (qual === '%') {
      qualification.uncertainApproximate = true;
    }
  }

  const match = seasonStr.match(/^(-?\d{4})-(2[1-4])$/);
  if (!match) {
    return {
      success: false,
      errors: [
        {
          code: 'INVALID_SEASON',
          message: `Invalid season format: ${input}`,
          suggestion:
            'Use format: YYYY-2X where X is 1 (Spring), 2 (Summer), 3 (Autumn), or 4 (Winter)',
        },
      ],
    };
  }

  const year = parseInt(match[1]!, 10);
  const season = parseInt(match[2]!, 10);

  // Pre-calculate season bounds
  const seasonBounds = calculateSeasonBounds(year, season);

  const edtfSeason: EDTFSeason = {
    type: 'Season',
    level: 1,
    edtf: input,
    precision: 'month', // Seasons are roughly 3 months
    year,
    season,
    ...(Object.keys(qualification).length > 0 && { qualification }),
    get min() {
      return dateFromMs(seasonBounds.minMs);
    },
    get max() {
      return dateFromMs(seasonBounds.maxMs);
    },
    get minMs() {
      return seasonBounds.minMs;
    },
    get maxMs() {
      return seasonBounds.maxMs;
    },
    toJSON() {
      const result: any = {
        type: this.type,
        year: this.year,
        season: this.season,
      };
      if (this.qualification) result.qualification = this.qualification;
      return result;
    },
    toString() {
      return this.edtf;
    },
  };

  return { success: true, value: edtfSeason, level: 1 };
}

/**
 * Parse Level 1 interval with extended features
 * Formats:
 * - 1984?/2004-06~ (qualified endpoints)
 * - ../1985 (open start)
 * - 1985/.. (open end)
 * - 1985/ (unknown end)
 * - /1985 (unknown start)
 */
function parseLevel1Interval(input: string): ParseResult<EDTFInterval> {
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
  let startLevel: EDTFLevel = 1;
  let endLevel: EDTFLevel = 1;

  // Parse start
  if (startStr === '..') {
    openStart = true;
  } else if (startStr === '') {
    start = null; // Unknown start
  } else {
    const startResult = startStr.match(/^\d{4}-2[1-4]/)
      ? parseSeason(startStr)
      : parseLevel1Date(startStr);
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
    startLevel = startResult.level ?? 1;
  }

  // Parse end
  if (endStr === '..') {
    openEnd = true;
  } else if (endStr === '') {
    end = null; // Unknown end
  } else {
    const endResult = endStr.match(/^\d{4}-2[1-4]/) ? parseSeason(endStr) : parseLevel1Date(endStr);
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
    endLevel = endResult.level ?? 1;
  }

  // Validate interval order (if both endpoints are known and not open)
  if (start && end && !openStart && !openEnd) {
    if (start.min > end.max) {
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

  // Import DATE_MIN_MS and DATE_MAX_MS constants
  const DATE_MIN_MS_VAL = -8640000000000000n;
  const DATE_MAX_MS_VAL = 8640000000000000n;

  // Determine interval level: max of start and end levels
  // Also, intervals where one endpoint has unspecified digits (XX) are Level 2
  let intervalLevel = Math.max(startLevel, endLevel) as EDTFLevel;

  // Check if either endpoint has unspecified digits - if so, it's Level 2
  if (intervalLevel === 1 && (startStr.includes('X') || endStr.includes('X'))) {
    intervalLevel = 2;
  }

  const edtfInterval: EDTFInterval = {
    type: 'Interval',
    level: intervalLevel,
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
      if (openStart) return DATE_MIN_MS_VAL;
      return start ? start.minMs : DATE_MIN_MS_VAL;
    },
    get maxMs() {
      if (openEnd) return DATE_MAX_MS_VAL;
      return end ? end.maxMs : DATE_MAX_MS_VAL;
    },
    toJSON() {
      return {
        type: this.type,
        start: this.start ? this.start.toJSON() : null,
        end: this.end ? this.end.toJSON() : null,
        ...(this.openStart && { openStart: true }),
        ...(this.openEnd && { openEnd: true }),
      };
    },
    toString() {
      return this.edtf;
    },
  };

  return { success: true, value: edtfInterval, level: intervalLevel };
}

// Helper functions

/**
 * Calculate min and max bounds as bigint milliseconds.
 * Handles unspecified digits (X) by expanding to min/max values.
 */
function calculateBounds(
  year: number | string,
  month?: number | string,
  day?: number | string
): { minMs: bigint; maxMs: bigint } {
  // Calculate minimum values
  let minYear: number;
  if (typeof year === 'string') {
    minYear = parseInt(year.replace(/X/g, '0'), 10);
  } else {
    minYear = year;
  }

  let minMonth: number;
  if (month === undefined || month === 'XX') {
    minMonth = 1;
  } else if (typeof month === 'string') {
    const m = parseInt(month.replace(/X/g, '0'), 10);
    minMonth = m === 0 ? 1 : m;
  } else {
    minMonth = month;
  }

  let minDay: number;
  if (day === undefined || day === 'XX') {
    minDay = 1;
  } else if (typeof day === 'string') {
    const d = parseInt(day.replace(/X/g, '0'), 10);
    minDay = d === 0 ? 1 : d;
  } else {
    minDay = day;
  }

  // Calculate maximum values
  let maxYear: number;
  if (typeof year === 'string') {
    maxYear = parseInt(year.replace(/X/g, '9'), 10);
  } else {
    maxYear = year;
  }

  let maxMonth: number;
  if (month === undefined || month === 'XX') {
    maxMonth = 12;
  } else if (typeof month === 'string') {
    const m = parseInt(month.replace(/X/g, '9'), 10);
    maxMonth = Math.min(m, 12);
  } else {
    maxMonth = month;
  }

  let maxDay: number;
  if (day === undefined || day === 'XX') {
    maxDay = daysInMonth(maxYear, maxMonth);
  } else if (typeof day === 'string') {
    const d = parseInt(day.replace(/X/g, '9'), 10);
    maxDay = Math.min(d, daysInMonth(maxYear, maxMonth));
  } else {
    maxDay = day;
  }

  return {
    minMs: calculateEpochMs(minYear, minMonth, minDay, 0, 0, 0, 0),
    maxMs: calculateEpochMs(maxYear, maxMonth, maxDay, 23, 59, 59, 999),
  };
}

/**
 * Calculate season bounds as bigint milliseconds.
 * Seasons map approximately to months:
 * 21=Spring (Mar-May), 22=Summer (Jun-Aug), 23=Autumn (Sep-Nov), 24=Winter (Dec-Feb)
 */
function calculateSeasonBounds(year: number, season: number): { minMs: bigint; maxMs: bigint } {
  // Season start months
  const seasonToMonth: { [key: number]: number } = {
    21: 3, // Spring starts in March
    22: 6, // Summer starts in June
    23: 9, // Autumn starts in September
    24: 12, // Winter starts in December
  };

  // Season end months and days
  const seasonToEndMonth: { [key: number]: { month: number; day: number } } = {
    21: { month: 5, day: 31 }, // Spring ends May 31
    22: { month: 8, day: 31 }, // Summer ends August 31
    23: { month: 11, day: 30 }, // Autumn ends November 30
    24: { month: 2, day: 28 }, // Winter ends February 28/29 (next year)
  };

  const startMonth = seasonToMonth[season] || 1;
  const end = seasonToEndMonth[season] || { month: 12, day: 31 };

  let endYear = year;
  // Winter spans across years
  if (season === 24) {
    endYear += 1;
  }

  // Check for leap year if February
  const endDay = end.month === 2 && isLeapYear(endYear) ? 29 : end.day;

  return {
    minMs: calculateEpochMs(year, startMonth, 1, 0, 0, 0, 0),
    maxMs: calculateEpochMs(endYear, end.month, endDay, 23, 59, 59, 999),
  };
}
