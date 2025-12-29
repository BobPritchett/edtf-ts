/**
 * Comparison and sorting utilities for EDTF dates
 */

import type { EDTFBase, EDTFDate, EDTFDateTime } from '@edtf-ts/core';

/**
 * Comparison mode for EDTF dates.
 * - 'min': Compare using the earliest possible date (min)
 * - 'max': Compare using the latest possible date (max)
 * - 'midpoint': Compare using the midpoint between min and max
 */
export type ComparisonMode = 'min' | 'max' | 'midpoint';

/**
 * Compare two EDTF dates.
 *
 * @param a - First date
 * @param b - Second date
 * @param mode - Comparison mode (default: 'min')
 * @returns A negative number if a < b, positive if a > b, zero if equal
 *
 * @example
 * ```typescript
 * const d1 = parse('2000');
 * const d2 = parse('2001');
 *
 * if (d1.success && d2.success) {
 *   compare(d1.value, d2.value); // negative number (2000 < 2001)
 * }
 * ```
 */
export function compare(
  a: EDTFBase,
  b: EDTFBase,
  mode: ComparisonMode = 'min'
): number {
  const aTime = getComparisonTime(a, mode);
  const bTime = getComparisonTime(b, mode);

  return aTime - bTime;
}

/**
 * Get the comparison time for a date based on the mode.
 */
function getComparisonTime(value: EDTFBase, mode: ComparisonMode): number {
  switch (mode) {
    case 'min':
      return value.min.getTime();
    case 'max':
      return value.max.getTime();
    case 'midpoint':
      return (value.min.getTime() + value.max.getTime()) / 2;
  }
}

/**
 * Sort an array of EDTF dates.
 *
 * @param dates - Array of dates to sort
 * @param mode - Comparison mode (default: 'min')
 * @param order - Sort order: 'asc' or 'desc' (default: 'asc')
 * @returns A new sorted array
 *
 * @example
 * ```typescript
 * const dates = [parse('2001'), parse('2000'), parse('1999')];
 * const validDates = dates.filter(d => d.success).map(d => d.value);
 *
 * sort(validDates); // [1999, 2000, 2001]
 * sort(validDates, 'min', 'desc'); // [2001, 2000, 1999]
 * ```
 */
export function sort(
  dates: EDTFBase[],
  mode: ComparisonMode = 'min',
  order: 'asc' | 'desc' = 'asc'
): EDTFBase[] {
  const sorted = [...dates].sort((a, b) => compare(a, b, mode));

  return order === 'desc' ? sorted.reverse() : sorted;
}

/**
 * Find the earliest date in an array.
 *
 * @param dates - Array of dates
 * @param mode - Comparison mode (default: 'min')
 * @returns The earliest date, or undefined if array is empty
 *
 * @example
 * ```typescript
 * const dates = [parse('2001'), parse('2000'), parse('1999')];
 * const validDates = dates.filter(d => d.success).map(d => d.value);
 *
 * earliest(validDates); // 1999
 * ```
 */
export function earliest(
  dates: EDTFBase[],
  mode: ComparisonMode = 'min'
): EDTFBase | undefined {
  if (dates.length === 0) return undefined;

  return dates.reduce((min, current) =>
    compare(current, min, mode) < 0 ? current : min
  );
}

/**
 * Find the latest date in an array.
 *
 * @param dates - Array of dates
 * @param mode - Comparison mode (default: 'max')
 * @returns The latest date, or undefined if array is empty
 *
 * @example
 * ```typescript
 * const dates = [parse('2001'), parse('2000'), parse('1999')];
 * const validDates = dates.filter(d => d.success).map(d => d.value);
 *
 * latest(validDates); // 2001
 * ```
 */
export function latest(
  dates: EDTFBase[],
  mode: ComparisonMode = 'max'
): EDTFBase | undefined {
  if (dates.length === 0) return undefined;

  return dates.reduce((max, current) =>
    compare(current, max, mode) > 0 ? current : max
  );
}

/**
 * Group dates by year.
 *
 * @param dates - Array of dates to group
 * @returns A map of year to array of dates
 *
 * @example
 * ```typescript
 * const dates = [parse('2000-01'), parse('2000-06'), parse('2001-01')];
 * const validDates = dates.filter(d => d.success).map(d => d.value);
 *
 * groupByYear(validDates);
 * // Map {
 * //   2000 => [2000-01, 2000-06],
 * //   2001 => [2001-01]
 * // }
 * ```
 */
export function groupByYear(dates: (EDTFDate | EDTFDateTime)[]): Map<number, (EDTFDate | EDTFDateTime)[]> {
  const groups = new Map<number, (EDTFDate | EDTFDateTime)[]>();

  for (const date of dates) {
    const year = typeof date.year === 'number' ? date.year : parseInt(String(date.year), 10);

    if (!isNaN(year)) {
      const group = groups.get(year) || [];
      group.push(date);
      groups.set(year, group);
    }
  }

  return groups;
}

