/**
 * Formatting utilities for EDTF dates
 */

import type { EDTFBase, EDTFDate, EDTFDateTime, EDTFInterval, EDTFSeason, EDTFSet, EDTFList } from './types/index.js';

/**
 * Options for formatting EDTF dates as human-readable strings.
 */
export interface FormatOptions {
  /** Whether to include uncertainty/approximation indicators (default: true) */
  includeQualifications?: boolean;
  /** Whether to show unspecified digits as 'X' or replace with ranges (default: false) */
  showUnspecified?: boolean;
  /** Date format style (default: 'full') */
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  /** Locale for month/day names (default: 'en-US') */
  locale?: string;
  /**
   * Length/display style of the era marker (default: 'short')
   * - 'long': "Before Christ", "Anno Domini"
   * - 'short': "BC", "AD"
   * - 'narrow': "B", "A"
   */
  era?: 'long' | 'short' | 'narrow';
  /**
   * When to display the era marker (default: 'auto')
   * - 'auto': Show only for BC/BCE dates (negative years)
   * - 'always': Show for all dates
   * - 'never': Never show era markers
   */
  eraDisplay?: 'auto' | 'always' | 'never';
  /**
   * Era notation style (default: 'bc-ad')
   * - 'bc-ad': Use "BC"/"AD" notation
   * - 'bce-ce': Use "BCE"/"CE" notation
   */
  eraNotation?: 'bc-ad' | 'bce-ce';
}

/**
 * Format an EDTF date as a human-readable string.
 *
 * @param value - The EDTF value to format
 * @param options - Formatting options
 * @returns A human-readable string representation
 *
 * @example
 * ```typescript
 * const date = parse('1985-04-12');
 * if (date.success) {
 *   formatHuman(date.value); // "April 12, 1985"
 * }
 *
 * const uncertain = parse('1984?');
 * if (uncertain.success) {
 *   formatHuman(uncertain.value); // "1984 (uncertain)"
 * }
 * ```
 */
export function formatHuman(value: EDTFBase, options: FormatOptions = {}): string {
  switch (value.type) {
    case 'Date':
      return formatDateHuman(value as EDTFDate, options);
    case 'DateTime':
      return formatDateTimeHuman(value as EDTFDateTime, options);
    case 'Interval':
      return formatIntervalHuman(value as EDTFInterval, options);
    case 'Season':
      return formatSeasonHuman(value as EDTFSeason, options);
    case 'Set':
      return formatSetHuman(value as EDTFSet, options);
    case 'List':
      return formatListHuman(value as EDTFList, options);
    default:
      return value.edtf;
  }
}

/**
 * Format a year with unspecified digits (e.g., "18XX" -> "1800s")
 */
function formatUnspecifiedYear(year: string): string {
  // Match patterns like 18XX, 19XX, 1XXX, etc.
  if (year.endsWith('XX')) {
    const prefix = year.slice(0, -2);
    return `${prefix}00s`;
  } else if (year.endsWith('X')) {
    const prefix = year.slice(0, -1);
    return `${prefix}0s`;
  }
  return year;
}

/**
 * Format a large number with appropriate scale suffix
 * e.g., 170000000 -> "170 million", 1500000000 -> "1.5 billion"
 */
function formatLargeNumber(num: number): string {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1_000_000_000_000) {
    const val = absNum / 1_000_000_000_000;
    return `${sign}${val % 1 === 0 ? val : val.toFixed(1)} trillion`;
  } else if (absNum >= 1_000_000_000) {
    const val = absNum / 1_000_000_000;
    return `${sign}${val % 1 === 0 ? val : val.toFixed(1)} billion`;
  } else if (absNum >= 1_000_000) {
    const val = absNum / 1_000_000;
    return `${sign}${val % 1 === 0 ? val : val.toFixed(1)} million`;
  } else if (absNum >= 10_000) {
    // For numbers like 170,000 - use comma formatting
    return `${sign}${absNum.toLocaleString('en-US')}`;
  }
  return `${sign}${absNum}`;
}

