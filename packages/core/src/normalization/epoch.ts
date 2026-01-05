/**
 * Epoch millisecond conversion utilities.
 *
 * Converts dates to/from BigInt milliseconds since Unix epoch (1970-01-01 00:00:00 UTC).
 * Uses the proleptic Gregorian calendar for all dates.
 */

import { daysSinceEpoch } from '../compare-utils/calendar.js';

/**
 * Milliseconds in one day.
 */
const MS_PER_DAY = 86_400_000n;

/**
 * Components of a date/time value.
 */
export interface DateComponents {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}

/**
 * Convert date/time components to epoch milliseconds.
 *
 * Uses proleptic Gregorian calendar with astronomical year numbering:
 * - Year 0 = 1 BC
 * - Year -1 = 2 BC
 *
 * Time components default to 0 if not provided.
 *
 * @param components Date/time components
 * @returns Epoch milliseconds as BigInt
 *
 * @example
 * ```typescript
 * dateToEpochMs({ year: 1985, month: 4, day: 12 })
 * // Returns: 482371200000n (Apr 12, 1985 00:00:00.000)
 *
 * dateToEpochMs({ year: 0, month: 1, day: 1 })
 * // Returns: -62167219200000n (Jan 1, 1 BC 00:00:00.000)
 * ```
 */
export function dateToEpochMs(components: DateComponents): bigint {
  const { year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0 } = components;

  // Validate time components
  if (hour < 0 || hour > 23) {
    throw new Error(`Invalid hour: ${hour}`);
  }
  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minute}`);
  }
  if (second < 0 || second > 59) {
    throw new Error(`Invalid second: ${second}`);
  }
  if (millisecond < 0 || millisecond > 999) {
    throw new Error(`Invalid millisecond: ${millisecond}`);
  }

  // Calculate days since epoch
  const days = daysSinceEpoch(year, month, day);

  // Calculate time of day in milliseconds
  const timeMs =
    BigInt(hour) * 3_600_000n +
    BigInt(minute) * 60_000n +
    BigInt(second) * 1_000n +
    BigInt(millisecond);

  return days * MS_PER_DAY + timeMs;
}

/**
 * Convert epoch milliseconds to a JavaScript Date object.
 *
 * Returns null if the value is outside JavaScript Date's safe range.
 *
 * @param epochMs Epoch milliseconds as BigInt
 * @returns Date object or null
 */
export function epochMsToDate(epochMs: bigint): Date | null {
  // JavaScript Date range: approximately ±8.64e15 milliseconds from epoch
  const MIN_SAFE_MS = -8_640_000_000_000_000n;
  const MAX_SAFE_MS = 8_640_000_000_000_000n;

  if (epochMs < MIN_SAFE_MS || epochMs > MAX_SAFE_MS) {
    return null;
  }

  return new Date(Number(epochMs));
}

/**
 * Get the start of a day (00:00:00.000).
 *
 * @param year Astronomical year
 * @param month Month (1-12)
 * @param day Day of month (1-31)
 */
export function startOfDay(year: number, month: number, day: number): bigint {
  return dateToEpochMs({ year, month, day, hour: 0, minute: 0, second: 0, millisecond: 0 });
}

/**
 * Get the end of a day (23:59:59.999).
 *
 * @param year Astronomical year
 * @param month Month (1-12)
 * @param day Day of month (1-31)
 */
export function endOfDay(year: number, month: number, day: number): bigint {
  return dateToEpochMs({ year, month, day, hour: 23, minute: 59, second: 59, millisecond: 999 });
}

/**
 * Get the start of a month (first day, 00:00:00.000).
 *
 * @param year Astronomical year
 * @param month Month (1-12)
 */
export function startOfMonth(year: number, month: number): bigint {
  return startOfDay(year, month, 1);
}

/**
 * Get the end of a month (last day, 23:59:59.999).
 *
 * @param year Astronomical year
 * @param month Month (1-12)
 */
export function endOfMonth(year: number, month: number): bigint {
  // Calculate days in month inline to avoid async import
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let lastDay = daysInMonth[month - 1]!;

  // Check for leap year February
  if (month === 2) {
    const isLeap = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
    if (isLeap) lastDay = 29;
  }

  return endOfDay(year, month, lastDay);
}

/**
 * Get the start of a year (Jan 1, 00:00:00.000).
 *
 * @param year Astronomical year
 */
export function startOfYear(year: number): bigint {
  return startOfDay(year, 1, 1);
}

/**
 * Get the end of a year (Dec 31, 23:59:59.999).
 *
 * @param year Astronomical year
 */
export function endOfYear(year: number): bigint {
  return endOfDay(year, 12, 31);
}
