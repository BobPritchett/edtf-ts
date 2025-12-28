import { describe, it, expect } from 'vitest';
import { parse, isValid, isEDTFDate, isEDTFDateTime, isEDTFInterval } from '../src/index.js';

describe('Level 0 - Complete Date', () => {
  it('should parse complete date', () => {
    const result = parse('1985-04-12');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.type).toBe('Date');
      expect(result.level).toBe(0);
      if (isEDTFDate(result.value)) {
        expect(result.value.year).toBe(1985);
        expect(result.value.month).toBe(4);
        expect(result.value.day).toBe(12);
        expect(result.value.precision).toBe('day');
      }
    }
  });

  it('should validate complete dates correctly', () => {
    expect(isValid('1985-04-12')).toBe(true);
    expect(isValid('2023-01-01')).toBe(true);
    expect(isValid('2000-12-31')).toBe(true);
  });

  it('should reject invalid months', () => {
    expect(isValid('1985-13-12')).toBe(false);
    expect(isValid('1985-00-12')).toBe(false);
    expect(isValid('2023-99-01')).toBe(false);
  });

  it('should reject invalid days', () => {
    expect(isValid('1985-02-30')).toBe(false); // February doesn't have 30 days
    expect(isValid('1985-04-31')).toBe(false); // April has 30 days
    expect(isValid('1985-01-32')).toBe(false); // January has 31 days
    expect(isValid('1985-06-00')).toBe(false); // No day 0
  });

  it('should handle leap years correctly', () => {
    expect(isValid('2000-02-29')).toBe(true);  // 2000 is a leap year
    expect(isValid('2004-02-29')).toBe(true);  // 2004 is a leap year
    expect(isValid('1900-02-29')).toBe(false); // 1900 is not a leap year
    expect(isValid('2001-02-29')).toBe(false); // 2001 is not a leap year
  });

  it('should calculate min/max dates correctly for complete dates', () => {
    const result = parse('1985-04-12');
    if (result.success) {
      expect(result.value.min).toBeInstanceOf(Date);
      expect(result.value.max).toBeInstanceOf(Date);
      expect(result.value.min.getUTCFullYear()).toBe(1985);
      expect(result.value.min.getUTCMonth()).toBe(3); // 0-indexed
      expect(result.value.min.getUTCDate()).toBe(12);
      expect(result.value.max.getUTCFullYear()).toBe(1985);
      expect(result.value.max.getUTCMonth()).toBe(3);
      expect(result.value.max.getUTCDate()).toBe(12);
    }
  });

  it('should serialize to JSON correctly', () => {
    const result = parse('1985-04-12');
    if (result.success) {
      const json = result.value.toJSON();
      expect(json).toEqual({
        type: 'Date',
        year: 1985,
        month: 4,
        day: 12
      });
    }
  });

  it('should convert to string correctly', () => {
    const result = parse('1985-04-12');
    if (result.success) {
      expect(result.value.toString()).toBe('1985-04-12');
    }
  });
});

describe('Level 0 - Year and Month', () => {
  it('should parse year-month', () => {
    const result = parse('1985-04');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.type).toBe('Date');
      expect(result.value.year).toBe(1985);
      expect(result.value.month).toBe(4);
      expect(result.value.day).toBeUndefined();
      expect(result.value.precision).toBe('month');
    }
  });

  it('should validate year-month correctly', () => {
    expect(isValid('1985-04')).toBe(true);
    expect(isValid('2023-12')).toBe(true);
    expect(isValid('2000-01')).toBe(true);
  });

  it('should reject invalid year-month', () => {
    expect(isValid('1985-13')).toBe(false); // Invalid month
    expect(isValid('1985-00')).toBe(false); // Invalid month
  });

  it('should calculate min/max dates correctly for year-month', () => {
    const result = parse('1985-04');
    if (result.success) {
      const min = result.value.min;
      const max = result.value.max;

      expect(min.getUTCFullYear()).toBe(1985);
      expect(min.getUTCMonth()).toBe(3); // 0-indexed
      expect(min.getUTCDate()).toBe(1); // First day of month

      expect(max.getUTCFullYear()).toBe(1985);
      expect(max.getUTCMonth()).toBe(3);
      expect(max.getUTCDate()).toBe(30); // Last day of April
    }
  });

  it('should serialize year-month to JSON correctly', () => {
    const result = parse('1985-04');
    if (result.success) {
      const json = result.value.toJSON();
      expect(json).toEqual({
        type: 'Date',
        year: 1985,
        month: 4
      });
      expect(json).not.toHaveProperty('day');
    }
  });
});

