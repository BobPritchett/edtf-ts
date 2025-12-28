/**
 * @edtf-ts/core
 * Modern TypeScript implementation of Extended Date/Time Format
 */

export const VERSION = '0.1.0';

// Export types
export type {
  EDTFBase,
  EDTFDate,
  EDTFDateTime,
  EDTFInterval,
  EDTFSeason,
  EDTFLevel,
  EDTFType,
  Precision,
  ParseResult,
  ParseError,
  DateComponents,
  Qualification,
  UnspecifiedDigits
} from './types/index.js';

// Export parsers
export { parseLevel0 } from './parser/level0.js';
export { parseLevel1 } from './parser/level1.js';

// Import for internal use
import { parseLevel0 } from './parser/level0.js';
import { parseLevel1 } from './parser/level1.js';
import type { ParseResult, EDTFLevel, EDTFDate, EDTFDateTime, EDTFInterval, EDTFSeason } from './types/index.js';

/**
 * Main parse function - supports Level 0 and Level 1
 * Automatically detects the level based on input features
 * @param input - EDTF string to parse
 * @param level - Optional: force a specific EDTF level (0, 1, or auto-detect)
 * @returns ParseResult with either success and value, or errors
 */
export function parse(input: string, level?: EDTFLevel): ParseResult {
  // Auto-detect level if not specified
  if (level === undefined) {
    level = detectLevel(input);
  }

  // Try the specified level first
  if (level === 1) {
    // For Level 1, try parseLevel1 and only fall back to Level 0 for simple dates
    const result = parseLevel1(input);
    if (result.success) return result;

    // If it failed and has Level 1 features, return the Level 1 error
    // Don't fall back to Level 0 for things that look like Level 1 features
    if (detectLevel(input) === 1) {
      return result;
    }

    // Otherwise try Level 0
    return parseLevel0(input);
  }

  // Level 0
  return parseLevel0(input);
}

/**
 * Detect the EDTF conformance level of an input string
 * @param input - EDTF string
 * @returns Detected level (0 or 1)
 */
function detectLevel(input: string): EDTFLevel {
  // Level 1 indicators
  const level1Indicators = [
    /[?~%]/,           // Uncertainty/approximation qualifiers
    /X/,               // Unspecified digits
    /^\.\./,           // Open interval start
    /\/\.\.$/,         // Open interval end
    /^\/|\/$/,         // Unknown interval endpoint
    /Y-?\d{5,}/,       // Extended year (5+ digits)
    /-2\d(?:[?~%]|$)/  // Season (any -2X pattern, will be validated by parser)
  ];

  for (const indicator of level1Indicators) {
    if (indicator.test(input)) {
      return 1;
    }
  }

  return 0;
}

/**
 * Validate an EDTF string
 * @param input - EDTF string to validate
 * @param level - EDTF conformance level (0, 1, or auto-detect)
 * @returns true if valid, false otherwise
 */
export function isValid(input: string, level?: EDTFLevel): boolean {
  const result = parse(input, level);
  return result.success;
}

/**
 * Type guard for EDTFDate
 */
export function isEDTFDate(value: unknown): value is EDTFDate {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Date';
}

/**
 * Type guard for EDTFDateTime
 */
export function isEDTFDateTime(value: unknown): value is EDTFDateTime {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'DateTime';
}

/**
 * Type guard for EDTFInterval
 */
export function isEDTFInterval(value: unknown): value is EDTFInterval {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Interval';
}

/**
 * Type guard for EDTFSeason
 */
export function isEDTFSeason(value: unknown): value is EDTFSeason {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Season';
}
