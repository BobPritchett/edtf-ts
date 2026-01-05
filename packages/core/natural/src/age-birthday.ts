/**
 * Age and birthday parsing for natural language input.
 *
 * Parses age expressions (e.g., "20 yo", "early 30s", "teenager") and
 * birthday constraints (e.g., "March birthday", "birthday 3/15") into
 * EDTF Level 2 intervals with component-level qualification.
 */

import { parse as parseEDTF } from '@edtf-ts/core';
import type { EDTFBase } from '@edtf-ts/core';
import {
  MONTH_NAMES,
  MONTH_FULL_NAMES,
  DECADE_WORDS,
  CONFIDENCE_SCORES,
  createLifeStageMap,
  createAgeIndicatorPattern,
} from '@edtf-ts/core';
import { parseNatural } from './parser.js';

/**
 * Confidence scoring for age parsing.
 * Extends CONFIDENCE_SCORES with additional birthday-specific scores.
 */
const CONFIDENCE = {
  ...CONFIDENCE_SCORES,
  BIRTHDAY_MONTH_ONLY: 0.80,
} as const;

/**
 * Life stage vocabulary lookup map.
 * Created from the shared LIFE_STAGES definition in @edtf-ts/core.
 */
const LIFE_STAGE_AGES = createLifeStageMap();

/**
 * Regex pattern for detecting age indicators in input.
 * Built dynamically from shared constants so new life stages/decades are auto-included.
 */
const AGE_INDICATOR_PATTERN = createAgeIndicatorPattern();

/**
 * Options for parsing age and birthday expressions.
 */
export interface ParseAgeBirthdayOptions {
  /** Reference date for age calculation (defaults to current date) */
  currentDate?: Date;
  /** If true, allows bare numbers like "35" to be interpreted as ages */
  contextIsAgeField?: boolean;
  /** Locale for month name parsing (default: 'en-US') */
  locale?: string;
}

/**
 * Result from parsing an age/birthday expression.
 */
export interface ParseAgeBirthdayResult {
  /** The EDTF string representation */
  edtf: string;
  /** The type of result ('date' for exact, 'interval' for range) */
  type: 'date' | 'interval';
  /**
   * Confidence score (0-1).
   * See CONFIDENCE_SCORES in @edtf-ts/utils for guidelines.
   */
  confidence: number;
  /** Human-readable interpretation */
  interpretation: string;
  /** Parsed EDTF object (if valid) */
  parsed?: EDTFBase;
  /** Derived age range [min, max] where max can be null for open-ended */
  ageRange?: [number, number | null];
  /** Birthday components that are known with certainty */
  birthdayKnown?: { month?: number; day?: number };
}

/**
 * Internal representation of a parsed age expression.
 */
interface AgeExpression {
  /** Minimum age in years (or fraction for sub-year) */
  minYears: number;
  /** Maximum age in years (or fraction for sub-year), null for open-ended */
  maxYears: number | null;
  /** Original input that produced this */
  source: string;
  /** Whether this is approximate (~) */
  approximate?: boolean;
  /** Whether this is uncertain (?) */
  uncertain?: boolean;
}

/**
 * Internal representation of a birthday constraint.
 */
interface BirthdayConstraint {
  /** Month (1-12) if known */
  month?: number;
  /** Day (1-31) if known */
  day?: number;
}

/**
 * Birth marker prefixes that indicate the remainder should be parsed as a date.
 */
const BIRTH_MARKERS = [
  'date of birth:',
  'date of birth',
  'dob:',
  'dob',
  'born:',
  'born',
  'birth:',
  'birth',
  'b.',
  'b ',
];

/**
 * Normalize input text for parsing.
 */
function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/[–—‐−]/g, '-')
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[\u00A0\u2009]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Expand age shorthands.
 */
function expandShorthands(input: string): string {
  return input
    .replace(/\byo\b/gi, 'years old')
    .replace(/\by\/o\b/gi, 'years old')
    .replace(/\byrs?\b/gi, 'years')
    .replace(/\bmos?\b/gi, 'months')
    .replace(/\bmths?\b/gi, 'months')
    .replace(/\bwks?\b/gi, 'weeks');
}

/**
 * Check if input starts with a birth marker and extract the remainder.
 */
