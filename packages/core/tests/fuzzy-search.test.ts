/**
 * Fuzzy Search Tests
 *
 * Tests for heuristic search bounds and overlap scoring functionality.
 */

import { describe, it, expect } from 'vitest';
import {
  FuzzyDate,
  ONE_DAY_MS,
  ONE_MONTH_MS,
  ONE_YEAR_MS,
  getSearchPadding,
} from '../src/index.js';

describe('Search Constants', () => {
  describe('Duration constants', () => {
    it('should have correct day duration', () => {
      expect(ONE_DAY_MS).toBe(86_400_000n);
    });

    it('should have correct month duration (~30.44 days)', () => {
      expect(ONE_MONTH_MS).toBe(2_629_800_000n);
    });

    it('should have correct year duration (~365.25 days)', () => {
      expect(ONE_YEAR_MS).toBe(31_557_600_000n);
    });
  });

  describe('getSearchPadding', () => {
    it('should return 0 for no qualifiers', () => {
      expect(getSearchPadding('year', false, false)).toBe(0n);
      expect(getSearchPadding('month', false, false)).toBe(0n);
      expect(getSearchPadding('day', false, false)).toBe(0n);
    });

    it('should return ±1 unit for uncertain (?)', () => {
      expect(getSearchPadding('year', false, true)).toBe(ONE_YEAR_MS);
      expect(getSearchPadding('month', false, true)).toBe(ONE_MONTH_MS);
      expect(getSearchPadding('day', false, true)).toBe(ONE_DAY_MS);
    });

    it('should return ±2 units for approximate (~)', () => {
      expect(getSearchPadding('year', true, false)).toBe(2n * ONE_YEAR_MS);
      expect(getSearchPadding('month', true, false)).toBe(2n * ONE_MONTH_MS);
      expect(getSearchPadding('day', true, false)).toBe(2n * ONE_DAY_MS);
    });

    it('should return ±3 units for both uncertain and approximate (%)', () => {
      expect(getSearchPadding('year', true, true)).toBe(3n * ONE_YEAR_MS);
      expect(getSearchPadding('month', true, true)).toBe(3n * ONE_MONTH_MS);
      expect(getSearchPadding('day', true, true)).toBe(3n * ONE_DAY_MS);
    });
  });
});

