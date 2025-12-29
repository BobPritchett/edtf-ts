/**
 * Validation utilities for EDTF dates
 */

import type { EDTFDate, EDTFDateTime, EDTFInterval } from '@edtf-ts/core';

/**
 * Check if a date falls within a given range.
 *
 * @param date - The date to check
 * @param start - The start of the range (inclusive)
 * @param end - The end of the range (inclusive)
 * @returns `true` if the date falls within the range, `false` otherwise
 *
 * @example
 * ```typescript
 * const date = parse('2000-06-15');
 * const start = parse('2000-01-01');
 * const end = parse('2000-12-31');
 *
 * if (date.success && start.success && end.success &&
 *     isEDTFDate(date.value) && isEDTFDate(start.value) && isEDTFDate(end.value)) {
 *   isInRange(date.value, start.value, end.value); // true
 * }
 * ```
 */
export function isInRange(
  date: EDTFDate | EDTFDateTime,
  start: EDTFDate | EDTFDateTime | Date,
  end: EDTFDate | EDTFDateTime | Date
): boolean {
  const dateMin = date.min.getTime();
  const dateMax = date.max.getTime();

  const startTime = start instanceof Date ? start.getTime() : start.min.getTime();
  const endTime = end instanceof Date ? end.getTime() : end.max.getTime();

  // Date overlaps range if its range intersects with the given range
  return dateMax >= startTime && dateMin <= endTime;
}

/**
 * Check if a date is completely contained within a given range.
 * Unlike `isInRange`, this requires the entire date range to be within the given range.
 *
 * @param date - The date to check
 * @param start - The start of the range (inclusive)
 * @param end - The end of the range (inclusive)
 * @returns `true` if the date is completely within the range, `false` otherwise
 *
 * @example
 * ```typescript
 * const month = parse('2000-06');
 * const year = parse('2000');
 *
 * if (month.success && year.success && isEDTFDate(month.value) && isEDTFDate(year.value)) {
 *   isCompletelyInRange(month.value, year.value.min, year.value.max); // true
 * }
 * ```
 */
export function isCompletelyInRange(
  date: EDTFDate | EDTFDateTime,
  start: EDTFDate | EDTFDateTime | Date,
  end: EDTFDate | EDTFDateTime | Date
): boolean {
  const dateMin = date.min.getTime();
  const dateMax = date.max.getTime();

  const startTime = start instanceof Date ? start.getTime() : start.min.getTime();
  const endTime = end instanceof Date ? end.getTime() : end.max.getTime();

  // Date is completely within range if both min and max fall within the given range
  return dateMin >= startTime && dateMax <= endTime;
}

/**
 * Check if a year is a leap year.
 *
 * @param year - The year to check
 * @returns `true` if the year is a leap year, `false` otherwise
 *
 * @example
 * ```typescript
 * isLeapYear(2000); // true
 * isLeapYear(2001); // false
 * isLeapYear(2004); // true
 * ```
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get the number of days in a given month.
 *
 * @param year - The year
 * @param month - The month (1-12)
 * @returns The number of days in the month
 *
 * @example
 * ```typescript
 * getDaysInMonth(2000, 2); // 29 (leap year)
 * getDaysInMonth(2001, 2); // 28
 * getDaysInMonth(2000, 4); // 30
 * ```
 */
export function getDaysInMonth(year: number, month: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (month === 2 && isLeapYear(year)) {
    return 29;
  }

  return daysInMonth[month - 1] || 0;
}

/**
 * Check if a date is valid (proper month and day values).
 *
 * @param year - The year
 * @param month - The month (1-12)
 * @param day - The day (1-31)
 * @returns `true` if the date is valid, `false` otherwise
 *
 * @example
 * ```typescript
 * isValidDate(2000, 2, 29); // true (leap year)
 * isValidDate(2001, 2, 29); // false (not a leap year)
 * isValidDate(2000, 13, 1); // false (invalid month)
 * ```
 */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  const maxDay = getDaysInMonth(year, month);
  return day <= maxDay;
}

/**
 * Check if an interval is valid (start is before or equal to end).
 *
 * @param interval - The interval to check
 * @returns `true` if the interval is valid, `false` otherwise
 *
 * @example
 * ```typescript
 * const interval = parse('2000/2010');
 * if (interval.success && isEDTFInterval(interval.value)) {
 *   isValidInterval(interval.value); // true
 * }
 * ```
 */
export function isValidInterval(interval: EDTFInterval): boolean {
  // If either endpoint is unknown, consider it valid
  if (!interval.start || !interval.end) return true;

  // Start must be before or equal to end
  return interval.start.min.getTime() <= interval.end.max.getTime();
}

/**
 * Check if a date has any uncertainty qualifications.
 *
 * @param date - The date to check
 * @returns `true` if the date is uncertain, `false` otherwise
 *
 * @example
 * ```typescript
 * const uncertain = parse('1984?');
 * if (uncertain.success && isEDTFDate(uncertain.value)) {
 *   isUncertain(uncertain.value); // true
 * }
 * ```
 */
export function isUncertain(date: EDTFDate): boolean {
  return !!(
    date.qualification?.uncertain ||
    date.qualification?.uncertainApproximate ||
    date.yearQualification?.uncertain ||
    date.yearQualification?.uncertainApproximate ||
    date.monthQualification?.uncertain ||
    date.monthQualification?.uncertainApproximate ||
    date.dayQualification?.uncertain ||
    date.dayQualification?.uncertainApproximate
  );
}

/**
 * Check if a date has any approximation qualifications.
 *
 * @param date - The date to check
 * @returns `true` if the date is approximate, `false` otherwise
 *
 * @example
 * ```typescript
 * const approx = parse('1984~');
 * if (approx.success && isEDTFDate(approx.value)) {
 *   isApproximate(approx.value); // true
 * }
 * ```
 */
export function isApproximate(date: EDTFDate): boolean {
  return !!(
    date.qualification?.approximate ||
    date.qualification?.uncertainApproximate ||
    date.yearQualification?.approximate ||
    date.yearQualification?.uncertainApproximate ||
    date.monthQualification?.approximate ||
    date.monthQualification?.uncertainApproximate ||
    date.dayQualification?.approximate ||
    date.dayQualification?.uncertainApproximate
  );
}

/**
 * Check if a date has any unspecified digits.
 *
 * @param date - The date to check
 * @returns `true` if the date has unspecified digits, `false` otherwise
 *
 * @example
 * ```typescript
 * const unspec = parse('199X');
 * if (unspec.success && isEDTFDate(unspec.value)) {
 *   hasUnspecified(unspec.value); // true
 * }
 * ```
 */
export function hasUnspecified(date: EDTFDate): boolean {
  return !!(
    date.unspecified?.year ||
    date.unspecified?.month ||
    date.unspecified?.day ||
    (typeof date.year === 'string' && date.year.includes('X')) ||
    (typeof date.month === 'string' && date.month.includes('X')) ||
    (typeof date.day === 'string' && date.day.includes('X'))
  );
}