function extractBirthMarker(input: string): { marker: string; remainder: string } | null {
  const normalized = normalizeInput(input);

  for (const marker of BIRTH_MARKERS) {
    if (normalized.startsWith(marker)) {
      const remainder = normalized.slice(marker.length).trim();
      if (remainder) {
        return { marker, remainder };
      }
    }
  }

  return null;
}

/**
 * Parse an age expression from normalized input.
 */
function parseAgeExpression(input: string): AgeExpression | null {
  const normalized = normalizeInput(expandShorthands(input));

  // Check for qualifiers
  const approximate = /\b(about|around|circa|approx|approximately|~)\b/.test(normalized);
  const uncertain = /\b(maybe|possibly|perhaps|\?)\b/.test(normalized);

  // Remove qualifiers for further parsing
  let cleanInput = normalized
    .replace(/\b(about|around|circa|approx|approximately|maybe|possibly|perhaps)\b/g, '')
    .replace(/[~?]/g, '')
    .trim();

  // Try life stages (includes teen subdivisions like "early teens", "mid teen", etc.)
  for (const [stage, [min, max]] of LIFE_STAGE_AGES) {
    if (cleanInput.includes(stage)) {
      return { minYears: min, maxYears: max, source: input, approximate, uncertain };
    }
  }

  // Try decade patterns: "early 30s", "mid-thirties", "late twenties", "30s"
  const decadeMatch = cleanInput.match(
    /\b(early|mid|late)?[-\s]*(twenties|thirties|forties|fifties|sixties|seventies|eighties|nineties|\d0s)\b/i
  );
  if (decadeMatch) {
    const modifier = decadeMatch[1]?.toLowerCase();
    const decadeWord = decadeMatch[2]!.toLowerCase();
    const decadeStart = DECADE_WORDS[decadeWord] ?? parseInt(decadeWord, 10);

    let min: number, max: number;
    if (modifier === 'early') {
      min = decadeStart;
      max = decadeStart + 3;
    } else if (modifier === 'mid') {
      min = decadeStart + 4;
      max = decadeStart + 6;
    } else if (modifier === 'late') {
      min = decadeStart + 7;
      max = decadeStart + 9;
    } else {
      min = decadeStart;
      max = decadeStart + 9;
    }

    return { minYears: min, maxYears: max, source: input, approximate, uncertain };
  }

  // Try numeric age range: "22-26", "22 to 26", "22-26 years old"
  const rangeMatch = cleanInput.match(/\b(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?\s*(?:old)?)?/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]!, 10);
    const max = parseInt(rangeMatch[2]!, 10);
    if (min <= max && min >= 0 && max <= 150) {
      return { minYears: min, maxYears: max, source: input, approximate, uncertain };
    }
  }

  // Try single numeric age: "35", "35 years", "35 years old", "age 35"
  // Allow content after the age (e.g., "20 years old, March birthday")
  const numericMatch = cleanInput.match(/\b(?:age\s+)?(\d+)\s*(?:years?\s*(?:old)?)?(?:\s*,|$)/i);
  if (numericMatch) {
    const age = parseInt(numericMatch[1]!, 10);
    if (age >= 0 && age <= 150) {
      return { minYears: age, maxYears: age, source: input, approximate, uncertain };
    }
  }

  // Try infant ages: "6 months", "6 months old", "2 weeks", "10 days"
  const infantMatch = cleanInput.match(/\b(\d+)\s*(months?|weeks?|days?)\s*(?:old)?/i);
  if (infantMatch) {
    const value = parseInt(infantMatch[1]!, 10);
    const unit = infantMatch[2]!.toLowerCase();

    let minYears: number, maxYears: number;
    if (unit.startsWith('month')) {
      // Convert months to fractional years
      minYears = value / 12;
      maxYears = (value + 1) / 12;
    } else if (unit.startsWith('week')) {
      minYears = (value * 7) / 365;
      maxYears = ((value + 1) * 7) / 365;
    } else if (unit.startsWith('day')) {
      minYears = value / 365;
      maxYears = (value + 1) / 365;
    } else {
      return null;
    }

    return { minYears, maxYears, source: input, approximate, uncertain };
  }

  return null;
}

/**
 * Parse a birthday constraint from input.
 */
