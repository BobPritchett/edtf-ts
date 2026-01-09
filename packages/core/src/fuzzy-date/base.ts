/**
 * FuzzyDateBase - Abstract base class for all FuzzyDate types
 *
 * This class wraps EDTFBase objects and provides method-based access
 * to comparison, formatting, and other operations.
 */

import type {
  EDTFBase,
  EDTFDate,
  EDTFDateTime,
  EDTFInterval,
  EDTFSeason,
  EDTFSet,
  EDTFList,
  EDTFLevel,
  EDTFType,
  Precision,
} from '../types/index.js';
import type { Truth, Shape } from '../compare-types/index.js';
import type { ComparisonMode } from '../comparators.js';
import type { FormatOptions } from '../formatters.js';
import type { IFuzzyDate, FuzzyDateInput, FuzzyDateParseResult } from './types.js';
import { FuzzyDateParseError } from './types.js';
import { getSearchPadding } from './search-constants.js';

import { parse } from '../parser.js';
import { dateFromMs } from '../core-utils/date-helpers.js';
import { normalize } from '../normalization/index.js';
import { compare } from '../comparators.js';
import { formatHuman, formatISO, formatRange } from '../formatters.js';
import {
  isBefore as allenIsBefore,
  isAfter as allenIsAfter,
  meets as allenMeets,
  overlaps as allenOverlaps,
  during as allenDuring,
  contains as allenContains,
  equals as allenEquals,
  starts as allenStarts,
  finishes as allenFinishes,
} from '../relations/evaluator.js';

// Forward declarations - these will be set by the subclass modules
// to avoid circular dependencies
let FuzzyDateDateClass: new (inner: EDTFDate) => IFuzzyDate;
let FuzzyDateTimeClass: new (inner: EDTFDateTime) => IFuzzyDate;
let FuzzyDateIntervalClass: new (inner: EDTFInterval) => IFuzzyDate;
let FuzzyDateSeasonClass: new (inner: EDTFSeason) => IFuzzyDate;
let FuzzyDateSetClass: new (inner: EDTFSet) => IFuzzyDate;
let FuzzyDateListClass: new (inner: EDTFList) => IFuzzyDate;

/**
 * Register subclass constructors (called by subclass modules)
 * @internal
 */
export function registerFuzzyDateClasses(classes: {
  Date: new (inner: EDTFDate) => IFuzzyDate;
  DateTime: new (inner: EDTFDateTime) => IFuzzyDate;
  Interval: new (inner: EDTFInterval) => IFuzzyDate;
  Season: new (inner: EDTFSeason) => IFuzzyDate;
  Set: new (inner: EDTFSet) => IFuzzyDate;
  List: new (inner: EDTFList) => IFuzzyDate;
}): void {
  FuzzyDateDateClass = classes.Date;
  FuzzyDateTimeClass = classes.DateTime;
  FuzzyDateIntervalClass = classes.Interval;
  FuzzyDateSeasonClass = classes.Season;
  FuzzyDateSetClass = classes.Set;
  FuzzyDateListClass = classes.List;
}

/**
 * Abstract base class for all FuzzyDate types.
 * Provides common functionality delegating to existing functions.
 */
export abstract class FuzzyDateBase implements IFuzzyDate {
  /** @internal */
  protected readonly _inner: EDTFBase;

  constructor(inner: EDTFBase) {
    this._inner = inner;
    // Note: We don't freeze here - subclasses may need to set properties
    // Freezing happens after construction in subclasses
  }

  // ============================================================
  // Identity Properties
  // ============================================================

  get type(): EDTFType {
    return this._inner.type;
  }

  get level(): EDTFLevel {
    return this._inner.level;
  }

  get edtf(): string {
    return this._inner.edtf;
  }

  get precision(): Precision {
    return this._inner.precision;
  }

  // ============================================================
  // Temporal Bounds
  // ============================================================

  get min(): Date {
    return this._inner.min;
  }

  get max(): Date {
    return this._inner.max;
  }

  get minMs(): bigint {
    return this._inner.minMs;
  }

  get maxMs(): bigint {
    return this._inner.maxMs;
  }

  get isBoundsClamped(): boolean | undefined {
    return this._inner.isBoundsClamped;
  }

  // ============================================================
  // Search Bounds (Heuristically Expanded for Discovery)
  // ============================================================

