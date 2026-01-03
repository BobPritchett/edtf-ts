import type { Member } from './member.js';
import type { Truth } from './truth.js';

/**
 * Allen's interval algebra relation.
 *
 * A relation evaluates the temporal relationship between two Members.
 * Returns a Truth value indicating whether the relation holds.
 */
export type AllenRelation = (a: Member, b: Member) => Truth;

/**
 * The 13 base Allen relations.
 *
 * These relations form a complete algebra for interval comparison:
 *
 * - `before`: A ends before B starts (gap between them)
 * - `after`: A starts after B ends (gap between them)
 * - `meets`: A ends exactly when B starts (no gap)
 * - `metBy`: A starts exactly when B ends (no gap)
 * - `overlaps`: A starts before B, ends during B
 * - `overlappedBy`: B starts before A, ends during A
 * - `starts`: A and B start together, A ends first
 * - `startedBy`: A and B start together, B ends first
 * - `during`: A is completely within B
 * - `contains`: B is completely within A
 * - `finishes`: A and B end together, A starts later
 * - `finishedBy`: A and B end together, B starts later
 * - `equals`: A and B have the same start and end
 *
 * Visual representation:
 * ```
 * before:      A:[====]     B:[====]
 * meets:       A:[====]B:[====]
 * overlaps:    A:[====]
 *                B:[====]
 * starts:      A:[====]
 *              B:[========]
 * during:        A:[==]
 *              B:[========]
 * finishes:        A:[====]
 *              B:[========]
 * equals:      A:[========]
 *              B:[========]
 * ```
 */
export type AllenRelationName =
  | 'before'
  | 'after'
  | 'meets'
  | 'metBy'
  | 'overlaps'
  | 'overlappedBy'
  | 'starts'
  | 'startedBy'
  | 'during'
  | 'contains'
  | 'finishes'
  | 'finishedBy'
  | 'equals';

/**
 * Derived temporal relations built from base Allen relations.
 *
 * - `intersects`: Any form of overlap (overlaps OR overlappedBy OR starts OR startedBy OR during OR contains OR finishes OR finishedBy OR equals)
 * - `disjoint`: No overlap (before OR after)
 * - `touches`: Adjacent without gap (meets OR metBy)
 * - `duringOrEqual`: Contained or equal (during OR equals)
 * - `containsOrEqual`: Contains or equal (contains OR equals)
 */
export type DerivedRelationName =
  | 'intersects'
  | 'disjoint'
  | 'touches'
  | 'duringOrEqual'
  | 'containsOrEqual';