/**
 * Format significant digits description
 * e.g., sigDigits=2 for year 1950 means "19th-20th century" (first 2 digits are significant)
 */
function formatSignificantDigits(year: number, sigDigits: number): string {
  const absYear = Math.abs(year);
  const yearStr = String(absYear);
  const totalDigits = yearStr.length;

  if (sigDigits >= totalDigits) {
    // All digits are significant, no special handling needed
    return '';
  }

  // The significant portion
  const sigPart = yearStr.slice(0, sigDigits);
  const insignificantCount = totalDigits - sigDigits;

  // Describe the precision level
  if (insignificantCount === 1) {
    return `(decade precision: ${sigPart}0s)`;
  } else if (insignificantCount === 2) {
    return `(century precision: ${sigPart}00s)`;
  } else if (insignificantCount === 3) {
    return `(millennium precision)`;
  } else {
    return `(${sigDigits} significant digits)`;
  }
}

/**
 * Cache for month names by locale and style
 * Key format: "locale|style" (e.g., "en-US|short", "fr-FR|long")
 * Value: Array of 12 month names (index 0 = January)
 */
const monthNameCache = new Map<string, string[]>();

/**
 * Get a localized month name using Intl.DateTimeFormat with caching
 */
function getMonthName(
  month: number,
  locale: string | undefined,
  style: 'numeric' | 'short' | 'long'
): string {
  if (style === 'numeric') {
    return String(month).padStart(2, '0');
  }

  const cacheKey = `${locale || 'default'}|${style}`;

  // Check cache first
  let monthNames = monthNameCache.get(cacheKey);

  if (!monthNames) {
    // Generate all 12 month names for this locale+style combination
    monthNames = [];
    const formatter = new Intl.DateTimeFormat(locale, {
      month: style,
      timeZone: 'UTC',
    });

    for (let m = 1; m <= 12; m++) {
      const date = new Date(Date.UTC(2000, m - 1, 1));
      monthNames.push(formatter.format(date));
    }

    monthNameCache.set(cacheKey, monthNames);
  }

  return monthNames[month - 1]!;
}

/**
 * Format an era marker based on options
 */
function formatEra(
  year: number,
  options: { era?: 'long' | 'short' | 'narrow'; eraNotation?: 'bc-ad' | 'bce-ce' }
): string {
  const { era = 'short', eraNotation = 'bc-ad' } = options;
  const isBC = year < 0;

  if (era === 'long') {
    if (isBC) {
      return eraNotation === 'bc-ad' ? 'Before Christ' : 'Before Common Era';
    } else {
      return eraNotation === 'bc-ad' ? 'Anno Domini' : 'Common Era';
    }
  } else if (era === 'narrow') {
    if (isBC) {
      return 'B';
    } else {
      return 'A';
    }
  } else {
    // 'short' (default)
    if (isBC) {
      return eraNotation === 'bc-ad' ? 'BC' : 'BCE';
    } else {
      return eraNotation === 'bc-ad' ? 'AD' : 'CE';
    }
  }
}

/**
 * Convert astronomical year numbering to historical year numbering
 * Astronomical: 0 = 1 BC, -1 = 2 BC, -43 = 44 BC
 * Historical: No year 0, 1 BC follows 1 AD
 */
function astronomicalToHistoricalYear(year: number): number {
  if (year < 0) {
    return Math.abs(year) + 1;
  }
  return year;
}

