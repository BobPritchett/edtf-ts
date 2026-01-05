/**
 * Age and birthday rendering utilities for EDTF dates.
 *
 * This module provides functions to render EDTF birthdate expressions
 * as human-friendly age and birthday strings, and to calculate age ranges.
 */

import { parse } from './parser.js';
import { isEDTFDate, isEDTFInterval } from './type-guards.js';
import type { EDTFBase, EDTFDate, EDTFInterval } from './types/index.js';
import {
  calculateAge,
  createDate,
} from './utils-date-helpers.js';
import { LIFE_STAGES } from './age-constants.js';

// Re-export shared types and constants for backwards compatibility
export { LIFE_STAGES, type LifeStage } from './age-constants.js';

/**
 * Options for rendering age and birthday from EDTF.
 */
export interface RenderAgeBirthdayOptions {
  /** Reference date for age calculation (defaults to current date) */
  currentDate?: Date;
  /** Locale for month/day formatting (default: 'en-US') */
  locale?: string;
  /** Output format (default: 'full') */
  format?: 'full' | 'age-only' | 'birthday-only';
  /** Age display style (default: 'vocabulary') */
  ageStyle?: 'numeric' | 'vocabulary';
  /** Age text length (default: 'long') */
  ageLength?: 'short' | 'medium' | 'long';
  /** Month format for birthday (default: 'long') */
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  /** Day format for birthday (default: 'numeric') */
  day?: 'numeric' | '2-digit';
}

/**
 * Result from rendering age and birthday.
 */
export interface RenderAgeBirthdayResult {
  /** Age display string (e.g., "20 years old", "teenager", "65+") */
  age: string;
  /** Birthday display string (e.g., "March 15th", "March") or null if unknown */
  birthday: string | null;
  /** Combined formatted string */
  formatted: string;
  /** Numeric age range [min, max] where max can be null for open-ended */
  ageRange: [number, number | null];
  /** Which birthday components are known with certainty */
  birthdayKnown: { month: boolean; day: boolean };
  /** Qualifier if present on the EDTF */
  qualifier?: 'approximate' | 'uncertain' | 'both';
}

/**
 * Calculate the age range from an EDTF birthdate expression.
 *
 * @param edtf - EDTF string or parsed object
 * @param currentDate - Reference date for age calculation
 * @returns [minAge, maxAge] where maxAge is null for open-ended intervals
 *
 * @example
 * ```typescript
 * calculateAgeRange('2005-03-15', new Date('2025-06-01')); // [20, 20]
 * calculateAgeRange('?2002-03-15/?2005-03-15', new Date('2025-06-01')); // [20, 23]
 * calculateAgeRange('../?1960-?06-?01', new Date('2025-06-01')); // [65, null]
 * calculateAgeRange('XXXX-03-15', new Date('2025-06-01')); // [0, 120]
 * ```
 */
export function calculateAgeRange(
  edtf: string | EDTFBase,
  currentDate: Date
): [number, number | null] {
  // Parse if string
  let parsed: EDTFBase;
  if (typeof edtf === 'string') {
    const result = parse(edtf);
    if (!result.success) {
      throw new Error(`Invalid EDTF string: ${edtf}`);
    }
    parsed = result.value;
  } else {
    parsed = edtf;
  }

  // Handle unspecified year (XXXX-MM-DD)
  if (isEDTFDate(parsed)) {
    const date = parsed as EDTFDate;
    if (typeof date.year === 'string' && date.year.includes('X')) {
      // Unspecified year - could be any age
      return [0, 120];
    }

    // Exact date - calculate single age
    const birthDate = createDateFromEDTF(date);
    const age = calculateAge(birthDate, currentDate);
    return [age, age];
  }

  // Handle interval
  if (isEDTFInterval(parsed)) {
    const interval = parsed as EDTFInterval;

    // Handle open start
    if (interval.openStart || !interval.start) {
      // Open start means no upper bound on age
      if (interval.end && isEDTFDate(interval.end)) {
        const latestBirth = createDateFromEDTF(interval.end as EDTFDate);
        const minAge = calculateAge(latestBirth, currentDate);
        return [minAge, null];
      }
      return [0, null];
    }

    // Handle open end
    if (interval.openEnd || !interval.end) {
      // Open end means age could be 0 (not born yet or just born)
      if (interval.start && isEDTFDate(interval.start)) {
        const earliestBirth = createDateFromEDTF(interval.start as EDTFDate);
        const maxAge = calculateAge(earliestBirth, currentDate);
        return [0, maxAge];
      }
      return [0, null];
    }

    // Both bounds present
    if (isEDTFDate(interval.start) && isEDTFDate(interval.end)) {
      const earliestBirth = createDateFromEDTF(interval.start as EDTFDate);
      const latestBirth = createDateFromEDTF(interval.end as EDTFDate);

      const maxAge = calculateAge(earliestBirth, currentDate);
      const minAge = calculateAge(latestBirth, currentDate);

      return [minAge, maxAge];
    }
  }

  // Fallback for other types
  return [0, 120];
}

