/**
 * Bound calculation utilities for EDTF normalization.
 *
 * These helpers extract the four bounds (sMin, sMax, eMin, eMax) from
 * EDTF date components, handling unspecified digits and precision variations.
 */

import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from './epoch.js';

/**
 * Parse a year that may contain unspecified digits (X).
 *
 * Returns { min, max } representing the range of possible years.
 *
 * Examples:
 * - "2020" → { min: 2020, max: 2020 }
 * - "202X" → { min: 2020, max: 2029 }
 * - "20XX" → { min: 2000, max: 2099 }
 * - "2XXX" → { min: 2000, max: 2999 }
 */
export function parseYearWithUnspecified(year: number | string): { min: number; max: number } {
  if (typeof year === 'number') {
    return { min: year, max: year };
  }

  const yearStr = String(year);

  // Count X's from right
  let min = 0;
  let max = 0;
  let multiplier = 1;

  for (let i = yearStr.length - 1; i >= 0; i--) {
    const char = yearStr[i];

    if (char === 'X' || char === 'x') {
      // X digit: min = 0, max = 9
      min += 0 * multiplier;
      max += 9 * multiplier;
    } else {
      const digit = parseInt(char, 10);
      if (isNaN(digit)) {
        throw new Error(`Invalid year character: ${char}`);
      }
      min += digit * multiplier;
      max += digit * multiplier;
    }

    multiplier *= 10;
  }

  // Handle negative years (leading minus)
  if (yearStr.startsWith('-')) {
    // For negative years, min and max are swapped
    return { min: -max, max: -min };
  }

  return { min, max };
}

/**
 * Parse a month that may be unspecified (XX).
 *
 * Returns { min, max } representing the range of possible months (1-12).
 */
export function parseMonthWithUnspecified(month: number | string | undefined): { min: number; max: number } | null {
  if (month === undefined) {
    return null;
  }

  if (typeof month === 'number') {
    return { min: month, max: month };
  }

  const monthStr = String(month);

  // Handle "XX"
  if (monthStr === 'XX' || monthStr === 'xx') {
    return { min: 1, max: 12 };
  }

  // Handle "1X" (October-December)
  if (monthStr === '1X' || monthStr === '1x') {
    return { min: 10, max: 12 };
  }

  // Handle "0X" (January-September)
  if (monthStr === '0X' || monthStr === '0x') {
    return { min: 1, max: 9 };
  }

  // Otherwise parse as number
  const parsed = parseInt(monthStr, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 12) {
    throw new Error(`Invalid month: ${monthStr}`);
  }

  return { min: parsed, max: parsed };
}

/**
 * Parse a day that may be unspecified (XX).
 *
 * Returns { min, max } representing the range of possible days.
 * Max is constrained by the actual days in the month.
 */
export function parseDayWithUnspecified(
  day: number | string | undefined,
  year: number,
  month: number
): { min: number; max: number } | null {
  if (day === undefined) {
    return null;
  }

  if (typeof day === 'number') {
    return { min: day, max: day };
  }

  const dayStr = String(day);

  // Import getDaysInMonth inline
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let maxDaysInMonth = daysInMonth[month - 1]!;

  if (month === 2) {
    const isLeap = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
    if (isLeap) maxDaysInMonth = 29;
  }

  // Handle "XX"
  if (dayStr === 'XX' || dayStr === 'xx') {
    return { min: 1, max: maxDaysInMonth };
  }

  // Handle "1X", "2X", "3X"
  if (dayStr.endsWith('X') || dayStr.endsWith('x')) {
    const tens = parseInt(dayStr[0]!, 10);
    if (isNaN(tens)) {
      throw new Error(`Invalid day: ${dayStr}`);
    }

    const min = tens * 10;
    const max = Math.min(tens * 10 + 9, maxDaysInMonth);

    // Validate range exists
    if (min > maxDaysInMonth) {
      throw new Error(`Invalid day range: ${dayStr} for month ${month}`);
    }

    return { min: Math.max(min, 1), max };
  }

  // Otherwise parse as number
  const parsed = parseInt(dayStr, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > maxDaysInMonth) {
    throw new Error(`Invalid day: ${dayStr} for month ${month}`);
  }

  return { min: parsed, max: parsed };
}

/**
 * Calculate bounds for a date with year precision.
 *
 * Returns epoch milliseconds for start and end of the year(s).
 */
export function boundsForYear(year: number | string): {
  sMin: bigint;
  sMax: bigint;
  eMin: bigint;
  eMax: bigint;
} {
  const { min: minYear, max: maxYear } = parseYearWithUnspecified(year);

  return {
    sMin: startOfYear(minYear),
    sMax: startOfYear(maxYear),
    eMin: endOfYear(minYear),
    eMax: endOfYear(maxYear),
  };
}

/**
 * Calculate bounds for a date with month precision.
 */
export function boundsForMonth(year: number | string, month: number | string): {
  sMin: bigint;
  sMax: bigint;
  eMin: bigint;
  eMax: bigint;
} {
  const { min: minYear, max: maxYear } = parseYearWithUnspecified(year);
  const monthRange = parseMonthWithUnspecified(month);

  if (!monthRange) {
    throw new Error('Month is required for month precision');
  }

  const { min: minMonth, max: maxMonth } = monthRange;

  return {
    sMin: startOfMonth(minYear, minMonth),
    sMax: startOfMonth(maxYear, maxMonth),
    eMin: endOfMonth(minYear, minMonth),
    eMax: endOfMonth(maxYear, maxMonth),
  };
}

/**
 * Calculate bounds for a date with day precision.
 */
export function boundsForDay(
  year: number | string,
  month: number | string,
  day: number | string
): {
  sMin: bigint;
  sMax: bigint;
  eMin: bigint;
  eMax: bigint;
} {
  const { min: minYear, max: maxYear } = parseYearWithUnspecified(year);
  const monthRange = parseMonthWithUnspecified(month);

  if (!monthRange) {
    throw new Error('Month is required for day precision');
  }

  const { min: minMonth, max: maxMonth } = monthRange;

  // For unspecified days, we need to calculate per month
  // Use the minimum year/month for min day, maximum year/month for max day
  const dayRangeMin = parseDayWithUnspecified(day, minYear, minMonth);
  const dayRangeMax = parseDayWithUnspecified(day, maxYear, maxMonth);

  if (!dayRangeMin || !dayRangeMax) {
    throw new Error('Day is required for day precision');
  }

  return {
    sMin: startOfDay(minYear, minMonth, dayRangeMin.min),
    sMax: startOfDay(maxYear, maxMonth, dayRangeMax.max),
    eMin: endOfDay(minYear, minMonth, dayRangeMin.min),
    eMax: endOfDay(maxYear, maxMonth, dayRangeMax.max),
  };
}