  /**
   * Heuristic "earliest" bound for search purposes.
   * Expands the strict min based on uncertainty/approximation qualifiers.
   */
  get searchMinMs(): bigint {
    const padding = getSearchPadding(this.precision, this.isApproximate, this.isUncertain);
    return this.minMs - padding;
  }

  /**
   * Heuristic "latest" bound for search purposes.
   * Expands the strict max based on uncertainty/approximation qualifiers.
   */
  get searchMaxMs(): bigint {
    const padding = getSearchPadding(this.precision, this.isApproximate, this.isUncertain);
    return this.maxMs + padding;
  }

  /**
   * Heuristic "earliest" bound as Date (clamped to JS Date range).
   */
  get searchMin(): Date {
    return dateFromMs(this.searchMinMs);
  }

  /**
   * Heuristic "latest" bound as Date (clamped to JS Date range).
   */
  get searchMax(): Date {
    return dateFromMs(this.searchMaxMs);
  }

  // ============================================================
  // Uncertainty Properties (overridden by subclasses as needed)
  // ============================================================

  get isUncertain(): boolean {
    return false;
  }

  get isApproximate(): boolean {
    return false;
  }

  get hasUnspecified(): boolean {
    return false;
  }

  // ============================================================
  // Escape Hatch
  // ============================================================

  get inner(): EDTFBase {
    return this._inner;
  }

  // ============================================================
  // Helper: Unwrap input to EDTFBase
  // ============================================================

  /** @internal */
  protected _unwrap(other: FuzzyDateInput): EDTFBase {
    if (other instanceof FuzzyDateBase) {
      return other._inner;
    }
    if (other instanceof Date) {
      // Convert Date to a simple EDTFDate-like object
      // Must include year, month, day for normalization
      const year = other.getUTCFullYear();
      const month = other.getUTCMonth() + 1;
      const day = other.getUTCDate();
      const ms = BigInt(other.getTime());
      const edtfStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      return {
        type: 'Date' as const,
        level: 0 as const,
        edtf: edtfStr,
        precision: 'day' as const,
        year,
        month,
        day,
        min: other,
        max: other,
        minMs: ms,
        maxMs: ms,
        toJSON: () => ({ edtf: edtfStr, type: 'Date' }),
        toString: () => edtfStr,
      } as EDTFBase;
    }
    // Already EDTFBase
    return other;
  }

  // ============================================================
  // Comparison Methods (Allen's Interval Algebra)
  // ============================================================

  isBefore(other: FuzzyDateInput): Truth {
    return allenIsBefore(this._inner, this._unwrap(other));
  }

  isAfter(other: FuzzyDateInput): Truth {
    return allenIsAfter(this._inner, this._unwrap(other));
  }

  meets(other: FuzzyDateInput): Truth {
    return allenMeets(this._inner, this._unwrap(other));
  }

  overlaps(other: FuzzyDateInput): Truth {
    return allenOverlaps(this._inner, this._unwrap(other));
  }

  during(other: FuzzyDateInput): Truth {
    return allenDuring(this._inner, this._unwrap(other));
  }

  contains(other: FuzzyDateInput): Truth {
    return allenContains(this._inner, this._unwrap(other));
  }

  equals(other: FuzzyDateInput): Truth {
    return allenEquals(this._inner, this._unwrap(other));
  }

  starts(other: FuzzyDateInput): Truth {
    return allenStarts(this._inner, this._unwrap(other));
  }

  finishes(other: FuzzyDateInput): Truth {
    return allenFinishes(this._inner, this._unwrap(other));
  }

  // ============================================================
  // Boolean Convenience Methods
  // ============================================================

  isDefinitelyBefore(other: FuzzyDateInput): boolean {
    return this.isBefore(other) === 'YES';
  }

  isDefinitelyAfter(other: FuzzyDateInput): boolean {
    return this.isAfter(other) === 'YES';
  }

  isPossiblyBefore(other: FuzzyDateInput): boolean {
    const result = this.isBefore(other);
    return result === 'YES' || result === 'MAYBE';
  }

  isPossiblyAfter(other: FuzzyDateInput): boolean {
    const result = this.isAfter(other);
    return result === 'YES' || result === 'MAYBE';
  }

  // ============================================================
  // Numeric Comparison
  // ============================================================

  compareTo(other: FuzzyDateInput, mode: ComparisonMode = 'min'): number {
    return compare(this._inner, this._unwrap(other), mode);
  }