function parseBirthdayConstraint(input: string): BirthdayConstraint | null {
  const normalized = normalizeInput(input);

  // Try "birthday MM/DD" or "MM/DD birthday"
  const slashMatch = normalized.match(/(?:birthday\s+)?(\d{1,2})\/(\d{1,2})(?:\s+birthday)?/);
  if (slashMatch) {
    const first = parseInt(slashMatch[1]!, 10);
    const second = parseInt(slashMatch[2]!, 10);

    // Assume US format: MM/DD
    if (first >= 1 && first <= 12 && second >= 1 && second <= 31) {
      return { month: first, day: second };
    }
  }

  // Try month name patterns
  for (const [monthName, monthNum] of Object.entries(MONTH_NAMES) as [string, number][]) {
    // "March 15th birthday", "March 15 birthday", "birthday March 15"
    const dayMatch = normalized.match(
      new RegExp(`(?:birthday\\s+)?${monthName}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+birthday)?`, 'i')
    );
    if (dayMatch) {
      const day = parseInt(dayMatch[1]!, 10);
      if (day >= 1 && day <= 31) {
        return { month: monthNum, day };
      }
    }

    // "15th of March birthday", "15 March birthday"
    const dayFirstMatch = normalized.match(
      new RegExp(`(?:birthday\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${monthName}(?:\\s+birthday)?`, 'i')
    );
    if (dayFirstMatch) {
      const day = parseInt(dayFirstMatch[1]!, 10);
      if (day >= 1 && day <= 31) {
        return { month: monthNum, day };
      }
    }

    // "March birthday" (month only)
    if (normalized.includes(`${monthName} birthday`) || normalized.includes(`${monthName}, birthday`)) {
      return { month: monthNum };
    }

    // Just month name in context
    if (normalized.includes(monthName) && normalized.includes('birthday')) {
      return { month: monthNum };
    }
  }

  return null;
}

/**
 * Check if a birthday has passed in the reference year.
 */
function hasBirthdayPassed(month: number, day: number, refDate: Date): boolean {
  const refMonth = refDate.getMonth() + 1;
  const refDay = refDate.getDate();

  if (month < refMonth) return true;
  if (month > refMonth) return false;
  return day <= refDay;
}

/**
 * Get the number of days in a month.
 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Format a date component with optional uncertainty marker.
 */
function fmt(value: number, digits: number, uncertain: boolean): string {
  const str = String(value).padStart(digits, '0');
  return uncertain ? `?${str}` : str;
}

/**
 * Calculate the birth interval from an age expression.
 */
