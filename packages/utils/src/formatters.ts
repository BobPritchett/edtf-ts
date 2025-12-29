/**
 * Formatting utilities for EDTF dates
 */

import type { EDTFBase, EDTFDate, EDTFDateTime, EDTFInterval, EDTFSeason, EDTFSet, EDTFList } from '@edtf-ts/core';

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
    includeQualifications,
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

  // For BC/BCE dates, convert from astronomical to historical year numbering
  const displayYear = typeof year === 'number' && isNegativeYear
    ? astronomicalToHistoricalYear(year)
    : year;

  // Handle unspecified digits in year (e.g., "18XX", "19XX")
  const yearStr = typeof displayYear === 'string'
    ? formatUnspecifiedYear(displayYear)
    : String(Math.abs(displayYear));

  // Check for unspecified components
  if (day === 'XX' && month === 'XX' && typeof year === 'number') {
    // Both month and day unspecified (e.g., "2020-XX-XX")
    result = `sometime in ${yearStr}`;
  } else if (day === 'XX' && month && typeof month === 'number' && typeof year === 'number') {
    // Unspecified day (e.g., "1872-01-XX")
    const monthNames = dateStyle === 'short'
      ? ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
      : dateStyle === 'medium'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    result = `some day in ${monthNames[month - 1]} ${yearStr}`;
  } else if (month === 'XX' && typeof year === 'number') {
    // Unspecified month (e.g., "1999-XX")
    result = `some month in ${yearStr}`;
  } else if (day && month && typeof day === 'number' && typeof month === 'number' && typeof year === 'number') {
    // Full date (only if year is numeric)
    // For BC dates, we can't use Intl.DateTimeFormat (doesn't support negative years)
    if (isNegativeYear) {
      const monthNames = dateStyle === 'short'
        ? ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
        : dateStyle === 'medium'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      result = `${monthNames[month - 1]} ${day}, ${yearStr}`;
    } else {
      const d = new Date(Date.UTC(year, month - 1, day));
      const formatter = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: dateStyle === 'short' ? 'numeric' : dateStyle === 'medium' ? 'short' : 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
      result = formatter.format(d);
    }
  } else if (month && typeof month === 'number' && typeof year === 'number') {
    // Year and month (only if year is numeric)
    const monthNames = dateStyle === 'short'
      ? ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
      : dateStyle === 'medium'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    result = `${monthNames[month - 1]} ${yearStr}`;
  } else {
    // Year only
    result = yearStr;
  }

  // Add era marker if needed
  if (shouldShowEra && typeof year === 'number') {
    const eraMarker = formatEra(year, { era, eraNotation });
    result = `${result} ${eraMarker}`;
  }

  // Add qualifications
  if (includeQualifications) {
    const quals: string[] = [];

    if (date.qualification?.uncertain) quals.push('uncertain');
    if (date.qualification?.approximate) quals.push('approximate');
    if (date.qualification?.uncertainApproximate) quals.push('uncertain/approximate');

    // Partial qualifications
    if (date.yearQualification || date.monthQualification || date.dayQualification) {
      const parts: string[] = [];
      if (date.yearQualification?.uncertain) parts.push('year uncertain');
      if (date.yearQualification?.approximate) parts.push('year approximate');
      if (date.monthQualification?.uncertain) parts.push('month uncertain');
      if (date.monthQualification?.approximate) parts.push('month approximate');
      if (date.dayQualification?.uncertain) parts.push('day uncertain');
      if (date.dayQualification?.approximate) parts.push('day approximate');
      quals.push(...parts);
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
    ? 'unknown start'
    : 'open start';

  const endStr = interval.end
    ? formatHuman(interval.end, options)
    : interval.openEnd
    ? 'unknown end'
    : 'open end';

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
    21: 'Spring',
    22: 'Summer',
    23: 'Autumn',
    24: 'Winter',
    25: 'Spring (Southern Hemisphere)',
    26: 'Summer (Southern Hemisphere)',
    27: 'Autumn (Southern Hemisphere)',
    28: 'Winter (Southern Hemisphere)',
    29: 'Quarter 1',
    30: 'Quarter 2',
    31: 'Quarter 3',
    32: 'Quarter 4',
    33: 'Quadrimester 1',
    34: 'Quadrimester 2',
    35: 'Quadrimester 3',
    36: 'Quadrimester 1',
    37: 'Semester 1',
    38: 'Semester 2',
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
