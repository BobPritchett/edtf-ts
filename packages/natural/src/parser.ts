import nearley from 'nearley';
import { parse as parseEDTF, FuzzyDate } from '@edtf-ts/core';
import type { EDTFBase, IFuzzyDate } from '@edtf-ts/core';
import grammar from './grammar.js';

/**
 * Result from parsing natural language date input
 */
export interface ParseResult {
  /** The EDTF string representation */
  edtf: string;
  /** The type of date (date, interval, season, set, list) */
  type: 'date' | 'interval' | 'season' | 'set' | 'list';
  /** Confidence score (0-1) for this interpretation */
  confidence: number;
  /** Human-readable interpretation of the result */
  interpretation: string;
  /** Parsed EDTF object (if valid) */
  parsed?: EDTFBase;
  /** FuzzyDate wrapper (if valid) - provides method-based API */
  fuzzyDate?: IFuzzyDate;
  /** Whether this result is ambiguous */
  ambiguous?: boolean;
}

/**
 * Options for natural language parsing
 */
export interface ParseNaturalOptions {
  /** Locale for date interpretation (default: 'en-US') */
  locale?: string;
  /** Return all possible interpretations for ambiguous input (default: true) */
  returnAllResults?: boolean;
  /** Minimum confidence threshold (0-1, default: 0) */
  minConfidence?: number;
}

/**
 * Error thrown when parsing fails
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public input: string,
    public position?: number
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Parse natural language date input into EDTF format
 *
 * @param input - Natural language date string
 * @param options - Parsing options
 * @returns Array of possible interpretations, sorted by confidence (highest first)
 *
 * @example
 * ```typescript
 * // Unambiguous input
 * parseNatural('January 12, 1940');
 * // [{ edtf: '1940-01-12', type: 'date', confidence: 0.95, interpretation: '...' }]
 *
 * // Ambiguous input (returns multiple interpretations)
 * parseNatural('02/03/2020');
 * // [
 * //   { edtf: '2020-02-03', confidence: 0.6, interpretation: 'February 3, 2020 (US format)' },
 * //   { edtf: '2020-03-02', confidence: 0.4, interpretation: 'March 2, 2020 (EU format)' }
 * // ]
 *
 * // Intervals
 * parseNatural('from 1964 to 2008');
 * // [{ edtf: '1964/2008', type: 'interval', confidence: 0.95, ... }]
 *
 * // Uncertain/Approximate
 * parseNatural('circa 1950');
 * // [{ edtf: '1950~', type: 'date', confidence: 0.95, ... }]
 * ```
 *
 * ## Slash-Delimited Dates (MM/DD/YYYY vs DD/MM/YYYY)
 *
 * Slash-separated numeric dates like "01/12/1940" are ambiguous - they could be
 * interpreted as either MM/DD/YYYY (US format) or DD/MM/YYYY (EU format).
 *
 * ### Disambiguation Rules
 *
 * 1. **Unambiguous cases**: If either the first or second number is greater than 12,
 *    there's only one valid interpretation:
 *    - `13/01/2020` → January 13, 2020 (first number > 12, must be day)
 *    - `01/25/2020` → January 25, 2020 (second number > 12, must be day)
 *
 * 2. **Ambiguous cases**: When both numbers could be month or day (1-12), both
 *    interpretations are returned, ordered by the `locale` option:
 *    - US locales: MM/DD/YYYY interpretation listed first (confidence: 0.6)
 *    - Other locales: DD/MM/YYYY interpretation listed first (confidence: 0.6)
 *
 * ### Locale-Based Ordering
 *
 * The following country codes are treated as MM/DD/YYYY (US format) locales:
 *
 * | Code | Country/Territory |
 * |------|-------------------|
 * | US   | United States |
 * | PH   | Philippines |
 * | BZ   | Belize |
 * | FM   | Federated States of Micronesia |
 * | PW   | Palau |
 * | DO   | Dominican Republic |
 * | HN   | Honduras |
 * | NI   | Nicaragua |
 * | PA   | Panama |
 * | PR   | Puerto Rico |
 * | GU   | Guam |
 * | AS   | American Samoa |
 * | VI   | US Virgin Islands |
 *
 * All other locales default to DD/MM/YYYY (EU format) ordering, as this is used
 * by the vast majority of countries worldwide (~150-178 countries).
 *
 * @example
 * ```typescript
 * // US locale - MM/DD/YYYY preferred
 * parseNatural('01/12/1940', { locale: 'en-US' });
 * // [
 * //   { edtf: '1940-01-12', confidence: 0.6 },  // January 12 (US)
 * //   { edtf: '1940-12-01', confidence: 0.4 }   // December 1 (EU)
 * // ]
 *
 * // UK locale - DD/MM/YYYY preferred
 * parseNatural('01/12/1940', { locale: 'en-GB' });
 * // [
 * //   { edtf: '1940-12-01', confidence: 0.6 },  // December 1 (EU)
 * //   { edtf: '1940-01-12', confidence: 0.4 }   // January 12 (US)
 * // ]
 * ```
 *
 * ## Two-Digit Year Handling (Sliding Window)
 *
 * Two-digit years in slash-delimited dates (e.g., "01/12/40") are resolved using
 * the **Sliding Window** convention with a -80/+20 year rolling century window.
 *
 * This means the parser assumes two-digit years fall within a 100-year window:
 * - 80 years in the past
 * - 20 years in the future
 *
 * For example, if the current year is 2026, the window spans 1946-2046:
 * - `25` → 2025 (within +20 future window)
 * - `38` → 2038 (within +20 future window)
 * - `50` → 1950 (beyond +20, falls to previous century)
 * - `99` → 1999 (beyond +20, falls to previous century)
 *
 * This approach is preferred over fixed pivot years (like Excel's 2029 or SQL
 * Server's 2049) because it remains accurate as time progresses.
 *
 * @example
 * ```typescript
 * // Assuming current year is 2026
 * parseNatural('01/12/25');  // → 2025-01-12 (within +20 window)
 * parseNatural('01/12/40');  // → 2040-01-12 (within +20 window)
 * parseNatural('01/12/50');  // → 1950-01-12 (beyond +20, previous century)
 * parseNatural('01/12/99');  // → 1999-01-12 (beyond +20, previous century)
 * ```
 */