function calculateBirthInterval(
  age: AgeExpression,
  birthday: BirthdayConstraint | null,
  currentDate: Date
): { edtf: string; type: 'date' | 'interval'; birthdayKnown?: { month?: number; day?: number } } {
  const refYear = currentDate.getFullYear();
  const refMonth = currentDate.getMonth() + 1;
  const refDay = currentDate.getDate();

  const minAge = Math.floor(age.minYears);
  const maxAge = age.maxYears !== null ? Math.floor(age.maxYears) : null;

  // Handle open-ended (senior, 65+)
  if (maxAge === null) {
    // Open start: `../?{year}-?{month}-?{day}`
    const endYear = refYear - minAge;
    const edtf = `../` + fmt(endYear, 4, true) + '-' + fmt(refMonth, 2, true) + '-' + fmt(refDay, 2, true);
    return { edtf, type: 'interval' };
  }

  // Case: Exact age + full birthday known
  if (birthday?.month && birthday?.day && minAge === maxAge) {
    const passed = hasBirthdayPassed(birthday.month, birthday.day, currentDate);
    const birthYear = passed ? refYear - minAge : refYear - minAge - 1;
    const edtf = `${birthYear}-${String(birthday.month).padStart(2, '0')}-${String(birthday.day).padStart(2, '0')}`;
    return {
      edtf,
      type: 'date',
      birthdayKnown: { month: birthday.month, day: birthday.day },
    };
  }

  // Case: Exact age + month known (day unknown)
  if (birthday?.month && !birthday?.day && minAge === maxAge) {
    const passed = hasBirthdayPassed(birthday.month, 1, currentDate);
    const birthYear = passed ? refYear - minAge : refYear - minAge - 1;
    const lastDay = daysInMonth(birthYear, birthday.month);
    const m = String(birthday.month).padStart(2, '0');
    const edtf = `${birthYear}-${m}-?01/${birthYear}-${m}-?${String(lastDay).padStart(2, '0')}`;
    return {
      edtf,
      type: 'interval',
      birthdayKnown: { month: birthday.month },
    };
  }

  // Case: Age range + full birthday known
  if (birthday?.month && birthday?.day && minAge !== maxAge) {
    const passed = hasBirthdayPassed(birthday.month, birthday.day, currentDate);
    const startYear = passed ? refYear - maxAge : refYear - maxAge - 1;
    const endYear = passed ? refYear - minAge : refYear - minAge - 1;
    const m = String(birthday.month).padStart(2, '0');
    const d = String(birthday.day).padStart(2, '0');
    const edtf = `?${startYear}-${m}-${d}/?${endYear}-${m}-${d}`;
    return {
      edtf,
      type: 'interval',
      birthdayKnown: { month: birthday.month, day: birthday.day },
    };
  }

  // Case: Age range + month known (day unknown)
  if (birthday?.month && !birthday?.day && minAge !== maxAge) {
    const passed = hasBirthdayPassed(birthday.month, 1, currentDate);
    const startYear = passed ? refYear - maxAge : refYear - maxAge - 1;
    const endYear = passed ? refYear - minAge : refYear - minAge - 1;
    const lastDayStart = daysInMonth(startYear, birthday.month);
    const lastDayEnd = daysInMonth(endYear, birthday.month);
    const m = String(birthday.month).padStart(2, '0');
    const edtf = `?${startYear}-${m}-?01/?${endYear}-${m}-?${String(Math.max(lastDayStart, lastDayEnd)).padStart(2, '0')}`;
    return {
      edtf,
      type: 'interval',
      birthdayKnown: { month: birthday.month },
    };
  }

  // Case: Sub-year ages (months, weeks, days)
  if (age.minYears < 1 && age.maxYears !== null && age.maxYears < 1) {
    // Calculate approximate date range
    const minDays = Math.floor(age.minYears * 365);
    const maxDays = Math.ceil(age.maxYears * 365);

    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - maxDays);
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() - minDays);

    const startY = startDate.getFullYear();
    const startM = startDate.getMonth() + 1;
    const startD = startDate.getDate();
    const endY = endDate.getFullYear();
    const endM = endDate.getMonth() + 1;
    const endD = endDate.getDate();

    const edtf = fmt(startY, 4, true) + '-' + fmt(startM, 2, true) + '-' + fmt(startD, 2, true) + '/' +
      fmt(endY, 4, true) + '-' + fmt(endM, 2, true) + '-' + fmt(endD, 2, true);
    return { edtf, type: 'interval' };
  }

  // Case: Age only (no birthday info) - generic interval
  // Formula: birthStart = (T - (maxAge+1) years) + 1 day
  //          birthEnd = T - minAge years

  // Calculate start date (earliest possible birth)
  const startYear = refYear - maxAge - 1;
  const startDate = new Date(startYear, refMonth - 1, refDay);
  startDate.setDate(startDate.getDate() + 1);

  // Calculate end date (latest possible birth)
  const endYear = refYear - minAge;

  const sY = startDate.getFullYear();
  const sM = startDate.getMonth() + 1;
  const sD = startDate.getDate();

  const edtf = fmt(sY, 4, true) + '-' + fmt(sM, 2, true) + '-' + fmt(sD, 2, true) + '/' +
    fmt(endYear, 4, true) + '-' + fmt(refMonth, 2, true) + '-' + fmt(refDay, 2, true);

  return { edtf, type: 'interval' };
}

/**
 * Parse a natural language age/birthday expression into EDTF format.
 *
 * @param input - Natural language input (e.g., "20 yo", "early 30s, March birthday")
 * @param options - Parsing options
 * @returns Parsed result with EDTF string and metadata
 *
 * @example
 * ```typescript
 * // Age only
 * parseAgeBirthday('20 yo', { currentDate: new Date('2025-06-01') });
 * // { edtf: '?2004-?06-?02/?2005-?06-?01', type: 'interval', ... }
 *
 * // Age with birthday
 * parseAgeBirthday('20 y/o, birthday 3/15', { currentDate: new Date('2025-06-01') });
 * // { edtf: '2005-03-15', type: 'date', ... }
 *
 * // Birth marker (handed off to parseNatural)
 * parseAgeBirthday('born c. 1871', { currentDate: new Date('2025-06-01') });
 * // { edtf: '1871~', type: 'date', ... }
 * ```
 */
