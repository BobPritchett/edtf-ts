import { describe, it, expect } from 'vitest';
import { parse, isEDTFDate, isEDTFInterval } from '@edtf-ts/core';
import {
  isInRange,
  isCompletelyInRange,
  isLeapYear,
  getDaysInMonth,
  isValidDate,
  isValidInterval,
  isUncertain,
  isApproximate,
  hasUnspecified,
} from '../src/validators.js';

describe('Validators - Range Checking', () => {
  it('should check if date is in range', () => {
    const date = parse('2000-06-15');
    const start = parse('2000-01-01');
    const end = parse('2000-12-31');

    if (date.success && start.success && end.success &&
        isEDTFDate(date.value) && isEDTFDate(start.value) && isEDTFDate(end.value)) {
      expect(isInRange(date.value, start.value, end.value)).toBe(true);
    }
  });

  it('should check if date is outside range', () => {
    const date = parse('2001-06-15');
    const start = parse('2000-01-01');
    const end = parse('2000-12-31');

    if (date.success && start.success && end.success &&
        isEDTFDate(date.value) && isEDTFDate(start.value) && isEDTFDate(end.value)) {
      expect(isInRange(date.value, start.value, end.value)).toBe(false);
    }
  });

  it('should check if date overlaps range', () => {
    const date = parse('2000'); // Entire year 2000
    const start = parse('2000-06-01');
    const end = parse('2000-06-30');

    if (date.success && start.success && end.success &&
        isEDTFDate(date.value) && isEDTFDate(start.value) && isEDTFDate(end.value)) {
      expect(isInRange(date.value, start.value, end.value)).toBe(true);
    }
  });

  it('should check if date is completely in range', () => {
    const month = parse('2000-06');
    const year = parse('2000');

    if (month.success && year.success &&
        isEDTFDate(month.value) && isEDTFDate(year.value)) {
      expect(isCompletelyInRange(month.value, year.value.min, year.value.max)).toBe(true);
    }
  });

  it('should check if date is not completely in range', () => {
    const year = parse('2000');
    const month = parse('2000-06');

    if (year.success && month.success &&
        isEDTFDate(year.value) && isEDTFDate(month.value)) {
      expect(isCompletelyInRange(year.value, month.value.min, month.value.max)).toBe(false);
    }
  });
});

describe('Validators - Leap Year', () => {
  it('should identify leap years', () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2004)).toBe(true);
    expect(isLeapYear(2020)).toBe(true);
  });

  it('should identify non-leap years', () => {
    expect(isLeapYear(2001)).toBe(false);
    expect(isLeapYear(1900)).toBe(false); // Century rule
    expect(isLeapYear(2100)).toBe(false);
  });

  it('should handle century leap years', () => {
    expect(isLeapYear(2000)).toBe(true); // Divisible by 400
    expect(isLeapYear(1600)).toBe(true);
    expect(isLeapYear(1900)).toBe(false); // Not divisible by 400
  });
});

describe('Validators - Days in Month', () => {
  it('should return correct days for regular months', () => {
    expect(getDaysInMonth(2000, 1)).toBe(31);
    expect(getDaysInMonth(2000, 4)).toBe(30);
    expect(getDaysInMonth(2000, 6)).toBe(30);
    expect(getDaysInMonth(2000, 12)).toBe(31);
  });

  it('should handle February in leap years', () => {
    expect(getDaysInMonth(2000, 2)).toBe(29);
    expect(getDaysInMonth(2004, 2)).toBe(29);
  });

  it('should handle February in non-leap years', () => {
    expect(getDaysInMonth(2001, 2)).toBe(28);
    expect(getDaysInMonth(1900, 2)).toBe(28);
  });
});

describe('Validators - Date Validation', () => {
  it('should validate correct dates', () => {
    expect(isValidDate(2000, 2, 29)).toBe(true); // Leap year
    expect(isValidDate(2000, 4, 30)).toBe(true);
    expect(isValidDate(2000, 12, 31)).toBe(true);
  });

  it('should reject invalid months', () => {
    expect(isValidDate(2000, 0, 1)).toBe(false);
    expect(isValidDate(2000, 13, 1)).toBe(false);
  });

  it('should reject invalid days', () => {
    expect(isValidDate(2000, 2, 30)).toBe(false); // Feb only has 29 in leap year
    expect(isValidDate(2001, 2, 29)).toBe(false); // Not a leap year
    expect(isValidDate(2000, 4, 31)).toBe(false); // April has 30 days
  });

  it('should reject day 0 or negative', () => {
    expect(isValidDate(2000, 1, 0)).toBe(false);
    expect(isValidDate(2000, 1, -1)).toBe(false);
  });
});

