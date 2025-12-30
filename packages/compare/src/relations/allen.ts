/**
 * Allen's interval algebra - 13 base relations.
 *
 * Each relation evaluates the temporal relationship between two Members
 * and returns a Truth value (YES/NO/MAYBE/UNKNOWN).
 */

import type { Member } from '../types/member.js';
import type { Truth } from '../types/truth.js';

/**
 * A is before B: A ends before B starts (gap between them).
 *
 * Visual: A:[====]     B:[====]
 *
 * Returns:
 * - YES if A.eMax < B.sMin (definitely before)
 * - NO if A.eMin >= B.sMax (definitely not before)
 * - UNKNOWN if required bounds are unknown
 * - MAYBE otherwise
 */
export function before(a: Member, b: Member): Truth {
  // Check for unknown bounds
  if (a.endKind === 'unknown' || b.startKind === 'unknown') {
    return 'UNKNOWN';
  }

  // Check for open bounds
  if (a.endKind === 'open') {
    // A has no end - cannot be before B
    return 'NO';
  }

  if (b.startKind === 'open') {
    // B has no start - A is always before
    return 'YES';
  }

  // Both closed: compare bounds
  if (a.eMax !== null && b.sMin !== null) {
    if (a.eMax < b.sMin) return 'YES'; // Definitely before (with gap)
  }

  if (a.eMin !== null && b.sMax !== null) {
    if (a.eMin >= b.sMax) return 'NO'; // Definitely not before
  }

  return 'MAYBE';
}

/**
 * A is after B: A starts after B ends (gap between them).
 *
 * Visual: B:[====]     A:[====]
 *
 * Symmetric to before.
 */
export function after(a: Member, b: Member): Truth {
  return before(b, a);
}

/**
 * A meets B: A ends exactly when B starts (no gap).
 *
 * Visual: A:[====]B:[====]
 *
 * Returns:
 * - YES if A.eMin <= B.sMax AND A.eMax >= B.sMin AND they touch
 * - NO if there's a definite gap or overlap
 * - UNKNOWN if required bounds are unknown
 * - MAYBE otherwise
 */
export function meets(a: Member, b: Member): Truth {
  // Check for unknown bounds
  if (a.endKind === 'unknown' || b.startKind === 'unknown') {
    return 'UNKNOWN';
  }

  // Check for open bounds
  if (a.endKind === 'open' || b.startKind === 'open') {
    return 'NO'; // Cannot meet if unbounded
  }

  // Both closed: check if they can meet
  if (a.eMin !== null && a.eMax !== null && b.sMin !== null && b.sMax !== null) {
    // For them to meet, the ranges must overlap at exactly one point
    // A's end range [eMin, eMax] must overlap with B's start range [sMin, sMax]

    // They definitely don't meet if there's a gap
    if (a.eMax < b.sMin) return 'NO'; // Gap before
    if (a.eMin > b.sMax) return 'NO'; // Gap after

    // They definitely don't meet if A clearly ends inside B
    if (a.eMax < b.sMax && a.eMin > b.sMin) return 'NO';

    // If the ranges overlap, they might meet
    if (a.eMax >= b.sMin && a.eMin <= b.sMax) {
      // Tight bounds suggest they meet
      if (a.eMin === a.eMax && b.sMin === b.sMax && a.eMax === b.sMin) {
        return 'YES'; // Exact point match
      }
      return 'MAYBE';
    }
  }

  return 'MAYBE';
}

/**
 * A is met by B: B ends exactly when A starts (no gap).
 *
 * Visual: B:[====]A:[====]
 *
 * Symmetric to meets.
 */
export function metBy(a: Member, b: Member): Truth {
  return meets(b, a);
}

/**
 * A overlaps B: A starts before B, ends during B.
 *
 * Visual: A:[====]
 *           B:[====]
 *
 * Returns:
 * - YES if definitely overlaps
 * - NO if definitely doesn't overlap
 * - UNKNOWN if required bounds are unknown
 * - MAYBE otherwise
 */
