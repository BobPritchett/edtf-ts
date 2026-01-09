/**
 * FuzzyDate.Season - Wrapper for EDTFSeason
 */

import type { EDTFSeason, Qualification } from '../types/index.js';
import type { IFuzzyDateSeason } from './types.js';
import { FuzzyDateBase } from './base.js';
import { SEASON_NAMES } from './types.js';
import { getSearchPadding } from './search-constants.js';
import { dateFromMs } from '../core-utils/date-helpers.js';

/**
 * FuzzyDate wrapper for EDTFSeason objects.
 * Represents seasons within a year.
 */
export class FuzzyDateSeason extends FuzzyDateBase implements IFuzzyDateSeason {
  /** @internal */
  protected declare readonly _inner: EDTFSeason;

  override get type(): 'Season' {
    return 'Season';
  }

  constructor(inner: EDTFSeason) {
    super(inner);
    Object.freeze(this);
  }

  // ============================================================
  // Season-specific Properties
  // ============================================================

  get year(): number {
    return this._inner.year;
  }

  get season(): number {
    return this._inner.season;
  }

  get seasonName(): string {
    return SEASON_NAMES[this._inner.season] ?? `Season ${this._inner.season}`;
  }

  get qualification(): Qualification | undefined {
    return this._inner.qualification;
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
    return false; // Seasons don't have unspecified digits
  }

  // ============================================================
  // Search Bounds (Season-specific: use month-level padding)
  // ============================================================

  /**
   * Override search min to use month-level padding for seasons.
   * Seasons span ~3 months, so month-level precision is more appropriate.
   */
  override get searchMinMs(): bigint {
    // Use month-level precision for seasons since they span roughly 3 months
    const padding = getSearchPadding('month', this.isApproximate, this.isUncertain);
    return this.minMs - padding;
  }

  /**
   * Override search max to use month-level padding for seasons.
   */
  override get searchMaxMs(): bigint {
    const padding = getSearchPadding('month', this.isApproximate, this.isUncertain);
    return this.maxMs + padding;
  }

  override get searchMin(): Date {
    return dateFromMs(this.searchMinMs);
  }

  override get searchMax(): Date {
    return dateFromMs(this.searchMaxMs);
  }

  // ============================================================
  // Static Factory
  // ============================================================

  /**
   * Parse an EDTF string as a Season specifically.
   * Returns { success: false } if the input is not a Season type.
   */
  static from(input: string): { success: true; value: FuzzyDateSeason; level: 0 | 1 | 2 } | { success: false; errors: { code: string; message: string }[] } {
    const result = FuzzyDateBase.from(input);
    if (!result.success) {
      return result;
    }
    if (result.value.type !== 'Season') {
      return {
        success: false,
        errors: [{ code: 'TYPE_MISMATCH', message: `Expected Season, got ${result.value.type}` }],
      };
    }
    return { success: true, value: result.value as FuzzyDateSeason, level: result.level };
  }
}
