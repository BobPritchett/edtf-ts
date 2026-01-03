/**
 * Shared constants for age and birthday parsing/rendering.
 *
 * This module contains vocabulary and mappings used by both:
 * - @edtf-ts/natural (parsing natural language to EDTF)
 * - @edtf-ts/utils (rendering EDTF to human-readable strings)
 */

/**
 * Life stage definitions with age ranges in years.
 * maxYears can be null for open-ended stages (e.g., senior).
 */
export interface LifeStage {
  name: string;
  minYears: number;
  maxYears: number | null;
  /** For sub-year stages, min/max in months */
  minMonths?: number;
  maxMonths?: number;
  /** Alternative names/aliases for this stage */
  aliases?: string[];
}

/**
 * Lookup table for life stage vocabulary.
 * Sorted from youngest to oldest for matching.
 *
 * Used for:
 * - Parsing: "toddler" → age range [1, 3]
 * - Rendering: age 2 → "toddler"
 */
export const LIFE_STAGES: LifeStage[] = [
  { name: 'newborn', minYears: 0, maxYears: 0, minMonths: 0, maxMonths: 1 },
  { name: 'infant', minYears: 0, maxYears: 1, minMonths: 1, maxMonths: 12 },
  { name: 'toddler', minYears: 1, maxYears: 3 },
  { name: 'preschooler', minYears: 3, maxYears: 5 },
  { name: 'child', minYears: 6, maxYears: 12, aliases: ['school-age'] },
  { name: 'pre-teen', minYears: 9, maxYears: 12, aliases: ['preteen', 'tween'] },
  { name: 'middle-schooler', minYears: 11, maxYears: 14 },
  { name: 'early teens', minYears: 13, maxYears: 15 },
  { name: 'mid teens', minYears: 16, maxYears: 17 },
  { name: 'late teens', minYears: 18, maxYears: 19 },
  { name: 'teenager', minYears: 13, maxYears: 19, aliases: ['teen', 'teens', 'adolescent'] },
  { name: 'young adult', minYears: 18, maxYears: 29 },
  { name: 'adult', minYears: 30, maxYears: 64 },
  { name: 'middle-aged', minYears: 45, maxYears: 65 },
  { name: 'senior', minYears: 65, maxYears: null, aliases: ['elderly'] },
];

/**
 * Create a lookup map from life stage name/alias to age range.
 * Useful for parsing natural language.
 */
export function createLifeStageMap(): Map<string, [number, number | null]> {
  const map = new Map<string, [number, number | null]>();
  for (const stage of LIFE_STAGES) {
    map.set(stage.name.toLowerCase(), [stage.minYears, stage.maxYears]);
    if (stage.aliases) {
      for (const alias of stage.aliases) {
        map.set(alias.toLowerCase(), [stage.minYears, stage.maxYears]);
      }
    }
  }
  return map;
}

/**
 * Month name lookup for parsing.
 * Maps month names and abbreviations to 1-indexed month numbers.
 */
export const MONTH_NAMES: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

/**
 * Reverse lookup: month number to full name.
 */
export const MONTH_FULL_NAMES: string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Decade word lookup for parsing.
 * Maps decade words to starting year of decade.
 */
export const DECADE_WORDS: Record<string, number> = {
  twenties: 20, '20s': 20,
  thirties: 30, '30s': 30,
  forties: 40, '40s': 40,
  fifties: 50, '50s': 50,
  sixties: 60, '60s': 60,
  seventies: 70, '70s': 70,
  eighties: 80, '80s': 80,
  nineties: 90, '90s': 90,
};

/**
 * Maximum reasonable human age for validation.
 * Used to reject implausible ages.
 */
export const MAX_HUMAN_AGE = 120;

/**
 * Confidence scoring guidelines for age parsing.
 *
 * These values indicate how confident we are in the parse result:
 * - 0.95: Exact date with birth marker (e.g., "born March 15, 1990")
 * - 0.90: Age + specific birthday (e.g., "20 yo, birthday 3/15")
 * - 0.85: Age only or birthday only
 * - 0.80: Ambiguous or partial match
 * - 0.70: Low confidence, multiple interpretations possible
 */
export const CONFIDENCE_SCORES = {
  EXACT_BIRTHDATE: 0.95,
  AGE_WITH_BIRTHDAY: 0.90,
  AGE_ONLY: 0.85,
  BIRTHDAY_ONLY: 0.85,
  AMBIGUOUS: 0.80,
  LOW: 0.70,
} as const;