function formatDateHuman(date: EDTFDate, options: FormatOptions): string {
  const {
    includeQualifications = true,
    dateStyle,
    locale,
    era = 'short',
    eraDisplay = 'auto',
    eraNotation = 'bc-ad'
  } = options;

  let result = '';
  const year = date.year;
  const month = date.month;
  const day = date.day;

  // Determine if we should show the era marker
  const isNegativeYear = typeof year === 'number' && year < 0;
  const shouldShowEra = eraDisplay === 'always' || (eraDisplay === 'auto' && isNegativeYear);

  // Check for extended year features (exponential, significant digits)
  const hasExponential = date.exponential !== undefined;
  const hasSigDigits = date.significantDigitsYear !== undefined || date.significantDigits !== undefined;
  const isExtendedYear = typeof year === 'number' && (Math.abs(year) > 9999 || hasExponential);

  // For BC/BCE dates, convert from astronomical to historical year numbering
  const displayYear = typeof year === 'number' && isNegativeYear
    ? astronomicalToHistoricalYear(year)
    : year;

  // Handle unspecified digits in year (e.g., "18XX", "19XX")
  let yearStr: string;
  if (typeof displayYear === 'string') {
    yearStr = formatUnspecifiedYear(displayYear);
  } else if (isExtendedYear) {
    // Format large/extended years with readable notation
    yearStr = formatLargeNumber(displayYear as number);
  } else {
    yearStr = String(Math.abs(displayYear as number));
  }

  // Add significant digits annotation if present
  const sigDigits = date.significantDigitsYear ?? date.significantDigits;
  let sigDigitsSuffix = '';
  if (hasSigDigits && typeof year === 'number' && sigDigits !== undefined) {
    sigDigitsSuffix = ' ' + formatSignificantDigits(year, sigDigits);
  }

  // Check for unspecified components
  if (day === 'XX' && month === 'XX' && typeof year === 'number') {
    // Both month and day unspecified (e.g., "2020-XX-XX")
    result = `sometime in ${yearStr}`;
  } else if (day === 'XX' && month && typeof month === 'number' && typeof year === 'number') {
    // Unspecified day (e.g., "1872-01-XX")
    const monthStyle = dateStyle === 'short' ? 'numeric' : dateStyle === 'medium' ? 'short' : 'long';
    const monthStr = getMonthName(month, locale, monthStyle);
    result = `some day in ${monthStr} ${yearStr}`;
  } else if (month === 'XX' && typeof year === 'number') {
    // Unspecified month (e.g., "1999-XX")
    result = `some month in ${yearStr}`;
  } else if (day && month && typeof day === 'number' && typeof month === 'number' && typeof year === 'string') {
    // Unspecified year with specific month/day (e.g., "156X-12-25")
    const monthStyle = dateStyle === 'short' ? 'numeric' : dateStyle === 'medium' ? 'short' : 'long';
    const monthStr = getMonthName(month, locale, monthStyle);
    result = `${monthStr} ${day} in the ${yearStr}`;
  } else if (day && month && typeof day === 'number' && typeof month === 'number' && typeof year === 'number') {
    // Full date (only if year is numeric)
    // For BC dates, we can't use Intl.DateTimeFormat (doesn't support negative years)
    if (isNegativeYear) {
      const monthStyle = dateStyle === 'short' ? 'numeric' : dateStyle === 'medium' ? 'short' : 'long';
      const monthStr = getMonthName(month, locale, monthStyle);
      result = `${monthStr} ${day}, ${yearStr}`;
    } else {
      const d = new Date(Date.UTC(year, month - 1, day));
      const formatter = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: dateStyle === 'short' ? '2-digit' : dateStyle === 'medium' ? 'short' : 'long',
        day: dateStyle === 'short' ? '2-digit' : 'numeric',
        timeZone: 'UTC',
      });
      result = formatter.format(d);
    }
  } else if (month && typeof month === 'number' && typeof year === 'number') {
    // Year and month (only if year is numeric)
    const monthStyle = dateStyle === 'short' ? 'numeric' : dateStyle === 'medium' ? 'short' : 'long';
    const monthStr = getMonthName(month, locale, monthStyle);
    result = `${monthStr} ${yearStr}`;
  } else {
    // Year only
    result = yearStr;
  }

  // Add era marker if needed
  if (shouldShowEra && typeof year === 'number') {
    const eraMarker = formatEra(year, { era, eraNotation });
    result = `${result} ${eraMarker}`;
  }

  // Add significant digits suffix if present
  if (sigDigitsSuffix) {
    result = `${result}${sigDigitsSuffix}`;
  }

  // Add qualifications
  if (includeQualifications) {
    const quals: string[] = [];

    if (date.qualification?.uncertain) quals.push('uncertain');
    if (date.qualification?.approximate) quals.push('approximate');
    if (date.qualification?.uncertainApproximate) quals.push('uncertain/approximate');

    // Check if all individual qualifications are the same (Level 1 style trailing qualification)
    const hasIndividualQuals = date.yearQualification || date.monthQualification || date.dayQualification;
    if (hasIndividualQuals && !date.qualification) {
      const allSame =
        JSON.stringify(date.yearQualification) === JSON.stringify(date.monthQualification) &&
        JSON.stringify(date.monthQualification) === JSON.stringify(date.dayQualification);

      if (allSame && date.yearQualification) {
        // All components have the same qualification - show it as a whole-date qualification
        if (date.yearQualification.uncertain) quals.push('uncertain');
        if (date.yearQualification.approximate) quals.push('approximate');
        if (date.yearQualification.uncertainApproximate) quals.push('uncertain/approximate');
      } else {
        // Partial qualifications (Level 2 style)
        const parts: string[] = [];
        if (date.yearQualification?.uncertain) parts.push('year uncertain');
        if (date.yearQualification?.approximate) parts.push('year approximate');
        if (date.yearQualification?.uncertainApproximate) parts.push('year uncertain/approximate');
        if (date.monthQualification?.uncertain) parts.push('month uncertain');
        if (date.monthQualification?.approximate) parts.push('month approximate');
        if (date.monthQualification?.uncertainApproximate) parts.push('month uncertain/approximate');
        if (date.dayQualification?.uncertain) parts.push('day uncertain');
        if (date.dayQualification?.approximate) parts.push('day approximate');
        if (date.dayQualification?.uncertainApproximate) parts.push('day uncertain/approximate');
        quals.push(...parts);
      }
    }

    if (quals.length > 0) {
      result += ` (${quals.join(', ')})`;
    }
  }

  return result;
}

