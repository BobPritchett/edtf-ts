import { resolveLanguage, resolveDateOrder, type Language, type DateOrder } from '@edtf-ts/core';
import en from './languages/en.js';
import es from './languages/es.js';
import fr from './languages/fr.js';
import { ageTokens, birthMarkers } from './languages/age-vocabulary.js';
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
import { buildPartialQual } from './semantic-helpers.js';
import type { ParseNaturalOptions, ParseResult } from './parser-factory.js';
import {
  possibleDateBounds,
  formatYear,
  shiftCalendarDate,
  formatCalendarDate,
  renderAgeBirthday,
} from '@edtf-ts/core';

/**
 * Confidence scoring for age parsing.
 * Extends CONFIDENCE_SCORES with additional birthday-specific scores.
 */
const CONFIDENCE = {
  ...CONFIDENCE_SCORES,
  BIRTHDAY_MONTH_ONLY: 0.8,
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
  /**
   * Reference date for age calculation (defaults to the current system date
   * at call time). Date components are read in the runtime's local time
   * zone — appropriate for UX, where "today" means the user's today. For
   * server-side use on behalf of a user in another time zone, construct and
   * pass a Date representing that user's current date.
   */
  currentDate?: Date;
  /** If true, allows bare numbers like "35" to be interpreted as ages */
  contextIsAgeField?: boolean;
  /** Locale for month name parsing (default: 'en-US') */
  locale?: string;
  language?: Language;
  dateOrder?: DateOrder;
}

/**
 * Result from parsing an age/birthday expression.
 */
