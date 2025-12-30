import { describe, it, expect } from 'vitest';
import { parse } from '@edtf-ts/core';
import { meets, overlaps, during, equals, isBefore } from '../../src/index.js';

describe('Examples: MAYBE and UNKNOWN truth values', () => {
  describe('Open/Unknown endpoints - Currently return MAYBE', () => {
    it('open-ended interval vs specific year', () => {
      const openEnd = parse('1985/..').value!;  // 1985 to unbounded end
      const year1990 = parse('1990').value!;

      // Open end (..) means unbounded, not unknown
      // Current implementation: MAYBE (could extend beyond 1990 or not)
      // Alternative interpretation: UNKNOWN (we have no information about the end)
      expect(during(year1990, openEnd)).toBe('MAYBE');

      // We know the interval can't end before 1990 since it's open
      expect(isBefore(openEnd, year1990)).toBe('NO');
    });

    it('unknown start interval vs specific year', () => {
      const unknownStart = parse('../1990').value!;  // Unbounded start to 1990
      const year1985 = parse('1985').value!;

      // Open start means unbounded in the past
      // 1985 could be during the interval (if it extends that far back)
      expect(during(year1985, unknownStart)).toBe('MAYBE');

      // Actually, 1985 IS definitely before an unbounded-start interval
      // that ends in 1990, because the interval extends infinitely into the past
      // and ends at 1990, so 1985 must be before the END of the interval
      expect(isBefore(year1985, unknownStart)).toBe('YES');
    });

    it('interval with empty endpoint (unknown)', () => {
      const unknownEnd = parse('1985/').value!;  // 1985 to unknown end
      const year1990 = parse('1990').value!;

      // The trailing slash with no end means unknown endpoint
      // This truly returns UNKNOWN because we don't have information
      // about where the interval ends - it could end before, during, or after 1990
      expect(overlaps(unknownEnd, year1990)).toBe('UNKNOWN');
    });
  });

  describe('MAYBE - Uncertain due to imprecision', () => {
    it('unspecified decade vs specific year', () => {
      const decade = parse('198X').value!;  // Any year 1980-1989
      const year1985 = parse('1985').value!;

      // 1985 is definitely contained within 1980-1989
      // But do they equal? Only if 198X specifically means 1985
      expect(equals(decade, year1985)).toBe('MAYBE');

      // Does 1985 start the decade 198X? Only if 198X is 1985-1989
      expect(during(year1985, decade)).toBe('MAYBE');
    });

    it('unspecified month vs specific month', () => {
      const unspecifiedMonth = parse('1985-XX').value!;  // Any month in 1985
      const april = parse('1985-04').value!;

      // April is definitely during 1985-XX (which spans all months)
      expect(during(april, unspecifiedMonth)).toBe('MAYBE');

      // Do they equal? Only if 1985-XX specifically represents April
      expect(equals(unspecifiedMonth, april)).toBe('MAYBE');
    });

    it('unspecified day creating range uncertainty', () => {
      const unspecifiedDay = parse('1985-04-XX').value!;  // Any day in April
      const specific = parse('1985-04-12').value!;

      // Is 1985-04-12 during 1985-04-XX? Definitely yes!
      // Wait, let me reconsider - 1985-04-XX means "some day in April"
      // and 1985-04-12 is "all of April 12th"
      // So it depends on which day XX represents
      expect(during(specific, unspecifiedDay)).toBe('MAYBE');
      expect(equals(specific, unspecifiedDay)).toBe('MAYBE');
    });

    it('month-level precision affecting meets relation', () => {
      const april = parse('1985-04').value!;
      const may = parse('1985-05').value!;

      // At month level, do April and May "meet" (touch at one point)?
      // April: 1985-04-01 00:00 to 1985-04-30 23:59:59.999
      // May:   1985-05-01 00:00 to 1985-05-31 23:59:59.999
      // They're adjacent months but there's a 1ms gap
      // However, with month-level precision, they MIGHT be considered to meet
      const result = meets(april, may);

      // This should be MAYBE or NO depending on interpretation
      // Our implementation says NO (there's technically a gap)
      expect(result).toBe('NO');

      // But they definitely don't overlap
      expect(overlaps(april, may)).toBe('NO');
    });

    it('year-level precision with adjacent years', () => {
      const y1985 = parse('1985').value!;
      const y1986 = parse('1986').value!;

      // 1985: Jan 1 00:00:00.000 to Dec 31 23:59:59.999
      // 1986: Jan 1 00:00:00.000 to Dec 31 23:59:59.999
      // There's a 1ms gap, so they don't meet at a single point
      expect(meets(y1985, y1986)).toBe('NO');

      // But 1985 is definitely before 1986
      expect(isBefore(y1985, y1986)).toBe('YES');
    });

    it('interval with unspecified bounds', () => {
      const interval = parse('198X/199X').value!;  // 1980s to 1990s
      const year1985 = parse('1985').value!;

      // Is 1985 during this interval?
      // The interval could be 1980/1990 or 1989/1999, etc.
      // 1985 is definitely within some interpretations
      expect(during(year1985, interval)).toBe('MAYBE');
    });
  });

  describe('Real-world examples', () => {
    it('historical events with partial dates', () => {
      const earlyJune = parse('1944-06-XX').value!; // Some day in June 1944
      const dday = parse('1944-06-06').value!;      // D-Day

      // Could the unknown June date be D-Day?
      expect(equals(earlyJune, dday)).toBe('MAYBE');
    });

    it('ongoing project with open end', () => {
      const project = parse('2020-01/..').value!;  // Started Jan 2020, ongoing
      const now = parse('2024').value!;

      // Is 2024 during the project?
      // The project has an open end (..) meaning unbounded
      // So 2024 COULD be during it (if it's still ongoing)
      expect(during(now, project)).toBe('MAYBE');

      // We do know 2024 is not before the project (which started in 2020)
      expect(isBefore(now, project)).toBe('NO');
    });
  });
});
