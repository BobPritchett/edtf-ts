/**
 * Normalize EDTFSet to Shape.
 *
 * Sets represent "one of" semantics: [1985, 1990, 1995]
 * The value is one of the listed options.
 */

import type { EDTFSet } from '../types/index.js';
import type { Shape, Member } from '../compare-types/index.js';
import { normalizeDate } from './date.js';
import { normalizeDateTime } from './datetime.js';
import { normalizeSeason } from './season.js';
import { isEDTFDate, isEDTFDateTime, isEDTFSeason } from '../type-guards.js';

/**
 * Normalize an EDTFSet to a Shape.
 *
 * Each value in the set becomes a Member.
 * listMode is set to 'oneOf' to indicate exclusive choice.
 */
export function normalizeSet(set: EDTFSet): Shape {
  const { values } = set;

  const members: Member[] = values.map((value) => {
    if (isEDTFDate(value)) {
      return normalizeDate(value);
    }

    if (isEDTFDateTime(value)) {
      return normalizeDateTime(value);
    }

    if (isEDTFSeason(value)) {
      return normalizeSeason(value);
    }

    throw new Error(`Unknown set value type: ${(value as any).type}`);
  });

  return {
    members,
    listMode: 'oneOf',
  };
}
