/**
 * FuzzyDate Type Definitions
 *
 * These types define the FuzzyDate API surface, a Temporal-inspired
 * wrapper around EDTF types.
 */

import type {
  EDTFBase,
  EDTFLevel,
  EDTFType,
  Precision,
  Qualification,
  ParseError,
} from '../types/index.js';
import type { Truth, Shape } from '../compare-types/index.js';
import type { ComparisonMode } from '../comparators.js';
import type { FormatOptions } from '../formatters.js';

/**
 * Input types accepted by FuzzyDate comparison methods.
 * Accepts FuzzyDate instances, plain EDTFBase objects, or JavaScript Date objects.
 */
export type FuzzyDateInput = IFuzzyDate | EDTFBase | Date;

/**
 * Base interface for all FuzzyDate instances.
 * Provides common properties and methods across all EDTF types.
 */
export interface IFuzzyDate {
  // ============================================================
  // Identity Properties
  // ============================================================

  /** Type discriminator */
  readonly type: EDTFType;
  /** EDTF conformance level (0, 1, or 2) */
  readonly level: EDTFLevel;
  /** Original EDTF string */
  readonly edtf: string;
  /** Precision of the date/time */
  readonly precision: Precision;

  // ============================================================
  // Temporal Bounds
  // ============================================================

  /** Earliest possible date (clamped to JS Date range) */
  readonly min: Date;
  /** Latest possible date (clamped to JS Date range) */
  readonly max: Date;
  /** Earliest possible date as epoch milliseconds (bigint, always accurate) */
  readonly minMs: bigint;
  /** Latest possible date as epoch milliseconds (bigint, always accurate) */
  readonly maxMs: bigint;
  /** True if min/max were clamped due to JS Date limitations */
  readonly isBoundsClamped: boolean | undefined;

  // ============================================================
  // Uncertainty Properties
  // ============================================================

  /** True if this date has uncertainty markers */
  readonly isUncertain: boolean;
  /** True if this date has approximation markers */
  readonly isApproximate: boolean;
  /** True if this date has unspecified digits (X) */
  readonly hasUnspecified: boolean;

  // ============================================================
  // Escape Hatch
  // ============================================================

  /** Access to the underlying plain EDTF object */
  readonly inner: EDTFBase;

  // ============================================================
  // Comparison Methods (Allen's Interval Algebra)
  // Returns four-valued Truth: 'YES' | 'NO' | 'MAYBE' | 'UNKNOWN'
  // ============================================================

  /** Check if this date is before another */
  isBefore(other: FuzzyDateInput): Truth;
  /** Check if this date is after another */
  isAfter(other: FuzzyDateInput): Truth;
  /** Check if this date meets (is adjacent to) another */
  meets(other: FuzzyDateInput): Truth;
  /** Check if this date overlaps another */
  overlaps(other: FuzzyDateInput): Truth;
  /** Check if this date is during another */
  during(other: FuzzyDateInput): Truth;
  /** Check if this date contains another */
  contains(other: FuzzyDateInput): Truth;
  /** Check if this date equals another */
  equals(other: FuzzyDateInput): Truth;
  /** Check if this date starts another */
  starts(other: FuzzyDateInput): Truth;
  /** Check if this date finishes another */
  finishes(other: FuzzyDateInput): Truth;

  // ============================================================
  // Boolean Convenience Methods
  // ============================================================

  /** True only if isBefore() returns 'YES' */
  isDefinitelyBefore(other: FuzzyDateInput): boolean;
  /** True only if isAfter() returns 'YES' */
  isDefinitelyAfter(other: FuzzyDateInput): boolean;
  /** True if isBefore() returns 'YES' or 'MAYBE' */
  isPossiblyBefore(other: FuzzyDateInput): boolean;
  /** True if isAfter() returns 'YES' or 'MAYBE' */
  isPossiblyAfter(other: FuzzyDateInput): boolean;

  // ============================================================
  // Numeric Comparison (for sorting)
  // ============================================================

  /** Compare to another date numerically (-1, 0, 1) */
  compareTo(other: FuzzyDateInput, mode?: ComparisonMode): number;

  // ============================================================
  // Formatting Methods
  // ============================================================