describe('Level 0 - Year Only', () => {
  it('should parse year only', () => {
    const result = parse('1985');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.type).toBe('Date');
      expect(result.value.year).toBe(1985);
      expect(result.value.month).toBeUndefined();
      expect(result.value.day).toBeUndefined();
      expect(result.value.precision).toBe('year');
    }
  });

  it('should parse negative years (BCE)', () => {
    const result = parse('-0044');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(-44);
    }
  });

  it('should validate year only', () => {
    expect(isValid('1985')).toBe(true);
    expect(isValid('2023')).toBe(true);
    expect(isValid('0000')).toBe(true);
    expect(isValid('-0044')).toBe(true);
  });

  it('should calculate min/max dates correctly for year only', () => {
    const result = parse('1985');
    if (result.success) {
      const min = result.value.min;
      const max = result.value.max;

      expect(min.getUTCFullYear()).toBe(1985);
      expect(min.getUTCMonth()).toBe(0); // January
      expect(min.getUTCDate()).toBe(1); // First day

      expect(max.getUTCFullYear()).toBe(1985);
      expect(max.getUTCMonth()).toBe(11); // December
      expect(max.getUTCDate()).toBe(31); // Last day of year
    }
  });

  it('should serialize year to JSON correctly', () => {
    const result = parse('1985');
    if (result.success) {
      const json = result.value.toJSON();
      expect(json).toEqual({
        type: 'Date',
        year: 1985
      });
      expect(json).not.toHaveProperty('month');
      expect(json).not.toHaveProperty('day');
    }
  });
});

describe('Level 0 - DateTime', () => {
  it('should parse datetime with Z timezone', () => {
    const result = parse('1985-04-12T23:20:30Z');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDateTime(result.value)) {
      expect(result.value.type).toBe('DateTime');
      expect(result.value.year).toBe(1985);
      expect(result.value.month).toBe(4);
      expect(result.value.day).toBe(12);
      expect(result.value.hour).toBe(23);
      expect(result.value.minute).toBe(20);
      expect(result.value.second).toBe(30);
      expect(result.value.timezone).toBe('Z');
      expect(result.value.precision).toBe('second');
    }
  });

  it('should parse datetime without timezone', () => {
    const result = parse('1985-04-12T23:20:30');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDateTime(result.value)) {
      expect(result.value.timezone).toBeUndefined();
    }
  });

  it('should parse datetime with positive timezone offset', () => {
    const result = parse('1985-04-12T23:20:30+05:00');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDateTime(result.value)) {
      expect(result.value.timezone).toBe('+05:00');
    }
  });

  it('should parse datetime with negative timezone offset', () => {
    const result = parse('1985-04-12T23:20:30-08:00');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDateTime(result.value)) {
      expect(result.value.timezone).toBe('-08:00');
    }
  });

  it('should validate datetime correctly', () => {
    expect(isValid('1985-04-12T23:20:30Z')).toBe(true);
    expect(isValid('2023-12-25T00:00:00Z')).toBe(true);
    expect(isValid('2000-01-01T12:30:45+05:00')).toBe(true);
  });

  it('should reject invalid time components', () => {
    expect(isValid('1985-04-12T24:20:30Z')).toBe(false); // Invalid hour
    expect(isValid('1985-04-12T23:60:30Z')).toBe(false); // Invalid minute
    expect(isValid('1985-04-12T23:20:60Z')).toBe(false); // Invalid second
  });

  it('should serialize datetime to JSON correctly', () => {
    const result = parse('1985-04-12T23:20:30Z');
    if (result.success) {
      const json = result.value.toJSON();
      expect(json).toEqual({
        type: 'DateTime',
        year: 1985,
        month: 4,
        day: 12,
        hour: 23,
        minute: 20,
        second: 30,
        timezone: 'Z'
      });
    }
  });
});

