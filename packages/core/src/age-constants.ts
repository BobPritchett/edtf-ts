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
  // Infancy and early childhood
  { name: 'newborn', minYears: 0, maxYears: 0, minMonths: 0, maxMonths: 1 },
  { name: 'infant', minYears: 0, maxYears: 1, minMonths: 1, maxMonths: 12, aliases: ['baby'] },
  { name: 'toddler', minYears: 1, maxYears: 3 },
  { name: 'preschooler', minYears: 3, maxYears: 5 },

  // Childhood
  { name: 'young child', minYears: 3, maxYears: 6 },
  { name: 'kindergartner', minYears: 5, maxYears: 6 },
  { name: 'child', minYears: 6, maxYears: 12, aliases: ['school-age'] },
  { name: 'grade schooler', minYears: 6, maxYears: 11, aliases: ['grade-schooler', 'elementary schooler'] },

  // Pre-teen and teen years
  { name: 'pre-teen', minYears: 9, maxYears: 12, aliases: ['preteen', 'tween'] },
  { name: 'middle-schooler', minYears: 11, maxYears: 14, aliases: ['middle schooler'] },
  { name: 'early teens', minYears: 13, maxYears: 15, aliases: ['early teen'] },
  { name: 'high-schooler', minYears: 14, maxYears: 18, aliases: ['high schooler'] },
  { name: 'mid teens', minYears: 16, maxYears: 17, aliases: ['mid teen'] },
  { name: 'late teens', minYears: 18, maxYears: 19, aliases: ['late teen'] },
  { name: 'teenager', minYears: 13, maxYears: 19, aliases: ['teen', 'teens', 'adolescent'] },

  // Legal/formal terms for minors
  { name: 'minor', minYears: 0, maxYears: 17 },
  { name: 'juvenile', minYears: 10, maxYears: 17 },

  // Adulthood by decade
  { name: 'young adult', minYears: 18, maxYears: 29 },
  { name: 'twentysomething', minYears: 20, maxYears: 29, aliases: ['twenty-something'] },
  { name: 'thirtysomething', minYears: 30, maxYears: 39, aliases: ['thirty-something'] },
  { name: 'adult', minYears: 30, maxYears: 64 },
  { name: 'middle-aged', minYears: 45, maxYears: 65 },

  // Senior years
  { name: 'senior', minYears: 65, maxYears: null, aliases: ['elderly'] },
  { name: 'septuagenarian', minYears: 70, maxYears: 79 },
  { name: 'octogenarian', minYears: 80, maxYears: 89 },
  { name: 'nonagenarian', minYears: 90, maxYears: 99 },
  { name: 'centenarian', minYears: 100, maxYears: null, aliases: ['supercentenarian'] },
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

/**
 * Create a regex pattern that matches any age indicator.
 * Used to detect whether input contains age info vs birthday-only.
 *
 * Matches:
 * - Numeric ages: "35", "35 years", "35 yo", "age 35"
 * - Time units: "6 months", "2 weeks", "10 days"
 * - Life stages: all names and aliases from LIFE_STAGES
 * - Decades: all keys from DECADE_WORDS plus numeric patterns like "30s"
 */
export function createAgeIndicatorPattern(): RegExp {
  // Collect all life stage names and aliases
  const lifeStageTerms: string[] = [];
  for (const stage of LIFE_STAGES) {
    lifeStageTerms.push(escapeRegex(stage.name));
    if (stage.aliases) {
      for (const alias of stage.aliases) {
        lifeStageTerms.push(escapeRegex(alias));
      }
    }
  }

  // Collect decade words (excluding numeric "20s" patterns - handled separately)
  const decadeTerms = Object.keys(DECADE_WORDS)
    .filter(k => !/^\d/.test(k))
    .map(escapeRegex);

  // Build the pattern parts
  const parts = [
    // Numeric ages with units
    String.raw`\d+\s*(?:years?|yo|y/o|months?|weeks?|days?)`,
    // "age 35" pattern
    String.raw`age\s+\d+`,
    // Life stages
    ...lifeStageTerms,
    // Decade words
    ...decadeTerms,
    // Numeric decade patterns: "30s", "40s", etc.
    String.raw`\d0s`,
  ];

  return new RegExp(`\\b(?:${parts.join('|')})\\b`, 'i');
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
