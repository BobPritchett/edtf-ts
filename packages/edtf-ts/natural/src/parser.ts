import nearley from 'nearley';
import { parse as parseEDTF } from '@edtf-ts';
import type { EDTFBase } from '@edtf-ts';
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
 */
/**
 * Normalize input text for parsing
 * - Normalize various dash/hyphen characters to standard hyphen
 * - Normalize various apostrophe characters to standard apostrophe
 * - Normalize various space characters to standard space
 * - Remove common trailing words that don't affect date meaning
 */
function normalizeInput(input: string): string {
  return input
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
    .replace(/\s+(era|period|epoch|age)$/i, '');
}

export function parseNatural(
  input: string,
  options: ParseNaturalOptions = {}
): ParseResult[] {
  const {
    locale = 'en-US',
    returnAllResults = true,
    minConfidence = 0,
  } = options;

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
    return [{
      edtf: edtfResult.value.edtf,
      type: edtfResult.value.type.toLowerCase() as ParseResult['type'],
      confidence: 1.0,
      interpretation: `Valid EDTF: ${edtfResult.value.edtf}`,
      parsed: edtfResult.value,
      ambiguous: false,
    }];
  }

  // Create parser with compiled grammar (imported at top of file)
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

  // Parse the input
  try {
    parser.feed(normalized);
  } catch (error: any) {
    throw new ParseError(
      `Failed to parse input: ${error.message}`,
      normalized,
      error.offset
    );
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
 * Handle ambiguous numeric dates (MM/DD vs DD/MM)
 */
function getNumericDateInterpretations(
  result: any,
  locale: string
): ParseResult[] {
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

  const usesUSFormat = locale === 'en-US' || locale.startsWith('en-US');

  // US interpretation: MM/DD/YYYY
  if (isFirstValidMonth && isSecondValidDay) {
    const usEdtf = `${year}-${first}-${second}`;
    interpretations.push({
      edtf: usEdtf,
      type: 'date',
      confidence: usesUSFormat ? 0.6 : 0.4,
      interpretation: `${getMonthName(firstNum)} ${secondNum}, ${year} (US format: MM/DD/YYYY)`,
      parsed: tryParse(usEdtf),
      ambiguous: true,
    });
  }

  // EU interpretation: DD/MM/YYYY
  if (isSecondValidMonth && isFirstValidDay) {
    const euEdtf = `${year}-${second}-${first}`;
    interpretations.push({
      edtf: euEdtf,
      type: 'date',
      confidence: usesUSFormat ? 0.4 : 0.6,
      interpretation: `${firstNum} ${getMonthName(secondNum)} ${year} (EU format: DD/MM/YYYY)`,
      parsed: tryParse(euEdtf),
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
  return {
    edtf: result.edtf,
    type: result.type,
    confidence: result.confidence,
    interpretation: generateInterpretation(result),
    parsed: tryParse(result.edtf),
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
