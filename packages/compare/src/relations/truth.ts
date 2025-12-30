/**
 * Truth value combinators for four-valued logic.
 *
 * Implements logic for combining multiple Truth values using quantifiers.
 */

import type { Truth } from '../types/index.js';

/**
 * Combine truth values using ANY quantifier.
 *
 * Returns YES if any value is YES.
 * Returns UNKNOWN if no YES but at least one UNKNOWN.
 * Returns MAYBE if no YES/UNKNOWN but at least one MAYBE.
 * Returns NO only if all are NO.
 *
 * Use case: Sets with "one of" semantics.
 *
 * @example
 * ```typescript
 * combineWithAny(['NO', 'YES', 'MAYBE']) // 'YES'
 * combineWithAny(['NO', 'MAYBE', 'MAYBE']) // 'MAYBE'
 * combineWithAny(['NO', 'NO']) // 'NO'
 * ```
 */
export function combineWithAny(values: Truth[]): Truth {
  if (values.length === 0) return 'NO';

  // YES beats everything
  if (values.includes('YES')) return 'YES';

  // UNKNOWN beats MAYBE and NO
  if (values.includes('UNKNOWN')) return 'UNKNOWN';

  // MAYBE beats NO
  if (values.includes('MAYBE')) return 'MAYBE';

  // All must be NO
  return 'NO';
}

/**
 * Combine truth values using ALL quantifier.
 *
 * Returns YES only if all values are YES.
 * Returns NO if any value is NO.
 * Returns UNKNOWN if no NO but at least one UNKNOWN.
 * Returns MAYBE if no NO/UNKNOWN but at least one MAYBE.
 *
 * Use case: Lists with "all of" semantics, validation.
 *
 * @example
 * ```typescript
 * combineWithAll(['YES', 'YES', 'YES']) // 'YES'
 * combineWithAll(['YES', 'NO', 'YES']) // 'NO'
 * combineWithAll(['YES', 'MAYBE', 'YES']) // 'MAYBE'
 * ```
 */
export function combineWithAll(values: Truth[]): Truth {
  if (values.length === 0) return 'YES';

  // NO beats everything
  if (values.includes('NO')) return 'NO';

  // UNKNOWN beats MAYBE and YES
  if (values.includes('UNKNOWN')) return 'UNKNOWN';

  // MAYBE beats YES
  if (values.includes('MAYBE')) return 'MAYBE';

  // All must be YES
  return 'YES';
}

/**
 * Negate a truth value.
 *
 * - YES → NO
 * - NO → YES
 * - MAYBE → MAYBE (still uncertain)
 * - UNKNOWN → UNKNOWN (still unknown)
 */
export function negate(value: Truth): Truth {
  if (value === 'YES') return 'NO';
  if (value === 'NO') return 'YES';
  return value; // MAYBE and UNKNOWN remain unchanged
}

/**
 * Logical AND for truth values.
 *
 * Both conditions must be satisfied.
 */
export function and(a: Truth, b: Truth): Truth {
  return combineWithAll([a, b]);
}

/**
 * Logical OR for truth values.
 *
 * At least one condition must be satisfied.
 */
export function or(a: Truth, b: Truth): Truth {
  return combineWithAny([a, b]);
}