/**
 * Create a JavaScript Date from an EDTFDate, stripping uncertainty markers.
 * Uses day 1 if day is unspecified, month 1 if month is unspecified.
 */
function createDateFromEDTF(date: EDTFDate): Date {
  const year = typeof date.year === 'string'
    ? parseInt(date.year.replace(/[?~%X]/g, '0'), 10)
    : date.year;

  const month = typeof date.month === 'number'
    ? date.month
    : typeof date.month === 'string'
      ? parseInt(date.month.replace(/[?~%X]/g, '1'), 10)
      : 1;

  const day = typeof date.day === 'number'
    ? date.day
    : typeof date.day === 'string'
      ? parseInt(date.day.replace(/[?~%X]/g, '1'), 10)
      : 1;

  return createDate(year, month, day);
}

/**
 * Extract birthday certainty from an EDTF interval or date.
 * Returns which components (month, day) are known with certainty.
 * Uses the parsed qualification properties from @edtf-ts/core.
 */
function extractBirthdayCertainty(parsed: EDTFBase): { month: boolean; day: boolean } {
  if (isEDTFDate(parsed)) {
    const date = parsed as EDTFDate;

    // Check for unspecified year (XXXX) - month and day are certain if present
    if (typeof date.year === 'string' && date.year.includes('X')) {
      return {
        month: typeof date.month === 'number',
        day: typeof date.day === 'number',
      };
    }

    // Use parsed component qualifications directly
    return {
      month: typeof date.month === 'number' && !date.monthQualification?.uncertain,
      day: typeof date.day === 'number' && !date.dayQualification?.uncertain,
    };
  }

  if (isEDTFInterval(parsed)) {
    const interval = parsed as EDTFInterval;
    const startDate = interval.start && isEDTFDate(interval.start) ? interval.start as EDTFDate : null;
    const endDate = interval.end && isEDTFDate(interval.end) ? interval.end as EDTFDate : null;

    // For intervals, month is certain if both bounds have the same month value
    // and neither has monthQualification.uncertain set
    // e.g., ?2002-03-15/?2005-03-15 - month 03 is certain in both
    // e.g., 2005-03-?01/2005-03-?31 - month 03 is certain (no monthQualification)
    const startMonth = startDate?.month;
    const endMonth = endDate?.month;
    // No qualification means the component is certain (not uncertain)
    const startMonthUncertain = startDate ? (startDate.monthQualification?.uncertain ?? false) : true;
    const endMonthUncertain = endDate ? (endDate.monthQualification?.uncertain ?? false) : true;

    const monthCertain = typeof startMonth === 'number' &&
      typeof endMonth === 'number' &&
      startMonth === endMonth &&
      !startMonthUncertain &&
      !endMonthUncertain;

    // Same logic for day - day must match AND neither be uncertain
    const startDay = startDate?.day;
    const endDay = endDate?.day;
    const startDayUncertain = startDate ? (startDate.dayQualification?.uncertain ?? false) : true;
    const endDayUncertain = endDate ? (endDate.dayQualification?.uncertain ?? false) : true;

    const dayCertain = typeof startDay === 'number' &&
      typeof endDay === 'number' &&
      startDay === endDay &&
      !startDayUncertain &&
      !endDayUncertain;

    return { month: monthCertain, day: dayCertain };
  }

  return { month: false, day: false };
}

/**
 * Extract the birthday (month and day) from an EDTF expression.
 */
function extractBirthday(parsed: EDTFBase): { month: number | null; day: number | null } {
  if (isEDTFDate(parsed)) {
    const date = parsed as EDTFDate;
    return {
      month: typeof date.month === 'number' ? date.month : null,
      day: typeof date.day === 'number' ? date.day : null,
    };
  }

  if (isEDTFInterval(parsed)) {
    const interval = parsed as EDTFInterval;
    // Use the end date's month/day (or start if end is open)
    const refDate = interval.end || interval.start;
    if (refDate && isEDTFDate(refDate)) {
      const date = refDate as EDTFDate;
      return {
        month: typeof date.month === 'number' ? date.month : null,
        day: typeof date.day === 'number' ? date.day : null,
      };
    }
  }

  return { month: null, day: null };
}