describe('Level 0 - Intervals', () => {
  it('should parse year interval', () => {
    const result = parse('1964/2008');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      expect(result.value.type).toBe('Interval');
      if (isEDTFDate(result.value.start) && isEDTFDate(result.value.end)) {
        expect(result.value.start.year).toBe(1964);
        expect(result.value.end.year).toBe(2008);
      }
    }
  });

  it('should parse month interval', () => {
    const result = parse('2004-06/2006-08');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      if (isEDTFDate(result.value.start) && isEDTFDate(result.value.end)) {
        expect(result.value.start.year).toBe(2004);
        expect(result.value.start.month).toBe(6);
        expect(result.value.end.year).toBe(2006);
        expect(result.value.end.month).toBe(8);
      }
    }
  });

  it('should parse day interval', () => {
    const result = parse('2004-02-01/2005-02-08');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      if (isEDTFDate(result.value.start) && isEDTFDate(result.value.end)) {
        expect(result.value.start.year).toBe(2004);
        expect(result.value.start.month).toBe(2);
        expect(result.value.start.day).toBe(1);
        expect(result.value.end.year).toBe(2005);
        expect(result.value.end.month).toBe(2);
        expect(result.value.end.day).toBe(8);
      }
    }
  });

  it('should parse datetime interval', () => {
    const result = parse('1985-04-12T23:20:30Z/1986-05-13T01:30:45Z');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      expect(isEDTFDateTime(result.value.start)).toBe(true);
      expect(isEDTFDateTime(result.value.end)).toBe(true);
    }
  });

  it('should validate intervals correctly', () => {
    expect(isValid('1964/2008')).toBe(true);
    expect(isValid('2004-06/2006-08')).toBe(true);
    expect(isValid('2004-02-01/2005-02-08')).toBe(true);
  });

  it('should reject intervals with invalid start', () => {
    const result = parse('1985-13-01/2000-01-01');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].message).toContain('Invalid interval start');
    }
  });

  it('should reject intervals with invalid end', () => {
    const result = parse('1985-01-01/2000-13-01');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].message).toContain('Invalid interval end');
    }
  });

  it('should reject intervals where start is after end', () => {
    const result = parse('2008/1964');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe('INVALID_INTERVAL_ORDER');
    }
  });

  it('should calculate min/max dates correctly for intervals', () => {
    const result = parse('1964/2008');
    if (result.success && isEDTFInterval(result.value)) {
      expect(result.value.min.getUTCFullYear()).toBe(1964);
      expect(result.value.max.getUTCFullYear()).toBe(2008);
    }
  });

  it('should serialize interval to JSON correctly', () => {
    const result = parse('1964/2008');
    if (result.success) {
      const json = result.value.toJSON();
      expect(json).toHaveProperty('type', 'Interval');
      expect(json).toHaveProperty('start');
      expect(json).toHaveProperty('end');
    }
  });

  it('should allow intervals with same start and end', () => {
    expect(isValid('1985/1985')).toBe(true);
    expect(isValid('1985-04/1985-04')).toBe(true);
    expect(isValid('1985-04-12/1985-04-12')).toBe(true);
  });
});

describe('Level 0 - Edge Cases', () => {
  it('should trim whitespace from input', () => {
    expect(isValid('  1985-04-12  ')).toBe(true);
    expect(isValid('\t1985\t')).toBe(true);
  });

  it('should reject malformed dates', () => {
    expect(isValid('not-a-date')).toBe(false);
    expect(isValid('19850412')).toBe(false); // Missing separators
    expect(isValid('1985/04/12')).toBe(false); // Wrong separator
    expect(isValid('12-04-1985')).toBe(false); // Wrong order
  });

  it('should reject intervals with wrong separator count', () => {
    const result = parse('1985/2000/2010');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe('INVALID_INTERVAL');
    }
  });

  it('should handle year 0000', () => {
    expect(isValid('0000')).toBe(true);
    const result = parse('0000');
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(0);
    }
  });

  it('should provide helpful error messages', () => {
    const result = parse('1985-13-01');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].message).toContain('Month must be 01-12');
      expect(result.errors[0].code).toBe('INVALID_MONTH');
    }
  });

  it('should provide error positions when available', () => {
    const result = parse('1985-13-01');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].position).toBeDefined();
    }
  });
});

describe('Level 0 - Type Guards', () => {
  it('should identify EDTFDate correctly', () => {
    const result = parse('1985-04-12');
    if (result.success) {
      expect(isEDTFDate(result.value)).toBe(true);
      expect(isEDTFDateTime(result.value)).toBe(false);
      expect(isEDTFInterval(result.value)).toBe(false);
    }
  });

  it('should identify EDTFDateTime correctly', () => {
    const result = parse('1985-04-12T23:20:30Z');
    if (result.success) {
      expect(isEDTFDate(result.value)).toBe(false);
      expect(isEDTFDateTime(result.value)).toBe(true);
      expect(isEDTFInterval(result.value)).toBe(false);
    }
  });

  it('should identify EDTFInterval correctly', () => {
    const result = parse('1964/2008');
    if (result.success) {
      expect(isEDTFDate(result.value)).toBe(false);
      expect(isEDTFDateTime(result.value)).toBe(false);
      expect(isEDTFInterval(result.value)).toBe(true);
    }
  });
});
