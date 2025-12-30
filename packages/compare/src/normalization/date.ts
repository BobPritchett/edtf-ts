/**
 * Normalize EDTFDate to Member.
 *
 * EDTFDate can represent:
 * - Year only: "1985"
 * - Year-month: "1985-04"
 * - Year-month-day: "1985-04-12"
 * - With unspecified digits: "198X", "1985-XX", "1985-04-XX"
 * - With qualifications: uncertain (?), approximate (~), or both (%)
 */

import type { EDTFDate } from '@edtf-ts/core';
import type { Member, Precision, Qualifiers } from '../types/index.js';
import { boundsForYear, boundsForMonth, boundsForDay } from './bounds.js';

/**
 * Normalize an EDTFDate to a Member.
 *
 * All dates are represented as ranges spanning the full precision:
 * - "1985" → Jan 1 00:00:00.000 to Dec 31 23:59:59.999
 * - "1985-04" → Apr 1 00:00:00.000 to Apr 30 23:59:59.999
 * - "1985-04-12" → Apr 12 00:00:00.000 to Apr 12 23:59:59.999
 *
 * Unspecified digits expand the range:
 * - "198X" → 1980-01-01 to 1989-12-31
 * - "1985-XX" → 1985-01-01 to 1985-12-31
 * - "1985-04-XX" → 1985-04-01 to 1985-04-30
 */
export function normalizeDate(date: EDTFDate): Member {
  const { year, month, day, qualification, yearQualification, monthQualification, dayQualification } = date;

  // Determine precision
  let precision: Precision;
  if (day !== undefined) {
    precision = 'day';
  } else if (month !== undefined) {
    precision = 'month';
  } else {
    precision = 'year';
  }

  // Calculate bounds based on precision
  let bounds: { sMin: bigint; sMax: bigint; eMin: bigint; eMax: bigint };

  if (day !== undefined && month !== undefined) {
    // Day precision
    bounds = boundsForDay(year, month, day);
  } else if (month !== undefined) {
    // Month precision
    bounds = boundsForMonth(year, month);
  } else {
    // Year precision
    bounds = boundsForYear(year);
  }

  // Extract qualifiers
  const qualifiers: Qualifiers = {};

  // Check global qualification first
  if (qualification) {
    qualifiers.uncertain = qualification.uncertain || qualification.uncertainApproximate;
    qualifiers.approximate = qualification.approximate || qualification.uncertainApproximate;
  }

  // Check partial qualifications (Level 2)
  // If any component is qualified, mark the whole date
  if (yearQualification || monthQualification || dayQualification) {
    const hasUncertain =
      yearQualification?.uncertain ||
      monthQualification?.uncertain ||
      dayQualification?.uncertain ||
      yearQualification?.uncertainApproximate ||
      monthQualification?.uncertainApproximate ||
      dayQualification?.uncertainApproximate;

    const hasApproximate =
      yearQualification?.approximate ||
      monthQualification?.approximate ||
      dayQualification?.approximate ||
      yearQualification?.uncertainApproximate ||
      monthQualification?.uncertainApproximate ||
      dayQualification?.uncertainApproximate;

    if (hasUncertain) qualifiers.uncertain = true;
    if (hasApproximate) qualifiers.approximate = true;
  }

  return {
    sMin: bounds.sMin,
    sMax: bounds.sMax,
    eMin: bounds.eMin,
    eMax: bounds.eMax,
    startKind: 'closed',
    endKind: 'closed',
    precision,
    qualifiers: Object.keys(qualifiers).length > 0 ? qualifiers : undefined,
  };
}
