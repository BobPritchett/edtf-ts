/**
 * @edtf-ts/compare
 *
 * Advanced comparison, Allen relations, and database preparation for EDTF temporal values.
 *
 * @example
 * ```typescript
 * import { parse } from '@edtf-ts/core';
 * import { normalize, allen } from '@edtf-ts/compare';
 *
 * const a = parse('1985');
 * const b = parse('1990');
 *
 * if (a.success && b.success) {
 *   const aNorm = normalize(a.value);
 *   const bNorm = normalize(b.value);
 *
 *   const result = allen.before(aNorm.members[0], bNorm.members[0]);
 *   console.log(result); // 'YES'
 * }
 * ```
 */

export const VERSION = '0.1.0';

// Re-export all types
export type {
  BoundKind,
  Precision,
  Qualifiers,
  Member,
  Shape,
  Truth,
  Quantifier,
  AllenRelation,
  AllenRelationName,
  DerivedRelationName,
  DbColumns,
  PrepareOptions,
  OverlapQuery,
  QueryOptions,
} from './types/index.js';

// Normalization
export { normalize, normalizeToMembers, normalizeToConvexHull } from './normalization/index.js';
export type { SeasonMapping } from './normalization/season.js';
export { DEFAULT_SEASON_MAPPINGS } from './normalization/season.js';

// Allen relations (Member-level functions)
export { allen } from './relations/allen.js';
export {
  before as allenBefore,
  after as allenAfter,
  meets as allenMeets,
  metBy as allenMetBy,
  overlaps as allenOverlaps,
  overlappedBy as allenOverlappedBy,
  starts as allenStarts,
  startedBy as allenStartedBy,
  during as allenDuring,
  contains as allenContains,
  finishes as allenFinishes,
  finishedBy as allenFinishedBy,
  equals as allenEquals,
} from './relations/allen.js';

// Derived relations (Member-level functions)
export { derived } from './relations/derived.js';
export {
  intersects as derivedIntersects,
  disjoint as derivedDisjoint,
  touches as derivedTouches,
  duringOrEqual as derivedDuringOrEqual,
  containsOrEqual as derivedContainsOrEqual,
} from './relations/derived.js';

// Truth value combinators
export { combineWithAny, combineWithAll, negate, and, or } from './relations/truth.js';

// Simple comparison API (EDTF-level functions with evaluator wrappers)
export {
  evaluateRelation,
  evaluate,
  isBefore,
  isAfter,
  meets,
  overlaps,
  starts,
  during,
  contains,
  finishes,
  equals,
  intersects,
  disjoint,
  touches,
  duringOrEqual,
  containsOrEqual,
} from './relations/evaluator.js';

// Epoch conversion
export { dateToEpochMs, startOfYear, startOfMonth, startOfDay, endOfYear, endOfMonth, endOfDay, type DateComponents } from './normalization/epoch.js';

// Utilities
export { minBigInt, maxBigInt, clampBigInt, bigIntToNumber, isSafeBigInt } from './utils/bigint.js';
export { isLeapYear, getDaysInMonth, daysSinceEpoch, astronomicalToHistorical, historicalToAstronomical } from './utils/calendar.js';

// Database preparation (to be implemented in Phase 5)
// export { prepareForDatabase, buildOverlapQuery, buildCanonicalOrder } from './database/index.js';
