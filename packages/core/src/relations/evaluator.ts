/**
 * Evaluator for comparing EDTF values using Allen relations.
 *
 * Handles Shape-to-Shape comparisons with quantifiers (ANY/ALL).
 */

import type { EDTFBase } from '../types/index.js';
import type { Shape, Member } from '../compare-types/member.js';
import type { Truth, Quantifier } from '../compare-types/truth.js';
import { normalize } from '../normalization/index.js';
import { combineWithAny, combineWithAll } from './truth.js';
import * as allen from './allen.js';
import * as derived from './derived.js';

/**
 * Allen relation function type.
 */
type AllenRelation = (a: Member, b: Member) => Truth;

/**
 * Evaluate an Allen relation between two Shapes.
 *
 * @param a First shape
 * @param b Second shape
 * @param relation Allen relation to evaluate
 * @param quantifierA Quantifier for shape A (ANY or ALL)
 * @param quantifierB Quantifier for shape B (ANY or ALL)
 *
 * @example
 * ```typescript
 * const setA = normalize(parse('[1985, 1990]').value);
 * const setB = normalize(parse('[1987, 1992]').value);
 *
 * // Does ANY member of A overlap with ANY member of B?
 * evaluateRelation(setA, setB, allen.overlaps, 'ANY', 'ANY'); // 'YES'
 *
 * // Do ALL members of A overlap with ALL members of B?
 * evaluateRelation(setA, setB, allen.overlaps, 'ALL', 'ALL'); // 'NO'
 * ```
 */
export function evaluateRelation(
  a: Shape,
  b: Shape,
  relation: AllenRelation,
  quantifierA: Quantifier = 'ANY',
  quantifierB: Quantifier = 'ANY'
): Truth {
  const combineA = quantifierA === 'ANY' ? combineWithAny : combineWithAll;
  const combineB = quantifierB === 'ANY' ? combineWithAny : combineWithAll;

  // Evaluate relation for each pair of members
  const outerResults: Truth[] = a.members.map((memberA) => {
    const innerResults: Truth[] = b.members.map((memberB) => {
      return relation(memberA, memberB);
    });
    return combineB(innerResults);
  });

  return combineA(outerResults);
}

/**
 * Helper: Evaluate relation between two EDTF values.
 *
 * Convenience function that normalizes EDTF values and evaluates the relation.
 *
 * @param a First EDTF value
 * @param b Second EDTF value
 * @param relation Allen relation to evaluate
 * @param quantifierA Quantifier for A (default: 'ANY')
 * @param quantifierB Quantifier for B (default: 'ANY')
 */
export function evaluate(
  a: EDTFBase,
  b: EDTFBase,
  relation: AllenRelation,
  quantifierA: Quantifier = 'ANY',
  quantifierB: Quantifier = 'ANY'
): Truth {
  const shapeA = normalize(a);
  const shapeB = normalize(b);
  return evaluateRelation(shapeA, shapeB, relation, quantifierA, quantifierB);
}

/**
 * Simple API: Check if A is before B.
 */
export function isBefore(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, allen.before, quantifier, quantifier);
}

/**
 * Simple API: Check if A is after B.
 */
export function isAfter(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, allen.after, quantifier, quantifier);
}

/**
 * Simple API: Check if A meets B.
 */
export function meets(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, allen.meets, quantifier, quantifier);
}

/**
 * Simple API: Check if A overlaps B.
 */
export function overlaps(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, allen.overlaps, quantifier, quantifier);
}

/**
 * Simple API: Check if A starts B.
 */
export function starts(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, allen.starts, quantifier, quantifier);
}

/**
 * Simple API: Check if A is during B.
 */
export function during(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, allen.during, quantifier, quantifier);
}

/**
 * Simple API: Check if A contains B.
 */
export function contains(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, allen.contains, quantifier, quantifier);
}

/**
 * Simple API: Check if A finishes B.
 */
export function finishes(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, allen.finishes, quantifier, quantifier);
}

/**
 * Simple API: Check if A equals B.
 */
export function equals(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, allen.equals, quantifier, quantifier);
}

/**
 * Simple API: Check if A intersects B (any overlap).
 */
export function intersects(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, derived.intersects, quantifier, quantifier);
}

/**
 * Simple API: Check if A is disjoint from B (no overlap).
 */
export function disjoint(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, derived.disjoint, quantifier, quantifier);
}

/**
 * Simple API: Check if A touches B (adjacent).
 */
export function touches(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, derived.touches, quantifier, quantifier);
}

/**
 * Simple API: Check if A is during or equals B.
 */
export function duringOrEqual(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, derived.duringOrEqual, quantifier, quantifier);
}

/**
 * Simple API: Check if A contains or equals B.
 */
export function containsOrEqual(a: EDTFBase, b: EDTFBase, quantifier: Quantifier = 'ANY'): Truth {
  return evaluate(a, b, derived.containsOrEqual, quantifier, quantifier);
}
