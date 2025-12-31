/**
 * EDTF Specification Compliance Tests
 * Based on examples from https://www.loc.gov/standards/datetime/
 */

import { describe, it, expect } from 'vitest';
import { parse } from '../src/index.js';

describe('EDTF Specification Compliance', () => {
  describe('Level 0 - ISO 8601 Profile', () => {
    it('should parse complete date', () => {
      const result = parse('1985-04-12');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Date');
        expect(result.value.precision).toBe('day');
        expect(result.level).toBe(0);
      }
    });

    it('should parse year-month', () => {
      const result = parse('1985-04');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.precision).toBe('month');
        expect(result.level).toBe(0);
      }
    });

    it('should parse year only', () => {
      const result = parse('1985');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.precision).toBe('year');
        expect(result.level).toBe(0);
      }
    });

    it('should parse datetime with time', () => {
      const result = parse('1985-04-12T23:20:30');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('DateTime');
        expect(result.level).toBe(0);
      }
    });

    it('should parse datetime with Z timezone', () => {
      const result = parse('1985-04-12T23:20:30Z');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('DateTime');
      }
    });

    it('should parse datetime with negative offset', () => {
      const result = parse('1985-04-12T23:20:30-04');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('DateTime');
      }
    });

    it('should parse datetime with positive offset with minutes', () => {
      const result = parse('1985-04-12T23:20:30+04:30');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('DateTime');
      }
    });

    it('should parse year interval', () => {
      const result = parse('1964/2008');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
        expect(result.level).toBe(0);
      }
    });

    it('should parse year-month interval', () => {
      const result = parse('2004-06/2006-08');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse complete date interval', () => {
      const result = parse('2004-02-01/2005-02-08');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse mixed precision interval (day/month)', () => {
      const result = parse('2004-02-01/2005-02');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse mixed precision interval (day/year)', () => {
      const result = parse('2004-02-01/2005');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse mixed precision interval (year/month)', () => {
      const result = parse('2005/2006-02');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });
  });

  describe('Level 1 - Extended Features', () => {
    it('should parse long year (positive)', () => {
      const result = parse('Y170000002');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1);
      }
    });

    it('should parse long year (negative)', () => {
      const result = parse('Y-170000002');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1);
      }
    });

    it('should parse season', () => {
      const result = parse('2001-21');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Season');
        expect(result.level).toBe(1);
      }
    });

    it('should parse uncertain year', () => {
      const result = parse('1984?');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1);
      }
    });

    it('should parse approximate year-month', () => {
      const result = parse('2004-06~');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1);
      }
    });

    it('should parse uncertain and approximate', () => {
      const result = parse('2004-06-11%');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1);
      }
    });

    it('should parse unspecified decade', () => {
      const result = parse('201X');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1);
      }
    });

    it('should parse unspecified century', () => {
      const result = parse('20XX');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1);
      }
    });

    it('should parse unspecified month', () => {
      const result = parse('2004-XX');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1);
      }
    });

    it('should parse unspecified day', () => {
      const result = parse('1985-04-XX');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1);
      }
    });

    it('should parse unspecified month and day', () => {
      const result = parse('1985-XX-XX');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1);
      }
    });

    it('should parse open end (complete date)', () => {
      const result = parse('1985-04-12/..');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
        expect(result.level).toBe(1);
      }
    });

    it('should parse open end (year-month)', () => {
      const result = parse('1985-04/..');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse open end (year)', () => {
      const result = parse('1985/..');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse open start (complete date)', () => {
      const result = parse('../1985-04-12');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse open start (year-month)', () => {
      const result = parse('../1985-04');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse open start (year)', () => {
      const result = parse('../1985');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse unknown end (complete date)', () => {
      const result = parse('1985-04-12/');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse unknown end (year-month)', () => {
      const result = parse('1985-04/');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse unknown end (year)', () => {
      const result = parse('1985/');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse unknown start (complete date)', () => {
      const result = parse('/1985-04-12');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse unknown start (year-month)', () => {
      const result = parse('/1985-04');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse unknown start (year)', () => {
      const result = parse('/1985');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
      }
    });

    it('should parse negative year', () => {
      const result = parse('-1985');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1);
      }
    });
  });

  describe('Level 2 - Extended Extended Features', () => {
    it('should parse exponential year (positive)', () => {
      const result = parse('Y-17E7');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse significant digits (year)', () => {
      const result = parse('1950S2');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse significant digits (long year)', () => {
      const result = parse('Y171010000S3');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse significant digits (exponential year)', () => {
      const result = parse('Y3388E2S3');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse extended season', () => {
      const result = parse('2001-34');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Season');
        expect(result.level).toBe(2);
      }
    });

    it('should parse set with range', () => {
      const result = parse('[1667,1668,1670..1672]');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Set');
        expect(result.level).toBe(2);
      }
    });

    it('should parse set with earlier (..-)', () => {
      const result = parse('[..1760-12-03]');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Set');
      }
    });

    it('should parse set with later (-..)', () => {
      const result = parse('[1760-12..]');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Set');
      }
    });

    it('should parse set with mixed values and later', () => {
      const result = parse('[1760-01,1760-02,1760-12..]');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Set');
      }
    });

    it('should parse set with multiple values', () => {
      const result = parse('[1667,1760-12]');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Set');
      }
    });

    it('should parse set with earlier only', () => {
      const result = parse('[..1984]');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Set');
      }
    });

    it('should parse list with range', () => {
      const result = parse('{1667,1668,1670..1672}');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('List');
        expect(result.level).toBe(2);
      }
    });

    it('should parse list with mixed precision', () => {
      const result = parse('{1960,1961-12}');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('List');
      }
    });

    it('should parse list with earlier', () => {
      const result = parse('{..1984}');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('List');
      }
    });

    it('should parse partial qualification (uncertain and approximate)', () => {
      const result = parse('2004-06-11%');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(1); // This is Level 1, not Level 2
      }
    });

    it('should parse partial qualification (approximate day)', () => {
      const result = parse('2004-06-~11');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse partial qualification (uncertain year)', () => {
      const result = parse('2004?-06-11');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse partial qualification (uncertain year, approximate day)', () => {
      const result = parse('?2004-06-~11');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse partial qualification (approximate month)', () => {
      const result = parse('2004-%06-11');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse unspecified with specific month and day', () => {
      const result = parse('156X-12-25');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse unspecified century with month and day', () => {
      const result = parse('15XX-12-25');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse completely unspecified year with month', () => {
      const result = parse('XXXX-12-XX');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse partial year unspecified', () => {
      const result = parse('1XXX-XX');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse partial year with specific month', () => {
      const result = parse('1XXX-12');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse partial unspecified month', () => {
      const result = parse('1984-1X');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.level).toBe(2);
      }
    });

    it('should parse partial qualification interval', () => {
      const result = parse('2004-06-~01/2004-06-~20');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
        expect(result.level).toBe(2);
      }
    });

    it('should parse interval with unspecified day', () => {
      const result = parse('2004-06-XX/2004-07-03');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.type).toBe('Interval');
        expect(result.level).toBe(2);
      }
    });
  });
});
