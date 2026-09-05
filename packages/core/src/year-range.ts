import type { EDTFDate } from './types/index.js';
import { parseYearWithUnspecified } from './normalization/bounds.js';

/** Inclusive possible years; the date's `year` remains its written estimate. */
export interface YearRange {
  min: number;
  max: number;
}

/** @internal Validate precision and calculate with integers before converting to number. */
export function significantYearRange(
  year: number,
  digits: number,
  width: number
): YearRange | undefined {
  if (!Number.isSafeInteger(year) || !Number.isSafeInteger(digits) || digits < 1 || digits > width)
    return undefined;
  const magnitude = BigInt(Math.abs(year));
  const scale = 10n ** BigInt(width - digits);
  const low = (magnitude / scale) * scale;
  const high = low + scale - 1n;
  if (high > BigInt(Number.MAX_SAFE_INTEGER)) return undefined;
  return year < 0
    ? { min: -Number(high), max: -Number(low) }
    : { min: Number(low), max: Number(high) };
}

/** Return the possible year range of an exact, masked, or significant-digit date. */
export function getYearRange(date: EDTFDate): YearRange {
  if (date.significantDigitsYear === undefined) return parseYearWithUnspecified(date.year);
  const year = Number(date.year);
  const width = date.edtf.startsWith('Y') ? String(Math.abs(year)).length : 4;
  const range = significantYearRange(year, date.significantDigitsYear, width);
  if (!range) throw new RangeError('Invalid significant-digit precision or year range');
  return range;
}
