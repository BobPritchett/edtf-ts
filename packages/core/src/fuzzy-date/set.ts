/**
 * FuzzyDate.Set - Wrapper for EDTFSet
 */

import type { EDTFSet } from '../types/index.js';
import type { IFuzzyDateSet, IFuzzyDate } from './types.js';
import { FuzzyDateBase } from './base.js';

/**
 * FuzzyDate wrapper for EDTFSet objects.
 * Represents "one of a set" of dates.
 */
export class FuzzyDateSet extends FuzzyDateBase implements IFuzzyDateSet {
  /** @internal */
  protected declare readonly _inner: EDTFSet;

  override get type(): 'Set' {
    return 'Set';
  }

  /** Cached wrapped values */
  private _values: IFuzzyDate[];

  constructor(inner: EDTFSet) {
    super(inner);
    // Pre-compute wrapped values before freezing
    this._values = inner.values.map(v => FuzzyDateBase.wrap(v));
    Object.freeze(this);
  }

  // ============================================================
  // Set-specific Properties
  // ============================================================

  get values(): IFuzzyDate[] {
    return this._values;
  }

  get earlier(): boolean {
    return this._inner.earlier ?? false;
  }

  get later(): boolean {
    return this._inner.later ?? false;
  }

  // ============================================================
  // Uncertainty Properties
  // ============================================================

  get isUncertain(): boolean {
    // A set is inherently uncertain - we don't know which member is the actual date
    return true;
  }

  get isApproximate(): boolean {
    // Check if any member is approximate
    return this.values.some(v => v.isApproximate);
  }

  get hasUnspecified(): boolean {
    // Check if any member has unspecified digits
    return this.values.some(v => v.hasUnspecified);
  }

  // ============================================================
  // Static Factory
  // ============================================================

  /**
   * Parse an EDTF string as a Set specifically.
   * Returns { success: false } if the input is not a Set type.
   */
  static from(input: string): { success: true; value: FuzzyDateSet; level: 0 | 1 | 2 } | { success: false; errors: { code: string; message: string }[] } {
    const result = FuzzyDateBase.from(input);
    if (!result.success) {
      return result;
    }
    if (result.value.type !== 'Set') {
      return {
        success: false,
        errors: [{ code: 'TYPE_MISMATCH', message: `Expected Set, got ${result.value.type}` }],
      };
    }
    return { success: true, value: result.value as FuzzyDateSet, level: result.level };
  }
}
