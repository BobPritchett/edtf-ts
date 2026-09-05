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
export function parse(input: string, level: EDTFLevel = 2): ParseResult {
  if (typeof input !== 'string' || !input.trim())
    return {
      success: false,
      errors: [{ code: 'INVALID_FORMAT', message: 'Expected a non-empty EDTF string' }],
    };
  const text = input.trim();
  if (/^\.\.[^/]/.test(text))
    return {
      success: false,
      errors: [
        {
          code: 'INVALID_FORMAT',
          message: 'Bare double-dot notation is not EDTF',
          suggestion: 'Use ../DATE for an interval or [..DATE] for a date choice',
        },
      ],
    };
  let last: ParseResult = { success: false, errors: [] };
  for (const parser of [parseLevel0, parseLevel1, parseLevel2]) {
    const result = parser(text);
    if (result.success) {
      if (result.level > level)
        return {
          success: false,
          errors: [
            { code: 'UNSUPPORTED_LEVEL', message: 'Input requires EDTF level ' + result.level },
          ],
        };
      return result;
    }
    if (result.errors[0]?.code !== 'NOT_LEVEL_2' && !last.errors?.[0]?.position) last = result;
  }
  return last;
}

/** Validate against the requested maximum conformance level. */
export function isValid(input: string, level?: EDTFLevel): boolean {
  return parse(input, level).success;
}
export { parseLevel0, parseLevel1, parseLevel2 };