  // ============================================================
  // Formatting Methods
  // ============================================================

  format(options?: FormatOptions): string {
    return formatHuman(this._inner, options);
  }

  toLocaleString(locale?: string, options?: FormatOptions): string {
    return formatHuman(this._inner, { ...options, locale });
  }

  toString(): string {
    return this._inner.edtf;
  }

  toJSON(): object {
    return this._inner.toJSON();
  }

  toISO(): string {
    return formatISO(this._inner);
  }

  toRangeString(options?: FormatOptions): string {
    return formatRange(this._inner, options);
  }

  // ============================================================
  // Normalization
  // ============================================================

  normalize(): Shape {
    return normalize(this._inner);
  }

  // ============================================================
  // Overlap Scoring (for Search Relevance)
  // ============================================================

  /**
   * Calculate the Jaccard Index (Intersection over Union) with another FuzzyDate.
   * Uses search bounds for both dates to maximize discovery potential.
   *
   * @param other - Another FuzzyDate, EDTFBase, or JS Date to compare against
   * @returns Number between 0.0 (no overlap) and 1.0 (perfect match)
   */
  overlapScore(other: FuzzyDateInput): number {
    // Get search bounds for the other input
    const otherFuzzy = other instanceof FuzzyDateBase
      ? other
      : FuzzyDateBase.wrap(this._unwrap(other));

    const startA = this.searchMinMs;
    const endA = this.searchMaxMs;
    const startB = otherFuzzy.searchMinMs;
    const endB = otherFuzzy.searchMaxMs;

    // Calculate intersection: max of starts to min of ends
    const interStart = startA > startB ? startA : startB;
    const interEnd = endA < endB ? endA : endB;

    const intersection = interEnd - interStart;

    // If intersection is negative or zero, they don't overlap
    if (intersection <= 0n) return 0.0;

    // Calculate union: min of starts to max of ends
    const unionStart = startA < startB ? startA : startB;
    const unionEnd = endA > endB ? endA : endB;

    const union = unionEnd - unionStart;

    // Edge case: point comparison (both are same instant)
    if (union === 0n) return 1.0;

    // Calculate Jaccard Index (IoU)
    // Convert to Number for division (BigInt doesn't support decimals)
    return Number(intersection) / Number(union);
  }

  // ============================================================
  // Static Factory Methods
  // ============================================================

  /**
   * Parse an EDTF string and return a result object.
   * Returns { success: true, value, level } on success,
   * or { success: false, errors } on failure.
   */
  static from(input: string): FuzzyDateParseResult {
    const result = parse(input);
    if (!result.success) {
      return result;
    }
    return {
      success: true,
      value: FuzzyDateBase.wrap(result.value),
      level: result.level,
    };
  }

  /**
   * Parse an EDTF string and return a FuzzyDate.
   * Throws FuzzyDateParseError on invalid input.
   */
  static parse(input: string): IFuzzyDate {
    const result = parse(input);
    if (!result.success) {
      throw new FuzzyDateParseError(result.errors);
    }
    return FuzzyDateBase.wrap(result.value);
  }

  /**
   * Wrap an existing EDTFBase object as a FuzzyDate.
   */
  static wrap(inner: EDTFBase): IFuzzyDate {
    switch (inner.type) {
      case 'Date':
        return new FuzzyDateDateClass(inner as EDTFDate);
      case 'DateTime':
        return new FuzzyDateTimeClass(inner as EDTFDateTime);
      case 'Interval':
        return new FuzzyDateIntervalClass(inner as EDTFInterval);
      case 'Season':
        return new FuzzyDateSeasonClass(inner as EDTFSeason);
      case 'Set':
        return new FuzzyDateSetClass(inner as EDTFSet);
      case 'List':
        return new FuzzyDateListClass(inner as EDTFList);
      default:
        // Fallback for any other types (Year, Decade, Century)
        // These are rare, treat as Date
        return new FuzzyDateDateClass(inner as EDTFDate);
    }
  }

  /**
   * Check if a string is valid EDTF.
   */
  static isValid(input: string): boolean {
    const result = parse(input);
    return result.success;
  }

  /**
   * Compare two FuzzyDate values numerically (for sort callbacks).
   */
  static compare(a: IFuzzyDate, b: IFuzzyDate, mode: ComparisonMode = 'min'): number {
    return compare(a.inner, b.inner, mode);
  }
}
