import type {
  ParseResult,
  EDTFDate,
  EDTFSeason,
  EDTFInterval,
  Qualification,
  UnspecifiedDigits
} from '../types/index.js';

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
function parseLevel1Date(input: string): ParseResult<EDTFDate> {
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
    const edtfDate: EDTFDate = {
      type: 'Date',
      level: 1,
      edtf: input,
      precision: 'year',
      year,
      significantDigits: extendedYearMatch[1]!.replace('-', '').length,
      ...(Object.keys(qualification).length > 0 && { qualification }),
      get min() {
        return calculateMinDate(this);
      },
      get max() {
        return calculateMaxDate(this);
      },
      toJSON() {
        const result: any = {
          type: this.type,
          year: this.year
        };
        if (this.month !== undefined) result.month = this.month;
        if (this.day !== undefined) result.day = this.day;
        if (this.qualification) result.qualification = this.qualification;
        if (this.unspecified) result.unspecified = this.unspecified;
        return result;
      },
      toString() {
        return this.edtf;
      }
    };
    return { success: true, value: edtfDate, level: 1 };
  }

  // Match date with possible X for unspecified digits
  // Supports: YYYY, YYYY-MM, YYYY-MM-DD with X in any position
  const match = dateStr.match(/^(-?[X\d]{4})(?:-([X\d]{2})(?:-([X\d]{2}))?)?$/);

  if (!match) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_FORMAT',
        message: `Invalid Level 1 date format: ${input}`,
        suggestion: 'Use format: YYYY, YYYY-MM, or YYYY-MM-DD (with optional ?, ~, or % and X for unspecified digits)'
      }]
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
          errors: [{
            code: 'INVALID_MONTH',
            message: `Month must be 01-12, got: ${monthStr}`
          }]
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
            errors: [{
              code: 'INVALID_DAY',
              message: `Day must be 01-${maxDay} for ${year}-${String(month).padStart(2, '0')}, got: ${dayStr}`
            }]
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

  const edtfDate: EDTFDate = {
    type: 'Date',
    level: 1,
    edtf: input,
    precision,
    year,
    ...(month !== undefined && { month }),
    ...(day !== undefined && { day }),
    ...(Object.keys(qualification).length > 0 && { qualification }),
    ...(hasUnspecified && { unspecified }),
    get min() {
      return calculateMinDate(this);
    },
    get max() {
      return calculateMaxDate(this);
    },
    toJSON() {
      const result: any = {
        type: this.type,
        year: this.year
      };
      if (this.month !== undefined) result.month = this.month;
      if (this.day !== undefined) result.day = this.day;
      if (this.qualification) result.qualification = this.qualification;
      if (this.unspecified) result.unspecified = this.unspecified;
      return result;
    },
    toString() {
      return this.edtf;
    }
  };

  return { success: true, value: edtfDate, level: 1 };
}

/**
 * Parse a season
 * Format: YYYY-21 (Spring), YYYY-22 (Summer), YYYY-23 (Autumn), YYYY-24 (Winter)
 * Can have qualification: 2001-21? or 2001-22~
 */
function parseSeason(input: string): ParseResult<EDTFSeason> {
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
      errors: [{
        code: 'INVALID_SEASON',
        message: `Invalid season format: ${input}`,
        suggestion: 'Use format: YYYY-2X where X is 1 (Spring), 2 (Summer), 3 (Autumn), or 4 (Winter)'
      }]
    };
  }

  const year = parseInt(match[1]!, 10);
  const season = parseInt(match[2]!, 10);

  const edtfSeason: EDTFSeason = {
    type: 'Season',
    level: 1,
    edtf: input,
    precision: 'month',  // Seasons are roughly 3 months
    year,
    season,
    ...(Object.keys(qualification).length > 0 && { qualification }),
    get min() {
      return calculateSeasonMin(this);
    },
    get max() {
      return calculateSeasonMax(this);
    },
    toJSON() {
      const result: any = {
        type: this.type,
        year: this.year,
        season: this.season
      };
      if (this.qualification) result.qualification = this.qualification;
      return result;
    },
    toString() {
      return this.edtf;
    }
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
    const startResult = startStr.match(/^\d{4}-2[1-4]/) ? parseSeason(startStr) : parseLevel1Date(startStr);
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
    const endResult = endStr.match(/^\d{4}-2[1-4]/) ? parseSeason(endStr) : parseLevel1Date(endStr);
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
    level: 1,
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
        start: this.start ? this.start.toJSON() : null,
        end: this.end ? this.end.toJSON() : null,
        ...(this.openStart && { openStart: true }),
        ...(this.openEnd && { openEnd: true })
      };
    },
    toString() {
      return this.edtf;
    }
  };

  return { success: true, value: edtfInterval, level: 1 };
}