/**
 * Match an age range to a life stage vocabulary term.
 */
function matchLifeStage(minAge: number, maxAge: number | null): string | null {
  // For exact decade matches (early/mid/late Xs)
  if (maxAge !== null && minAge >= 20) {
    const minDecade = Math.floor(minAge / 10) * 10;
    const maxDecade = Math.floor(maxAge / 10) * 10;

    if (minDecade === maxDecade) {
      const decadeStart = minDecade;
      const minInDecade = minAge - decadeStart;
      const maxInDecade = maxAge - decadeStart;

      // Early: 0-3, Mid: 4-6, Late: 7-9
      if (minInDecade === 0 && maxInDecade === 3) {
        return `early ${decadeStart}s`;
      }
      if (minInDecade === 4 && maxInDecade === 6) {
        return `mid ${decadeStart}s`;
      }
      if (minInDecade === 7 && maxInDecade === 9) {
        return `late ${decadeStart}s`;
      }
      // Full decade
      if (minInDecade === 0 && maxInDecade === 9) {
        return `${decadeStart}s`;
      }
    }
  }

  // Check for exact life stage matches
  for (const stage of LIFE_STAGES) {
    if (stage.maxYears === null) {
      // Open-ended stage (senior)
      if (maxAge === null && minAge === stage.minYears) {
        return stage.name;
      }
    } else if (minAge === stage.minYears && maxAge === stage.maxYears) {
      return stage.name;
    }
  }

  return null;
}

/**
 * Format an age range as a human-readable string.
 */
function formatAgeRange(
  minAge: number,
  maxAge: number | null,
  options: RenderAgeBirthdayOptions
): string {
  const { ageStyle = 'vocabulary', ageLength = 'long' } = options;

  // Try vocabulary match if enabled
  if (ageStyle === 'vocabulary') {
    const stage = matchLifeStage(minAge, maxAge);
    if (stage) return stage;
  }

  // Numeric formatting
  const suffix = ageLength === 'short' ? 'yo' :
    ageLength === 'medium' ? ' y/o' : ' years old';

  // Open-ended
  if (maxAge === null) {
    return `${minAge}+${ageLength === 'short' ? '' : ' years old'}`;
  }

  // Single age
  if (minAge === maxAge) {
    return `${minAge}${suffix}`;
  }

  // Range
  return `${minAge}–${maxAge}${suffix}`;
}

/**
 * Format a birthday as a human-readable string.
 */
function formatBirthday(
  month: number | null,
  day: number | null,
  certainty: { month: boolean; day: boolean },
  options: RenderAgeBirthdayOptions
): string | null {
  const { locale = 'en-US', month: monthFormat = 'long', day: dayFormat = 'numeric' } = options;

  if (!certainty.month || month === null) {
    return null;
  }

  // Format month name
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: monthFormat });
  const monthDate = new Date(2000, month - 1, 1);
  const monthName = monthFormatter.format(monthDate);

  if (!certainty.day || day === null) {
    return monthName;
  }

  // Format day - use ordinal for text month formats, slash separator for numeric
  const dayStr = dayFormat === '2-digit' ? String(day).padStart(2, '0') : String(day);
  const isNumericMonth = monthFormat === 'numeric' || monthFormat === '2-digit';

  if (isNumericMonth) {
    return `${monthName}/${dayStr}`;
  }

  const ordinal = getOrdinalSuffix(day);
  return `${monthName} ${dayStr}${ordinal}`;
}

/**
 * Get ordinal suffix for a number (st, nd, rd, th).
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0] || 'th';
}

/**
 * Detect qualifiers (approximate/uncertain) on an EDTF expression.
 * Only detects whole-expression qualifiers (Level 1), not component-level (Level 2).
 *
 * Component-level qualifiers like ?2004-?06-?02 are NOT considered whole-expression
 * uncertainty - they indicate which components are derived vs known.
 */