  /** Format as human-readable string */
  format(options?: FormatOptions): string;
  /** Format with locale */
  toLocaleString(locale?: string, options?: FormatOptions): string;
  /** Returns the EDTF string */
  toString(): string;
  /** Serializable JSON representation */
  toJSON(): object;
  /** Best-effort ISO 8601 string */
  toISO(): string;
  /** Format the min/max range */
  toRangeString(options?: FormatOptions): string;

  // ============================================================
  // Normalization
  // ============================================================

  /** Get normalized shape for comparison operations */
  normalize(): Shape;
}

/**
 * FuzzyDate.Date - wraps EDTFDate
 */
export interface IFuzzyDateDate extends IFuzzyDate {
  readonly type: 'Date';
  readonly year: number | string;
  readonly month: number | string | undefined;
  readonly day: number | string | undefined;
  readonly qualification: Qualification | undefined;
}

/**
 * FuzzyDate.DateTime - wraps EDTFDateTime
 */
export interface IFuzzyDateTime extends IFuzzyDate {
  readonly type: 'DateTime';
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly timezone: string | undefined;
}

/**
 * FuzzyDate.Interval - wraps EDTFInterval
 */
export interface IFuzzyDateInterval extends IFuzzyDate {
  readonly type: 'Interval';
  readonly start: IFuzzyDate | null;
  readonly end: IFuzzyDate | null;
  readonly isOpenStart: boolean;
  readonly isOpenEnd: boolean;

  /** Iterate through the interval by unit */
  by(unit: 'year' | 'month' | 'day'): IterableIterator<IFuzzyDateDate>;
  /** Convert interval to array of dates */
  toArray(unit: 'year' | 'month' | 'day'): IFuzzyDateDate[];
}

/**
 * FuzzyDate.Season - wraps EDTFSeason
 */
export interface IFuzzyDateSeason extends IFuzzyDate {
  readonly type: 'Season';
  readonly year: number;
  readonly season: number;
  readonly seasonName: string;
  readonly qualification: Qualification | undefined;
}

/**
 * FuzzyDate.Set - wraps EDTFSet
 */
export interface IFuzzyDateSet extends IFuzzyDate {
  readonly type: 'Set';
  readonly values: IFuzzyDate[];
  readonly earlier: boolean;
  readonly later: boolean;
}

/**
 * FuzzyDate.List - wraps EDTFList
 */
export interface IFuzzyDateList extends IFuzzyDate {
  readonly type: 'List';
  readonly values: IFuzzyDate[];
  readonly earlier: boolean;
  readonly later: boolean;
}

/**
 * Parse result for FuzzyDate.from()
 */
export type FuzzyDateParseResult<T extends IFuzzyDate = IFuzzyDate> =
  | { success: true; value: T; level: EDTFLevel }
  | { success: false; errors: ParseError[] };

/**
 * Error thrown by FuzzyDate.parse() on invalid input
 */
export class FuzzyDateParseError extends Error {
  readonly errors: ParseError[];

  constructor(errors: ParseError[]) {
    const message = errors.map(e => e.message).join('; ');
    super(`Failed to parse EDTF: ${message}`);
    this.name = 'FuzzyDateParseError';
    this.errors = errors;
  }
}

/**
 * Season name mappings
 */
export const SEASON_NAMES: Record<number, string> = {
  // Seasons (independent of location) - Level 1
  21: 'Spring',
  22: 'Summer',
  23: 'Autumn',
  24: 'Winter',
  // Northern Hemisphere seasons - Level 2
  25: 'Spring (Northern Hemisphere)',
  26: 'Summer (Northern Hemisphere)',
  27: 'Autumn (Northern Hemisphere)',
  28: 'Winter (Northern Hemisphere)',
  // Southern Hemisphere seasons - Level 2
  29: 'Spring (Southern Hemisphere)',
  30: 'Summer (Southern Hemisphere)',
  31: 'Autumn (Southern Hemisphere)',
  32: 'Winter (Southern Hemisphere)',
  // Quarters - Level 2
  33: 'Quarter 1',
  34: 'Quarter 2',
  35: 'Quarter 3',
  36: 'Quarter 4',
  // Quadrimesters - Level 2
  37: 'Quadrimester 1',
  38: 'Quadrimester 2',
  39: 'Quadrimester 3',
  // Semestrals - Level 2
  40: 'Semestral 1',
  41: 'Semestral 2',
};