function formatDateTimeHuman(datetime: EDTFDateTime, options: FormatOptions): string {
  const { dateStyle, locale } = options;

  const d = new Date(Date.UTC(
    datetime.year,
    datetime.month - 1,
    datetime.day,
    datetime.hour,
    datetime.minute,
    datetime.second
  ));

  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: dateStyle === 'short' ? 'numeric' : dateStyle === 'medium' ? 'short' : 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  });

  let result = formatter.format(d);

  if (datetime.timezone && datetime.timezone !== 'Z') {
    result += ` ${datetime.timezone}`;
  }

  return result;
}

function formatIntervalHuman(interval: EDTFInterval, options: FormatOptions): string {
  const startStr = interval.start
    ? formatHuman(interval.start, options)
    : interval.openStart
    ? 'open start'
    : 'unknown';

  const endStr = interval.end
    ? formatHuman(interval.end, options)
    : interval.openEnd
    ? 'open end'
    : 'unknown';

  let result = `${startStr} to ${endStr}`;

  if (options.includeQualifications && interval.qualification) {
    const quals: string[] = [];
    if (interval.qualification.uncertain) quals.push('uncertain');
    if (interval.qualification.approximate) quals.push('approximate');
    if (quals.length > 0) {
      result += ` (${quals.join(', ')})`;
    }
  }

  return result;
}

function formatSeasonHuman(season: EDTFSeason, options: FormatOptions): string {
  const seasonNames: Record<number, string> = {
    // Seasons (independent of location) - Level 1
    21: 'Spring',
    22: 'Summer',
    23: 'Autumn',
    24: 'Winter',
    // Northern Hemisphere seasons - Level 2
    25: 'Spring (Northern Hemisphere)',
    26: 'Summer (Northern Hemisphere)',
    27: 'Autumn (Northern Hemisphere)',
    28: 'Winter (Northern Hemisphere)',
    // Southern Hemisphere seasons - Level 2
    29: 'Spring (Southern Hemisphere)',
    30: 'Summer (Southern Hemisphere)',
    31: 'Autumn (Southern Hemisphere)',
    32: 'Winter (Southern Hemisphere)',
    // Quarters - Level 2
    33: 'Quarter 1',
    34: 'Quarter 2',
    35: 'Quarter 3',
    36: 'Quarter 4',
    // Quadrimesters - Level 2
    37: 'Quadrimester 1',
    38: 'Quadrimester 2',
    39: 'Quadrimester 3',
    // Semestrals - Level 2
    40: 'Semestral 1',
    41: 'Semestral 2',
  };

  let result = `${seasonNames[season.season] || `Season ${season.season}`} ${season.year}`;

  if (options.includeQualifications && season.qualification) {
    const quals: string[] = [];
    if (season.qualification.uncertain) quals.push('uncertain');
    if (season.qualification.approximate) quals.push('approximate');
    if (quals.length > 0) {
      result += ` (${quals.join(', ')})`;
    }
  }

  return result;
}

