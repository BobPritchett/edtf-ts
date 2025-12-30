/**
 * Main normalization module.
 *
 * Converts any EDTF value to a Shape (collection of Members).
 */

import type { EDTFBase } from '@edtf-ts/core';
import type { Shape, Member } from '../types/index.js';
import { isEDTFDate, isEDTFDateTime, isEDTFInterval, isEDTFSeason, isEDTFSet, isEDTFList } from '@edtf-ts/core';
import { normalizeDate } from './date.js';
import { normalizeDateTime } from './datetime.js';
import { normalizeInterval } from './interval.js';
import { normalizeSeason } from './season.js';
import { normalizeSet } from './set.js';
import { normalizeList } from './list.js';

/**
 * Normalize any EDTF value to a Shape.
 *
 * A Shape contains one or more Members representing the temporal range(s).
 *
 * - Simple types (Date, DateTime, Season, Interval): Single Member
 * - Sets/Lists: Multiple Members
 *
 * @example
 * ```typescript
 * import { parse } from '@edtf-ts/core';
 * import { normalize } from '@edtf-ts/compare';
 *
 * const date = parse('1985-04-12');
 * if (date.success) {
 *   const shape = normalize(date.value);
 *   console.log(shape.members[0].sMin); // Start of Apr 12, 1985
 *   console.log(shape.members[0].eMax); // End of Apr 12, 1985
 * }
 * ```
 */
export function normalize(edtf: EDTFBase): Shape {
  if (isEDTFDate(edtf)) {
    return { members: [normalizeDate(edtf)] };
  }

  if (isEDTFDateTime(edtf)) {
    return { members: [normalizeDateTime(edtf)] };
  }

  if (isEDTFInterval(edtf)) {
    return { members: [normalizeInterval(edtf)] };
  }

  if (isEDTFSeason(edtf)) {
    return { members: [normalizeSeason(edtf)] };
  }

  if (isEDTFSet(edtf)) {
    return normalizeSet(edtf);
  }

  if (isEDTFList(edtf)) {
    return normalizeList(edtf);
  }

  throw new Error(`Unknown EDTF type: ${edtf.type}`);
}

/**
 * Normalize an EDTF value to an array of Members.
 *
 * Convenience function that returns just the members array.
 */
export function normalizeToMembers(edtf: EDTFBase): Member[] {
  return normalize(edtf).members;
}

/**
 * Normalize an EDTF value to a single Member using convex hull.
 *
 * For Sets/Lists, this flattens all members into a single bounding range.
 * This is useful for database storage but loses gap information.
 *
 * @example
 * ```typescript
 * const set = parse('[1985, 1990, 1995]');
 * const hull = normalizeToConvexHull(set.value);
 * // hull spans from 1985-01-01 to 1995-12-31
 * // (includes gaps: 1986-1989, 1991-1994)
 * ```
 */
export function normalizeToConvexHull(edtf: EDTFBase): Member {
  const shape = normalize(edtf);

  if (shape.members.length === 1) {
    return shape.members[0]!;
  }

  // Calculate convex hull: min of all starts, max of all ends
  const sMinValues = shape.members.map((m) => m.sMin).filter((v): v is bigint => v !== null);
  const sMaxValues = shape.members.map((m) => m.sMax).filter((v): v is bigint => v !== null);
  const eMinValues = shape.members.map((m) => m.eMin).filter((v): v is bigint => v !== null);
  const eMaxValues = shape.members.map((m) => m.eMax).filter((v): v is bigint => v !== null);

  const sMin = sMinValues.length > 0 ? sMinValues.reduce((a, b) => (a < b ? a : b)) : null;
  const sMax = sMaxValues.length > 0 ? sMaxValues.reduce((a, b) => (a > b ? a : b)) : null;
  const eMin = eMinValues.length > 0 ? eMinValues.reduce((a, b) => (a < b ? a : b)) : null;
  const eMax = eMaxValues.length > 0 ? eMaxValues.reduce((a, b) => (a > b ? a : b)) : null;

  // Determine bound kinds (if any member has open/unknown, convex hull inherits it)
  const hasOpenStart = shape.members.some((m) => m.startKind === 'open');
  const hasOpenEnd = shape.members.some((m) => m.endKind === 'open');
  const hasUnknownStart = shape.members.some((m) => m.startKind === 'unknown');
  const hasUnknownEnd = shape.members.some((m) => m.endKind === 'unknown');

  const startKind = hasOpenStart ? 'open' : hasUnknownStart ? 'unknown' : 'closed';
  const endKind = hasOpenEnd ? 'open' : hasUnknownEnd ? 'unknown' : 'closed';

  // Combine qualifiers
  const hasUncertain = shape.members.some((m) => m.qualifiers?.uncertain);
  const hasApproximate = shape.members.some((m) => m.qualifiers?.approximate);

  return {
    sMin,
    sMax,
    eMin,
    eMax,
    startKind,
    endKind,
    precision: 'mixed',
    qualifiers:
      hasUncertain || hasApproximate
        ? {
            uncertain: hasUncertain,
            approximate: hasApproximate,
          }
        : undefined,
  };
}

// Re-export specific normalizers for advanced use
export { normalizeDate } from './date.js';
export { normalizeDateTime } from './datetime.js';
export { normalizeInterval } from './interval.js';
export { normalizeSeason, DEFAULT_SEASON_MAPPINGS, type SeasonMapping } from './season.js';
export { normalizeSet } from './set.js';
export { normalizeList } from './list.js';
