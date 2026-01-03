/**
 * Normalize EDTFSeason to Member.
 *
 * EDTF seasons (codes 21-41) represent sub-year groupings.
 * We map them to fixed month spans.
 */

import type { EDTFSeason } from '../types/index.js';
import type { Member, Qualifiers } from '../compare-types/index.js';
import { startOfMonth, endOfMonth } from './epoch.js';

/**
 * Season code to month range mapping.
 *
 * This is the default mapping based on Northern Hemisphere conventions.
 * Applications can customize this mapping as needed.
 */
export interface SeasonMapping {
  /** Starting month (1-12) */
  startMonth: number;
  /** Ending month (1-12) */
  endMonth: number;
  /** Name for display */
  name: string;
}

/**
 * Default season mappings (Northern Hemisphere).
 *
 * Codes 21-24: Seasons
 * Codes 25-28: Hemispheric variations (not standard)
 * Codes 29-32: Meteorological seasons
 * Codes 33-36: Quarters
 * Codes 37-39: Quadrimesters
 * Codes 40-41: Semestrals
 */
export const DEFAULT_SEASON_MAPPINGS: Record<number, SeasonMapping> = {
  // Northern Hemisphere seasons
  21: { startMonth: 3, endMonth: 5, name: 'Spring' }, // March-May
  22: { startMonth: 6, endMonth: 8, name: 'Summer' }, // June-August
  23: { startMonth: 9, endMonth: 11, name: 'Autumn' }, // September-November
  24: { startMonth: 12, endMonth: 2, name: 'Winter' }, // December-February (crosses year)

  // Southern Hemisphere seasons (offset by 6 months)
  25: { startMonth: 9, endMonth: 11, name: 'Spring (SH)' },
  26: { startMonth: 12, endMonth: 2, name: 'Summer (SH)' },
  27: { startMonth: 3, endMonth: 5, name: 'Autumn (SH)' },
  28: { startMonth: 6, endMonth: 8, name: 'Winter (SH)' },

  // Quarters
  33: { startMonth: 1, endMonth: 3, name: 'Quarter 1' }, // Q1
  34: { startMonth: 4, endMonth: 6, name: 'Quarter 2' }, // Q2
  35: { startMonth: 7, endMonth: 9, name: 'Quarter 3' }, // Q3
  36: { startMonth: 10, endMonth: 12, name: 'Quarter 4' }, // Q4

  // Quadrimesters
  37: { startMonth: 1, endMonth: 4, name: 'Quadrimester 1' },
  38: { startMonth: 5, endMonth: 8, name: 'Quadrimester 2' },
  39: { startMonth: 9, endMonth: 12, name: 'Quadrimester 3' },

  // Semestrals
  40: { startMonth: 1, endMonth: 6, name: 'Semestral 1' },
  41: { startMonth: 7, endMonth: 12, name: 'Semestral 2' },
};

/**
 * Normalize an EDTFSeason to a Member.
 *
 * Seasons are mapped to fixed month spans.
 * For seasons that cross year boundaries (e.g., Winter: Dec-Feb),
 * we need special handling.
 *
 * @param season The EDTF season to normalize
 * @param mappings Custom season mappings (optional, uses defaults if not provided)
 */
export function normalizeSeason(
  season: EDTFSeason,
  mappings: Record<number, SeasonMapping> = DEFAULT_SEASON_MAPPINGS
): Member {
  const { year, season: seasonCode, qualification } = season;

  const mapping = mappings[seasonCode];

  if (!mapping) {
    throw new Error(`Unknown season code: ${seasonCode}`);
  }

  const { startMonth, endMonth } = mapping;

  let sMin: bigint;
  let sMax: bigint;
  let eMin: bigint;
  let eMax: bigint;

  if (endMonth >= startMonth) {
    // Normal case: season within a single year
    // e.g., Spring (Mar-May), Q1 (Jan-Mar)
    sMin = startOfMonth(year, startMonth);
    sMax = sMin; // Season start is precise to the month
    eMin = endOfMonth(year, endMonth);
    eMax = eMin; // Season end is precise to the month
  } else {
    // Season crosses year boundary
    // e.g., Winter (Dec-Feb): Dec of year Y to Feb of year Y+1
    sMin = startOfMonth(year, startMonth);
    sMax = sMin;
    eMin = endOfMonth(year + 1, endMonth);
    eMax = eMin;
  }

  // Extract qualifiers
  const qualifiers: Qualifiers | undefined = qualification
    ? {
        uncertain: qualification.uncertain || qualification.uncertainApproximate,
        approximate: qualification.approximate || qualification.uncertainApproximate,
      }
    : undefined;

  return {
    sMin,
    sMax,
    eMin,
    eMax,
    startKind: 'closed',
    endKind: 'closed',
    precision: 'subyear',
    qualifiers: qualifiers && (qualifiers.uncertain || qualifiers.approximate) ? qualifiers : undefined,
  };
}

/**
 * Get the name of a season code.
 */
export function getSeasonName(
  seasonCode: number,
  mappings: Record<number, SeasonMapping> = DEFAULT_SEASON_MAPPINGS
): string {
  const mapping = mappings[seasonCode];
  return mapping?.name ?? `Season ${seasonCode}`;
}
