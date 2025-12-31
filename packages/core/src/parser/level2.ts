import type {
  ParseResult,
  EDTFDate,
  EDTFSeason,
  EDTFSet,
  EDTFList,
  EDTFInterval
} from '../types/index.js';

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

  // Try to parse as interval with Level 2 features (contains '/')
  // Check if it has partial qualifications that indicate Level 2
  // Level 2: qualifier BEFORE component (2004-~06) or qualifier AFTER non-final component (2004?-06)
  // Level 1: qualifier AFTER final component only (1984?, 2004-06~)
  if (input.includes('/')) {
    const hasLevel2Features = /^[?~%]\d{4}-/.test(input) ||  // ?2004-06 (qualifier before year at start)
                               /-[?~%]\d{2}/.test(input) ||   // 2004-~06 or 2004-06-~01 (qualifier before month/day)
                               /\d{4}[?~%]-/.test(input) ||   // 2004?-06 (qualifier after year, before month)
                               /\d{2}[?~%]-/.test(input);     // 06?-01 (qualifier after month, before day)

    if (hasLevel2Features) {
      return parseLevel2Interval(input);
    }
  }

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

  // Try to parse partial qualification
  // Individual: ?2004-06-~11 or 2004-~06-11 (qualifier before component)
  // Group: 2004?-06-11 or 2004-06~-11 (qualifier after component)
  if (/^[?~%]/.test(input) || /-[?~%]\d{2}/.test(input) || /\d{4}[?~%]/.test(input) || /\d{2}[?~%]/.test(input)) {
    return parsePartialQualification(input);
  }

  // Try to parse extended season (25-41 range)
  if (/^\d{4}-[234]\d/.test(input)) {
    const seasonNum = parseInt(input.slice(5, 7), 10);
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
      errors: [{
        code: 'INVALID_INTERVAL',
        message: 'Interval must have exactly one "/" separator'
      }]
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
    start = null;  // Unknown start
  } else {
    // Try to parse as extended season first (25-41), then partial qualification, then fall back
    let startResult: ParseResult<EDTFDate | EDTFSeason>;

    if (startStr.match(/^\d{4}-[234]\d/)) {
      const seasonNum = parseInt(startStr.slice(5, 7), 10);
      if (seasonNum >= 25 && seasonNum <= 41) {
        startResult = parseExtendedSeason(startStr);
      } else {
        startResult = parsePartialQualification(startStr);
      }
    } else {
      startResult = parsePartialQualification(startStr);
    }

    if (!startResult.success) {
      return {
        success: false,
        errors: startResult.errors.map(err => ({
          ...err,
          message: `Invalid interval start: ${err.message}`
        }))
      };
    }
    start = startResult.value as EDTFDate | EDTFSeason;
  }

  // Parse end
  if (endStr === '..') {
    openEnd = true;
  } else if (endStr === '') {
    end = null;  // Unknown end
  } else {
    // Try to parse as extended season first (25-41), then partial qualification, then fall back
    let endResult: ParseResult<EDTFDate | EDTFSeason>;

    if (endStr.match(/^\d{4}-[234]\d/)) {
      const seasonNum = parseInt(endStr.slice(5, 7), 10);
      if (seasonNum >= 25 && seasonNum <= 41) {
        endResult = parseExtendedSeason(endStr);
      } else {
        endResult = parsePartialQualification(endStr);
      }
    } else {
      endResult = parsePartialQualification(endStr);
    }

    if (!endResult.success) {
      return {
        success: false,
        errors: endResult.errors.map(err => ({
          ...err,
          message: `Invalid interval end: ${err.message}`
        }))
      };
    }
    end = endResult.value as EDTFDate | EDTFSeason;
  }

  // Validate interval order (if both endpoints are known and not open)
  if (start && end && !openStart && !openEnd) {
    if (start.min > end.max) {
      return {
        success: false,
        errors: [{
          code: 'INVALID_INTERVAL_ORDER',
          message: 'Interval start must be before or equal to end'
        }]
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
      if (this.openStart) return new Date(-8640000000000000);  // Min date
      return this.start ? this.start.min : new Date(-8640000000000000);
    },
    get max() {
      if (this.openEnd) return new Date(8640000000000000);  // Max date
      return this.end ? this.end.max : new Date(8640000000000000);
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
        min: this.min.toISOString(),
        max: this.max.toISOString()
      };
    }
  };

  return {
    success: true,
    value: edtfInterval,
    level: 2
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

  // Check for open-ended sets
  if (content.startsWith('..')) {
    earlier = true;
    const remaining = content.slice(2);
    const parts = remaining.split(',').map(p => p.trim()).filter(p => p);
    for (const part of parts) {
      const result = parseSetValue(part);
      if (!result.success) return result;
      values.push(result.value as EDTFDate | EDTFSeason);
    }
  } else if (content.endsWith('..')) {
    later = true;
    const remaining = content.slice(0, -2);
    const parts = remaining.split(',').map(p => p.trim()).filter(p => p);
    for (const part of parts) {
      const result = parseSetValue(part);
      if (!result.success) return result;
      values.push(result.value as EDTFDate | EDTFSeason);
    }
  } else {
    // Regular set or range
    const parts = content.split(',').map(p => p.trim());
    for (const part of parts) {
      if (part.includes('..')) {
        // Range: 1670..1672
        const [start, end] = part.split('..').map(p => p.trim());
        if (!start || !end) {
          return {
            success: false,
            errors: [{ code: 'INVALID_RANGE', message: 'Invalid range in set' }]
          };
        }
        const startResult = parseSetValue(start);
        const endResult = parseSetValue(end);
        if (!startResult.success) return startResult;
        if (!endResult.success) return endResult;

        // Expand range based on precision
        const startDate = startResult.value as EDTFDate;
        const endDate = endResult.value as EDTFDate;

        if (typeof startDate.year === 'number' && typeof endDate.year === 'number') {
          const precision = startDate.precision;

          // Validate that both dates have the same precision for range expansion
          if (startDate.precision !== endDate.precision) {
            return {
              success: false,
              errors: [{ code: 'INVALID_RANGE', message: 'Range endpoints must have the same precision' }]
            };
          }

          if (precision === 'day') {
            // Expand day range (e.g., 2025-01-15..2025-01-20)
            const startTime = startDate.min.getTime();
            const endTime = endDate.min.getTime();
            const oneDayMs = 24 * 60 * 60 * 1000;

            for (let time = startTime; time <= endTime; time += oneDayMs) {
              const d = new Date(time);
              const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
              const result = parseSetValue(dateStr);
              if (result.success) {
                values.push(result.value as EDTFDate);
              }
            }
          } else if (precision === 'month') {
            // Expand month range (e.g., 2025-01..2026-11)
            let currentYear = startDate.year;
            let currentMonth = (startDate.month as number);
            const endYear = endDate.year;
            const endMonth = (endDate.month as number);

            while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
              const result = parseSetValue(dateStr);
              if (result.success) {
                values.push(result.value as EDTFDate);
              }

              currentMonth++;
              if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
              }
            }
          } else {
            // Expand year range (e.g., 1670..1672)
            for (let y = startDate.year; y <= endDate.year; y++) {
              const yearResult = parseSetValue(y.toString());
              if (yearResult.success) {
                values.push(yearResult.value as EDTFDate);
              }
            }
          }
        }
      } else {
        const result = parseSetValue(part);
        if (!result.success) return result;
        values.push(result.value as EDTFDate | EDTFSeason);
      }
    }
  }

  if (values.length === 0) {
    return {
      success: false,
      errors: [{ code: 'EMPTY_SET', message: 'Set cannot be empty' }]
    };
  }

  // Calculate min/max from values
  const allDates = values.map(v => v.min);
  const min = new Date(Math.min(...allDates.map(d => d.getTime())));
  const allMaxDates = values.map(v => v.max);
  const max = new Date(Math.max(...allMaxDates.map(d => d.getTime())));

  const edtfSet: EDTFSet = {
    type: 'Set',
    level: 2,
    edtf: input,
    precision: values[0]!.precision,
    values,
    ...(earlier && { earlier }),
    ...(later && { later }),
    min: earlier ? new Date(-8640000000000000) : min,
    max: later ? new Date(8640000000000000) : max,
    toJSON() {
      return {
        type: this.type,
        values: this.values.map(v => v.toJSON()),
        ...(this.earlier && { earlier: true }),
        ...(this.later && { later: true })
      };
    },
    toString() {
      return this.edtf;
    }
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
        values: this.values.map(v => v.toJSON()),
        ...(this.earlier && { earlier: true }),
        ...(this.later && { later: true })
      };
    }
  };

  return { success: true, value: edtfList, level: 2 };
}

