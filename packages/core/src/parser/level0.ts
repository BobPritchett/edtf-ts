import type { ParseResult, EDTFDate, EDTFDateTime, EDTFInterval } from '../types/index.js';

/**
 * Parse EDTF Level 0 strings
 * Level 0 is the ISO 8601 profile - basic dates and intervals without uncertainty
 */
export function parseLevel0(input: string): ParseResult {
  input = input.trim();

  // Try to parse as interval first (contains '/')
  if (input.includes('/')) {
    return parseInterval(input);
  }

  // Try to parse as datetime (contains 'T')
  if (input.includes('T')) {
    return parseDateTime(input);
  }

  // Parse as date
  return parseDate(input);
}

/**
 * Parse a date in format YYYY, YYYY-MM, or YYYY-MM-DD
 */
function parseDate(input: string): ParseResult<EDTFDate> {
  // Match: YYYY, YYYY-MM, or YYYY-MM-DD
  // Allow negative years for BCE dates
  const match = input.match(/^(-?\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);

  if (!match) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_FORMAT',
        message: `Invalid date format: ${input}`,
        suggestion: 'Use format: YYYY, YYYY-MM, or YYYY-MM-DD'
      }]
    };
  }

  const year = parseInt(match[1]!, 10);
  const month = match[2] ? parseInt(match[2], 10) : undefined;
  const day = match[3] ? parseInt(match[3], 10) : undefined;

  // Validate month
  if (month !== undefined && (month < 1 || month > 12)) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_MONTH',
        message: `Month must be 01-12, got: ${match[2]}`,
        position: { start: 5, end: 7 }
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
          message: `Day must be 01-${maxDay} for ${year}-${String(month).padStart(2, '0')}, got: ${match[3]}`,
          position: { start: 8, end: 10 }
        }]
      };
    }
  }

  const edtfDate: EDTFDate = {
    type: 'Date',
    level: 0,
    edtf: input,
    precision: day ? 'day' : month ? 'month' : 'year',
    year,
    month,
    day,
    get min() {
      return calculateMinDate(this);
    },
    get max() {
      return calculateMaxDate(this);
    },
    isBefore(other: EDTFDate | Date) {
      const otherDate = other instanceof Date ? other : other.max;
      return this.max < otherDate;
    },
    isAfter(other: EDTFDate | Date) {
      const otherDate = other instanceof Date ? other : other.min;
      return this.min > otherDate;
    },
    equals(other: EDTFDate) {
      return this.edtf === other.edtf;
    },
    covers(other: EDTFDate) {
      // This date covers another if the other's range is within this date's range
      return this.min <= other.min && this.max >= other.max;
    },
    toJSON() {
      const result: { type: string; year: number; month?: number; day?: number } = {
        type: this.type,
        year: this.year as number
      };
      if (this.month !== undefined) result.month = this.month as number;
      if (this.day !== undefined) result.day = this.day as number;
      return result;
    },
    toString() {
      return this.edtf;
    }
  };

  return { success: true, value: edtfDate, level: 0 };
}

/**
 * Parse a datetime in ISO 8601 format
 * Format: YYYY-MM-DDTHH:MM:SS[.sss][Z|±HH:MM|±HH]
 */
function parseDateTime(input: string): ParseResult<EDTFDateTime> {
  // Match ISO 8601 datetime with optional timezone
  // Supports: Z, ±HH:MM, or ±HH
  const match = input.match(/^(-?\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}(?::\d{2})?)?$/);

  if (!match) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_FORMAT',
        message: `Invalid datetime format: ${input}`,
        suggestion: 'Use format: YYYY-MM-DDTHH:MM:SS[Z|±HH:MM|±HH]'
      }]
    };
  }

  const year = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10);
  const day = parseInt(match[3]!, 10);
  const hour = parseInt(match[4]!, 10);
  const minute = parseInt(match[5]!, 10);
  const second = parseInt(match[6]!, 10);
  const timezone = match[7] || undefined;

  // Validate month
  if (month < 1 || month > 12) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_MONTH',
        message: `Month must be 01-12, got: ${match[2]}`
      }]
    };
  }

  // Validate day
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_DAY',
        message: `Day must be 01-${maxDay} for ${year}-${String(month).padStart(2, '0')}, got: ${match[3]}`
      }]
    };
  }

  // Validate time components
  if (hour < 0 || hour > 23) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_HOUR',
        message: `Hour must be 00-23, got: ${match[4]}`
      }]
    };
  }

  if (minute < 0 || minute > 59) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_MINUTE',
        message: `Minute must be 00-59, got: ${match[5]}`
      }]
    };
  }

  if (second < 0 || second > 59) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_SECOND',
        message: `Second must be 00-59, got: ${match[6]}`
      }]
    };
  }

  const edtfDateTime: EDTFDateTime = {
    type: 'DateTime',
    level: 0,
    edtf: input,
    precision: 'second',
    year,
    month,
    day,
    hour,
    minute,
    second,
    timezone,
    get min() {
      return calculateMinDateTime(this);
    },
    get max() {
      return calculateMaxDateTime(this);
    },
    toJSON() {
      const result: { type: string; year: number; month: number; day: number; hour: number; minute: number; second: number; timezone?: string } = {
        type: this.type,
        year: this.year,
        month: this.month,
        day: this.day,
        hour: this.hour,
        minute: this.minute,
        second: this.second
      };
      if (this.timezone) result.timezone = this.timezone;
      return result;
    },
    toString() {
      return this.edtf;
    }
  };

  return { success: true, value: edtfDateTime, level: 0 };
}