function formatSetHuman(set: EDTFSet, options: FormatOptions): string {
  const values = set.values.map(v => formatHuman(v, options));

  let result = 'One of: ';
  if (set.earlier) result = 'Earlier or one of: ';

  result += values.join(', ');

  if (set.later) result += ', or later';

  return result;
}

function formatListHuman(list: EDTFList, options: FormatOptions): string {
  const values = list.values.map(v => formatHuman(v, options));

  let result = 'All of: ';
  if (list.earlier) result = 'Earlier and all of: ';

  result += values.join(', ');

  if (list.later) result += ', and later';

  return result;
}

/**
 * Format an EDTF date as an ISO 8601 string (when possible).
 * Falls back to EDTF string for dates that can't be represented in ISO 8601.
 *
 * @param value - The EDTF value to format
 * @returns An ISO 8601 string or EDTF string
 *
 * @example
 * ```typescript
 * const date = parse('1985-04-12');
 * if (date.success) {
 *   formatISO(date.value); // "1985-04-12"
 * }
 *
 * const uncertain = parse('1984?');
 * if (uncertain.success) {
 *   formatISO(uncertain.value); // "1984?" (can't be represented in ISO 8601)
 * }
 * ```
 */
export function formatISO(value: EDTFBase): string {
  // Only Level 0 dates and datetimes can be represented as pure ISO 8601
  if (value.level === 0 && (value.type === 'Date' || value.type === 'DateTime')) {
    const date = value as EDTFDate | EDTFDateTime;

    if (value.type === 'Date' && typeof date.year === 'number') {
      const year = String(date.year).padStart(4, '0');

      if (date.month && typeof date.month === 'number') {
        const month = String(date.month).padStart(2, '0');

        if (date.day && typeof date.day === 'number') {
          const day = String(date.day).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }

        return `${year}-${month}`;
      }

      return year;
    }

    if (value.type === 'DateTime') {
      const dt = value as EDTFDateTime;
      const year = String(dt.year).padStart(4, '0');
      const month = String(dt.month).padStart(2, '0');
      const day = String(dt.day).padStart(2, '0');
      const hour = String(dt.hour).padStart(2, '0');
      const minute = String(dt.minute).padStart(2, '0');
      const second = String(dt.second).padStart(2, '0');
      const tz = dt.timezone || 'Z';

      return `${year}-${month}-${day}T${hour}:${minute}:${second}${tz}`;
    }
  }

  // Fall back to EDTF string for everything else
  return value.edtf;
}

/**
 * Format a date range (min/max) as a human-readable string.
 *
 * @param value - The EDTF value with min/max dates
 * @param options - Formatting options
 * @returns A human-readable range string
 *
 * @example
 * ```typescript
 * const date = parse('1985-04');
 * if (date.success) {
 *   formatRange(date.value); // "April 1, 1985 to April 30, 1985"
 * }
 * ```
 */
export function formatRange(value: EDTFBase, options: FormatOptions = {}): string {
  const { dateStyle = 'full', locale = 'en-US' } = options;

  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: dateStyle === 'short' ? 'numeric' : dateStyle === 'medium' ? 'short' : 'long',
    day: 'numeric',
  });

  const minStr = formatter.format(value.min);
  const maxStr = formatter.format(value.max);

  if (minStr === maxStr) {
    return minStr;
  }

  return `${minStr} to ${maxStr}`;
}
