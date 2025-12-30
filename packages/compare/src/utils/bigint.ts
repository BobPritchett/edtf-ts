/**
 * BigInt arithmetic helpers for temporal calculations.
 *
 * These utilities handle large integer arithmetic needed for extreme years
 * beyond JavaScript's safe integer range.
 */

/**
 * Find the minimum of an array of bigints, ignoring null values.
 */
export function minBigInt(values: (bigint | null)[]): bigint | null {
  const filtered = values.filter((v): v is bigint => v !== null);
  if (filtered.length === 0) return null;

  return filtered.reduce((min, val) => (val < min ? val : min));
}

/**
 * Find the maximum of an array of bigints, ignoring null values.
 */
export function maxBigInt(values: (bigint | null)[]): bigint | null {
  const filtered = values.filter((v): v is bigint => v !== null);
  if (filtered.length === 0) return null;

  return filtered.reduce((max, val) => (val > max ? val : max));
}

/**
 * Clamp a bigint value between min and max.
 */
export function clampBigInt(value: bigint, min: bigint, max: bigint): bigint {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Convert bigint to number safely, returning null if out of safe range.
 */
export function bigIntToNumber(value: bigint): number | null {
  if (value < Number.MIN_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
    return null;
  }
  return Number(value);
}

/**
 * Check if a bigint can be safely converted to a JavaScript number.
 */
export function isSafeBigInt(value: bigint): boolean {
  return (
    value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER
  );
}
