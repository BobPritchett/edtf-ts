/**
 * Normalize EDTFList to Shape.
 *
 * Lists represent "all of" semantics: {1985, 1990, 1995}
 * All listed values apply.
 */

import type { EDTFList } from '../types/index.js';
import type { Shape, Member } from '../compare-types/index.js';
import { normalizeDate } from './date.js';
import { normalizeDateTime } from './datetime.js';
import { normalizeSeason } from './season.js';
import { isEDTFDate, isEDTFDateTime, isEDTFSeason } from '../type-guards.js';

/**
 * Normalize an EDTFList to a Shape.
 *
 * Each value in the list becomes a Member.
 * listMode is set to 'allOf' to indicate all values apply.
 */
export function normalizeList(list: EDTFList): Shape {
  const { values } = list;

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

    throw new Error(`Unknown list value type: ${JSON.stringify(value)}`);
  });

  for (const direction of ['earlier', 'later'] as const) {
    if (!list[direction]) continue;
    const anchor = direction === 'earlier' ? values[0]! : values[values.length - 1]!;
    if (
      isEDTFDate(anchor) &&
      typeof anchor.year === 'number' &&
      (anchor.month === undefined || typeof anchor.month === 'number') &&
      (anchor.day === undefined || typeof anchor.day === 'number')
    ) {
      members.push({
        ...normalizeDate(anchor),
        calendarRange: {
          direction,
          anchor: { year: anchor.year, month: anchor.month, day: anchor.day },
        },
      });
    } else {
      members.push({
        sMin: null,
        sMax: null,
        eMin: null,
        eMax: null,
        startKind: 'unknown',
        endKind: 'unknown',
        precision: anchor.precision,
      });
    }
  }
  return {
    members,
    listMode: 'allOf',
  };
}