export interface ParseAgeBirthdayResult {
  /** The EDTF string representation */
  edtf: string;
  /** The type of result ('date' for exact, 'interval' for range) */
  type: import('./parser-factory.js').ParseResult['type'];
  /**
   * Confidence score (0-1).
   * See CONFIDENCE_SCORES in @edtf-ts/core for guidelines.
   */
  confidence: number;
  /** Human-readable interpretation */
  interpretation: string;
  /** Parsed EDTF object (if valid) */
  parsed: EDTFBase;
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
  unit?: 'month' | 'week' | 'day';
  amount?: number;
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

/**
 * Normalize input text for parsing.
 */
function normalizeInput(input: string): string {
  return input
    .normalize('NFC')
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
function extractBirthMarker(
  input: string,
  language: Language
): { marker: string; remainder: string } | null {
  const normalized = normalizeInput(input);

  for (const marker of birthMarkers[language]) {
    if (
      normalized.startsWith(marker) &&
      (/[ .:]$/.test(marker) || !/[a-zà-ÿ]/.test(normalized[marker.length] ?? ''))
    ) {
      const remainder = input.normalize('NFC').trim().slice(marker.length).trim();
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
  for (const [stage, [min, max]] of [...LIFE_STAGE_AGES].sort(
    (a, b) => b[0].length - a[0].length
  )) {
    if (new RegExp('(?:^|\\W)' + stage + '(?:$|\\W)').test(cleanInput)) {
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
    throw new Error('Invalid age range');
  }

  const openAge = cleanInput.match(/^(?:age\s+)?(\d+)\s*\+(?:\s+years?(?:\s+old)?)?$/);
  if (openAge)
    return { minYears: Number(openAge[1]), maxYears: null, source: input, approximate, uncertain };

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

    return {
      minYears,
      maxYears,
      source: input,
      approximate,
      uncertain,
      unit: unit.startsWith('month') ? 'month' : unit.startsWith('week') ? 'week' : 'day',
      amount: value,
    };
  }

  return null;
}

/**
 * Parse a birthday constraint from input.
 */
function parseBirthdayConstraint(
  input: string,
  order: DateOrder = 'MDY'
): BirthdayConstraint | null {
  const normalized = normalizeInput(input);

  // Try "birthday MM/DD" or "MM/DD birthday"
  const slashMatch = normalized.match(/(?:birthday\s+)?(\d{1,2})\/(\d{1,2})(?:\s+birthday)?/);
  if (slashMatch) {
    const first = parseInt(slashMatch[order === 'DMY' ? 2 : 1]!, 10);
    const second = parseInt(slashMatch[order === 'DMY' ? 1 : 2]!, 10);

    // Partial numeric birthdays follow the selected numeric date order.
    if (first >= 1 && first <= 12 && second >= 1 && second <= 31) {
      return { month: first, day: second };
    }
    throw new Error('Invalid numeric birthday');
  }

  // Try month name patterns
  for (const [monthName, monthNum] of Object.entries(MONTH_NAMES) as [string, number][]) {
    // "March 15th birthday", "March 15 birthday", "birthday March 15"
    const dayMatch = normalized.match(
      new RegExp(
        `(?:birthday\\s+)?${monthName}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+birthday)?`,
        'i'
      )
    );
    if (dayMatch) {
      const day = parseInt(dayMatch[1]!, 10);
      if (day >= 1 && day <= 31) {
        return { month: monthNum, day };
      }
      throw new Error('Invalid birthday');
    }

    // "15th of March birthday", "15 March birthday"
    const dayFirstMatch = normalized.match(
      new RegExp(
        `(?:birthday\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${monthName}(?:\\s+birthday)?`,
        'i'
      )
    );
    if (dayFirstMatch) {
      const day = parseInt(dayFirstMatch[1]!, 10);
      if (day >= 1 && day <= 31) {
        return { month: monthNum, day };
      }
      throw new Error('Invalid birthday');
    }

    // "March birthday" (month only)
    if (
      normalized.includes(`${monthName} birthday`) ||
      normalized.includes(`${monthName}, birthday`)
    ) {
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
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/**
 * Format a date component with optional uncertainty marker.
 */
function fmt(value: number, digits: number, uncertain: boolean): string {
  const str = digits === 4 ? formatYear(value) : String(value).padStart(digits, '0');
  return uncertain ? `?${str}` : str;
}

/**
 * Calculate the birth interval from an age expression.
 */
function calculateBirthInterval(
  age: AgeExpression,
  birthday: BirthdayConstraint | null,
  currentDate: Date
): {
  edtf: string;
  type: 'date' | 'interval' | 'set';
  birthdayKnown?: { month?: number; day?: number };
} {
  const refYear = currentDate.getFullYear();
  const refMonth = currentDate.getMonth() + 1;
  const refDay = currentDate.getDate();

  const minAge = Math.floor(age.minYears);
  const maxAge = age.maxYears !== null ? Math.floor(age.maxYears) : null;

  // Handle open-ended (senior, 65+)
  if (maxAge === null) {
    if (birthday)
      throw new Error(
        'An unbounded age with a recurring birthday cannot be represented by a finite EDTF expression; provide a finite age range'
      );
    // Open start: `../?{year}-?{month}-?{day}`
    const endYear = refYear - minAge;
    const edtf =
      `../` +
      fmt(endYear, 4, true) +
      '-' +
      fmt(refMonth, 2, true) +
      '-' +
      fmt(Math.min(refDay, daysInMonth(endYear, refMonth)), 2, true);
    return { edtf, type: 'interval' };
  }

  // Completed calendar months/weeks/days, with clamped month anniversaries.
  const unitWindow = (() => {
    if (!age.unit || age.amount === undefined) return undefined;
    const ref = { year: refYear, month: refMonth, day: refDay };
    const subtract = (amount: number) => {
      if (age.unit === 'month') {
        const total = refYear * 12 + refMonth - 1 - amount;
        const year = Math.floor(total / 12),
          month = (((total % 12) + 12) % 12) + 1;
        return { year, month, day: Math.min(refDay, daysInMonth(year, month)) };
      }
      let date = ref;
      for (let n = 0; n < amount * (age.unit === 'week' ? 7 : 1); n++)
        date = shiftCalendarDate(date, -1) as typeof ref;
      return date;
    };
    const start = shiftCalendarDate(subtract(age.amount + 1), 1),
      end = subtract(age.amount);
    return { start, end };
  })();

  if (birthday?.month) {
    const m = birthday.month,
      parts: string[] = [];
    const lowerYear = refYear - maxAge - 1,
      upperYear = refYear - minAge;
    for (let year = lowerYear; year <= upperYear; year++) {
      const allowed: number[] = [];
      const lastDay = daysInMonth(year, m);
      for (let day = birthday.day ?? 1; day <= (birthday.day ?? lastDay); day++) {
        if (day > lastDay) continue;
        const completedAge = refYear - year - (hasBirthdayPassed(m, day, currentDate) ? 0 : 1);
        const epoch = possibleDateBounds(year, m, day)!.minMs;
        const insideUnit =
          !unitWindow ||
          (epoch >=
            possibleDateBounds(unitWindow.start.year, unitWindow.start.month, unitWindow.start.day)!
              .minMs &&
            epoch <=
              possibleDateBounds(unitWindow.end.year, unitWindow.end.month, unitWindow.end.day)!
                .maxMs);
        if (insideUnit && completedAge >= minAge && completedAge <= maxAge) allowed.push(day);
      }
      if (!allowed.length) continue;
      const first = formatCalendarDate({ year, month: m, day: allowed[0]! });
      const last = formatCalendarDate({ year, month: m, day: allowed[allowed.length - 1]! });
      parts.push(first === last ? first : first + '..' + last);
    }
    if (!parts.length) throw new Error('No valid birth date satisfies this age and birthday');
    if (parts.length === 1 && !parts[0]!.includes('..'))
      return { edtf: parts[0]!, type: 'date', birthdayKnown: birthday };
    return { edtf: '[' + parts.join(',') + ']', type: 'set', birthdayKnown: birthday };
  }

  if (unitWindow) {
    const uncertain = (date: typeof unitWindow.start) =>
      fmt(date.year, 4, true) + '-' + fmt(date.month!, 2, true) + '-' + fmt(date.day!, 2, true);
    return {
      edtf: uncertain(unitWindow.start) + '/' + uncertain(unitWindow.end),
      type: 'interval',
    };
  }

  // Case: Age only (no birthday info) - generic interval
  // Formula: birthStart = (T - (maxAge+1) years) + 1 day
  //          birthEnd = T - minAge years

  // Calculate start date (earliest possible birth)
  const startYear = refYear - maxAge - 1;
  const startDate = shiftCalendarDate(
    { year: startYear, month: refMonth, day: Math.min(refDay, daysInMonth(startYear, refMonth)) },
    1
  );

  // Calculate end date (latest possible birth)
  const endYear = refYear - minAge;

  const sY = startDate.year;
  const sM = startDate.month!;
  const sD = startDate.day!;

  const edtf =
    fmt(sY, 4, true) +
    '-' +
    fmt(sM, 2, true) +
    '-' +
    fmt(sD, 2, true) +
    '/' +
    fmt(endYear, 4, true) +
    '-' +
    fmt(refMonth, 2, true) +
    '-' +
    fmt(Math.min(refDay, daysInMonth(endYear, refMonth)), 2, true);

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
export function createAgeBirthdayParser(
  parseNatural: (input: string, options?: ParseNaturalOptions) => ParseResult[],
  defaultLocale = 'en-US'
) {
  return function parseAgeBirthday(
    input: string,
    options: ParseAgeBirthdayOptions = {}
  ): ParseAgeBirthdayResult {
    const { currentDate = new Date(), locale: requestedLocale = defaultLocale } = options;
    const locale = options.language
      ? new Intl.Locale(requestedLocale, { language: options.language }).toString()
      : requestedLocale;
    if (!Number.isFinite(currentDate.getTime())) throw new Error('Invalid reference date');

    if (!input || typeof input !== 'string') {
      throw new Error('Input must be a non-empty string');
    }

    const language = resolveLanguage(locale, options.language);
    const original = input.normalize('NFC').replace(/\s+/g, ' ').trim();
    const normalized = ageTokens(normalizeInput(original), language, { en, es, fr }[language]);
    const order = resolveDateOrder(requestedLocale, options.dateOrder);
    if (!normalized) {
      throw new Error('Input must not be empty after normalization');
    }

    // Step 1: Check for birth marker → hand off to parseNatural
    const birthMarker = extractBirthMarker(original, language);
    if (birthMarker) {
      {
        const results = parseNatural(birthMarker.remainder, {
          locale,
          language,
          dateOrder: order,
          referenceDate: currentDate,
        });
        if (results.length > 0) {
          const best = results[0]!;
          return {
            edtf: best.edtf,
            type: best.type,
            confidence: best.confidence,
            interpretation: `${language === 'es' ? 'Fecha de nacimiento' : language === 'fr' ? 'Date de naissance' : 'Birth date'}: ${best.interpretation}`,
            parsed: best.parsed,
          };
        }
      }
    }

    // Step 2: Check for birthday-only input (no age)
    const birthdayOnly = parseBirthdayConstraint(normalized, order);
    // Check if input contains any age indicator (numeric ages, life stages, decades)
    const hasAgeIndicator = AGE_INDICATOR_PATTERN.test(normalized);

    if (
      birthdayOnly?.month &&
      birthdayOnly.day &&
      birthdayOnly.day > daysInMonth(2000, birthdayOnly.month)
    )
      throw new Error('Invalid birthday');
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
          interpretation: renderAgeBirthday(edtf, { currentDate, locale, format: 'birthday-only' })
            .formatted,
          parsed: tryParse(edtf),
          birthdayKnown: birthdayOnly,
        };
      } else {
        const edtf = `XXXX-${m}`;
        return {
          edtf,
          type: 'date',
          confidence: CONFIDENCE.BIRTHDAY_MONTH_ONLY,
          interpretation: renderAgeBirthday(edtf, { currentDate, locale, format: 'birthday-only' })
            .formatted,
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
    const birthday = parseBirthdayConstraint(normalized, order);

    if (birthday?.month && birthday.day && birthday.day > daysInMonth(2000, birthday.month))
      throw new Error('Invalid birthday: day does not exist in this month');
    // Step 5: Calculate birth interval
    const result = calculateBirthInterval(age, birthday, currentDate);

    // An approximate age qualifies the derived birth year; a known birthday stays exact.
    let edtf = result.edtf;
    if (age.approximate || age.uncertain) {
      const qualifier = age.approximate && age.uncertain ? '%' : age.approximate ? '~' : '?';
      const qualify = (text: string) =>
        text && text !== '..' ? buildPartialQual(text, { year: qualifier }) : text;
      if (result.type === 'set') {
        const parsed = tryParse(edtf) as import('@edtf-ts/core').EDTFSet;
        edtf = '[' + parsed.values.map((v) => qualify(v.edtf)).join(',') + ']';
      } else edtf = edtf.split('/').map(qualify).join('/');
    }

    // Calculate age range for output
    const ageRange: [number, number | null] = [
      Math.floor(age.minYears),
      age.maxYears !== null ? Math.floor(age.maxYears) : null,
    ];

    // Generate interpretation
    const ageStr =
      ageRange[1] === null
        ? `${ageRange[0]}+ years old`
        : ageRange[0] === ageRange[1]
          ? `${ageRange[0]} years old`
          : `${ageRange[0]}-${ageRange[1]} years old`;

    const bdayStr = birthday?.day
      ? `, birthday ${getMonthName(birthday.month!)} ${birthday.day}`
      : birthday?.month
        ? `, ${getMonthName(birthday.month)} birthday`
        : '';

    const plainInterpretation =
      language === 'en'
        ? ageStr + bdayStr
        : renderAgeBirthday(edtf, { currentDate, locale, ageStyle: 'numeric' }).formatted;
    const prefixes =
      language === 'es'
        ? ['posiblemente', 'aproximadamente']
        : language === 'fr'
          ? ['peut-être', 'environ']
          : ['possibly', 'approximately'];
    const qualificationText = [age.uncertain ? prefixes[0] : '', age.approximate ? prefixes[1] : '']
      .filter(Boolean)
      .join(' ');
    return {
      edtf,
      type: result.type,
      confidence: birthday ? CONFIDENCE.AGE_WITH_BIRTHDAY : CONFIDENCE.AGE_ONLY,
      interpretation: qualificationText
        ? qualificationText + ' ' + plainInterpretation
        : plainInterpretation,
      parsed: tryParse(edtf),
      ageRange,
      birthdayKnown: result.birthdayKnown,
    };
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
function tryParse(edtf: string): EDTFBase {
  const result = parseEDTF(edtf);
  if (!result.success) throw new Error('Invalid birth date: ' + edtf);
  return result.value;
}
