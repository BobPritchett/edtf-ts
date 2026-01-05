/**
 * FuzzyDate - Temporal-inspired API for EDTF
 *
 * Provides an immutable, method-based interface for working with
 * Extended Date/Time Format values.
 *
 * @example
 * ```typescript
 * import { FuzzyDate } from '@edtf-ts/core';
 *
 * // Parse with result type
 * const result = FuzzyDate.from('1985-04-12');
 * if (result.success) {
 *   console.log(result.value.format()); // "April 12, 1985"
 * }
 *
 * // Parse with throwing (for when you know input is valid)
 * const date = FuzzyDate.parse('1985-04-12');
 * console.log(date.isBefore(FuzzyDate.parse('1990'))); // 'YES'
 *
 * // Type-specific parsing
 * const interval = FuzzyDate.Interval.from('1985/1990');
 * if (interval.success) {
 *   for (const year of interval.value.by('year')) {
 *     console.log(year.edtf);
 *   }
 * }
 * ```
 */

import type { ComparisonMode } from '../comparators.js';
import type {
  IFuzzyDate,
  IFuzzyDateDate,
  IFuzzyDateTime,
  IFuzzyDateInterval,
  IFuzzyDateSeason,
  IFuzzyDateSet,
  IFuzzyDateList,
} from './types.js';
import { FuzzyDateBase, registerFuzzyDateClasses } from './base.js';
import { FuzzyDateDate } from './date.js';
import { FuzzyDateTime } from './date-time.js';
import { FuzzyDateInterval } from './interval.js';
import { FuzzyDateSeason } from './season.js';
import { FuzzyDateSet } from './set.js';
import { FuzzyDateList } from './list.js';
import { isValid } from '../parser.js';
import { compare } from '../comparators.js';

// Register subclasses with base class (avoids circular dependencies)
registerFuzzyDateClasses({
  Date: FuzzyDateDate,
  DateTime: FuzzyDateTime,
  Interval: FuzzyDateInterval,
  Season: FuzzyDateSeason,
  Set: FuzzyDateSet,
  List: FuzzyDateList,
});

/**
 * FuzzyDate namespace - Temporal-inspired API for EDTF
 *
 * Main entry points:
 * - `FuzzyDate.from(string)` - Parse with result type
 * - `FuzzyDate.parse(string)` - Parse with throwing
 * - `FuzzyDate.wrap(EDTFBase)` - Wrap existing EDTF object
 * - `FuzzyDate.isValid(string)` - Validate EDTF string
 * - `FuzzyDate.compare(a, b)` - Compare two FuzzyDates
 *
 * Type-specific factories:
 * - `FuzzyDate.Date.from(string)` - Parse as Date
 * - `FuzzyDate.Interval.from(string)` - Parse as Interval
 * - `FuzzyDate.Season.from(string)` - Parse as Season
 * - etc.
 */
export const FuzzyDate = {
  /**
   * Parse an EDTF string and return a result object.
   * Returns { success: true, value, level } on success,
   * or { success: false, errors } on failure.
   *
   * @example
   * ```typescript
   * const result = FuzzyDate.from('1985-04-12');
   * if (result.success) {
   *   console.log(result.value.format()); // "April 12, 1985"
   * } else {
   *   console.error(result.errors);
   * }
   * ```
   */
  from: FuzzyDateBase.from,

  /**
   * Parse an EDTF string and return a FuzzyDate.
   * Throws FuzzyDateParseError on invalid input.
   *
   * @example
   * ```typescript
   * try {
   *   const date = FuzzyDate.parse('1985-04-12');
   *   console.log(date.format());
   * } catch (e) {
   *   if (e instanceof FuzzyDateParseError) {
   *     console.error('Invalid EDTF:', e.errors);
   *   }
   * }
   * ```
   */
  parse: FuzzyDateBase.parse,

  /**
   * Wrap an existing EDTFBase object as a FuzzyDate.
   *
   * @example
   * ```typescript
   * import { parse, FuzzyDate } from '@edtf-ts/core';
   *
   * const result = parse('1985-04-12');
   * if (result.success) {
   *   const fuzzy = FuzzyDate.wrap(result.value);
   *   console.log(fuzzy.isBefore(otherDate));
   * }
   * ```
   */
  wrap: FuzzyDateBase.wrap,

  /**
   * Check if a string is valid EDTF.
   *
   * @example
   * ```typescript
   * FuzzyDate.isValid('1985-04-12'); // true
   * FuzzyDate.isValid('not a date'); // false
   * ```
   */
  isValid,

  /**
   * Compare two FuzzyDate values numerically (for sort callbacks).
   *
   * @example
   * ```typescript
   * const dates = [
   *   FuzzyDate.parse('2000'),
   *   FuzzyDate.parse('1990'),
   *   FuzzyDate.parse('2010'),
   * ];
   * dates.sort(FuzzyDate.compare); // [1990, 2000, 2010]
   * ```
   */
  compare: (a: IFuzzyDate, b: IFuzzyDate, mode: ComparisonMode = 'min'): number => {
    return compare(a.inner, b.inner, mode);
  },

  /**
   * FuzzyDate.Date - Parse as Date type
   */
  Date: FuzzyDateDate,

  /**
   * FuzzyDate.DateTime - Parse as DateTime type
   */
  DateTime: FuzzyDateTime,

  /**
   * FuzzyDate.Interval - Parse as Interval type
   */
  Interval: FuzzyDateInterval,

  /**
   * FuzzyDate.Season - Parse as Season type
   */
  Season: FuzzyDateSeason,

  /**
   * FuzzyDate.Set - Parse as Set type
   */
  Set: FuzzyDateSet,

  /**
   * FuzzyDate.List - Parse as List type
   */
  List: FuzzyDateList,
} as const;

// Re-export types for consumers
export type {
  IFuzzyDate,
  IFuzzyDateDate,
  IFuzzyDateTime,
  IFuzzyDateInterval,
  IFuzzyDateSeason,
  IFuzzyDateSet,
  IFuzzyDateList,
  FuzzyDateParseResult,
  FuzzyDateInput,
} from './types.js';

export { FuzzyDateParseError } from './types.js';

// Re-export classes for instanceof checks
export { FuzzyDateBase } from './base.js';
export { FuzzyDateDate } from './date.js';
export { FuzzyDateTime } from './date-time.js';
export { FuzzyDateInterval } from './interval.js';
export { FuzzyDateSeason } from './season.js';
export { FuzzyDateSet } from './set.js';
export { FuzzyDateList } from './list.js';

/**
 * Type alias for FuzzyDate instances.
 * Use this when you need to type a variable that holds any FuzzyDate.
 *
 * @example
 * ```typescript
 * import { FuzzyDate, type FuzzyDateType } from '@edtf-ts/core';
 *
 * function processDate(date: FuzzyDateType) {
 *   console.log(date.format());
 * }
 * ```
 */
export type FuzzyDateType = IFuzzyDate;

/**
 * Namespace types for FuzzyDate subtypes.
 * These mirror the Temporal pattern of Temporal.PlainDate, Temporal.Interval, etc.
 */
export namespace FuzzyDate {
  export type Date = IFuzzyDateDate;
  export type DateTime = IFuzzyDateTime;
  export type Interval = IFuzzyDateInterval;
  export type Season = IFuzzyDateSeason;
  export type Set = IFuzzyDateSet;
  export type List = IFuzzyDateList;
}
