/**
 * Main EDTF parser
 */

import { parseLevel0 } from './parser/level0.js';
import { parseLevel1 } from './parser/level1.js';
import { parseLevel2 } from './parser/level2.js';
import type { ParseResult, EDTFLevel } from './types/index.js';

/**
 * Parse an EDTF (Extended Date/Time Format) string.
 *
 * Supports all three EDTF conformance levels:
 * - Level 0: ISO 8601 profile (dates, datetimes, intervals)
 * - Level 1: Uncertainty, approximation, unspecified digits, extended years, seasons
 * - Level 2: Sets, lists, exponential years, significant digits
 *
 * @param input - EDTF string to parse
 * @param level - Optional EDTF conformance level (0, 1, or 2). If omitted, auto-detects the level.
 * @returns ParseResult object with either `{ success: true, value, level }` or `{ success: false, errors }`
 */
export function parse(input: string, level?: EDTFLevel): ParseResult {
  // Auto-detect level if not specified
  if (level === undefined) {
    level = detectLevel(input);
  }

  // Try the specified level first
  if (level === 2) {
    const result = parseLevel2(input);
    if (result.success) return result;

    // Fall back to Level 1
    const result1 = parseLevel1(input);
    if (result1.success) return result1;

    // Fall back to Level 0
    return parseLevel0(input);
  }

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
 * @returns Detected level (0, 1, or 2)
 */
function detectLevel(input: string): EDTFLevel {
  // Level 2 indicators (check first)
  const level2Indicators = [
    /^\[.*\]$/,        // Set notation
    /^\{.*\}$/,        // List notation
    /E\d+/,            // Exponential year
    /S\d/,             // Significant digits
    /-[234]\d(?:[?~%]|$)/, // Extended seasons (25-41 range)
    /^[?~%]/,          // Individual qualification (qualifier at start)
    /-[?~%]\d{2}/,     // Individual qualification (qualifier before month or day, not at end)
    /\d{4}[?~%]-/,     // Group qualification (qualifier after year: 2004?-06)
    /\d{2}[?~%]-\d{2}/ // Group qualification (qualifier after month: 2004-06~-11)
  ];

  for (const indicator of level2Indicators) {
    if (indicator.test(input)) {
      return 2;
    }
  }

  // Level 2 unspecified digit patterns (partial unspecified - more complex than Level 1)
  // Level 2: partial unspecified within year (156X, 15XX, 1XXX) with month or day components
  // Level 2: partial unspecified month (1984-1X)
  // Level 2: mixed patterns (XXXX-12-XX where month is specific but year/day are not)
  if (/X/.test(input)) {
    // Check for Level 2 partial unspecified patterns
    const level2UnspecifiedPatterns = [
      /^\d{1,3}X+-\d{2}/,     // Partial year with month: 156X-12, 15XX-12, 1XXX-12
      /^X{4}-\d{2}-/,         // Fully unspecified year with specific month: XXXX-12-XX
      /^\d{4}-\dX/,           // Partial unspecified month: 1984-1X
      /^\d{1,3}X+-X{2}/,      // Partial year with unspecified month: 1XXX-XX
    ];

    for (const pattern of level2UnspecifiedPatterns) {
      if (pattern.test(input)) {
        return 2;
      }
    }

    // Check for intervals containing Level 2 unspecified patterns
    if (input.includes('/')) {
      const [start, end] = input.split('/');
      if (start && end) {
        for (const pattern of level2UnspecifiedPatterns) {
          if (pattern.test(start) || pattern.test(end)) {
            return 2;
          }
        }
        // Also check for XX day in intervals: 2004-06-XX
        if (/\d{4}-\d{2}-XX/.test(start) || /\d{4}-\d{2}-XX/.test(end)) {
          return 2;
        }
      }
    }
  }

  // Level 1 indicators
  const level1Indicators = [
    /[?~%]/,           // Uncertainty/approximation qualifiers
    /X/,               // Unspecified digits (Level 1: XXXX, XXXX-XX, XXXX-XX-XX)
    /^\.\./,           // Open interval start
    /\/\.\.$/,         // Open interval end
    /^\/|\/$/,         // Unknown interval endpoint
    /Y-?\d{5,}/,       // Extended year (5+ digits)
    /-2[1-4](?:[?~%]|$)/,  // Level 1 seasons (21-24)
    /^-\d+$/           // Negative year (years before year 0000)
  ];

  for (const indicator of level1Indicators) {
    if (indicator.test(input)) {
      return 1;
    }
  }

  return 0;
}

/**
 * Validate an EDTF string.
 *
 * @param input - EDTF string to validate
 * @param level - Optional EDTF conformance level (0, 1, or 2). If omitted, auto-detects the level.
 * @returns `true` if the input is a valid EDTF string, `false` otherwise
 */
export function isValid(input: string, level?: EDTFLevel): boolean {
  const result = parse(input, level);
  return result.success;
}

// Re-export individual level parsers
export { parseLevel0 } from './parser/level0.js';
export { parseLevel1 } from './parser/level1.js';
export { parseLevel2 } from './parser/level2.js';
