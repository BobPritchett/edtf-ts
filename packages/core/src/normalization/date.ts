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

import type { EDTFDate } from '../types/index.js';
import type { Member, Precision, Qualifiers } from '../compare-types/index.js';
import { possibleDateBounds } from '../calendar.js';
import { getYearRange } from '../year-range.js';
import { startOfYear, endOfYear } from './epoch.js';
import { dateToEpochMs } from './epoch.js';
import { getDaysInMonth } from '../compare-utils/calendar.js';

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
  const {
    year,
    month,
    day,
    qualification,
    yearQualification,
    monthQualification,
    dayQualification,
  } = date;

  // Determine precision
  let precision: Precision;
  if (day !== undefined) {
    precision = 'day';
  } else if (month !== undefined) {
    precision = 'month';
  } else {
    precision = 'year';
  }

  const possibilities = possibleDateBounds(year, month, day)!;
  const { first, last } = possibilities;
  const end = (d: typeof first) =>
    dateToEpochMs({
      year: d.year,
      month: d.month!,
      day: d.day!,
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
  const start = (d: typeof first) => dateToEpochMs({ year: d.year, month: d.month!, day: d.day! });
  const bounds = {
    sMin: possibilities.minMs,
    sMax: start({
      ...last,
      ...(day === undefined ? { day: 1 } : {}),
      ...(month === undefined ? { month: 1 } : {}),
    }),
    eMin: end({
      ...first,
      ...(month === undefined
        ? { month: 12, day: 31 }
        : day === undefined
          ? { day: getDaysInMonth(first.year, first.month!) }
          : {}),
    }),
    eMax: possibilities.maxMs,
  };

  if (date.significantDigitsYear !== undefined) {
    const range = getYearRange(date);
    bounds.sMin = startOfYear(range.min);
    bounds.sMax = startOfYear(range.max);
    bounds.eMin = endOfYear(range.min);
    bounds.eMax = endOfYear(range.max);
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
