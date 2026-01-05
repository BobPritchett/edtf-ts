/**
 * Date helper utilities for handling extended years and JavaScript Date limitations.
 */

import { DATE_MIN_MS, DATE_MAX_MS } from '../types/index.js';

// Milliseconds per unit
const MS_PER_SECOND = 1000n;
const MS_PER_MINUTE = 60n * MS_PER_SECOND;
const MS_PER_HOUR = 60n * MS_PER_MINUTE;
const MS_PER_DAY = 24n * MS_PER_HOUR;

// Average milliseconds per year (accounting for leap years: 365.2425 days)
const MS_PER_YEAR = 31556952000n; // 365.2425 * 24 * 60 * 60 * 1000

/**
 * Check if a year is within JavaScript Date range (~±270,000 years).
 */
export function isYearInDateRange(year: number): boolean {
  // JavaScript Date can handle approximately ±270,000 years
  return year >= -270000 && year <= 270000;
}

/**
 * Calculate epoch milliseconds for a given date (bigint, always accurate).
 * Handles years far outside JavaScript Date range.
 */
export function calculateEpochMs(
  year: number,
  month: number = 1,
  day: number = 1,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
  millisecond: number = 0
): bigint {
  // For years within normal range, use Date for precision
  if (isYearInDateRange(year)) {
    return BigInt(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
  }

  // For extended years, calculate from epoch
  // Use a reference year for month/day calculations
  const referenceYear = 2000;
  const referenceMs = BigInt(Date.UTC(referenceYear, month - 1, day, hour, minute, second, millisecond));

  // Calculate year difference and adjust
  const yearDiff = BigInt(year - referenceYear);
  return referenceMs + (yearDiff * MS_PER_YEAR);
}

/**
 * Calculate epoch milliseconds for the start of a year (Jan 1, 00:00:00.000).
 */
export function yearStartMs(year: number): bigint {
  return calculateEpochMs(year, 1, 1, 0, 0, 0, 0);
}

/**
 * Calculate epoch milliseconds for the end of a year (Dec 31, 23:59:59.999).
 */
export function yearEndMs(year: number): bigint {
  return calculateEpochMs(year, 12, 31, 23, 59, 59, 999);
}

/**
 * Clamp epoch milliseconds to JavaScript Date range.
 */
export function clampToDateRange(ms: bigint): bigint {
  if (ms < DATE_MIN_MS) return DATE_MIN_MS;
  if (ms > DATE_MAX_MS) return DATE_MAX_MS;
  return ms;
}

/**
 * Create a Date from epoch milliseconds, clamping to valid range if needed.
 */
export function dateFromMs(ms: bigint): Date {
  const clampedMs = clampToDateRange(ms);
  return new Date(Number(clampedMs));
}

/**
 * Check if epoch milliseconds requires clamping for JavaScript Date.
 */
export function needsClamping(ms: bigint): boolean {
  return ms < DATE_MIN_MS || ms > DATE_MAX_MS;
}

/**
 * Days in a month, accounting for leap years.
 */
export function daysInMonth(year: number, month: number): number {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return days[month - 1] || 0;
}

/**
 * Check if a year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
