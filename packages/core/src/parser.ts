/**
 * Main EDTF parser
 */

import { parseLevel0 } from './parser/level0.js';
import { parseLevel1 } from './parser/level1.js';
import { parseLevel2 } from './parser/level2.js';
import type {
  ParseResult,
  EDTFLevel,
  ParseOptions,
  EDTFBase,
  EDTFInterval,
  EDTFSet,
  EDTFList,
  EDTFSeason,
  EDTFDateTime,
  ParseError,
} from './types/index.js';

/** Conservative profile restrictions, separate from the maximum EDTF feature level. */
function strictErrors(value: EDTFBase, path = '$'): ParseError[] {
  const unsupported = (feature: string): ParseError[] => [
    {
      code: 'UNSUPPORTED_EXTENSION',
      path,
      message: `${feature} at ${path} is excluded by the strict interoperability profile`,
      suggestion: 'Use conformance: "extended" to retain this representation',
    },
  ];
  if (value.type === 'DateTime') {
    if ((value as EDTFDateTime).fractionalSecond !== undefined)
      return unsupported('Fractional seconds');
    if (/^[+-]\d{6}-/.test(value.edtf)) return unsupported('Expanded ISO datetime year');
  }
  if (value.type === 'Season') {
    if (path !== '$') return unsupported('Season endpoint or collection member');
    if ((value as EDTFSeason).qualification) return unsupported('Qualified season');
  }
  if (value.type === 'Interval') {
    const interval = value as EDTFInterval;
    return ['start', 'end'].flatMap((key) => {
      const endpoint = interval[key as 'start' | 'end'];
      return endpoint ? strictErrors(endpoint, `${path}.${key}`) : [];
    });
  }
  if (value.type === 'Set' || value.type === 'List')
    return (value as EDTFSet | EDTFList).values.flatMap((member, i) =>
      strictErrors(member, `${path}.values[${i}]`)
    );
  return [];
}

/**
 * Parse an EDTF (Extended Date/Time Format) string.
 *
 * Supports all three EDTF conformance levels:
 * - Level 0: ISO 8601 profile (dates, datetimes, intervals)
 * - Level 1: Uncertainty, approximation, unspecified digits, extended years, seasons
 * - Level 2: Sets, lists, exponential years, significant digits
 *
 * @param input - EDTF string to parse
 * @param levelOrOptions - Maximum feature level, or level and strict/extended options.
 * @returns ParseResult object with either `{ success: true, value, level }` or `{ success: false, errors }`
 */
export function parse(input: string, levelOrOptions: EDTFLevel | ParseOptions = 2): ParseResult {
  if (levelOrOptions === null || !['number', 'object'].includes(typeof levelOrOptions))
    return {
      success: false,
      errors: [{ code: 'INVALID_OPTIONS', message: 'Expected a level or parsing options' }],
    };
  const options = typeof levelOrOptions === 'number' ? { level: levelOrOptions } : levelOrOptions;
  const level = options.level ?? 2;
  if (
    ![0, 1, 2].includes(level) ||
    !['strict', 'extended'].includes(options.conformance ?? 'extended')
  )
    return {
      success: false,
      errors: [{ code: 'INVALID_OPTIONS', message: 'Invalid parsing level or conformance mode' }],
    };
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
      const errors = options.conformance === 'strict' ? strictErrors(result.value) : [];
      return errors.length ? { success: false, errors } : result;
    }
    if (result.errors[0]?.code !== 'NOT_LEVEL_2' && !last.errors?.[0]?.position) last = result;
  }
  return last;
}

/** Validate against the requested maximum conformance level. */
export function isValid(input: string, levelOrOptions?: EDTFLevel | ParseOptions): boolean {
  return parse(input, levelOrOptions).success;
}
export { parseLevel0, parseLevel1, parseLevel2 };