/**
 * Helper to parse a single value in a set/list
 */
function parseSetValue(value: string): ParseResult<EDTFDate | EDTFSeason> {
  // Try season first
  if (/^\d{4}-[234]\d/.test(value)) {
    return parseExtendedSeason(value);
  }
  // Try regular date (reuse from Level 1, but simplified for this implementation)
  const match = value.match(/^(-?\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  if (!match) {
    return {
      success: false,
      errors: [{ code: 'INVALID_SET_VALUE', message: `Invalid value in set: ${value}` }]
    };
  }

  const year = parseInt(match[1]!, 10);
  const month = match[2] ? parseInt(match[2], 10) : undefined;
  const day = match[3] ? parseInt(match[3], 10) : undefined;

  const edtfDate: EDTFDate = {
    type: 'Date',
    level: 2,
    edtf: value,
    precision: day ? 'day' : month ? 'month' : 'year',
    year,
    ...(month !== undefined && { month }),
    ...(day !== undefined && { day }),
    get min() {
      const y = typeof this.year === 'number' ? this.year : parseInt(String(this.year), 10);
      const m = typeof this.month === 'number' ? this.month : 1;
      const d = typeof this.day === 'number' ? this.day : 1;
      return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    },
    get max() {
      const y = typeof this.year === 'number' ? this.year : parseInt(String(this.year), 10);
      const m = typeof this.month === 'number' ? this.month : 12;
      const d = typeof this.day === 'number' ? this.day : 31;
      return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    },
    toJSON() {
      const result: any = { type: this.type, year: this.year };
      if (this.month !== undefined) result.month = this.month;
      if (this.day !== undefined) result.day = this.day;
      return result;
    },
    toString() {
      return this.edtf;
    }
  };

  return { success: true, value: edtfDate, level: 2 };
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
      errors: [{ code: 'INVALID_EXPONENTIAL', message: 'Invalid exponential year format' }]
    };
  }

  const base = parseInt(match[1]!, 10);
  const exponent = parseInt(match[2]!, 10);
  const sigDigits = match[3] ? parseInt(match[3], 10) : undefined;
  const year = base * Math.pow(10, exponent);

  const edtfDate: EDTFDate = {
    type: 'Date',
    level: 2,
    edtf: input,
    precision: 'year',
    year,
    exponential: exponent,
    ...(sigDigits !== undefined && { significantDigitsYear: sigDigits }),
    get min() {
      return new Date(Date.UTC(this.year as number, 0, 1, 0, 0, 0, 0));
    },
    get max() {
      return new Date(Date.UTC(this.year as number, 11, 31, 23, 59, 59, 999));
    },
    toJSON() {
      const result: any = {
        type: this.type,
        year: this.year,
        exponential: this.exponential
      };
      if (this.significantDigitsYear !== undefined) {
        result.significantDigits = this.significantDigitsYear;
      }
      return result;
    },
    toString() {
      return this.edtf;
    }
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
      errors: [{ code: 'INVALID_EXTENDED_YEAR', message: 'Invalid extended year with significant digits format' }]
    };
  }

  const year = parseInt(match[1]!, 10);
  const sigDigits = parseInt(match[2]!, 10);

  const edtfDate: EDTFDate = {
    type: 'Date',
    level: 2,
    edtf: input,
    precision: 'year',
    year,
    significantDigitsYear: sigDigits,
    get min() {
      return new Date(Date.UTC(this.year as number, 0, 1, 0, 0, 0, 0));
    },
    get max() {
      return new Date(Date.UTC(this.year as number, 11, 31, 23, 59, 59, 999));
    },
    toJSON() {
      return {
        type: this.type,
        year: this.year,
        significantDigits: this.significantDigitsYear
      };
    },
    toString() {
      return this.edtf;
    }
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
      errors: [{ code: 'INVALID_SIGNIFICANT_DIGITS', message: 'Invalid significant digits format' }]
    };
  }

  const year = parseInt(match[1]!, 10);
  const sigDigits = parseInt(match[2]!, 10);

  const edtfDate: EDTFDate = {
    type: 'Date',
    level: 2,
    edtf: input,
    precision: 'year',
    year,
    significantDigitsYear: sigDigits,
    get min() {
      return new Date(Date.UTC(this.year as number, 0, 1, 0, 0, 0, 0));
    },
    get max() {
      return new Date(Date.UTC(this.year as number, 11, 31, 23, 59, 59, 999));
    },
    toJSON() {
      return {
        type: this.type,
        year: this.year,
        significantDigits: this.significantDigitsYear
      };
    },
    toString() {
      return this.edtf;
    }
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
  const match = input.match(/^([?~%])?(-?\d{4})([?~%])?(?:-([?~%])?(\d{2})([?~%])?(?:-([?~%])?(\d{2})([?~%])?)?)?$/);

  if (!match) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_FORMAT',
        message: `Invalid partial qualification format: ${input}`,
        suggestion: 'Use format like ?2004-06-~11 (uncertain year, approximate day) or 2004?-06-11 (uncertain year)'
      }]
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
      errors: [{
        code: 'INVALID_MONTH',
        message: `Month must be 01-12, got: ${match[5]}`
      }]
    };
  }

  // Validate day
  if (day !== undefined && month !== undefined) {
    const maxDay = daysInMonth(year, month);
    if (day < 1 || day > maxDay) {
      return {
        success: false,
        errors: [{
          code: 'INVALID_DAY',
          message: `Day must be 01-${maxDay} for ${year}-${String(month).padStart(2, '0')}, got: ${match[8]}`
        }]
      };
    }
  }

  // Handle qualifications
  // Individual qualification (qualifier before component): applies only to that component
  // Group qualification (qualifier after component): applies to that component AND all to the left

  let yearQualification: import('../types/index.js').Qualification | undefined;
  let monthQualification: import('../types/index.js').Qualification | undefined;
  let dayQualification: import('../types/index.js').Qualification | undefined;

  // Process qualifications from right to left (group qualifications cascade left)
  if (dayQualAfter) {
    // Group qualification: applies to day, month, and year
    const qual = parseQualificationChar(dayQualAfter);
    dayQualification = qual;
    monthQualification = qual;
    yearQualification = qual;
  } else if (dayQualBefore) {
    // Individual qualification: applies only to day
    dayQualification = parseQualificationChar(dayQualBefore);
  }

  if (monthQualAfter && !dayQualAfter) {
    // Group qualification: applies to month and year (unless overridden by day group qual)
    const qual = parseQualificationChar(monthQualAfter);
    monthQualification = qual;
    yearQualification = qual;
  } else if (monthQualBefore && !monthQualification) {
    // Individual qualification: applies only to month (if not already set)
    monthQualification = parseQualificationChar(monthQualBefore);
  }

  if (yearQualAfter && !monthQualAfter && !dayQualAfter) {
    // Group qualification: applies to year only (unless overridden by month/day group qual)
    yearQualification = parseQualificationChar(yearQualAfter);
  } else if (yearQualBefore && !yearQualification) {
    // Individual qualification: applies only to year (if not already set)
    yearQualification = parseQualificationChar(yearQualBefore);
  }

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
      const y = typeof this.year === 'number' ? this.year : parseInt(String(this.year), 10);
      const m = typeof this.month === 'number' ? this.month : 1;
      const d = typeof this.day === 'number' ? this.day : 1;
      return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    },
    get max() {
      const y = typeof this.year === 'number' ? this.year : parseInt(String(this.year), 10);
      const m = typeof this.month === 'number' ? this.month : 12;
      const d = typeof this.day === 'number' ? this.day : daysInMonth(y, m);
      return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
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
    }
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
 * Helper: Days in month (accounting for leap years)
 */