export function overlaps(a: Member, b: Member): Truth {
  // Check for unknown bounds
  if (
    a.startKind === 'unknown' ||
    a.endKind === 'unknown' ||
    b.startKind === 'unknown' ||
    b.endKind === 'unknown'
  ) {
    return 'UNKNOWN';
  }

  // Check for open bounds
  if (a.startKind === 'open' || b.endKind === 'open') {
    return 'NO'; // Cannot have classic overlap with open bounds
  }

  // For A to overlap B:
  // 1. A starts before B starts
  // 2. A ends after B starts but before B ends

  if (
    a.sMin !== null &&
    a.sMax !== null &&
    a.eMin !== null &&
    a.eMax !== null &&
    b.sMin !== null &&
    b.sMax !== null &&
    b.eMin !== null &&
    b.eMax !== null
  ) {
    // Check if A definitely starts before B
    const startsBeforeB = a.sMax < b.sMin;

    // Check if A ends during B
    const endsDuringB = a.eMin > b.sMin && a.eMax < b.eMax;

    if (startsBeforeB && endsDuringB) {
      return 'YES';
    }

    // Check if it's impossible
    // A starts after B starts
    if (a.sMin >= b.sMax) return 'NO';
    // A ends before B starts
    if (a.eMax <= b.sMin) return 'NO';
    // A ends after B ends
    if (a.eMin >= b.eMax) return 'NO';
  }

  return 'MAYBE';
}

/**
 * A is overlapped by B: B starts before A, ends during A.
 *
 * Visual: B:[====]
 *           A:[====]
 *
 * Symmetric to overlaps.
 */
export function overlappedBy(a: Member, b: Member): Truth {
  return overlaps(b, a);
}

/**
 * A starts B: A and B start together, A ends before B.
 *
 * Visual: A:[====]
 *         B:[========]
 */
export function starts(a: Member, b: Member): Truth {
  // Check for unknown bounds
  if (
    a.startKind === 'unknown' ||
    a.endKind === 'unknown' ||
    b.startKind === 'unknown' ||
    b.endKind === 'unknown'
  ) {
    return 'UNKNOWN';
  }

  // Check for open bounds
  if (a.startKind === 'open' || b.startKind === 'open') {
    // Both must be open to start together
    if (a.startKind === 'open' && b.startKind === 'open') {
      // Check if A ends before B
      if (a.endKind !== 'open' && b.endKind === 'open') return 'YES';
      if (a.endKind === 'open') return 'NO';
    }
    return 'NO';
  }

  if (
    a.sMin !== null &&
    a.sMax !== null &&
    a.eMin !== null &&
    a.eMax !== null &&
    b.sMin !== null &&
    b.sMax !== null &&
    b.eMin !== null &&
    b.eMax !== null
  ) {
    // Check if they can start together
    const canStartTogether = !(a.sMax < b.sMin || a.sMin > b.sMax);

    // Check if A ends before B
    const aEndsFirst = a.eMax < b.eMin;

    if (canStartTogether && aEndsFirst) return 'YES';

    // Definitely don't start together
    if (a.sMax < b.sMin || a.sMin > b.sMax) return 'NO';

    // A ends after or at same time as B
    if (a.eMin >= b.eMax) return 'NO';
  }

  return 'MAYBE';
}

/**
 * A is started by B: B and A start together, B ends before A.
 *
 * Visual: B:[====]
 *         A:[========]
 *
 * Symmetric to starts.
 */
export function startedBy(a: Member, b: Member): Truth {
  return starts(b, a);
}

/**
 * A is during B: A is completely within B (both start and end).
 *
 * Visual:   A:[==]
 *         B:[========]
 */
export function during(a: Member, b: Member): Truth {
  // Check for unknown bounds
  if (
    a.startKind === 'unknown' ||
    a.endKind === 'unknown' ||
    b.startKind === 'unknown' ||
    b.endKind === 'unknown'
  ) {
    return 'UNKNOWN';
  }

  // Check for open bounds
  if (a.startKind === 'open' || a.endKind === 'open') {
    return 'NO'; // A cannot be during B if A is unbounded
  }

  if (b.startKind === 'open' && b.endKind === 'open') {
    return 'YES'; // Everything is during an unbounded interval
  }

  if (
    a.sMin !== null &&
    a.eMax !== null &&
    b.sMin !== null &&
    b.sMax !== null &&
    b.eMin !== null &&
    b.eMax !== null
  ) {
    // A is definitely during B if:
    // - A starts after B starts (A's earliest start > B's latest start)
    // - A ends before B ends (A's latest end < B's earliest end)
    if (a.sMin > b.sMax && a.eMax < b.eMin) {
      return 'YES';
    }

    // A is definitely not during B if:
    // - A's latest possible start is before or equal to B's earliest possible start
    //   (A cannot start strictly after B)
    if (a.sMax <= b.sMin) return 'NO';
    // - A's earliest possible end is after or equal to B's latest possible end
    //   (A cannot end strictly before B)
    if (a.eMin >= b.eMax) return 'NO';
  }

  return 'MAYBE';
}