/**
 * Group dates by month (within the same year).
 *
 * @param dates - Array of dates to group
 * @returns A map of 'YYYY-MM' string to array of dates
 *
 * @example
 * ```typescript
 * const dates = [parse('2000-01-15'), parse('2000-01-20'), parse('2000-02-10')];
 * const validDates = dates.filter(d => d.success).map(d => d.value);
 *
 * groupByMonth(validDates);
 * // Map {
 * //   '2000-01' => [2000-01-15, 2000-01-20],
 * //   '2000-02' => [2000-02-10]
 * // }
 * ```
 */
export function groupByMonth(dates: (EDTFDate | EDTFDateTime)[]): Map<string, (EDTFDate | EDTFDateTime)[]> {
  const groups = new Map<string, (EDTFDate | EDTFDateTime)[]>();

  for (const date of dates) {
    if (date.month && typeof date.month === 'number') {
      const year = typeof date.year === 'number' ? date.year : parseInt(String(date.year), 10);
      const key = `${year}-${String(date.month).padStart(2, '0')}`;

      const group = groups.get(key) || [];
      group.push(date);
      groups.set(key, group);
    }
  }

  return groups;
}

/**
 * Calculate the duration between two dates in milliseconds.
 *
 * @param start - Start date
 * @param end - End date
 * @param mode - How to calculate duration: 'min' (shortest), 'max' (longest), 'midpoint' (average)
 * @returns Duration in milliseconds
 *
 * @example
 * ```typescript
 * const start = parse('2000-01-01');
 * const end = parse('2000-12-31');
 *
 * if (start.success && end.success) {
 *   duration(start.value, end.value); // milliseconds in ~1 year
 * }
 * ```
 */
export function duration(
  start: EDTFBase,
  end: EDTFBase,
  mode: ComparisonMode = 'min'
): number {
  const startTime = getComparisonTime(start, mode);
  const endTime = getComparisonTime(end, mode);

  return Math.abs(endTime - startTime);
}

/**
 * Calculate the duration between two dates in days.
 *
 * @param start - Start date
 * @param end - End date
 * @param mode - How to calculate duration
 * @returns Duration in days (fractional)
 *
 * @example
 * ```typescript
 * const start = parse('2000-01-01');
 * const end = parse('2000-01-08');
 *
 * if (start.success && end.success) {
 *   durationInDays(start.value, end.value); // ~7
 * }
 * ```
 */
export function durationInDays(
  start: EDTFBase,
  end: EDTFBase,
  mode: ComparisonMode = 'min'
): number {
  return duration(start, end, mode) / (1000 * 60 * 60 * 24);
}

/**
 * Calculate the duration between two dates in years.
 *
 * @param start - Start date
 * @param end - End date
 * @param mode - How to calculate duration
 * @returns Duration in years (fractional)
 *
 * @example
 * ```typescript
 * const start = parse('2000');
 * const end = parse('2005');
 *
 * if (start.success && end.success) {
 *   durationInYears(start.value, end.value); // ~5
 * }
 * ```
 */
export function durationInYears(
  start: EDTFBase,
  end: EDTFBase,
  mode: ComparisonMode = 'min'
): number {
  return durationInDays(start, end, mode) / 365.25;
}

/**
 * Find overlapping dates in an array.
 * Returns pairs of dates whose min/max ranges overlap.
 *
 * @param dates - Array of dates to check
 * @returns Array of overlapping date pairs
 *
 * @example
 * ```typescript
 * const dates = [parse('2000'), parse('2000-06'), parse('2001')];
 * const validDates = dates.filter(d => d.success).map(d => d.value);
 *
 * findOverlaps(validDates);
 * // [[2000, 2000-06]] (2000-06 is contained within 2000)
 * ```
 */
export function findOverlaps(dates: EDTFBase[]): [EDTFBase, EDTFBase][] {
  const overlaps: [EDTFBase, EDTFBase][] = [];

  for (let i = 0; i < dates.length; i++) {
    for (let j = i + 1; j < dates.length; j++) {
      const a = dates[i]!;
      const b = dates[j]!;

      // Check if ranges overlap
      if (a.max.getTime() >= b.min.getTime() && a.min.getTime() <= b.max.getTime()) {
        overlaps.push([a, b]);
      }
    }
  }

  return overlaps;
}

/**
 * Remove duplicate dates from an array.
 * Dates are considered duplicates if they have the same EDTF string representation.
 *
 * @param dates - Array of dates
 * @returns Array with duplicates removed
 *
 * @example
 * ```typescript
 * const dates = [parse('2000'), parse('2000'), parse('2001')];
 * const validDates = dates.filter(d => d.success).map(d => d.value);
 *
 * unique(validDates); // [2000, 2001]
 * ```
 */
export function unique(dates: EDTFBase[]): EDTFBase[] {
  const seen = new Set<string>();
  const result: EDTFBase[] = [];

  for (const date of dates) {
    if (!seen.has(date.edtf)) {
      seen.add(date.edtf);
      result.push(date);
    }
  }

  return result;
}
