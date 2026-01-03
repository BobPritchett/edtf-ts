/**
 * Four-valued logic for temporal comparison results.
 *
 * - `YES`: The relation definitely holds (bounds force it to be true)
 * - `NO`: The relation definitely does not hold (bounds forbid it)
 * - `MAYBE`: The relation might hold (bounds allow but don't force)
 * - `UNKNOWN`: Cannot determine (required bound information is missing)
 *
 * Example: Is "1985" before "1990"?
 * - YES: All possible times in 1985 are before all possible times in 1990
 *
 * Example: Is "198X" before "1990"?
 * - MAYBE: Some values (1980-1989) are before, some (1989) might overlap
 *
 * Example: Is "1985/.." before "1990"?
 * - UNKNOWN: We don't know when the interval ends
 */
export type Truth = 'YES' | 'NO' | 'MAYBE' | 'UNKNOWN';

/**
 * Quantifier for combining truth values across multiple Members.
 *
 * - `ANY`: Returns YES if any member satisfies the relation (sets, search)
 * - `ALL`: Returns YES only if all members satisfy the relation (lists, validation)
 */
export type Quantifier = 'ANY' | 'ALL';