/**
 * A contains B: B is completely within A.
 *
 * Visual: B:[==]
 *         A:[========]
 *
 * Symmetric to during.
 */
export function contains(a: Member, b: Member): Truth {
  return during(b, a);
}

/**
 * A finishes B: A and B end together, A starts after B.
 *
 * Visual:     A:[====]
 *         B:[========]
 */
export function finishes(a: Member, b: Member): Truth {
  // Check for unknown bounds
  if (
    a.startKind === 'unknown' ||
    a.endKind === 'unknown' ||
    b.startKind === 'unknown' ||
    b.endKind === 'unknown'
  ) {
    return 'UNKNOWN';
  }

  // Check for open bounds
  if (a.endKind === 'open' || b.endKind === 'open') {
    // Both must be open to end together
    if (a.endKind === 'open' && b.endKind === 'open') {
      // Check if A starts after B
      if (a.startKind !== 'open' && b.startKind === 'open') return 'YES';
      if (a.startKind === 'open') return 'NO';
    }
    return 'NO';
  }

  if (
    a.sMin !== null &&
    a.sMax !== null &&
    a.eMin !== null &&
    a.eMax !== null &&
    b.sMin !== null &&
    b.sMax !== null &&
    b.eMin !== null &&
    b.eMax !== null
  ) {
    // Check if they can end together
    const canEndTogether = !(a.eMax < b.eMin || a.eMin > b.eMax);

    // Check if A starts after B
    const aStartsLater = a.sMin > b.sMax;

    if (canEndTogether && aStartsLater) return 'YES';

    // Definitely don't end together
    if (a.eMax < b.eMin || a.eMin > b.eMax) return 'NO';

    // A starts before or at same time as B
    if (a.sMax <= b.sMin) return 'NO';
  }

  return 'MAYBE';
}

/**
 * A is finished by B: B and A end together, B starts after A.
 *
 * Visual:     B:[====]
 *         A:[========]
 *
 * Symmetric to finishes.
 */
export function finishedBy(a: Member, b: Member): Truth {
  return finishes(b, a);
}

/**
 * A equals B: A and B have the same start and end.
 *
 * Visual: A:[========]
 *         B:[========]
 */
export function equals(a: Member, b: Member): Truth {
  // Check for unknown bounds
  if (
    a.startKind === 'unknown' ||
    a.endKind === 'unknown' ||
    b.startKind === 'unknown' ||
    b.endKind === 'unknown'
  ) {
    return 'UNKNOWN';
  }

  // Check for open bounds - both must match
  if (a.startKind !== b.startKind || a.endKind !== b.endKind) {
    return 'NO';
  }

  // If both are fully open, they're equal
  if (a.startKind === 'open' && a.endKind === 'open') {
    return 'YES';
  }

  if (
    a.sMin !== null &&
    a.sMax !== null &&
    a.eMin !== null &&
    a.eMax !== null &&
    b.sMin !== null &&
    b.sMax !== null &&
    b.eMin !== null &&
    b.eMax !== null
  ) {
    // They're definitely equal if all bounds match exactly
    if (a.sMin === b.sMin && a.sMax === b.sMax && a.eMin === b.eMin && a.eMax === b.eMax) {
      return 'YES';
    }

    // They're definitely not equal if bounds don't overlap
    if (a.sMax < b.sMin || a.sMin > b.sMax) return 'NO';
    if (a.eMax < b.eMin || a.eMin > b.eMax) return 'NO';
  }

  return 'MAYBE';
}

/**
 * All 13 base Allen relations as an object.
 */
export const allen = {
  before,
  after,
  meets,
  metBy,
  overlaps,
  overlappedBy,
  starts,
  startedBy,
  during,
  contains,
  finishes,
  finishedBy,
  equals,
};