/**
 * Normalize input text for parsing
 * - Normalize various dash/hyphen characters to standard hyphen
 * - Normalize various apostrophe characters to standard apostrophe
 * - Normalize various space characters to standard space
 * - Remove common trailing words that don't affect date meaning
 */
function normalizeInput(input: string): string {
  return (
    input
      // Normalize dashes: en-dash (–), em-dash (—), non-breaking hyphen, minus sign to regular hyphen
      .replace(/[–—‐−]/g, '-')
      // Normalize apostrophes: Unicode apostrophe ('), right single quotation mark to ASCII apostrophe
      .replace(/[\u2019\u2018]/g, "'")
      // Normalize spaces: non-breaking space, thin space to regular space
      .replace(/[\u00A0\u2009]/g, ' ')
      // Normalize multiple spaces to single space
      .replace(/\s+/g, ' ')
      .trim()
      // Remove common trailing decorative words
      // Note: "era" is kept when part of "Common Era" or "Before Common Era" but stripped otherwise (e.g., "1980s era")
      .replace(/\s+(period|epoch|age)$/i, '')
      .replace(/(?<!common)\s+era$/i, '')
  );
}

export function parseNatural(input: string, options: ParseNaturalOptions = {}): ParseResult[] {
  const { locale = 'en-US', returnAllResults = true, minConfidence = 0 } = options;

  if (!input || typeof input !== 'string') {
    throw new ParseError('Input must be a non-empty string', input);
  }

  const normalized = normalizeInput(input);
  if (!normalized) {
    throw new ParseError('Input must not be empty', input);
  }

  // First, try to parse as EDTF directly (pass-through for valid EDTF)
  const edtfResult = parseEDTF(normalized);
  if (edtfResult.success) {
    // Valid EDTF string - return it as-is with high confidence
    return [
      {
        edtf: edtfResult.value.edtf,
        type: edtfResult.value.type.toLowerCase() as ParseResult['type'],
        confidence: 1.0,
        interpretation: `Valid EDTF: ${edtfResult.value.edtf}`,
        parsed: edtfResult.value,
        fuzzyDate: FuzzyDate.wrap(edtfResult.value),
        ambiguous: false,
      },
    ];
  }

  // Create parser with compiled grammar (imported at top of file)
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

  // Parse the input
  try {
    parser.feed(normalized);
  } catch (error: any) {
    throw new ParseError(`Failed to parse input: ${error.message}`, normalized, error.offset);
  }

  // Get all parse results
  const results = parser.results;

  if (!results || results.length === 0) {
    throw new ParseError('No valid parse found for input', normalized);
  }

  // Process results
  const processedResults: ParseResult[] = [];

  for (const result of results) {
    // Handle ambiguous numeric dates (MM/DD vs DD/MM)
    if (result.ambiguous && locale) {
      const interpretations = getNumericDateInterpretations(result, locale);
      processedResults.push(...interpretations);
    } else {
      processedResults.push(enrichResult(result));
    }
  }

  // Filter by minimum confidence
  const filtered = processedResults.filter((r) => r.confidence >= minConfidence);

  if (filtered.length === 0) {
    throw new ParseError(
      `No results met minimum confidence threshold of ${minConfidence}`,
      normalized
    );
  }

  // Sort by confidence (highest first)
  filtered.sort((a, b) => b.confidence - a.confidence);

  // Deduplicate results with the same EDTF string, keeping highest confidence
  const deduped = deduplicateResults(filtered);

  // Return all or just the best result
  return returnAllResults ? deduped : deduped.slice(0, 1);
}