describe('Validators - Interval Validation', () => {
  it('should validate correct intervals', () => {
    const interval = parse('2000/2010');
    if (interval.success && isEDTFInterval(interval.value)) {
      expect(isValidInterval(interval.value)).toBe(true);
    }
  });

  it('should reject invalid intervals', () => {
    const interval = parse('2010/2000');
    if (interval.success && isEDTFInterval(interval.value)) {
      expect(isValidInterval(interval.value)).toBe(false);
    }
  });

  it('should accept intervals with unknown endpoints', () => {
    const interval1 = parse('../2010');
    const interval2 = parse('2000/..');

    if (interval1.success && isEDTFInterval(interval1.value)) {
      expect(isValidInterval(interval1.value)).toBe(true);
    }

    if (interval2.success && isEDTFInterval(interval2.value)) {
      expect(isValidInterval(interval2.value)).toBe(true);
    }
  });
});

describe('Validators - Uncertainty', () => {
  it('should detect uncertain dates', () => {
    const uncertain = parse('1984?');
    if (uncertain.success && isEDTFDate(uncertain.value)) {
      expect(isUncertain(uncertain.value)).toBe(true);
    }
  });

  it('should detect uncertain-approximate dates', () => {
    const ua = parse('1984%');
    if (ua.success && isEDTFDate(ua.value)) {
      expect(isUncertain(ua.value)).toBe(true);
    }
  });

  it('should detect partial uncertainty', () => {
    const partial = parse('?2004-06-11');
    if (partial.success && isEDTFDate(partial.value)) {
      expect(isUncertain(partial.value)).toBe(true);
    }
  });

  it('should not detect uncertainty in certain dates', () => {
    const certain = parse('1984');
    if (certain.success && isEDTFDate(certain.value)) {
      expect(isUncertain(certain.value)).toBe(false);
    }
  });
});

describe('Validators - Approximation', () => {
  it('should detect approximate dates', () => {
    const approx = parse('1984~');
    if (approx.success && isEDTFDate(approx.value)) {
      expect(isApproximate(approx.value)).toBe(true);
    }
  });

  it('should detect approximate-uncertain dates', () => {
    const ua = parse('1984%');
    if (ua.success && isEDTFDate(ua.value)) {
      expect(isApproximate(ua.value)).toBe(true);
    }
  });

  it('should detect partial approximation', () => {
    const partial = parse('2004-~06-11');
    if (partial.success && isEDTFDate(partial.value)) {
      expect(isApproximate(partial.value)).toBe(true);
    }
  });

  it('should not detect approximation in exact dates', () => {
    const exact = parse('1984');
    if (exact.success && isEDTFDate(exact.value)) {
      expect(isApproximate(exact.value)).toBe(false);
    }
  });
});

describe('Validators - Unspecified Digits', () => {
  it('should detect unspecified year digits', () => {
    const unspec = parse('199X');
    if (unspec.success && isEDTFDate(unspec.value)) {
      expect(hasUnspecified(unspec.value)).toBe(true);
    }
  });

  it('should detect unspecified month', () => {
    const unspec = parse('2004-XX');
    if (unspec.success && isEDTFDate(unspec.value)) {
      expect(hasUnspecified(unspec.value)).toBe(true);
    }
  });

  it('should detect unspecified day', () => {
    const unspec = parse('2004-06-XX');
    if (unspec.success && isEDTFDate(unspec.value)) {
      expect(hasUnspecified(unspec.value)).toBe(true);
    }
  });

  it('should not detect unspecified in complete dates', () => {
    const complete = parse('2004-06-11');
    if (complete.success && isEDTFDate(complete.value)) {
      expect(hasUnspecified(complete.value)).toBe(false);
    }
  });
});
