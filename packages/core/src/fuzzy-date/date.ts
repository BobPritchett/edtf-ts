/**
 * FuzzyDate.Date - Wrapper for EDTFDate
 */

import type { EDTFDate, Qualification } from '../types/index.js';
import type { IFuzzyDateDate } from './types.js';
import { FuzzyDateBase } from './base.js';

/**
 * FuzzyDate wrapper for EDTFDate objects.
 * Represents dates that can be uncertain, approximate, or have unspecified digits.
 */
export class FuzzyDateDate extends FuzzyDateBase implements IFuzzyDateDate {
  /** @internal */
  protected declare readonly _inner: EDTFDate;

  override get type(): 'Date' {
    return 'Date';
  }

  constructor(inner: EDTFDate) {
    super(inner);
    Object.freeze(this);
  }

  // ============================================================
  // Date-specific Properties
  // ============================================================

  get year(): number | string {
    return this._inner.year;
  }

  get month(): number | string | undefined {
    return this._inner.month;
  }

  get day(): number | string | undefined {
    return this._inner.day;
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
      this._inner.qualification?.uncertainApproximate ||
      this._inner.yearQualification?.uncertain ||
      this._inner.yearQualification?.uncertainApproximate ||
      this._inner.monthQualification?.uncertain ||
      this._inner.monthQualification?.uncertainApproximate ||
      this._inner.dayQualification?.uncertain ||
      this._inner.dayQualification?.uncertainApproximate
    );
  }

  get isApproximate(): boolean {
    return !!(
      this._inner.qualification?.approximate ||
      this._inner.qualification?.uncertainApproximate ||
      this._inner.yearQualification?.approximate ||
      this._inner.yearQualification?.uncertainApproximate ||
      this._inner.monthQualification?.approximate ||
      this._inner.monthQualification?.uncertainApproximate ||
      this._inner.dayQualification?.approximate ||
      this._inner.dayQualification?.uncertainApproximate
    );
  }

  get hasUnspecified(): boolean {
    return !!(
      this._inner.unspecified?.year ||
      this._inner.unspecified?.month ||
      this._inner.unspecified?.day ||
      typeof this._inner.year === 'string' ||
      this._inner.month === 'XX' ||
      this._inner.day === 'XX'
    );
  }

  // ============================================================
  // Static Factory
  // ============================================================

  /**
   * Parse an EDTF string as a Date specifically.
   * Returns { success: false } if the input is not a Date type.
   */
  static from(input: string): { success: true; value: FuzzyDateDate; level: 0 | 1 | 2 } | { success: false; errors: { code: string; message: string }[] } {
    const result = FuzzyDateBase.from(input);
    if (!result.success) {
      return result;
    }
    if (result.value.type !== 'Date') {
      return {
        success: false,
        errors: [{ code: 'TYPE_MISMATCH', message: `Expected Date, got ${result.value.type}` }],
      };
    }
    return { success: true, value: result.value as FuzzyDateDate, level: result.level };
  }
}
