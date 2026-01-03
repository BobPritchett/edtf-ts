import { describe, it, expect } from 'vitest';
import {
  isLeapYear,
  getDaysInMonth,
  getDaysInYear,
  daysSinceEpoch,
  astronomicalToHistorical,
  historicalToAstronomical,
} from '../../src/compare-utils/calendar.js';

describe('calendar utils', () => {
  describe('isLeapYear', () => {
    it('identifies regular leap years', () => {
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2004)).toBe(true);
      expect(isLeapYear(2024)).toBe(true);
    });

    it('identifies non-leap years', () => {
      expect(isLeapYear(2001)).toBe(false);
      expect(isLeapYear(2002)).toBe(false);
      expect(isLeapYear(2003)).toBe(false);
    });

    it('handles century years correctly', () => {
      expect(isLeapYear(1900)).toBe(false); // divisible by 100, not 400
      expect(isLeapYear(2000)).toBe(true);  // divisible by 400
      expect(isLeapYear(2100)).toBe(false); // divisible by 100, not 400
    });

    it('handles negative years (BC)', () => {
      expect(isLeapYear(0)).toBe(true);   // 1 BC (year 0)
      expect(isLeapYear(-1)).toBe(false); // 2 BC (year -1)
      expect(isLeapYear(-4)).toBe(true);  // 5 BC (year -4)
    });
  });

  describe('getDaysInMonth', () => {
    it('returns correct days for each month', () => {
      expect(getDaysInMonth(2024, 1)).toBe(31);  // January
      expect(getDaysInMonth(2024, 2)).toBe(29);  // February (leap)
      expect(getDaysInMonth(2024, 3)).toBe(31);  // March
      expect(getDaysInMonth(2024, 4)).toBe(30);  // April
      expect(getDaysInMonth(2024, 5)).toBe(31);  // May
      expect(getDaysInMonth(2024, 6)).toBe(30);  // June
      expect(getDaysInMonth(2024, 7)).toBe(31);  // July
      expect(getDaysInMonth(2024, 8)).toBe(31);  // August
      expect(getDaysInMonth(2024, 9)).toBe(30);  // September
      expect(getDaysInMonth(2024, 10)).toBe(31); // October
      expect(getDaysInMonth(2024, 11)).toBe(30); // November
      expect(getDaysInMonth(2024, 12)).toBe(31); // December
    });

    it('handles February in non-leap years', () => {
      expect(getDaysInMonth(2023, 2)).toBe(28);
      expect(getDaysInMonth(2025, 2)).toBe(28);
    });

    it('throws on invalid month', () => {
      expect(() => getDaysInMonth(2024, 0)).toThrow('Invalid month: 0');
      expect(() => getDaysInMonth(2024, 13)).toThrow('Invalid month: 13');
    });
  });

  describe('getDaysInYear', () => {
    it('returns 365 for non-leap years', () => {
      expect(getDaysInYear(2023)).toBe(365);
    });

    it('returns 366 for leap years', () => {
      expect(getDaysInYear(2024)).toBe(366);
    });
  });

  describe('daysSinceEpoch', () => {
    it('calculates Unix epoch correctly', () => {
      // 1970-01-01 should be 0
      expect(daysSinceEpoch(1970, 1, 1)).toBe(0n);
    });

    it('calculates known dates correctly', () => {
      // 1985-04-12 = 5580 days since epoch
      expect(daysSinceEpoch(1985, 4, 12)).toBe(5580n);

      // 2000-01-01 = 10957 days since epoch
      expect(daysSinceEpoch(2000, 1, 1)).toBe(10957n);
    });

    it('handles dates before epoch', () => {
      // 1969-12-31 = -1 day
      expect(daysSinceEpoch(1969, 12, 31)).toBe(-1n);

      // 1960-01-01
      expect(daysSinceEpoch(1960, 1, 1)).toBe(-3653n);
    });

    it('throws on invalid dates', () => {
      expect(() => daysSinceEpoch(2024, 0, 1)).toThrow('Invalid month');
      expect(() => daysSinceEpoch(2024, 13, 1)).toThrow('Invalid month');
      expect(() => daysSinceEpoch(2024, 2, 30)).toThrow('Invalid day');
    });
  });

  describe('astronomical to historical year conversion', () => {
    it('converts AD years correctly', () => {
      expect(astronomicalToHistorical(1)).toEqual({ year: 1, era: 'AD' });
      expect(astronomicalToHistorical(1985)).toEqual({ year: 1985, era: 'AD' });
      expect(astronomicalToHistorical(2024)).toEqual({ year: 2024, era: 'AD' });
    });

    it('converts BC years correctly', () => {
      expect(astronomicalToHistorical(0)).toEqual({ year: 1, era: 'BC' });
      expect(astronomicalToHistorical(-1)).toEqual({ year: 2, era: 'BC' });
      expect(astronomicalToHistorical(-99)).toEqual({ year: 100, era: 'BC' });
    });

    it('round-trips correctly', () => {
      const testYears = [2024, 1, 0, -1, -99, -999];

      for (const year of testYears) {
        const historical = astronomicalToHistorical(year);
        const astronomical = historicalToAstronomical(historical.year, historical.era);
        expect(astronomical).toBe(year);
      }
    });
  });
});
