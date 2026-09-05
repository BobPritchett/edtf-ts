import { parse, formatCalendarDate, shiftCalendarDate, type CalendarDate } from '@edtf-ts/core';

export interface ResolutionContext {
  referenceYear: number;
  dateOrder: 'MDY' | 'DMY' | 'YMD';
  crossYear: 'end' | 'start';
  numericAmbiguity?: boolean;
  crossYearAmbiguity?: boolean;
}
export interface Candidate {
  edtf: string;
  type?: string;
  confidence: number;
  ambiguous?: boolean;
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
export class ConstraintError extends Error {}
/** A written weekday is a constraint, never silently discarded. */
export function withWeekday(candidate: Candidate, weekday: number): Candidate {
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
  if (actual !== weekday) throw new ConstraintError('The weekday does not match the calendar date');
  return candidate;
}
export function buildBoundary(
  candidate: Candidate,
  direction: 'before' | 'after',
  inclusive: boolean
): Candidate {
  if (!candidate?.edtf) throw new Error('Missing cutoff');
  if (/[?~%X]/.test(candidate.edtf))
    throw new ConstraintError(
      'A natural-language cutoff must be an exact year, month, or day; approximation and unspecified digits do not define a strict boundary. Supply an exact cutoff or literal EDTF.'
    );
  const result = parse(candidate.edtf);
  if (!result.success || result.value.type !== 'Date')
    throw new ConstraintError('A cutoff must be an exact year, month, or day');
  const date = result.value as unknown as CalendarDate;
  const cutoff = inclusive ? date : shiftCalendarDate(date, direction === 'before' ? -1 : 1);
  const text = formatCalendarDate(cutoff);
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
  const content = candidate.edtf.slice(1, -1);
  return {
    ...candidate,
    edtf:
      candidate.edtf[0] +
      (earlier && !content.startsWith('..') ? '..' : '') +
      content +
      (later && !content.endsWith('..') ? '..' : '') +
      candidate.edtf.slice(-1),
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
