/**
 * @edtf-ts/natural - Natural language date parser for EDTF
 *
 * Converts human-readable date expressions into Extended Date/Time Format (EDTF).
 *
 * @example
 * ```typescript
 * import { parseNatural } from '@edtf-ts/natural';
 *
 * // Simple dates
 * parseNatural('January 12, 1940');
 * // [{ edtf: '1940-01-12', confidence: 0.95, ... }]
 *
 * // Uncertain/approximate
 * parseNatural('circa 1950');
 * // [{ edtf: '1950~', confidence: 0.95, ... }]
 *
 * // Ambiguous dates (returns multiple interpretations)
 * parseNatural('02/03/2020');
 * // [
 * //   { edtf: '2020-02-03', confidence: 0.6, interpretation: 'US format' },
 * //   { edtf: '2020-03-02', confidence: 0.4, interpretation: 'EU format' }
 * // ]
 *
 * // Intervals
 * parseNatural('from 1964 to 2008');
 * // [{ edtf: '1964/2008', type: 'interval', ... }]
 *
 * // Decades and centuries
 * parseNatural('the 1960s');
 * // [{ edtf: '196X', confidence: 0.95, ... }]
 * ```
 *
 * @packageDocumentation
 */

export { parseNatural, ParseError } from './parser';
export type { ParseResult, ParseNaturalOptions } from './parser';

// Export age and birthday parser
export { parseAgeBirthday } from './age-birthday';
export type { ParseAgeBirthdayOptions, ParseAgeBirthdayResult } from './age-birthday';
