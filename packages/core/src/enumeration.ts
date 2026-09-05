import { formatCalendarDate, shiftCalendarDate, type CalendarDate } from './calendar.js';
import { getDaysInMonth } from './compare-utils/calendar.js';
import { canonicalize } from './canonical.js';
import { parse } from './parser.js';
import { readCollectionElements, type CollectionDate } from './parser/collection-elements.js';
import { EDTFOperationError, type EDTFInput } from './operations.js';
import { getYearRange } from './year-range.js';
import type { EDTFBase, EDTFDate, ParseOptions, ParseResult } from './types/index.js';

export type EnumerationErrorCode = 'INTERVAL' | 'UNBOUNDED_COLLECTION';
export class EnumerationError extends Error {
  constructor(public readonly code: EnumerationErrorCode) {
    super(
      code === 'INTERVAL'
        ? 'An interval denotes an extent; use interval.by(unit) to traverse it'
        : 'An unbounded collection has no finite enumeration'
    );
    this.name = 'EnumerationError';
  }
}

const matches = (pattern: number | string, n: number, width: number) =>
  typeof pattern === 'number'
    ? pattern === n
    : [...pattern.replace('-', '')].every(
        (c, i) => c === 'X' || c === String(Math.abs(n)).padStart(width, '0')[i]
      );

function parsed(text: string, options?: ParseOptions): EDTFBase {
  const result = parse(text, options);
  if (!result.success) throw new EDTFOperationError(result.errors);
  return result.value;
}

/** Replace date components only; qualifiers retain their original scope. */
function completion(date: EDTFDate, calendar: CalendarDate): EDTFBase {
  const match = date.edtf.match(
    /^([?~%]?)(-?[\dX]{4})([?~%]?)(?:-([?~%]?)([\dX]{2})([?~%]?))?(?:-([?~%]?)([\dX]{2})([?~%]?))?$/
  );
  if (!match || date.significantDigitsYear !== undefined)
    return parsed(formatCalendarDate(calendar));
  let text =
    match[1]! +
    String(calendar.year < 0 ? '-' : '') +
    String(Math.abs(calendar.year)).padStart(4, '0') +
    match[3]!;
  if (calendar.month !== undefined)
    text += '-' + match[4]! + String(calendar.month).padStart(2, '0') + match[6]!;
  if (calendar.day !== undefined)
    text += '-' + match[7]! + String(calendar.day).padStart(2, '0') + match[9]!;
  return parsed(canonicalize(text));
}

function* dateValues(value: EDTFBase): IterableIterator<EDTFBase> {
  if (value.type !== 'Date') {
    yield value;
    return;
  }
  const date = value as EDTFDate;
  if (!date.edtf.includes('X') && date.significantDigitsYear === undefined) {
    yield value;
    return;
  }
  const range = getYearRange(date);
  for (let year = range.min; ; year++) {
    if (date.significantDigitsYear !== undefined || matches(date.year, year, 4)) {
      if (date.month === undefined) yield completion(date, { year });
      else
        for (let month = 1; month <= 12; month++) {
          if (!matches(date.month, month, 2)) continue;
          if (date.day === undefined) yield completion(date, { year, month });
          else
            for (let day = 1; day <= getDaysInMonth(year, month); day++)
              if (matches(date.day, day, 2)) yield completion(date, { year, month, day });
        }
    }
    if (year === range.max) break;
  }
}

/**
 * Lazily enumerate possible values at their written precision, retaining qualifiers,
 * element order, and duplicates. Pass a string to avoid legacy eager collection parsing.
 * Input and finite-enumeration checks finish before this function returns an iterator.
 */
export function enumerateValues(
  input: EDTFInput,
  options?: ParseOptions
): IterableIterator<EDTFBase> {
  const text = (
    typeof input === 'string' ? input : 'inner' in input ? input.inner.edtf : input.edtf
  ).trim();
  if (
    (text.startsWith('[') && text.endsWith(']')) ||
    (text.startsWith('{') && text.endsWith('}'))
  ) {
    // Validate options and the collection's required level without expanding it.
    parsed('[0000]', options);
    const plan = readCollectionElements(text, (member): ParseResult<CollectionDate> => {
      const result = parse(member, options);
      if (!result.success) return result;
      return result.value.type === 'Date' || result.value.type === 'Season'
        ? { ...result, value: result.value as CollectionDate }
        : {
            success: false,
            errors: [
              { code: 'INVALID_SET', message: 'Collection elements must be dates or seasons' },
            ],
          };
    });
    if (!plan.success) throw new EDTFOperationError(plan.errors);
    if (
      options?.conformance === 'strict' &&
      plan.value.some((part) => part.first.type === 'Season')
    )
      throw new EDTFOperationError([
        {
          code: 'UNSUPPORTED_EXTENSION',
          message: 'Season collection members are excluded by the strict interoperability profile',
        },
      ]);
    if (plan.value.some((part) => part.earlier || part.later))
      throw new EnumerationError('UNBOUNDED_COLLECTION');
    return (function* () {
      for (const part of plan.value) {
        if (!part.last) yield* dateValues(part.first);
        else {
          const first = part.first as EDTFDate;
          let date = { year: first.year, month: first.month, day: first.day } as CalendarDate;
          while (true) {
            const value = parsed(formatCalendarDate(date));
            yield value;
            if (value.minMs >= part.last.minMs) break;
            date = shiftCalendarDate(date, 1);
          }
        }
      }
    })();
  }
  const value = parsed(text, options);
  if (value.type === 'Interval') throw new EnumerationError('INTERVAL');
  return dateValues(value);
}
