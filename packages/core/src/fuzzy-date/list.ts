/**
 * FuzzyDate.List - Wrapper for EDTFList
 */

import type { EDTFList } from '../types/index.js';
import type { IFuzzyDateList, IFuzzyDate } from './types.js';
import { FuzzyDateBase } from './base.js';

/**
 * FuzzyDate wrapper for EDTFList objects.
 * Represents "all members" of a list of dates.
 */
export class FuzzyDateList extends FuzzyDateBase implements IFuzzyDateList {
  /** @internal */
  protected declare readonly _inner: EDTFList;

  override get type(): 'List' {
    return 'List';
  }

  /** Cached wrapped values */
  private _values: IFuzzyDate[];

  constructor(inner: EDTFList) {
    super(inner);
    // Pre-compute wrapped values before freezing
    this._values = inner.values.map(v => FuzzyDateBase.wrap(v));
    Object.freeze(this);
  }

  // ============================================================
  // List-specific Properties
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
    // Check if any member is uncertain
    return this.values.some(v => v.isUncertain);
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
   * Parse an EDTF string as a List specifically.
   * Returns { success: false } if the input is not a List type.
   */
  static from(input: string): { success: true; value: FuzzyDateList; level: 0 | 1 | 2 } | { success: false; errors: { code: string; message: string }[] } {
    const result = FuzzyDateBase.from(input);
    if (!result.success) {
      return result;
    }
    if (result.value.type !== 'List') {
      return {
        success: false,
        errors: [{ code: 'TYPE_MISMATCH', message: `Expected List, got ${result.value.type}` }],
      };
    }
    return { success: true, value: result.value as FuzzyDateList, level: result.level };
  }
}
