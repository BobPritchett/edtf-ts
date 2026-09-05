import { calendarFromEpoch, type CalendarDate } from './calendar.js';
import { normalizeToConvexHull } from './normalization/index.js';
import { resolveEDTF, type EDTFInput } from './operations.js';

/** A bound never substitutes a JavaScript Date limit for infinity or missing data. */
export type TemporalBound =
  | { kind: 'finite'; epochMs: bigint; date: Required<CalendarDate> }
  | { kind: 'negativeInfinity' }
  | { kind: 'positiveInfinity' }
  | { kind: 'unknown' };

export interface TemporalBounds {
  earliest: TemporalBound;
  latest: TemporalBound;
}

/**
 * Inclusive outer bounds, with exact bigint timestamps and Gregorian calendar days.
 * Collection gaps are intentionally not represented; use normalize() to retain them.
 * Timestamps use the existing UTC/floating time domain of the expression.
 */
export function getBounds(input: EDTFInput): TemporalBounds {
  const hull = normalizeToConvexHull(resolveEDTF(input));
  const finite = (ms: bigint | null): TemporalBound =>
    ms === null
      ? { kind: 'unknown' }
      : { kind: 'finite', epochMs: ms, date: calendarFromEpoch(ms) };
  return {
    earliest:
      hull.startKind === 'open'
        ? { kind: 'negativeInfinity' }
        : hull.startKind === 'unknown'
          ? { kind: 'unknown' }
          : finite(hull.sMin),
    latest:
      hull.endKind === 'open'
        ? { kind: 'positiveInfinity' }
        : hull.endKind === 'unknown'
          ? { kind: 'unknown' }
          : finite(hull.eMax),
  };
}
