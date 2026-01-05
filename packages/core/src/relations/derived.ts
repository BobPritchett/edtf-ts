/**
 * Derived Allen relations - built from combinations of base relations.
 */

import type { Member } from '../compare-types/member.js';
import type { Truth } from '../compare-types/truth.js';
import { before, after, meets, metBy, overlaps, overlappedBy, starts, startedBy, during, contains, finishes, finishedBy, equals } from './allen.js';
import { combineWithAny } from './truth.js';

/**
 * A intersects B: Any form of temporal overlap.
 *
 * True if the intervals share any time point.
 * Equivalent to: NOT (before OR after)
 * Or positively: meets OR metBy OR overlaps OR overlappedBy OR starts OR startedBy OR during OR contains OR finishes OR finishedBy OR equals
 */
export function intersects(a: Member, b: Member): Truth {
  return combineWithAny([
    meets(a, b),
    metBy(a, b),
    overlaps(a, b),
    overlappedBy(a, b),
    starts(a, b),
    startedBy(a, b),
    during(a, b),
    contains(a, b),
    finishes(a, b),
    finishedBy(a, b),
    equals(a, b),
  ]);
}

/**
 * A is disjoint from B: No temporal overlap.
 *
 * True if the intervals share no time points.
 * Equivalent to: before OR after
 */
export function disjoint(a: Member, b: Member): Truth {
  return combineWithAny([before(a, b), after(a, b)]);
}

/**
 * A touches B: Adjacent intervals without gap.
 *
 * True if the intervals meet exactly at one point.
 * Equivalent to: meets OR metBy
 */
export function touches(a: Member, b: Member): Truth {
  return combineWithAny([meets(a, b), metBy(a, b)]);
}

/**
 * A is during or equals B: A is contained within or equal to B.
 *
 * Useful for containment queries.
 * Equivalent to: during OR starts OR finishes OR equals
 */
export function duringOrEqual(a: Member, b: Member): Truth {
  return combineWithAny([during(a, b), starts(a, b), finishes(a, b), equals(a, b)]);
}

/**
 * A contains or equals B: A contains or equals B.
 *
 * Symmetric to duringOrEqual.
 * Equivalent to: contains OR startedBy OR finishedBy OR equals
 */
export function containsOrEqual(a: Member, b: Member): Truth {
  return combineWithAny([contains(a, b), startedBy(a, b), finishedBy(a, b), equals(a, b)]);
}

/**
 * All derived relations as an object.
 */
export const derived = {
  intersects,
  disjoint,
  touches,
  duringOrEqual,
  containsOrEqual,
};