describe('Search Bounds', () => {
  describe('Strict bounds remain unchanged', () => {
    it('min/max should not change for approximate dates', () => {
      const exact = FuzzyDate.parse('1920');
      const approx = FuzzyDate.parse('1920~');

      // Strict bounds should be the same
      expect(exact.minMs).toBe(approx.minMs);
      expect(exact.maxMs).toBe(approx.maxMs);
    });

    it('min/max should not change for uncertain dates', () => {
      const exact = FuzzyDate.parse('1920');
      const uncertain = FuzzyDate.parse('1920?');

      // Strict bounds should be the same
      expect(exact.minMs).toBe(uncertain.minMs);
      expect(exact.maxMs).toBe(uncertain.maxMs);
    });
  });

  describe('Year precision padding', () => {
    it('should not pad exact years', () => {
      const date = FuzzyDate.parse('1920');
      expect(date.searchMinMs).toBe(date.minMs);
      expect(date.searchMaxMs).toBe(date.maxMs);
    });

    it('should pad uncertain year (?) by ±1 year', () => {
      const date = FuzzyDate.parse('1920?');
      const padding = ONE_YEAR_MS;

      expect(date.searchMinMs).toBe(date.minMs - padding);
      expect(date.searchMaxMs).toBe(date.maxMs + padding);

      // searchMin should be in late 1918 or early 1919 (millisecond math may not hit exact year boundary)
      expect(date.searchMin.getUTCFullYear()).toBeLessThanOrEqual(1919);
      expect(date.searchMin.getUTCFullYear()).toBeGreaterThanOrEqual(1918);
      // searchMax should be in late 1921 or early 1922
      expect(date.searchMax.getUTCFullYear()).toBeGreaterThanOrEqual(1921);
      expect(date.searchMax.getUTCFullYear()).toBeLessThanOrEqual(1922);
    });

    it('should pad approximate year (~) by ±2 years', () => {
      const date = FuzzyDate.parse('1920~');
      const padding = 2n * ONE_YEAR_MS;

      expect(date.searchMinMs).toBe(date.minMs - padding);
      expect(date.searchMaxMs).toBe(date.maxMs + padding);

      // searchMin should be in 1917-1918 range
      expect(date.searchMin.getUTCFullYear()).toBeLessThanOrEqual(1918);
      expect(date.searchMin.getUTCFullYear()).toBeGreaterThanOrEqual(1917);
      // searchMax should be in 1922-1923 range
      expect(date.searchMax.getUTCFullYear()).toBeGreaterThanOrEqual(1922);
      expect(date.searchMax.getUTCFullYear()).toBeLessThanOrEqual(1923);
    });

    it('should pad uncertain+approximate year (%) by ±3 years', () => {
      const date = FuzzyDate.parse('1920%');
      const padding = 3n * ONE_YEAR_MS;

      expect(date.searchMinMs).toBe(date.minMs - padding);
      expect(date.searchMaxMs).toBe(date.maxMs + padding);

      // searchMin should be in 1916-1917 range
      expect(date.searchMin.getUTCFullYear()).toBeLessThanOrEqual(1917);
      expect(date.searchMin.getUTCFullYear()).toBeGreaterThanOrEqual(1916);
      // searchMax should be in 1923-1924 range
      expect(date.searchMax.getUTCFullYear()).toBeGreaterThanOrEqual(1923);
      expect(date.searchMax.getUTCFullYear()).toBeLessThanOrEqual(1924);
    });
  });

  describe('Month precision padding', () => {
    it('should not pad exact month', () => {
      const date = FuzzyDate.parse('1920-05');
      expect(date.searchMinMs).toBe(date.minMs);
      expect(date.searchMaxMs).toBe(date.maxMs);
    });

    it('should pad uncertain month (?) by ±1 month', () => {
      const date = FuzzyDate.parse('1920-05?');
      const padding = ONE_MONTH_MS;

      expect(date.searchMinMs).toBe(date.minMs - padding);
      expect(date.searchMaxMs).toBe(date.maxMs + padding);

      // searchMin should be roughly April 1920 (month math may not hit exact boundary)
      // May (month 4, 0-indexed) - 1 month = March/April
      expect(date.searchMin.getUTCMonth()).toBeLessThanOrEqual(4); // At most May
      expect(date.searchMin.getUTCMonth()).toBeGreaterThanOrEqual(2); // At least March
    });

    it('should pad approximate month (~) by ±2 months', () => {
      const date = FuzzyDate.parse('1920-05~');
      const padding = 2n * ONE_MONTH_MS;

      expect(date.searchMinMs).toBe(date.minMs - padding);
      expect(date.searchMaxMs).toBe(date.maxMs + padding);

      // searchMin should be roughly March 1920
      expect(date.searchMin.getUTCMonth()).toBe(2); // March (0-indexed)
    });
  });

  describe('Day precision padding', () => {
    it('should not pad exact day', () => {
      const date = FuzzyDate.parse('1920-05-10');
      expect(date.searchMinMs).toBe(date.minMs);
      expect(date.searchMaxMs).toBe(date.maxMs);
    });

    it('should pad approximate day (~) by ±2 days', () => {
      const date = FuzzyDate.parse('1920-05-10~');
      const padding = 2n * ONE_DAY_MS;

      expect(date.searchMinMs).toBe(date.minMs - padding);
      expect(date.searchMaxMs).toBe(date.maxMs + padding);

      // searchMin should be May 8
      expect(date.searchMin.getUTCDate()).toBe(8);
      // searchMax should be May 12
      expect(date.searchMax.getUTCDate()).toBe(12);
    });
  });

  describe('Unspecified digits with qualifiers', () => {
    it('should compound padding for unspecified decade with approximate (199X~)', () => {
      const date = FuzzyDate.parse('199X~');

      // Strict bounds cover 1990-1999
      const strictMinYear = date.min.getUTCFullYear();
      const strictMaxYear = date.max.getUTCFullYear();
      expect(strictMinYear).toBe(1990);
      expect(strictMaxYear).toBe(1999);

      // Search bounds should expand by ±2 years
      const searchMinYear = date.searchMin.getUTCFullYear();
      const searchMaxYear = date.searchMax.getUTCFullYear();
      expect(searchMinYear).toBe(1988);
      expect(searchMaxYear).toBe(2001);
    });

    it('should handle unspecified year digits with uncertain (?)', () => {
      const date = FuzzyDate.parse('19XX?');

      // Strict bounds cover 1900-1999
      expect(date.min.getUTCFullYear()).toBe(1900);
      expect(date.max.getUTCFullYear()).toBe(1999);

      // Search bounds should expand by ±1 year (allowing for ms math variance)
      expect(date.searchMin.getUTCFullYear()).toBeLessThanOrEqual(1899);
      expect(date.searchMin.getUTCFullYear()).toBeGreaterThanOrEqual(1898);
      expect(date.searchMax.getUTCFullYear()).toBeGreaterThanOrEqual(2000);
      expect(date.searchMax.getUTCFullYear()).toBeLessThanOrEqual(2001);
    });
  });

  describe('Interval search bounds', () => {
    it('should use separate padding for start and end', () => {
      // Start is approximate (~), end is uncertain (?)
      const interval = FuzzyDate.parse('1985~/1990?');

      // Start gets ~2 year padding, end gets ?1 year padding (with ms variance)
      expect(interval.searchMin.getUTCFullYear()).toBeLessThanOrEqual(1983);
      expect(interval.searchMin.getUTCFullYear()).toBeGreaterThanOrEqual(1982);
      expect(interval.searchMax.getUTCFullYear()).toBeGreaterThanOrEqual(1991);
      expect(interval.searchMax.getUTCFullYear()).toBeLessThanOrEqual(1992);
    });

    it('should not add padding for open starts', () => {
      const interval = FuzzyDate.parse('../1990');
      // Open start, so no extra padding on min
      expect(interval.searchMinMs).toBe(interval.minMs);
    });

    it('should not add padding for open ends', () => {
      const interval = FuzzyDate.parse('1985/..');
      // Open end, so no extra padding on max
      expect(interval.searchMaxMs).toBe(interval.maxMs);
    });

    it('should handle exact interval without padding', () => {
      const interval = FuzzyDate.parse('1985/1990');
      expect(interval.searchMinMs).toBe(interval.minMs);
      expect(interval.searchMaxMs).toBe(interval.maxMs);
    });
  });

  describe('Season search bounds', () => {
    it('should use month-level precision for seasons', () => {
      const season = FuzzyDate.parse('1985-21~'); // Approximate Spring 1985

      // Season spans roughly 3 months
      // Approximate qualifier adds ±2 months
      // Verify that padding is applied (search range is wider than strict range)
      expect(season.searchMinMs).toBeLessThan(season.minMs);
      expect(season.searchMaxMs).toBeGreaterThan(season.maxMs);

      // Verify the padding amount is approximately 2 months
      const minPadding = season.minMs - season.searchMinMs;
      const maxPadding = season.searchMaxMs - season.maxMs;
      expect(minPadding).toBe(2n * ONE_MONTH_MS);
      expect(maxPadding).toBe(2n * ONE_MONTH_MS);
    });
  });

  describe('Set search bounds', () => {
    it('should inherit uncertainty from set nature', () => {
      // Sets are inherently uncertain (we don't know which member is actual)
      const set = FuzzyDate.parse('[1667,1668,1670]');

      // Sets have isUncertain = true by default
      expect(set.isUncertain).toBe(true);

      // So they get uncertainty padding on the convex hull
      expect(set.searchMinMs).toBeLessThan(set.minMs);
      expect(set.searchMaxMs).toBeGreaterThan(set.maxMs);
    });
  });
});

