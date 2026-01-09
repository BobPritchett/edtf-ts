/**
 * FuzzyDate.Interval - Wrapper for EDTFInterval
 */

import type { EDTFInterval, EDTFDate } from '../types/index.js';
import type { IFuzzyDateInterval, IFuzzyDate, IFuzzyDateDate } from './types.js';
import { FuzzyDateBase } from './base.js';
import { getSearchPadding } from './search-constants.js';
import { dateFromMs } from '../core-utils/date-helpers.js';

/**
 * FuzzyDate wrapper for EDTFInterval objects.
 * Represents time intervals between two dates.
 */
export class FuzzyDateInterval extends FuzzyDateBase implements IFuzzyDateInterval {
  /** @internal */
  protected declare readonly _inner: EDTFInterval;

  override get type(): 'Interval' {
    return 'Interval';
  }

  /** Cached wrapped start */
  private _start: IFuzzyDate | null;
  /** Cached wrapped end */
  private _end: IFuzzyDate | null;

  constructor(inner: EDTFInterval) {
    super(inner);
    // Pre-compute wrapped start/end before freezing
    this._start = inner.start ? FuzzyDateBase.wrap(inner.start) : null;
    this._end = inner.end ? FuzzyDateBase.wrap(inner.end) : null;
    Object.freeze(this);
  }

  // ============================================================
  // Interval-specific Properties
  // ============================================================

  get start(): IFuzzyDate | null {
    if (this._start === undefined) {
      this._start = this._inner.start ? FuzzyDateBase.wrap(this._inner.start) : null;
    }
    return this._start;
  }

  get end(): IFuzzyDate | null {
    if (this._end === undefined) {
      this._end = this._inner.end ? FuzzyDateBase.wrap(this._inner.end) : null;
    }
    return this._end;
  }

  get isOpenStart(): boolean {
    return this._inner.openStart ?? false;
  }

  get isOpenEnd(): boolean {
    return this._inner.openEnd ?? false;
  }

  // ============================================================
  // Uncertainty Properties
  // ============================================================

  get isUncertain(): boolean {
    return !!(
      this._inner.qualification?.uncertain ||
      this._inner.qualification?.uncertainApproximate
    );
  }

  get isApproximate(): boolean {
    return !!(
      this._inner.qualification?.approximate ||
      this._inner.qualification?.uncertainApproximate
    );
  }

  get hasUnspecified(): boolean {
    // Check if start or end has unspecified digits
    const startHasUnspecified = this.start?.hasUnspecified ?? false;
    const endHasUnspecified = this.end?.hasUnspecified ?? false;
    return startHasUnspecified || endHasUnspecified;
  }

  // ============================================================
  // Search Bounds (Interval-specific: separate start/end padding)
  // ============================================================

  /**
   * Override search min to use start's qualifiers.
   * For intervals, the start date's uncertainty/approximation affects the search min.
   */
  override get searchMinMs(): bigint {
    // For open start, don't add extra padding beyond strict bounds
    if (!this.start || this.isOpenStart) {
      return this.minMs;
    }
    const startPadding = getSearchPadding(
      this.start.precision,
      this.start.isApproximate,
      this.start.isUncertain
    );
    return this.minMs - startPadding;
  }

  /**
   * Override search max to use end's qualifiers.
   * For intervals, the end date's uncertainty/approximation affects the search max.
   */
  override get searchMaxMs(): bigint {
    // For open end, don't add extra padding beyond strict bounds
    if (!this.end || this.isOpenEnd) {
      return this.maxMs;
    }
    const endPadding = getSearchPadding(
      this.end.precision,
      this.end.isApproximate,
      this.end.isUncertain
    );
    return this.maxMs + endPadding;
  }

  override get searchMin(): Date {
    return dateFromMs(this.searchMinMs);
  }

  override get searchMax(): Date {
    return dateFromMs(this.searchMaxMs);
  }

  // ============================================================
  // Iteration Methods
  // ============================================================

  /**
   * Iterate through the interval by unit.
   * Yields FuzzyDateDate objects for each year/month/day in the interval.
   */
  *by(unit: 'year' | 'month' | 'day'): IterableIterator<IFuzzyDateDate> {
    // Can only iterate if we have concrete start and end bounds
    if (!this._inner.start || !this._inner.end) {
      return;
    }

    const startDate = this._inner.min;
    const endDate = this._inner.max;

    let current = new Date(startDate);

    while (current <= endDate) {
      // Create an EDTF date for this point
      const year = current.getUTCFullYear();
      const month = current.getUTCMonth() + 1;
      const day = current.getUTCDate();

      let edtfString: string;
      let precision: 'year' | 'month' | 'day';

      switch (unit) {
        case 'year':
          edtfString = String(year);
          precision = 'year';
          break;
        case 'month':
          edtfString = `${year}-${String(month).padStart(2, '0')}`;
          precision = 'month';
          break;
        case 'day':
          edtfString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          precision = 'day';
          break;
      }

      // Create a minimal EDTFDate object
      const edtfDate: EDTFDate = {
        type: 'Date',
        level: 0,
        edtf: edtfString,
        precision,
        year,
        month: unit !== 'year' ? month : undefined,
        day: unit === 'day' ? day : undefined,
        min: this._getMinDateForUnit(year, month, day, unit),
        max: this._getMaxDateForUnit(year, month, day, unit),
        minMs: BigInt(this._getMinDateForUnit(year, month, day, unit).getTime()),
        maxMs: BigInt(this._getMaxDateForUnit(year, month, day, unit).getTime()),
        toJSON: () => ({ edtf: edtfString, type: 'Date' }),
        toString: () => edtfString,
      };

      yield FuzzyDateBase.wrap(edtfDate) as IFuzzyDateDate;

      // Advance to next unit
      switch (unit) {
        case 'year':
          current.setUTCFullYear(current.getUTCFullYear() + 1);
          current.setUTCMonth(0);
          current.setUTCDate(1);
          break;
        case 'month':
          current.setUTCMonth(current.getUTCMonth() + 1);
          current.setUTCDate(1);
          break;
        case 'day':
          current.setUTCDate(current.getUTCDate() + 1);
          break;
      }
    }
  }

  /**
   * Convert interval to array of dates by unit.
   */
  toArray(unit: 'year' | 'month' | 'day'): IFuzzyDateDate[] {
    return [...this.by(unit)];
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  /** @internal */
  private _getMinDateForUnit(year: number, month: number, day: number, unit: 'year' | 'month' | 'day'): Date {
    switch (unit) {
      case 'year':
        return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      case 'month':
        return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      case 'day':
        return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }
  }

  /** @internal */
  private _getMaxDateForUnit(year: number, month: number, day: number, unit: 'year' | 'month' | 'day'): Date {
    switch (unit) {
      case 'year':
        return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      case 'month': {
        // Last day of the month
        const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
        return new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999));
      }
      case 'day':
        return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    }
  }

  // ============================================================
  // Static Factory
  // ============================================================

  /**
   * Parse an EDTF string as an Interval specifically.
   * Returns { success: false } if the input is not an Interval type.
   */
  static from(input: string): { success: true; value: FuzzyDateInterval; level: 0 | 1 | 2 } | { success: false; errors: { code: string; message: string }[] } {
    const result = FuzzyDateBase.from(input);
    if (!result.success) {
      return result;
    }
    if (result.value.type !== 'Interval') {
      return {
        success: false,
        errors: [{ code: 'TYPE_MISMATCH', message: `Expected Interval, got ${result.value.type}` }],
      };
    }
    return { success: true, value: result.value as FuzzyDateInterval, level: result.level };
  }
}
