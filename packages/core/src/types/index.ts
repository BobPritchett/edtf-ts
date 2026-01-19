/**
 * Core EDTF Types
 * These are the foundational types for all EDTF objects
 */

/**
 * Precision level for a date or datetime.
 */
export type Precision = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'subyear';

/**
 * EDTF conformance level.
 * - Level 0: ISO 8601 profile
 * - Level 1: Extended features (uncertainty, approximation, seasons, etc.)
 * - Level 2: Advanced features (sets, lists, exponential years, etc.)
 */
export type EDTFLevel = 0 | 1 | 2;

/**
 * Type of EDTF object.
 */
export type EDTFType =
  | 'Date'
  | 'DateTime'
  | 'Interval'
  | 'Season'
  | 'Set'
  | 'List'
  | 'Year'
  | 'Decade'
  | 'Century';

/**
 * JavaScript Date range limits (approximately ±270,000 years from epoch).
 * Dates outside this range will be clamped when using min/max Date properties.
 */
export const DATE_MIN_MS = -8640000000000000n;
export const DATE_MAX_MS = 8640000000000000n;

/**
 * Base interface for all EDTF types.
 * All EDTF objects extend this interface.
 */
export interface EDTFBase {
  /** Type discriminator */
  readonly type: EDTFType;
  /** EDTF conformance level (0, 1, or 2) */
  readonly level: EDTFLevel;
  /** Original EDTF string */
  readonly edtf: string;
  /** Precision of the date/time */
  readonly precision: Precision;
  /**
   * Earliest possible date represented by this EDTF object.
   * Note: For extended years beyond JavaScript Date range (~±270,000 years),
   * this will be clamped to Date.MIN or Date.MAX. Use minMs for accurate values.
   */
  readonly min: Date;
  /**
   * Latest possible date represented by this EDTF object.
   * Note: For extended years beyond JavaScript Date range (~±270,000 years),
   * this will be clamped to Date.MIN or Date.MAX. Use maxMs for accurate values.
   */
  readonly max: Date;
  /**
   * Earliest possible date as epoch milliseconds (bigint).
   * Always accurate, even for astronomical dates beyond JavaScript Date range.
   */
  readonly minMs: bigint;
  /**
   * Latest possible date as epoch milliseconds (bigint).
   * Always accurate, even for astronomical dates beyond JavaScript Date range.
   */
  readonly maxMs: bigint;
  /**
   * True if min or max Date values were clamped due to JavaScript Date limitations.
   * When true, use minMs/maxMs for accurate values.
   */
  readonly isBoundsClamped?: boolean;
  /** Serialize to JSON */
  toJSON(): object;
  /** Convert to string (returns original EDTF string) */
  toString(): string;
}

/**
 * Qualification flags for uncertainty and approximation (Level 1+).
 */
export interface Qualification {
  /** True if the date is uncertain (marked with ?) */
  uncertain?: boolean;
  /** True if the date is approximate (marked with ~) */
  approximate?: boolean;
  /** True if the date is both uncertain and approximate (marked with %) */
  uncertainApproximate?: boolean;
}

/**
 * Tracking for unspecified digits (Level 1).
 * Used when dates contain 'X' characters, e.g., "199X" or "2004-XX-XX".
 */
export interface UnspecifiedDigits {
  /** Unspecified year digits, e.g., "20XX" or "2XXX" */
  year?: string;
  /** Unspecified month, typically "XX" */
  month?: string;
  /** Unspecified day, typically "XX" */
  day?: string;
}

/**
 * Date component values.
 */
export interface DateComponents {
  /** Year (number or string with X for unspecified) */
  year: number | string;
  /** Month (1-12 or "XX" for unspecified) */
  month?: number | string;
  /** Day (1-31 or "XX" for unspecified) */
  day?: number | string;
}

/**
 * EDTF Date object (all levels).
 * Represents a date that can be uncertain, approximate, or contain unspecified digits.
 */
export interface EDTFDate extends EDTFBase {
  type: 'Date';
  /** Year (number or string with X for unspecified) */
  year: number | string;
  /** Month (1-12 or "XX" for unspecified) */
  month?: number | string;
  /** Day (1-31 or "XX" for unspecified) */
  day?: number | string;

