/**
 * FuzzyDate API Tests
 *
 * Tests for the Temporal-inspired FuzzyDate wrapper API.
 */

import { describe, it, expect } from 'vitest';
import {
  FuzzyDate,
  FuzzyDateBase,
  FuzzyDateDate,
  FuzzyDateTime,
  FuzzyDateInterval,
  FuzzyDateSeason,
  FuzzyDateSet,
  FuzzyDateList,
  FuzzyDateParseError,
  parse,
} from '../src/index.js';

describe('FuzzyDate', () => {
  describe('FuzzyDate.from() - Result-based parsing', () => {
    it('should parse a simple date', () => {
      const result = FuzzyDate.from('1985-04-12');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Date');
        expect(result.value.edtf).toBe('1985-04-12');
        expect(result.level).toBe(0);
      }
    });

    it('should parse an interval', () => {
      const result = FuzzyDate.from('1985/1990');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse a season', () => {
      const result = FuzzyDate.from('1985-21');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Season');
      }
    });

    it('should return errors for invalid input', () => {
      const result = FuzzyDate.from('not a date');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('FuzzyDate.parse() - Throwing parser', () => {
    it('should parse valid EDTF and return FuzzyDate', () => {
      const date = FuzzyDate.parse('1985-04-12');
      expect(date.type).toBe('Date');
      expect(date.edtf).toBe('1985-04-12');
    });

    it('should throw FuzzyDateParseError on invalid input', () => {
      expect(() => FuzzyDate.parse('not a date')).toThrow(FuzzyDateParseError);
    });
  });

  describe('FuzzyDate.wrap() - Wrapping existing EDTFBase', () => {
    it('should wrap parsed EDTF objects', () => {
      const result = parse('1985-04-12');
      if (result.success) {
        const fuzzy = FuzzyDate.wrap(result.value);
        expect(fuzzy.type).toBe('Date');
        expect(fuzzy.edtf).toBe('1985-04-12');
      }
    });
  });

  describe('FuzzyDate.isValid()', () => {
    it('should return true for valid EDTF', () => {
      expect(FuzzyDate.isValid('1985-04-12')).toBe(true);
      expect(FuzzyDate.isValid('1985/1990')).toBe(true);
      expect(FuzzyDate.isValid('1984?')).toBe(true);
    });

    it('should return false for invalid EDTF', () => {
      expect(FuzzyDate.isValid('not a date')).toBe(false);
      expect(FuzzyDate.isValid('1985/13/01')).toBe(false);
    });
  });

  describe('FuzzyDate.compare()', () => {
    it('should compare two dates', () => {
      const a = FuzzyDate.parse('1985');
      const b = FuzzyDate.parse('1990');
      expect(FuzzyDate.compare(a, b)).toBeLessThan(0);
      expect(FuzzyDate.compare(b, a)).toBeGreaterThan(0);
    });
  });

  describe('Instance properties', () => {
    it('should expose temporal bounds', () => {
      const date = FuzzyDate.parse('1985-04-12');
      expect(date.min).toBeInstanceOf(Date);
      expect(date.max).toBeInstanceOf(Date);
      expect(typeof date.minMs).toBe('bigint');
      expect(typeof date.maxMs).toBe('bigint');
    });

    it('should expose precision', () => {
      expect(FuzzyDate.parse('1985').precision).toBe('year');
      expect(FuzzyDate.parse('1985-04').precision).toBe('month');
      expect(FuzzyDate.parse('1985-04-12').precision).toBe('day');
    });

    it('should expose level', () => {
      expect(FuzzyDate.parse('1985-04-12').level).toBe(0);
      expect(FuzzyDate.parse('1984?').level).toBe(1);
    });

    it('should provide access to inner EDTFBase', () => {
      const date = FuzzyDate.parse('1985-04-12');
      expect(date.inner).toBeDefined();
      expect(date.inner.edtf).toBe('1985-04-12');
    });
  });

  describe('Uncertainty properties', () => {
    it('should detect uncertainty', () => {
      expect(FuzzyDate.parse('1984?').isUncertain).toBe(true);
      expect(FuzzyDate.parse('1985').isUncertain).toBe(false);
    });

    it('should detect approximation', () => {
      expect(FuzzyDate.parse('1984~').isApproximate).toBe(true);
      expect(FuzzyDate.parse('1985').isApproximate).toBe(false);
    });

    it('should detect unspecified digits', () => {
      expect(FuzzyDate.parse('198X').hasUnspecified).toBe(true);
      expect(FuzzyDate.parse('1985').hasUnspecified).toBe(false);
    });
  });

  describe('Comparison methods (Allen relations)', () => {
    it('should return Truth values for isBefore', () => {
      const a = FuzzyDate.parse('1985');
      const b = FuzzyDate.parse('1990');
      expect(a.isBefore(b)).toBe('YES');
      expect(b.isBefore(a)).toBe('NO');
    });

    it('should return Truth values for isAfter', () => {
      const a = FuzzyDate.parse('1985');
      const b = FuzzyDate.parse('1990');
      expect(a.isAfter(b)).toBe('NO');
      expect(b.isAfter(a)).toBe('YES');
    });

    it('should handle MAYBE for uncertain comparisons', () => {
      const decade = FuzzyDate.parse('198X');
      const year = FuzzyDate.parse('1985');
      expect(decade.equals(year)).toBe('MAYBE');
    });

    it('should accept FuzzyDate, EDTFBase, and Date inputs', () => {
      const fuzzy = FuzzyDate.parse('1985-04-12');
      const result = parse('1990-01-01');
      const jsDate = new Date('2000-01-01');

      if (result.success) {
        // FuzzyDate input
        expect(fuzzy.isBefore(FuzzyDate.parse('1990'))).toBe('YES');
        // EDTFBase input
        expect(fuzzy.isBefore(result.value)).toBe('YES');
        // Date input
        expect(fuzzy.isBefore(jsDate)).toBe('YES');
      }
    });
  });

  describe('Boolean convenience methods', () => {
    it('isDefinitelyBefore returns boolean', () => {
      const a = FuzzyDate.parse('1985');
      const b = FuzzyDate.parse('1990');
      expect(a.isDefinitelyBefore(b)).toBe(true);
      expect(b.isDefinitelyBefore(a)).toBe(false);
    });

    it('isPossiblyBefore returns true for YES or MAYBE', () => {
      const decade = FuzzyDate.parse('198X');
      const year = FuzzyDate.parse('1985');
      // decade could be before, during, or after 1985
      expect(decade.isPossiblyBefore(year)).toBe(true);
    });
  });

  describe('Formatting methods', () => {
    it('format() returns human-readable string', () => {
      const date = FuzzyDate.parse('1985-04-12');
      const formatted = date.format();
      expect(formatted).toContain('1985');
      expect(formatted).toContain('12');
    });

    it('toString() returns EDTF string', () => {
      const date = FuzzyDate.parse('1985-04-12');
      expect(date.toString()).toBe('1985-04-12');
    });

    it('toJSON() returns serializable object', () => {
      const date = FuzzyDate.parse('1985-04-12');
      const json = date.toJSON();
      expect(json).toBeDefined();
    });

    it('toISO() returns ISO string when possible', () => {
      const date = FuzzyDate.parse('1985-04-12');
      expect(date.toISO()).toBe('1985-04-12');
    });
  });

  describe('FuzzyDate.Date subtype', () => {
    it('should have date-specific properties', () => {
      const result = FuzzyDate.Date.from('1985-04-12');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.year).toBe(1985);
        expect(result.value.month).toBe(4);
        expect(result.value.day).toBe(12);
      }
    });

    it('should fail for non-Date types', () => {
      const result = FuzzyDate.Date.from('1985/1990');
      expect(result.success).toBe(false);
    });
  });

  describe('FuzzyDate.Interval subtype', () => {
    it('should have interval-specific properties', () => {
      const result = FuzzyDate.Interval.from('1985/1990');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.start).not.toBeNull();
        expect(result.value.end).not.toBeNull();
        expect(result.value.isOpenStart).toBe(false);
        expect(result.value.isOpenEnd).toBe(false);
      }
    });

    it('should detect open intervals', () => {
      const result = FuzzyDate.Interval.from('1985/..');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.isOpenEnd).toBe(true);
      }
    });

    it('should iterate by year', () => {
      const result = FuzzyDate.Interval.from('1985/1987');
      expect(result.success).toBe(true);
      if (result.success) {
        const years = result.value.toArray('year');
        expect(years.length).toBe(3);
        expect(years[0]!.edtf).toBe('1985');
        expect(years[1]!.edtf).toBe('1986');
        expect(years[2]!.edtf).toBe('1987');
      }
    });
  });

  describe('FuzzyDate.Season subtype', () => {
    it('should have season-specific properties', () => {
      const result = FuzzyDate.Season.from('1985-21');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.year).toBe(1985);
        expect(result.value.season).toBe(21);
        expect(result.value.seasonName).toBe('Spring');
      }
    });
  });

  describe('instanceof checks', () => {
    it('should support instanceof for type checking', () => {
      const date = FuzzyDate.parse('1985-04-12');
      expect(date instanceof FuzzyDateBase).toBe(true);
      expect(date instanceof FuzzyDateDate).toBe(true);
    });

    it('should distinguish between types', () => {
      const date = FuzzyDate.parse('1985-04-12');
      const interval = FuzzyDate.parse('1985/1990');
      expect(date instanceof FuzzyDateDate).toBe(true);
      expect(date instanceof FuzzyDateInterval).toBe(false);
      expect(interval instanceof FuzzyDateInterval).toBe(true);
      expect(interval instanceof FuzzyDateDate).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should be frozen', () => {
      const date = FuzzyDate.parse('1985-04-12');
      expect(Object.isFrozen(date)).toBe(true);
    });
  });
});
