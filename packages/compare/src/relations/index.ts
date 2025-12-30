/**
 * Main relations module exports.
 */

// Truth value combinators
export { combineWithAny, combineWithAll, negate, and, or } from './truth.js';
export type { Truth, Quantifier } from '../types/truth.js';

// Base Allen relations (as object and individual exports)
export { allen } from './allen.js';
export {
  before,
  after,
  meets,
  metBy,
  overlaps,
  overlappedBy,
  starts,
  startedBy,
  during,
  contains as allenContains,
  finishes,
  finishedBy,
  equals as allenEquals,
} from './allen.js';

// Derived relations (as object and individual exports)
export { derived } from './derived.js';
export {
  intersects as derivedIntersects,
  disjoint as derivedDisjoint,
  touches as derivedTouches,
  duringOrEqual,
  containsOrEqual,
} from './derived.js';

// Evaluator and simple API
export {
  evaluateRelation,
  evaluate,
  isBefore,
  isAfter,
  meets as evaluatorMeets,
  overlaps as evaluatorOverlaps,
  starts as evaluatorStarts,
  during as evaluatorDuring,
  contains,
  finishes as evaluatorFinishes,
  equals,
  intersects,
  disjoint,
  touches,
} from './evaluator.js';
