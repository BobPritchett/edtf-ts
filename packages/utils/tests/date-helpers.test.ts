import { describe, it, expect } from 'vitest';
import {
  daysInMonth,
  createDate,
  getDateComponents,
  subtractYears,
  addYears,
  subtractMonths,
  addMonths,
  subtractWeeks,
  subtractDays,
  addDays,
  calculateAge,
  isBefore,
  isAfter,
  isSameDay,
  hasBirthdayPassedThisYear,
  formatDateISO,
} from '../src/date-helpers.js';
import { isLeapYear } from '../src/validators.js';

describe('daysInMonth', () => {
  it('should return correct days for each month', () => {
    expect(daysInMonth(2024, 1)).toBe(31); // January
    expect(daysInMonth(2024, 2)).toBe(29); // February (leap year)
    expect(daysInMonth(2023, 2)).toBe(28); // February (non-leap year)
    expect(daysInMonth(2024, 4)).toBe(30); // April
    expect(daysInMonth(2024, 12)).toBe(31); // December
  });
});

describe('isLeapYear', () => {
  it('should correctly identify leap years', () => {
    expect(isLeapYear(2000)).toBe(true); // divisible by 400
    expect(isLeapYear(1900)).toBe(false); // divisible by 100 but not 400
    expect(isLeapYear(2024)).toBe(true); // divisible by 4
    expect(isLeapYear(2023)).toBe(false); // not divisible by 4
  });
});

describe('subtractYears', () => {
  it('should subtract years from a date', () => {
    const date = createDate(2025, 6, 15);
    const result = subtractYears(date, 20);
    expect(getDateComponents(result)).toEqual({ year: 2005, month: 6, day: 15 });
  });

  it('should handle Feb 29 → Feb 28 when target is not leap year', () => {
    const leapDate = createDate(2024, 2, 29);
    const result = subtractYears(leapDate, 1); // 2023 is not a leap year
    expect(getDateComponents(result)).toEqual({ year: 2023, month: 2, day: 28 });
  });

  it('should handle Feb 29 → Feb 29 when target is leap year', () => {
    const leapDate = createDate(2024, 2, 29);
    const result = subtractYears(leapDate, 4); // 2020 is a leap year
    expect(getDateComponents(result)).toEqual({ year: 2020, month: 2, day: 29 });
  });
});

describe('subtractMonths', () => {
  it('should subtract months from a date', () => {
    const date = createDate(2025, 6, 15);
    const result = subtractMonths(date, 3);
    expect(getDateComponents(result)).toEqual({ year: 2025, month: 3, day: 15 });
  });

  it('should handle year boundary', () => {
    const date = createDate(2025, 3, 15);
    const result = subtractMonths(date, 6);
    expect(getDateComponents(result)).toEqual({ year: 2024, month: 9, day: 15 });
  });

  it('should clamp day to end of month (Aug 31 - 6 months = Feb 28)', () => {
    const date = createDate(2025, 8, 31);
    const result = subtractMonths(date, 6);
    // Feb 2025 has 28 days
    expect(getDateComponents(result)).toEqual({ year: 2025, month: 2, day: 28 });
  });

  it('should handle leap year Feb 29', () => {
    const date = createDate(2024, 8, 31);
    const result = subtractMonths(date, 6);
    // Feb 2024 has 29 days (leap year)
    expect(getDateComponents(result)).toEqual({ year: 2024, month: 2, day: 29 });
  });
});

describe('subtractDays', () => {
  it('should subtract days from a date', () => {
    const date = createDate(2025, 6, 15);
    const result = subtractDays(date, 10);
    expect(getDateComponents(result)).toEqual({ year: 2025, month: 6, day: 5 });
  });

  it('should handle month boundary', () => {
    const date = createDate(2025, 6, 1);
    const result = subtractDays(date, 1);
    expect(getDateComponents(result)).toEqual({ year: 2025, month: 5, day: 31 });
  });

  it('should handle year boundary', () => {
    const date = createDate(2025, 1, 1);
    const result = subtractDays(date, 1);
    expect(getDateComponents(result)).toEqual({ year: 2024, month: 12, day: 31 });
  });
});