function detectQualifier(parsed: EDTFBase): 'approximate' | 'uncertain' | 'both' | undefined {
  // Check if the parsed object has a whole-expression qualification
  if (isEDTFDate(parsed)) {
    const date = parsed as EDTFDate;
    if (date.qualification) {
      if (date.qualification.uncertainApproximate) return 'both';
      if (date.qualification.uncertain && date.qualification.approximate) return 'both';
      if (date.qualification.uncertain) return 'uncertain';
      if (date.qualification.approximate) return 'approximate';
    }
    return undefined;
  }

  if (isEDTFInterval(parsed)) {
    const interval = parsed as EDTFInterval;
    if (interval.qualification) {
      if (interval.qualification.uncertainApproximate) return 'both';
      if (interval.qualification.uncertain && interval.qualification.approximate) return 'both';
      if (interval.qualification.uncertain) return 'uncertain';
      if (interval.qualification.approximate) return 'approximate';
    }
    return undefined;
  }

  // Fallback: check the EDTF string for trailing qualifiers only (not component-level)
  // Level 1 trailing qualifiers: 1984?, 1984~, 1984%
  // These appear at the end, not before components
  const edtf = parsed.edtf;

  // Only match trailing qualifiers, not component-level ones like ?2004 or 2004?-06
  if (edtf.match(/\d%$/)) return 'both';
  if (edtf.match(/\d\?$/) && !edtf.includes('/')) return 'uncertain';
  if (edtf.match(/\d~$/) && !edtf.includes('/')) return 'approximate';

  return undefined;
}

/**
 * Render an EDTF birthdate expression as human-readable age and birthday.
 *
 * @param edtf - EDTF string or parsed object
 * @param options - Rendering options
 * @returns Structured result with age, birthday, and formatted string
 *
 * @example
 * ```typescript
 * // Exact birthdate
 * renderAgeBirthday('2005-03-15', { currentDate: new Date('2025-06-01') });
 * // { age: '20 years old', birthday: 'March 15th', formatted: '20 years old, birthday March 15th' }
 *
 * // Age range with birthday
 * renderAgeBirthday('?2002-03-15/?2005-03-15', { currentDate: new Date('2025-06-01') });
 * // { age: 'early 20s', birthday: 'March 15th', formatted: 'early 20s, birthday March 15th' }
 *
 * // Age only (no birthday info)
 * renderAgeBirthday('?2004-?06-?02/?2005-?06-?01', { currentDate: new Date('2025-06-01') });
 * // { age: '20 years old', birthday: null, formatted: '20 years old' }
 * ```
 */
export function renderAgeBirthday(
  edtf: string | EDTFBase,
  options: RenderAgeBirthdayOptions = {}
): RenderAgeBirthdayResult {
  const { currentDate = new Date(), format = 'full' } = options;

  // Parse if string
  let parsed: EDTFBase;
  if (typeof edtf === 'string') {
    const result = parse(edtf);
    if (!result.success) {
      throw new Error(`Invalid EDTF string: ${edtf}`);
    }
    parsed = result.value;
  } else {
    parsed = edtf;
  }

  // Calculate age range
  const ageRange = calculateAgeRange(parsed, currentDate);
  const [minAge, maxAge] = ageRange;

  // Extract birthday info
  const birthdayKnown = extractBirthdayCertainty(parsed);
  const birthday = extractBirthday(parsed);

  // Detect qualifiers
  const qualifier = detectQualifier(parsed);

  // Format age
  let ageStr = formatAgeRange(minAge, maxAge, options);

  // Add qualifier prefix if present
  if (qualifier === 'both') {
    ageStr = `approximately/possibly ${ageStr}`;
  } else if (qualifier === 'uncertain') {
    ageStr = `possibly ${ageStr}`;
  } else if (qualifier === 'approximate') {
    ageStr = `approximately ${ageStr}`;
  }

  // Format birthday
  const birthdayStr = formatBirthday(birthday.month, birthday.day, birthdayKnown, options);

  // Combine based on format
  let formatted: string;
  switch (format) {
    case 'age-only':
      formatted = ageStr;
      break;
    case 'birthday-only':
      formatted = birthdayStr ? `${birthdayStr} birthday` : '';
      break;
    case 'full':
    default:
      if (birthdayStr && birthdayKnown.day) {
        formatted = `${ageStr}, birthday ${birthdayStr}`;
      } else if (birthdayStr) {
        formatted = `${ageStr}, ${birthdayStr} birthday`;
      } else {
        formatted = ageStr;
      }
      break;
  }

  return {
    age: ageStr,
    birthday: birthdayStr,
    formatted,
    ageRange,
    birthdayKnown,
    qualifier,
  };
}
