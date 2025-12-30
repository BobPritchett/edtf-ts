/**
 * Normalize EDTFInterval to Member.
 *
 * Intervals represent a range between two endpoints:
 * - "1985/1990" → from sometime in 1985 to sometime in 1990
 * - "1985-04/1985-06" → from sometime in April to sometime in June 1985
 * - "2004-02-01/2005-02" → from Feb 1, 2004 to sometime in Feb 2005
 *
 * Special endpoints:
 * - ".." = open (unbounded)
 * - "" (empty) = unknown
 */

import type { EDTFInterval } from '@edtf-ts/core';
import type { Member, BoundKind, Precision } from '../types/index.js';
import { normalizeDate } from './date.js';
import { normalizeDateTime } from './datetime.js';
import { normalizeSeason } from './season.js';
import { isEDTFDate, isEDTFDateTime, isEDTFSeason } from '@edtf-ts/core';

/**
 * Normalize an EDTFInterval to a Member.
 *
 * Key semantics:
 * - Start is **sometime during** the start endpoint
 * - End is **sometime during** the end endpoint
 * - Mixed precision is allowed (e.g., year to month, day to year)
 */
export function normalizeInterval(interval: EDTFInterval): Member {
  const { start, end, openStart, openEnd, qualification } = interval;

  // Determine start bounds and kind
  let startBounds: { sMin: bigint | null; sMax: bigint | null };
  let startKind: BoundKind;

  if (openStart) {
    // Open start: unbounded
    startBounds = { sMin: null, sMax: null };
    startKind = 'open';
  } else if (start === null) {
    // Unknown start
    startBounds = { sMin: null, sMax: null };
    startKind = 'unknown';
  } else {
    // Normalize the start endpoint
    const startMember = normalizeEndpoint(start);
    startBounds = { sMin: startMember.sMin, sMax: startMember.sMax };
    startKind = 'closed';
  }

  // Determine end bounds and kind
  let endBounds: { eMin: bigint | null; eMax: bigint | null };
  let endKind: BoundKind;

  if (openEnd) {
    // Open end: unbounded
    endBounds = { eMin: null, eMax: null };
    endKind = 'open';
  } else if (end === null) {
    // Unknown end
    endBounds = { eMin: null, eMax: null };
    endKind = 'unknown';
  } else {
    // Normalize the end endpoint
    const endMember = normalizeEndpoint(end);
    endBounds = { eMin: endMember.eMin, eMax: endMember.eMax };
    endKind = 'closed';
  }

  // Determine precision
  let precision: Precision;

  if (startKind !== 'closed' || endKind !== 'closed') {
    precision = 'unknown';
  } else if (start && end) {
    const startMember = normalizeEndpoint(start);
    const endMember = normalizeEndpoint(end);

    if (startMember.precision === endMember.precision) {
      precision = startMember.precision;
    } else {
      precision = 'mixed';
    }
  } else {
    precision = 'unknown';
  }

  // Extract qualifiers from interval qualification
  const qualifiers = qualification
    ? {
        uncertain: qualification.uncertain || qualification.uncertainApproximate,
        approximate: qualification.approximate || qualification.uncertainApproximate,
      }
    : undefined;

  return {
    sMin: startBounds.sMin,
    sMax: startBounds.sMax,
    eMin: endBounds.eMin,
    eMax: endBounds.eMax,
    startKind,
    endKind,
    precision,
    qualifiers: qualifiers && (qualifiers.uncertain || qualifiers.approximate) ? qualifiers : undefined,
  };
}

/**
 * Helper to normalize an interval endpoint.
 */
function normalizeEndpoint(
  endpoint: any // EDTFDate | EDTFDateTime | EDTFSeason
): Member {
  if (isEDTFDate(endpoint)) {
    return normalizeDate(endpoint);
  }

  if (isEDTFDateTime(endpoint)) {
    return normalizeDateTime(endpoint);
  }

  if (isEDTFSeason(endpoint)) {
    return normalizeSeason(endpoint);
  }

  throw new Error(`Unknown endpoint type: ${endpoint.type}`);
}