describe('addDays', () => {
  it('should add days to a date', () => {
    const date = createDate(2025, 6, 1);
    const result = addDays(date, 5);
    expect(getDateComponents(result)).toEqual({ year: 2025, month: 6, day: 6 });
  });
});

describe('calculateAge', () => {
  it('should calculate age correctly when birthday has passed', () => {
    const birthdate = createDate(2005, 3, 15);
    const refDate = createDate(2025, 6, 1);
    expect(calculateAge(birthdate, refDate)).toBe(20);
  });

  it('should calculate age correctly when birthday has not passed', () => {
    const birthdate = createDate(2005, 8, 15);
    const refDate = createDate(2025, 6, 1);
    expect(calculateAge(birthdate, refDate)).toBe(19);
  });

  it('should calculate age correctly on birthday', () => {
    const birthdate = createDate(2005, 6, 1);
    const refDate = createDate(2025, 6, 1);
    expect(calculateAge(birthdate, refDate)).toBe(20);
  });

  it('should calculate age correctly on day before birthday', () => {
    const birthdate = createDate(2005, 6, 2);
    const refDate = createDate(2025, 6, 1);
    expect(calculateAge(birthdate, refDate)).toBe(19);
  });
});

describe('hasBirthdayPassedThisYear', () => {
  it('should return true when birthday month has passed', () => {
    const refDate = createDate(2025, 6, 1);
    expect(hasBirthdayPassedThisYear(3, 15, refDate)).toBe(true); // March 15
  });

  it('should return false when birthday month has not come', () => {
    const refDate = createDate(2025, 6, 1);
    expect(hasBirthdayPassedThisYear(8, 15, refDate)).toBe(false); // August 15
  });

  it('should return true when same month and day has passed', () => {
    const refDate = createDate(2025, 6, 15);
    expect(hasBirthdayPassedThisYear(6, 10, refDate)).toBe(true); // June 10
  });

  it('should return true on exact birthday', () => {
    const refDate = createDate(2025, 6, 15);
    expect(hasBirthdayPassedThisYear(6, 15, refDate)).toBe(true); // June 15
  });

  it('should return false when same month but day has not come', () => {
    const refDate = createDate(2025, 6, 15);
    expect(hasBirthdayPassedThisYear(6, 20, refDate)).toBe(false); // June 20
  });
});

describe('isBefore', () => {
  it('should return true when first date is before second', () => {
    const date1 = createDate(2024, 1, 1);
    const date2 = createDate(2025, 1, 1);
    expect(isBefore(date1, date2)).toBe(true);
  });

  it('should return false when first date is after second', () => {
    const date1 = createDate(2025, 1, 1);
    const date2 = createDate(2024, 1, 1);
    expect(isBefore(date1, date2)).toBe(false);
  });

  it('should return false when dates are equal', () => {
    const date1 = createDate(2025, 1, 1);
    const date2 = createDate(2025, 1, 1);
    expect(isBefore(date1, date2)).toBe(false);
  });
});

describe('isSameDay', () => {
  it('should return true for same dates', () => {
    const date1 = createDate(2025, 6, 15);
    const date2 = createDate(2025, 6, 15);
    expect(isSameDay(date1, date2)).toBe(true);
  });

  it('should return false for different dates', () => {
    const date1 = createDate(2025, 6, 15);
    const date2 = createDate(2025, 6, 16);
    expect(isSameDay(date1, date2)).toBe(false);
  });
});

describe('formatDateISO', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = createDate(2025, 6, 1);
    expect(formatDateISO(date)).toBe('2025-06-01');
  });

  it('should pad single digit month and day', () => {
    const date = createDate(2025, 1, 5);
    expect(formatDateISO(date)).toBe('2025-01-05');
  });
});