export function parseAgeBirthday(
  input: string,
  options: ParseAgeBirthdayOptions = {}
): ParseAgeBirthdayResult {
  const { currentDate = new Date(), locale = 'en-US' } = options;

  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  const normalized = normalizeInput(input);
  if (!normalized) {
    throw new Error('Input must not be empty after normalization');
  }

  // Step 1: Check for birth marker → hand off to parseNatural
  const birthMarker = extractBirthMarker(normalized);
  if (birthMarker) {
    try {
      const results = parseNatural(birthMarker.remainder, { locale });
      if (results.length > 0) {
        const best = results[0]!;
        return {
          edtf: best.edtf,
          type: best.type === 'interval' ? 'interval' : 'date',
          confidence: best.confidence,
          interpretation: `Birth date: ${best.interpretation}`,
          parsed: best.parsed,
        };
      }
    } catch {
      // Fall through to age parsing
    }
  }

  // Step 2: Check for birthday-only input (no age)
  const birthdayOnly = parseBirthdayConstraint(normalized);
  // Check if input contains any age indicator (numeric ages, life stages, decades)
  const hasAgeIndicator = AGE_INDICATOR_PATTERN.test(normalized);

  if (birthdayOnly && !hasAgeIndicator) {
    // Birthday only, no age info → XXXX-MM-DD
    const m = String(birthdayOnly.month).padStart(2, '0');
    if (birthdayOnly.day) {
      const d = String(birthdayOnly.day).padStart(2, '0');
      const edtf = `XXXX-${m}-${d}`;
      return {
        edtf,
        type: 'date',
        confidence: CONFIDENCE.BIRTHDAY_ONLY,
        interpretation: `Birthday: ${getMonthName(birthdayOnly.month!)} ${birthdayOnly.day}`,
        parsed: tryParse(edtf),
        birthdayKnown: birthdayOnly,
      };
    } else {
      const edtf = `XXXX-${m}`;
      return {
        edtf,
        type: 'date',
        confidence: CONFIDENCE.BIRTHDAY_MONTH_ONLY,
        interpretation: `Birthday month: ${getMonthName(birthdayOnly.month!)}`,
        parsed: tryParse(edtf),
        birthdayKnown: { month: birthdayOnly.month },
      };
    }
  }

  // Step 3: Parse age expression
  const age = parseAgeExpression(normalized);
  if (!age) {
    throw new Error(`Could not parse age from input: ${input}`);
  }

  // Step 4: Parse birthday constraint (if present alongside age)
  const birthday = parseBirthdayConstraint(normalized);

  // Step 5: Calculate birth interval
  const result = calculateBirthInterval(age, birthday, currentDate);

  // Step 6: Apply qualifiers if present
  let edtf = result.edtf;
  if (age.approximate && age.uncertain) {
    edtf = edtf.replace(/^(\??)(\d)/, '%$2').replace(/\/(\??)(\d)/, '/%$2');
  } else if (age.approximate && !edtf.includes('~')) {
    // Add approximate marker to the whole expression
    if (result.type === 'date') {
      edtf = `${edtf}~`;
    }
  } else if (age.uncertain && !result.edtf.includes('?')) {
    // Add uncertain marker
    if (result.type === 'date') {
      edtf = `${edtf}?`;
    }
  }

  // Calculate age range for output
  const ageRange: [number, number | null] = [
    Math.floor(age.minYears),
    age.maxYears !== null ? Math.floor(age.maxYears) : null,
  ];

  // Generate interpretation
  const ageStr = ageRange[1] === null
    ? `${ageRange[0]}+ years old`
    : ageRange[0] === ageRange[1]
      ? `${ageRange[0]} years old`
      : `${ageRange[0]}-${ageRange[1]} years old`;

  const bdayStr = birthday?.day
    ? `, birthday ${getMonthName(birthday.month!)} ${birthday.day}`
    : birthday?.month
      ? `, ${getMonthName(birthday.month)} birthday`
      : '';

  return {
    edtf,
    type: result.type,
    confidence: birthday ? CONFIDENCE.AGE_WITH_BIRTHDAY : CONFIDENCE.AGE_ONLY,
    interpretation: `${ageStr}${bdayStr}`,
    parsed: tryParse(edtf),
    ageRange,
    birthdayKnown: result.birthdayKnown,
  };
}

/**
 * Get month name from number.
 */
function getMonthName(month: number): string {
  return MONTH_FULL_NAMES[month - 1] || 'Unknown';
}

/**
 * Try to parse an EDTF string, returning undefined if invalid.
 */
function tryParse(edtf: string): EDTFBase | undefined {
  const result = parseEDTF(edtf);
  return result.success ? result.value : undefined;
}