/**
 * Parse an interval in format START/END
 * START and END can be dates or datetimes
 */
function parseInterval(input: string): ParseResult<EDTFInterval> {
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

  const startStr = parts[0];
  const endStr = parts[1];

  if (!startStr || !endStr) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_INTERVAL',
        message: 'Interval must have both start and end dates'
      }]
    };
  }

  // Parse start
  const startResult = startStr.includes('T') ? parseDateTime(startStr) : parseDate(startStr);
  if (!startResult.success) {
    return {
      success: false,
      errors: startResult.errors.map(err => ({
        ...err,
        message: `Invalid interval start: ${err.message}`
      }))
    };
  }

  // Parse end
  const endResult = endStr.includes('T') ? parseDateTime(endStr) : parseDate(endStr);
  if (!endResult.success) {
    return {
      success: false,
      errors: endResult.errors.map(err => ({
        ...err,
        message: `Invalid interval end: ${err.message}`
      }))
    };
  }

  const start = startResult.value as EDTFDate | EDTFDateTime;
  const end = endResult.value as EDTFDate | EDTFDateTime;

  // Validate that start is before end
  if (start.min > end.max) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_INTERVAL_ORDER',
        message: 'Interval start must be before or equal to end'
      }]
    };
  }

  const edtfInterval: EDTFInterval = {
    type: 'Interval',
    level: 0,
    edtf: input,
    precision: start.precision,
    start,
    end,
    get min() {
      return this.start!.min;
    },
    get max() {
      return this.end!.max;
    },
    contains(date: EDTFDate | EDTFDateTime | Date) {
      const testDate = date instanceof Date ? date : date.min;
      return testDate >= this.min && testDate <= this.max;
    },
    overlaps(other: EDTFInterval) {
      // Two intervals overlap if one's start is before the other's end
      return this.min <= other.max && other.min <= this.max;
    },
    *by(unit: 'year' | 'month' | 'day') {
      if (!this.start || !this.end) {
        return; // Cannot iterate with unknown/open endpoints
      }

      const startDate = this.start.min;
      const endDate = this.end.max;

      const current = new Date(startDate);

      while (current <= endDate) {
        // Create an EDTF date for the current position
        const year = current.getUTCFullYear();
        const month = current.getUTCMonth() + 1;
        const day = current.getUTCDate();

        const edtfStr = unit === 'year' ? `${year}` :
                       unit === 'month' ? `${year}-${String(month).padStart(2, '0')}` :
                       `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const dateResult = parseDate(edtfStr);
        if (dateResult.success) {
          yield dateResult.value as EDTFDate;
        }

        // Increment based on unit
        if (unit === 'year') {
          current.setUTCFullYear(current.getUTCFullYear() + 1);
        } else if (unit === 'month') {
          current.setUTCMonth(current.getUTCMonth() + 1);
        } else {
          current.setUTCDate(current.getUTCDate() + 1);
        }
      }
    },
    toJSON() {
      return {
        type: this.type,
        start: this.start!.toJSON(),
        end: this.end!.toJSON()
      };
    },
    toString() {
      return this.edtf;
    }
  };

  return { success: true, value: edtfInterval, level: 0 };
}

// Helper: Days in month (accounting for leap years)
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

// Helper: Calculate min date for a Date (Level 0 - values are always numbers)
function calculateMinDate(date: EDTFDate): Date {
  const year = date.year as number;
  const month = (date.month as number | undefined) ?? 1;
  const day = (date.day as number | undefined) ?? 1;
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

// Helper: Calculate max date for a Date (Level 0 - values are always numbers)
function calculateMaxDate(date: EDTFDate): Date {
  const year = date.year as number;
  const month = (date.month as number | undefined) ?? 12;
  const day = (date.day as number | undefined) ?? daysInMonth(year, month);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}

// Helper: Calculate min date for a DateTime
function calculateMinDateTime(datetime: EDTFDateTime): Date {
  return new Date(Date.UTC(
    datetime.year,
    datetime.month - 1,
    datetime.day,
    datetime.hour,
    datetime.minute,
    datetime.second,
    0
  ));
}

// Helper: Calculate max date for a DateTime
function calculateMaxDateTime(datetime: EDTFDateTime): Date {
  return new Date(Date.UTC(
    datetime.year,
    datetime.month - 1,
    datetime.day,
    datetime.hour,
    datetime.minute,
    datetime.second,
    999
  ));
}