function daysInMonth(year: number, month: number): number {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return days[month - 1] || 0;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Parse extended seasons (Level 2)
 * 25-28: Southern Hemisphere seasons
 * 29-32: Quarters
 * 33-36: Quadrimesters
 * 37-41: Semesters
 */
function parseExtendedSeason(input: string): ParseResult<EDTFSeason> {
  const match = input.match(/^(\d{4})-([234]\d)$/);
  if (!match) {
    return {
      success: false,
      errors: [{ code: 'INVALID_SEASON', message: 'Invalid season format' }]
    };
  }

  const year = parseInt(match[1]!, 10);
  const season = parseInt(match[2]!, 10);

  // Validate season range
  if (season < 21 || season > 41) {
    return {
      success: false,
      errors: [{ code: 'INVALID_SEASON', message: `Season must be 21-41, got ${season}` }]
    };
  }

  const edtfSeason: EDTFSeason = {
    type: 'Season',
    level: season >= 25 ? 2 : 1,
    edtf: input,
    precision: 'month',
    year,
    season,
    get min() {
      return new Date(Date.UTC(this.year, 0, 1, 0, 0, 0, 0));
    },
    get max() {
      return new Date(Date.UTC(this.year, 11, 31, 23, 59, 59, 999));
    },
    toJSON() {
      return {
        type: this.type,
        year: this.year,
        season: this.season
      };
    },
    toString() {
      return this.edtf;
    }
  };

  return { success: true, value: edtfSeason, level: season >= 25 ? 2 : 1 };
}

// Exports are handled via imports from level1
