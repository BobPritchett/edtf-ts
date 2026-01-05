/**
 * FuzzyDate.DateTime - Wrapper for EDTFDateTime
 */

import type { EDTFDateTime } from '../types/index.js';
import type { IFuzzyDateTime } from './types.js';
import { FuzzyDateBase } from './base.js';

/**
 * FuzzyDate wrapper for EDTFDateTime objects.
 * Represents precise moments in time with optional timezone.
 */
export class FuzzyDateTime extends FuzzyDateBase implements IFuzzyDateTime {
  /** @internal */
  protected declare readonly _inner: EDTFDateTime;

  override get type(): 'DateTime' {
    return 'DateTime';
  }

  constructor(inner: EDTFDateTime) {
    super(inner);
    Object.freeze(this);
  }

  // ============================================================
  // DateTime-specific Properties
  // ============================================================

  get year(): number {
    return this._inner.year;
  }

  get month(): number {
    return this._inner.month;
  }

  get day(): number {
    return this._inner.day;
  }

  get hour(): number {
    return this._inner.hour;
  }

  get minute(): number {
    return this._inner.minute;
  }

  get second(): number {
    return this._inner.second;
  }

  get timezone(): string | undefined {
    return this._inner.timezone;
  }

  // ============================================================
  // Uncertainty Properties (DateTime is always precise)
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
  // Static Factory
  // ============================================================

  /**
   * Parse an EDTF string as a DateTime specifically.
   * Returns { success: false } if the input is not a DateTime type.
   */
  static from(input: string): { success: true; value: FuzzyDateTime; level: 0 | 1 | 2 } | { success: false; errors: { code: string; message: string }[] } {
    const result = FuzzyDateBase.from(input);
    if (!result.success) {
      return result;
    }
    if (result.value.type !== 'DateTime') {
      return {
        success: false,
        errors: [{ code: 'TYPE_MISMATCH', message: `Expected DateTime, got ${result.value.type}` }],
      };
    }
    return { success: true, value: result.value as FuzzyDateTime, level: result.level };
  }
}
