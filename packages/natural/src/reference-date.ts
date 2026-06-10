/**
 * Module-level reference date shared with the generated grammar.
 *
 * Nearley postprocessors are compiled at grammar-build time and have no
 * per-parse parameter channel, so `parseNatural()` sets the reference date
 * here immediately before feeding the parser and resets it in a `finally`
 * block. Parsing is fully synchronous, so the value cannot leak across
 * concurrent callers.
 *
 * When no reference date is set, the current system date (local time) is
 * used, preserving the historical default behavior.
 */
let referenceDate: Date | null = null;

/** Set (or clear, with null) the reference date for the current parse. */
export function setReferenceDate(date: Date | null): void {
  referenceDate = date;
}

/**
 * The year (local time) used to resolve two-digit years via the sliding
 * +20-year future window.
 */
export function getReferenceYear(): number {
  return (referenceDate ?? new Date()).getFullYear();
}