// Helper functions

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

function calculateMinDate(date: EDTFDate): Date {
  // Handle unspecified digits by using minimum values
  let year: number;
  if (typeof date.year === 'string') {
    // Replace X with 0 for minimum
    year = parseInt(date.year.replace(/X/g, '0'), 10);
  } else {
    year = date.year;
  }

  let month: number;
  if (date.month === undefined || date.month === 'XX') {
    month = 1;
  } else if (typeof date.month === 'string') {
    // Replace X with 0 for minimum (but ensure valid month)
    const m = parseInt(date.month.replace(/X/g, '0'), 10);
    month = m === 0 ? 1 : m;
  } else {
    month = date.month;
  }

  let day: number;
  if (date.day === undefined || date.day === 'XX') {
    day = 1;
  } else if (typeof date.day === 'string') {
    // Replace X with 0 for minimum (but ensure valid day)
    const d = parseInt(date.day.replace(/X/g, '0'), 10);
    day = d === 0 ? 1 : d;
  } else {
    day = date.day;
  }

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function calculateMaxDate(date: EDTFDate): Date {
  // Handle unspecified digits by using maximum values
  let year: number;
  if (typeof date.year === 'string') {
    // Replace X with 9 for maximum
    year = parseInt(date.year.replace(/X/g, '9'), 10);
  } else {
    year = date.year;
  }

  let month: number;
  if (date.month === undefined || date.month === 'XX') {
    month = 12;
  } else if (typeof date.month === 'string') {
    // Replace X with 9 for maximum (but cap at 12)
    const m = parseInt(date.month.replace(/X/g, '9'), 10);
    month = Math.min(m, 12);
  } else {
    month = date.month;
  }

  let day: number;
  if (date.day === undefined || date.day === 'XX') {
    day = daysInMonth(year, month);
  } else if (typeof date.day === 'string') {
    // Replace X with 9 for maximum (but cap at max days in month)
    const d = parseInt(date.day.replace(/X/g, '9'), 10);
    day = Math.min(d, daysInMonth(year, month));
  } else {
    day = date.day;
  }

  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}

function calculateSeasonMin(season: EDTFSeason): Date {
  // Seasons map approximately to months
  // 21=Spring (Mar-May), 22=Summer (Jun-Aug), 23=Autumn (Sep-Nov), 24=Winter (Dec-Feb)
  const seasonToMonth: { [key: number]: number } = {
    21: 3,   // Spring starts in March
    22: 6,   // Summer starts in June
    23: 9,   // Autumn starts in September
    24: 12   // Winter starts in December
  };

  const month = seasonToMonth[season.season] || 1;
  return new Date(Date.UTC(season.year, month - 1, 1, 0, 0, 0, 0));
}

function calculateSeasonMax(season: EDTFSeason): Date {
  // End of each season
  const seasonToEndMonth: { [key: number]: { month: number; day: number } } = {
    21: { month: 5, day: 31 },    // Spring ends May 31
    22: { month: 8, day: 31 },    // Summer ends August 31
    23: { month: 11, day: 30 },   // Autumn ends November 30
    24: { month: 2, day: 28 }     // Winter ends February 28/29 (next year)
  };

  const end = seasonToEndMonth[season.season] || { month: 12, day: 31 };
  let year = season.year;

  // Winter spans across years
  if (season.season === 24) {
    year += 1;
  }

  // Check for leap year if February
  const day = end.month === 2 && isLeapYear(year) ? 29 : end.day;

  return new Date(Date.UTC(year, end.month - 1, day, 23, 59, 59, 999));
}
