import { parse, formatCalendarDate, shiftCalendarDate, type CalendarDate } from '@edtf-ts/core';
import type { ParseNote } from './diagnostics.js';

export interface ResolutionContext {
  referenceYear: number;
  dateOrder: 'MDY' | 'DMY' | 'YMD';
  crossYear: 'end' | 'start';
  numericAmbiguity?: boolean;
  crossYearAmbiguity?: boolean;
  weekdayMismatch?: 'reject' | 'warn';
  warnings?: ParseWarning[];
  notes?: ParseNote[];
  boundaryMode?: 'exclusive-choice' | 'open-interval';
}
export interface ParseWarning {
  code: 'WEEKDAY_MISMATCH';
  message: string;
  date: string;
  writtenWeekday: number;
  actualWeekday: number;
}
export interface Candidate {
  edtf: string;
  type?: string;
  confidence: number;
  ambiguous?: boolean;
  sharedDaySet?: boolean;
}
export interface SemanticNode {
  kind: 'operation';
  children: unknown[];
  resolve: (children: any[], context: ResolutionContext) => unknown;
}
/** Nearley constructs a tree; no calendar calculation or clock access occurs here. */
export function defer(children: unknown[], resolve: SemanticNode['resolve']): SemanticNode {
  return { kind: 'operation', children, resolve };
}
export function resolveNode(value: any, context: ResolutionContext): any {
  if (Array.isArray(value)) return value.map((v) => resolveNode(v, context));
  if (value?.kind === 'operation')
    return value.resolve(
      value.children.map((v: unknown) => resolveNode(v, context)),
      context
    );
  return value;
}
export class ConstraintError extends Error {
  constructor(
    message: string,
    public readonly policy = false
  ) {
    super(message);
  }
}
/** A written weekday is a constraint, never silently discarded. */
export function withWeekday(
  candidate: Candidate,
  weekday: number,
  context: ResolutionContext
): Candidate {
  const result = parse(candidate.edtf);
  if (!result.success || result.value.type !== 'Date') throw new Error('A weekday requires a date');
  const date = result.value as unknown as CalendarDate;
  if (
    typeof date.year !== 'number' ||
    typeof date.month !== 'number' ||
    typeof date.day !== 'number'
  )
    throw new Error('A weekday requires a complete calendar date');
  const epochDay = result.value.minMs / 86400000n;
  const actual = Number((((epochDay + 4n) % 7n) + 7n) % 7n);
  if (actual !== weekday) {
    if (context.weekdayMismatch !== 'warn')
      throw new ConstraintError('The weekday does not match the calendar date');
    (context.warnings ??= []).push({
      code: 'WEEKDAY_MISMATCH',
      message: 'The weekday does not match the calendar date',
      date: candidate.edtf,
      writtenWeekday: weekday,
      actualWeekday: actual,
    });
  }
  return candidate;
}
export function buildBoundary(
  candidate: Candidate,
  direction: 'before' | 'after',
  inclusive: boolean,
  context?: ResolutionContext
): Candidate {
  if (!candidate?.edtf) throw new Error('Missing cutoff');
  if (context?.boundaryMode === 'open-interval' && !inclusive) {
    const result = parse(candidate.edtf);
    if (!result.success) throw new ConstraintError('Invalid cutoff date');
    let endpoint = candidate.edtf;
    if (result.value.type === 'Interval') {
      const period = result.value as import('@edtf-ts/core').EDTFInterval;
      const bound = direction === 'before' ? period.start : period.end;
      if (!bound) throw new ConstraintError('A period cutoff must have finite endpoints', true);
      endpoint = bound.edtf;
    } else if (result.value.type !== 'Date' && result.value.type !== 'Season') {
      throw new ConstraintError('An open-interval cutoff requires a date or period', true);
    }
    (context.notes ??= []).push({
      code: 'OPEN_INTERVAL_CUTOFF',
      policy: 'P4',
      message:
        'Caller requested an open interval; its stated endpoint is retained without exclusive subtraction',
    });
    return {
      edtf: direction === 'before' ? '../' + endpoint : endpoint + '/..',
      type: 'interval',
      confidence: 0.95,
    };
  }
  if (/[?~%X]/.test(candidate.edtf))
    throw new ConstraintError(
      'A natural-language cutoff must be an exact year, month, or day; approximation and unspecified digits do not define a strict boundary. Supply an exact cutoff or literal EDTF.',
      true
    );
  const result = parse(candidate.edtf);
  if (!result.success || result.value.type !== 'Date')
    throw new ConstraintError('A cutoff must be an exact year, month, or day', true);
  const date = result.value as unknown as CalendarDate;
  const cutoff = inclusive ? date : shiftCalendarDate(date, direction === 'before' ? -1 : 1);
  const text = formatCalendarDate(cutoff);
  if (context && !inclusive)
    (context.notes ??= []).push({
      code: 'EXCLUSIVE_CUTOFF',
      policy: 'P4',
      message: 'Before/after excludes the stated calendar unit and denotes one possible date',
    });
  return {
    edtf: direction === 'before' ? `[..${text}]` : `[${text}..]`,
    type: 'set',
    confidence: 0.95,
  };
}
export function collection(type: 'set' | 'list', values: Candidate[]): Candidate {
  const content = values
    .map((v) => (v.edtf.startsWith('[') ? v.edtf.slice(1, -1) : v.edtf))
    .join(',');
  return { edtf: type === 'set' ? `[${content}]` : `{${content}}`, type, confidence: 0.95 };
}
/** Explicit collection phrasing retains open members and their qualification scope. */
export function withCollectionBounds(
  candidate: Candidate,
  earlier: boolean,
  later: boolean
): Candidate {
  const parsed = parse(candidate.edtf);
  if (!parsed.success)
    throw new ConstraintError('Invalid collection before applying an open boundary');
  const parts = candidate.edtf.slice(1, -1).split(',');
  // An open range absorbs its finite range into the outer boundary.
  if (earlier && !parts[0]!.startsWith('..')) {
    if (parts[0]!.endsWith('..')) parts.unshift('..' + parts[0]!.slice(0, -2));
    else parts[0] = '..' + parts[0]!.split('..').at(-1);
  }
  if (later && !parts.at(-1)!.endsWith('..')) {
    if (parts.at(-1)!.startsWith('..')) parts.push(parts.at(-1)!.slice(2) + '..');
    else parts[parts.length - 1] = parts.at(-1)!.split('..')[0] + '..';
  }
  return {
    ...candidate,
    edtf: candidate.edtf[0] + parts.join(',') + candidate.edtf.slice(-1),
  };
}
export function choiceRange(first: Candidate, last: Candidate): Candidate {
  return { edtf: `[${first.edtf}..${last.edtf}]`, type: 'set', confidence: 0.95 };
}
export function sharedMonthRange(
  year: string,
  first: string,
  last: string,
  context: ResolutionContext
): string {
  let start = Number(year),
    end = start;
  if (Number(first) > Number(last)) {
    context.crossYearAmbiguity = true;
    if (context.crossYear === 'end') start--;
    else end++;
  }
  return `${formatCalendarDate({ year: start, month: Number(first) })}/${formatCalendarDate({ year: end, month: Number(last) })}`;
}
export function sharedDayRange(
  year: string,
  month: string,
  first: number,
  last: number
): Candidate {
  return {
    edtf: `${formatCalendarDate({ year: Number(year), month: Number(month), day: first })}/${formatCalendarDate({ year: Number(year), month: Number(month), day: last })}`,
    type: 'interval',
    confidence: 0.98,
  };
}

/** Expand day alternatives using an already formatted shared year and month. */
export function sharedDaySet(
  year: string,
  month: string,
  days: (number | null)[]
): Candidate | null {
  // A four-digit number remains an explicit year in an ordinary collection.
  if (days.some((day) => day === null)) return null;
  return {
    ...collection(
      'set',
      days.map((day) => ({
        edtf: `${year}-${month}-${String(day).padStart(2, '0')}`,
        confidence: 0.95,
      }))
    ),
    sharedDaySet: true,
  };
}