  /** Uncertainty/approximation flags (Level 1+) */
  qualification?: Qualification;
  /** Unspecified digit tracking (Level 1) */
  unspecified?: UnspecifiedDigits;
  /** Significant digits for extended years (Level 1) */
  significantDigits?: number;

  /** Exponential notation exponent (Level 2, e.g., Y-17E7) */
  exponential?: number;
  /** Significant digits for year (Level 2, e.g., 1950S2) */
  significantDigitsYear?: number;

  /** Partial qualification for year (Level 2) */
  yearQualification?: Qualification;
  /** Partial qualification for month (Level 2) */
  monthQualification?: Qualification;
  /** Partial qualification for day (Level 2) */
  dayQualification?: Qualification;

  /** Check if this date is before another date */
  isBefore?(other: EDTFDate | Date): boolean;
  /** Check if this date is after another date */
  isAfter?(other: EDTFDate | Date): boolean;
  /** Check if this date equals another date */
  equals?(other: EDTFDate): boolean;
  /** Check if this date's range covers another date's range */
  covers?(other: EDTFDate): boolean;
}

/**
 * EDTF DateTime object (Level 0).
 * Represents a precise moment in time with optional timezone.
 */
export interface EDTFDateTime extends EDTFBase {
  type: 'DateTime';
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** Timezone (e.g., 'Z', '+05:00', '-08:00') */
  timezone?: string;
}

/**
 * EDTF Season object (Level 1 and 2).
 * Represents a season within a year.
 * - 21-24: Northern Hemisphere seasons (Spring, Summer, Autumn, Winter)
 * - 25-28: Southern Hemisphere seasons
 * - 29-32: Meteorological seasons
 * - 33-36: Quarters
 * - 37-39: Quadrimesters
 * - 40-41: Semestrals
 */
export interface EDTFSeason extends EDTFBase {
  type: 'Season';
  year: number;
  /** Season code (21-41) */
  season: number;
  /** Uncertainty/approximation flags */
  qualification?: Qualification;
}

/**
 * EDTF Interval object (Level 0 and 1).
 * Represents a time interval between two dates or datetimes.
 */
export interface EDTFInterval extends EDTFBase {
  type: 'Interval';
  /** Interval start (null for unknown) */
  start: EDTFDate | EDTFDateTime | EDTFSeason | null;
  /** Interval end (null for unknown) */
  end: EDTFDate | EDTFDateTime | EDTFSeason | null;
  /** True if interval has open start (..) */
  openStart?: boolean;
  /** True if interval has open end (..) */
  openEnd?: boolean;
  /** Uncertainty/approximation flags for the interval */
  qualification?: Qualification;

  /** Check if a date is contained within this interval */
  contains?(date: EDTFDate | EDTFDateTime | Date): boolean;
  /** Check if this interval overlaps with another interval */
  overlaps?(other: EDTFInterval): boolean;
  /** Iterate through the interval by year, month, or day */
  by?(unit: 'year' | 'month' | 'day'): IterableIterator<EDTFDate>;
}

/**
 * EDTF Set object (Level 2).
 * Represents "one of a set" of dates.
 */
export interface EDTFSet extends EDTFBase {
  type: 'Set';
  /** Values in the set */
  values: (EDTFDate | EDTFDateTime | EDTFSeason)[];
  /** True if set includes earlier dates (e.g., [..1760-12]) */
  earlier?: boolean;
  /** True if set includes later dates (e.g., [1760-12..]) */
  later?: boolean;
}

/**
 * EDTF List object (Level 2).
 * Represents "all members" of a list of dates.
 */
export interface EDTFList extends EDTFBase {
  type: 'List';
  /** Values in the list */
  values: (EDTFDate | EDTFDateTime | EDTFSeason)[];
  /** True if list includes earlier dates */
  earlier?: boolean;
  /** True if list includes later dates */
  later?: boolean;
}

/**
 * Parse error information.
 */
export interface ParseError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Optional position in the input string where the error occurred */
  position?: { start: number; end: number };
  /** Optional suggestion for fixing the error */
  suggestion?: string;
}

/**
 * Result of parsing an EDTF string.
 * This is a discriminated union that is either a success or failure.
 */
export type ParseResult<T = EDTFBase> =
  | { success: true; value: T; level: EDTFLevel }
  | { success: false; errors: ParseError[] };