/**
 * Deduplicate parse results by EDTF string, keeping the highest confidence version
 */
function deduplicateResults(results: ParseResult[]): ParseResult[] {
  const seen = new Map<string, ParseResult>();

  for (const result of results) {
    const key = result.edtf;
    const existing = seen.get(key);

    // Keep the result with higher confidence, or if same confidence, the first one
    if (!existing || result.confidence > existing.confidence) {
      seen.set(key, result);
    }
  }

  // Return in original order (sorted by confidence)
  return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Countries that primarily use MM/DD/YYYY format.
 * This is a short list - most of the world uses DD/MM/YYYY.
 */
const MDY_COUNTRY_CODES = new Set([
  'US', // United States
  'PH', // Philippines
  'BZ', // Belize
  'FM', // Federated States of Micronesia
  'PW', // Palau
  'DO', // Dominican Republic (mixed, but often MDY)
  'HN', // Honduras
  'NI', // Nicaragua
  'PA', // Panama
  'PR', // Puerto Rico (US territory)
  'GU', // Guam (US territory)
  'AS', // American Samoa (US territory)
  'VI', // US Virgin Islands
]);

/**
 * Check if a locale uses MM/DD/YYYY format based on country code.
 * Falls back to checking for common US-related locale patterns.
 */
function usesMDYFormat(locale: string): boolean {
  // Extract country code from locale (e.g., 'en-US' -> 'US', 'es-MX' -> 'MX')
  const parts = locale.split(/[-_]/);
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    if (lastPart && MDY_COUNTRY_CODES.has(lastPart.toUpperCase())) {
      return true;
    }
  }

  // Check for direct US patterns without country code separator
  if (locale.toUpperCase() === 'US' || locale.toLowerCase() === 'en-us') {
    return true;
  }

  // Default: assume DD/MM/YYYY (most of the world)
  return false;
}

/**
 * Handle ambiguous numeric dates (MM/DD vs DD/MM)
 */
