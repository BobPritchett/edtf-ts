/**
 * Search Constants for Fuzzy Date Discovery
 *
 * These constants and helpers define the heuristic padding applied to
 * EDTF dates for search and discovery purposes. While `min`/`max` represent
 * strict EDTF bounds, `searchMin`/`searchMax` expand these bounds based on
 * uncertainty and approximation qualifiers.
 */

import type { Precision } from '../types/index.js';

// ============================================================
// Duration Constants (milliseconds as bigint)
// ============================================================

/** One day in milliseconds */
export const ONE_DAY_MS = 86_400_000n;

/** One month in milliseconds (~30.44 days average) */
export const ONE_MONTH_MS = 2_629_800_000n;

/** One year in milliseconds (~365.25 days average) */
export const ONE_YEAR_MS = 31_557_600_000n;

// ============================================================
// Qualifier Multipliers
// ============================================================

/** Multiplier for uncertain (?) qualifier: ±1 unit */
export const UNCERTAIN_MULTIPLIER = 1n;

/** Multiplier for approximate (~) qualifier: ±2 units */
export const APPROXIMATE_MULTIPLIER = 2n;

/** Multiplier for both uncertain and approximate (%) qualifier: ±3 units */
export const UNCERTAIN_APPROXIMATE_MULTIPLIER = 3n;

// ============================================================
// Padding Calculation
// ============================================================

/**
 * Get the appropriate duration unit for a precision level.
 *
 * @param precision - The precision of the date
 * @returns Duration in milliseconds as bigint
 */
export function getUnitForPrecision(precision: Precision): bigint {
  switch (precision) {
    case 'day':
      return ONE_DAY_MS;
    case 'month':
      return ONE_MONTH_MS;
    case 'year':
    default:
      // For hour/minute/second precision, use day as the unit
      // (these are typically exact and don't need search padding)
      return ONE_YEAR_MS;
  }
}

/**
 * Calculate the search padding for a date based on its precision and qualifiers.
 *
 * The padding is applied to both min and max bounds to expand the search range:
 * - Uncertain (?): ±1 unit of precision
 * - Approximate (~): ±2 units of precision
 * - Both (%): ±3 units of precision
 *
 * @param precision - The precision of the date (year, month, day)
 * @param isApproximate - Whether the date has an approximate (~) qualifier
 * @param isUncertain - Whether the date has an uncertain (?) qualifier
 * @returns Padding amount in milliseconds as bigint
 *
 * @example
 * // Approximate year: ±2 years
 * getSearchPadding('year', true, false) // 2 * ONE_YEAR_MS
 *
 * // Uncertain month: ±1 month
 * getSearchPadding('month', false, true) // 1 * ONE_MONTH_MS
 *
 * // Both uncertain and approximate day: ±3 days
 * getSearchPadding('day', true, true) // 3 * ONE_DAY_MS
 */
export function getSearchPadding(
  precision: Precision,
  isApproximate: boolean,
  isUncertain: boolean
): bigint {
  // No qualifiers means no padding
  if (!isApproximate && !isUncertain) {
    return 0n;
  }

  const unit = getUnitForPrecision(precision);

  let multiplier: bigint;
  if (isApproximate && isUncertain) {
    multiplier = UNCERTAIN_APPROXIMATE_MULTIPLIER;
  } else if (isApproximate) {
    multiplier = APPROXIMATE_MULTIPLIER;
  } else {
    multiplier = UNCERTAIN_MULTIPLIER;
  }

  return unit * multiplier;
}
