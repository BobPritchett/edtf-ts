import { describe, it, expect } from 'vitest';
import { parse, isEDTFDate, compare, sort } from '../src/index.js';
import {
  earliest,
  latest,
  groupByYear,
  groupByMonth,
  duration,
  durationInDays,
  durationInYears,
  findOverlaps,
  unique,
} from '../src/comparators.js';

describe('Comparators - Compare', () => {
  it('should compare dates (min mode)', () => {
    const d1 = parse('2000');
    const d2 = parse('2001');

    if (d1.success && d2.success) {
      expect(compare(d1.value, d2.value, 'min')).toBeLessThan(0);
      expect(compare(d2.value, d1.value, 'min')).toBeGreaterThan(0);
      expect(compare(d1.value, d1.value, 'min')).toBe(0);
    }
  });

  it('should compare dates (max mode)', () => {
    const d1 = parse('2000');
    const d2 = parse('2001');

    if (d1.success && d2.success) {
      expect(compare(d1.value, d2.value, 'max')).toBeLessThan(0);
    }
  });

  it('should compare dates (midpoint mode)', () => {
    const d1 = parse('2000');
    const d2 = parse('2001');

    if (d1.success && d2.success) {
      expect(compare(d1.value, d2.value, 'midpoint')).toBeLessThan(0);
    }
  });
});

describe('Comparators - Sort', () => {
  it('should sort dates ascending', () => {
    const dates = [parse('2001'), parse('2000'), parse('1999')];
    const validDates = dates.filter(d => d.success).map(d => d.value);

    const sorted = sort(validDates);
    if (isEDTFDate(sorted[0]!) && isEDTFDate(sorted[1]!) && isEDTFDate(sorted[2]!)) {
      expect(sorted[0].year).toBe(1999);
      expect(sorted[1].year).toBe(2000);
      expect(sorted[2].year).toBe(2001);
    }
  });

  it('should sort dates descending', () => {
    const dates = [parse('1999'), parse('2000'), parse('2001')];
    const validDates = dates.filter(d => d.success).map(d => d.value);

    const sorted = sort(validDates, 'min', 'desc');
    if (isEDTFDate(sorted[0]!) && isEDTFDate(sorted[1]!) && isEDTFDate(sorted[2]!)) {
      expect(sorted[0].year).toBe(2001);
      expect(sorted[1].year).toBe(2000);
      expect(sorted[2].year).toBe(1999);
    }
  });

  it('should not modify original array', () => {
    const dates = [parse('2001'), parse('2000')];
    const validDates = dates.filter(d => d.success).map(d => d.value);
    const original = [...validDates];

    sort(validDates);

    expect(validDates).toEqual(original);
  });
});

describe('Comparators - Earliest and Latest', () => {
  it('should find earliest date', () => {
    const dates = [parse('2001'), parse('2000'), parse('1999')];
    const validDates = dates.filter(d => d.success).map(d => d.value);

    const min = earliest(validDates);
    expect(min && isEDTFDate(min) && min.year).toBe(1999);
  });

  it('should find latest date', () => {
    const dates = [parse('2001'), parse('2000'), parse('1999')];
    const validDates = dates.filter(d => d.success).map(d => d.value);

    const max = latest(validDates);
    expect(max && isEDTFDate(max) && max.year).toBe(2001);
  });

  it('should handle empty array', () => {
    expect(earliest([])).toBeUndefined();
    expect(latest([])).toBeUndefined();
  });
});

describe('Comparators - Grouping', () => {
  it('should group by year', () => {
    const dates = [
      parse('2000-01'),
      parse('2000-06'),
      parse('2001-01')
    ];
    const validDates = dates.filter(d => d.success && isEDTFDate(d.value)).map(d => d.value as any);

    const groups = groupByYear(validDates);

    expect(groups.get(2000)?.length).toBe(2);
    expect(groups.get(2001)?.length).toBe(1);
  });

  it('should group by month', () => {
    const dates = [
      parse('2000-01-15'),
      parse('2000-01-20'),
      parse('2000-02-10')
    ];
    const validDates = dates.filter(d => d.success && isEDTFDate(d.value)).map(d => d.value as any);

    const groups = groupByMonth(validDates);

    expect(groups.get('2000-01')?.length).toBe(2);
    expect(groups.get('2000-02')?.length).toBe(1);
  });
});

describe('Comparators - Duration', () => {
  it('should calculate duration in milliseconds', () => {
    const start = parse('2000-01-01');
    const end = parse('2000-01-02');

    if (start.success && end.success) {
      const dur = duration(start.value, end.value);
      expect(dur).toBeGreaterThan(0);
      expect(dur).toBeLessThanOrEqual(1000 * 60 * 60 * 24); // ~1 day
    }
  });

  it('should calculate duration in days', () => {
    const start = parse('2000-01-01');
    const end = parse('2000-01-08');

    if (start.success && end.success) {
      const days = durationInDays(start.value, end.value);
      expect(days).toBeCloseTo(7, 0);
    }
  });

  it('should calculate duration in years', () => {
    const start = parse('2000');
    const end = parse('2005');

    if (start.success && end.success) {
      const years = durationInYears(start.value, end.value);
      expect(years).toBeCloseTo(5, 0);
    }
  });
});

describe('Comparators - Overlaps', () => {
  it('should find overlapping dates', () => {
    const dates = [
      parse('2000'),
      parse('2000-06'),
      parse('2001')
    ];
    const validDates = dates.filter(d => d.success).map(d => d.value);

    const overlaps = findOverlaps(validDates);

    expect(overlaps.length).toBeGreaterThan(0);
  });

  it('should not find overlaps in non-overlapping dates', () => {
    const dates = [
      parse('2000-01'),
      parse('2000-03'),
      parse('2000-05')
    ];
    const validDates = dates.filter(d => d.success).map(d => d.value);

    const overlaps = findOverlaps(validDates);

    expect(overlaps.length).toBe(0);
  });
});

describe('Comparators - Unique', () => {
  it('should remove duplicate dates', () => {
    const dates = [
      parse('2000'),
      parse('2000'),
      parse('2001')
    ];
    const validDates = dates.filter(d => d.success).map(d => d.value);

    const uniq = unique(validDates);

    expect(uniq.length).toBe(2);
  });

  it('should preserve order', () => {
    const dates = [
      parse('2001'),
      parse('2000'),
      parse('2001')
    ];
    const validDates = dates.filter(d => d.success).map(d => d.value);

    const uniq = unique(validDates);

    expect(uniq.length).toBe(2);
    if (isEDTFDate(uniq[0]!) && isEDTFDate(uniq[1]!)) {
      expect(uniq[0].year).toBe(2001);
      expect(uniq[1].year).toBe(2000);
    }
  });
});