describe('Overlap Scoring', () => {
  describe('Perfect matches', () => {
    it('should return 1.0 for identical dates', () => {
      const a = FuzzyDate.parse('1920');
      const b = FuzzyDate.parse('1920');
      expect(a.overlapScore(b)).toBe(1.0);
    });

    it('should return 1.0 for same approximate dates', () => {
      const a = FuzzyDate.parse('1920~');
      const b = FuzzyDate.parse('1920~');
      expect(a.overlapScore(b)).toBe(1.0);
    });
  });

  describe('No overlap', () => {
    it('should return 0.0 for non-overlapping dates', () => {
      const a = FuzzyDate.parse('1920');
      const b = FuzzyDate.parse('1950');
      expect(a.overlapScore(b)).toBe(0.0);
    });

    it('should return 0.0 for distant approximate dates', () => {
      const a = FuzzyDate.parse('1920~'); // expands to ~1918-1922
      const b = FuzzyDate.parse('1950~'); // expands to ~1948-1952
      expect(a.overlapScore(b)).toBe(0.0);
    });
  });

  describe('Partial overlap', () => {
    it('should return value between 0 and 1 for overlapping dates', () => {
      const exact = FuzzyDate.parse('1920');
      const approx = FuzzyDate.parse('1920~');

      const score = exact.overlapScore(approx);
      expect(score).toBeGreaterThan(0.0);
      expect(score).toBeLessThan(1.0);
    });

    it('should give higher scores to closer matches', () => {
      const query = FuzzyDate.parse('1920');
      const exact1920 = FuzzyDate.parse('1920');
      const circa1920 = FuzzyDate.parse('1920~');
      const circa1950 = FuzzyDate.parse('1950~'); // Far away year

      const scoreExact = query.overlapScore(exact1920);
      const scoreCirca = query.overlapScore(circa1920);
      const scoreFar = query.overlapScore(circa1950);

      // Exact match should be highest
      expect(scoreExact).toBe(1.0);

      // Circa 1920 should have high overlap (contains 1920)
      expect(scoreCirca).toBeGreaterThan(0.1);

      // Circa 1950 should have no overlap (too far away)
      expect(scoreFar).toBe(0);

      // Circa 1920 should score higher than far away dates
      expect(scoreCirca).toBeGreaterThan(scoreFar);
    });

    it('should rank approximate decade lower than approximate year', () => {
      const query = FuzzyDate.parse('1919');
      const circaYear = FuzzyDate.parse('1919~');
      const circaDecade = FuzzyDate.parse('191X~');

      const scoreYear = query.overlapScore(circaYear);
      const scoreDecade = query.overlapScore(circaDecade);

      // Approximate year should score higher than approximate decade
      expect(scoreYear).toBeGreaterThan(scoreDecade);

      // But decade should still have some overlap
      expect(scoreDecade).toBeGreaterThan(0.0);
    });
  });

  describe('Symmetry', () => {
    it('should be symmetric (a.overlapScore(b) == b.overlapScore(a))', () => {
      const a = FuzzyDate.parse('1920~');
      const b = FuzzyDate.parse('1921~');

      expect(a.overlapScore(b)).toBe(b.overlapScore(a));
    });
  });

  describe('Input types', () => {
    it('should accept FuzzyDate input', () => {
      const a = FuzzyDate.parse('1920');
      const b = FuzzyDate.parse('1920');
      expect(() => a.overlapScore(b)).not.toThrow();
    });

    it('should accept JS Date input', () => {
      const a = FuzzyDate.parse('1920');
      const jsDate = new Date(Date.UTC(1920, 5, 15)); // June 15, 1920 (month is 0-indexed)
      expect(() => a.overlapScore(jsDate)).not.toThrow();
      // Note: A JS Date is converted to a point in time (minMs === maxMs), not a day range.
      // This means the Jaccard index returns 0 since a point has zero duration.
      // This is a known limitation - for proper day overlap, use FuzzyDate.parse() instead.
      const score = a.overlapScore(jsDate);
      expect(score).toBe(0);
    });

    it('should calculate overlap correctly with parsed day date', () => {
      const a = FuzzyDate.parse('1920');
      const dayInYear = FuzzyDate.parse('1920-06-15');
      // A day range has duration, so there should be non-zero overlap with the year
      const score = a.overlapScore(dayInYear);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should rank "Photos from 1919" query correctly', () => {
      // Query: looking for photos from 1919
      const query = FuzzyDate.parse('1919');

      // Results with varying dates
      const exact1919 = FuzzyDate.parse('1919');
      const circa1919 = FuzzyDate.parse('1919~');
      const circa1920 = FuzzyDate.parse('1920~');
      const circa1920s = FuzzyDate.parse('192X~');

      const scores = [
        { date: '1919', score: query.overlapScore(exact1919) },
        { date: '1919~', score: query.overlapScore(circa1919) },
        { date: '1920~', score: query.overlapScore(circa1920) },
        { date: '192X~', score: query.overlapScore(circa1920s) },
      ];

      // Verify ranking order
      expect(scores[0]!.score).toBe(1.0); // Exact match
      expect(scores[1]!.score).toBeGreaterThan(scores[2]!.score); // Circa 1919 > Circa 1920
      expect(scores[2]!.score).toBeGreaterThan(scores[3]!.score); // Circa 1920 > Circa 1920s

      // Circa 1920s should still have non-zero score due to search bound overlap
      expect(scores[3]!.score).toBeGreaterThan(0);
    });

    it('should handle museum collection date ranges', () => {
      // Query: events in the 1920s
      const query = FuzzyDate.parse('1920/1929');

      // Result: artifact dated "circa 1925"
      const circa1925 = FuzzyDate.parse('1925~');

      const score = query.overlapScore(circa1925);

      // Should have substantial overlap since 1925 is within 1920-1929
      // circa 1925 expands to roughly 1923-1927, which overlaps well with 1920-1929
      expect(score).toBeGreaterThan(0.4);
      expect(score).toBeLessThan(1.0);
    });
  });
});