function getNumericDateInterpretations(result: any, locale: string): ParseResult[] {
  const match = result.edtf.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return [enrichResult(result)];
  }

  const [, year, first, second] = match;
  const firstNum = parseInt(first, 10);
  const secondNum = parseInt(second, 10);

  const interpretations: ParseResult[] = [];

  // Check if both interpretations are valid
  const isFirstValidMonth = firstNum >= 1 && firstNum <= 12;
  const isSecondValidMonth = secondNum >= 1 && secondNum <= 12;
  const isFirstValidDay = firstNum >= 1 && firstNum <= 31;
  const isSecondValidDay = secondNum >= 1 && secondNum <= 31;

  const usesUSFormat = usesMDYFormat(locale);

  // US interpretation: MM/DD/YYYY (first=month, second=day)
  if (isFirstValidMonth && isSecondValidDay) {
    const usEdtf = `${year}-${first}-${second}`;
    const usParsed = tryParse(usEdtf);
    interpretations.push({
      edtf: usEdtf,
      type: 'date',
      confidence: usesUSFormat ? 0.6 : 0.4,
      interpretation: `${getMonthName(firstNum)} ${secondNum}, ${year} (US format: MM/DD/YYYY)`,
      parsed: usParsed,
      fuzzyDate: usParsed ? FuzzyDate.wrap(usParsed) : undefined,
      ambiguous: true,
    });
  }

  // EU interpretation: DD/MM/YYYY (first=day, second=month)
  if (isSecondValidMonth && isFirstValidDay) {
    const euEdtf = `${year}-${second}-${first}`;
    const euParsed = tryParse(euEdtf);
    interpretations.push({
      edtf: euEdtf,
      type: 'date',
      confidence: usesUSFormat ? 0.4 : 0.6,
      interpretation: `${firstNum} ${getMonthName(secondNum)} ${year} (EU format: DD/MM/YYYY)`,
      parsed: euParsed,
      fuzzyDate: euParsed ? FuzzyDate.wrap(euParsed) : undefined,
      ambiguous: true,
    });
  }

  // If only one interpretation is valid, increase its confidence
  if (interpretations.length === 1 && interpretations[0]) {
    interpretations[0].confidence = 0.9;
    interpretations[0].ambiguous = false;
  }

  return interpretations.length > 0 ? interpretations : [enrichResult(result)];
}

/**
 * Enrich a parse result with interpretation and parsed EDTF object
 */
function enrichResult(result: any): ParseResult {
  const parsed = tryParse(result.edtf);
  return {
    edtf: result.edtf,
    type: result.type,
    confidence: result.confidence,
    interpretation: generateInterpretation(result),
    parsed,
    fuzzyDate: parsed ? FuzzyDate.wrap(parsed) : undefined,
    ambiguous: result.ambiguous,
  };
}

/**
 * Generate human-readable interpretation
 */
function generateInterpretation(result: any): string {
  const { edtf, type } = result;

  // Try to parse the EDTF to get better interpretation
  const parsed = tryParse(edtf);
  if (!parsed) {
    return `EDTF: ${edtf}`;
  }

  let interpretation = '';

  switch (type) {
    case 'interval':
      interpretation = `Date range: ${edtf}`;
      break;
    case 'season':
      interpretation = `Seasonal date: ${edtf}`;
      break;
    case 'set':
      interpretation = `One of: ${edtf}`;
      break;
    case 'list':
      interpretation = `All of: ${edtf}`;
      break;
    default:
      interpretation = `Date: ${edtf}`;
  }

  // Add qualifications
  if (edtf.includes('?') && edtf.includes('~')) {
    interpretation += ' (uncertain and approximate)';
  } else if (edtf.includes('?')) {
    interpretation += ' (uncertain)';
  } else if (edtf.includes('~')) {
    interpretation += ' (approximate)';
  }

  return interpretation;
}

/**
 * Try to parse EDTF string, return undefined if invalid
 */
function tryParse(edtf: string): EDTFBase | undefined {
  const result = parseEDTF(edtf);
  return result.success ? result.value : undefined;
}

/**
 * Get month name from number
 */
function getMonthName(month: number): string {
  const names = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return names[month - 1] || 'Invalid';
}
