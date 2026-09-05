import type { EDTFDate, EDTFSeason, ParseResult } from '../types/index.js';

export type CollectionDate = EDTFDate | EDTFSeason;
export interface CollectionElement {
  first: CollectionDate;
  last?: EDTFDate;
  earlier: boolean;
  later: boolean;
}

/** @internal Parse only written endpoints; expanding a range is a separate operation. */
export function readCollectionElements(
  input: string,
  parseMember: (text: string) => ParseResult<CollectionDate>
): ParseResult<CollectionElement[]> {
  const invalid = (message: string): ParseResult<CollectionElement[]> => ({
    success: false,
    errors: [{ code: 'INVALID_RANGE', message }],
  });
  const content = input.slice(1, -1);
  if (/\s/.test(content))
    return {
      success: false,
      errors: [{ code: 'INVALID_SET', message: 'Whitespace is not allowed inside an EDTF set' }],
    };
  const parts = content.split(','),
    elements: CollectionElement[] = [];
  for (const [index, part] of parts.entries()) {
    const earlier = part.startsWith('..'),
      later = part.endsWith('..');
    if ((earlier && index !== 0) || (later && index !== parts.length - 1) || (earlier && later))
      return invalid('Open boundaries must occur at the corresponding outer collection edge');
    const text = part.replace(/^\.\.|\.\.$/g, '');
    if (!text)
      return { success: false, errors: [{ code: 'EMPTY_SET', message: 'Empty set member' }] };
    const endpoints = text.split('..');
    if (endpoints.length > 2 || ((earlier || later) && endpoints.length !== 1))
      return invalid('Malformed range');
    const start = parseMember(endpoints[0]!);
    if (!start.success) return start;
    if (endpoints.length === 1) {
      elements.push({ first: start.value, earlier, later });
      continue;
    }
    const end = parseMember(endpoints[1]!);
    if (!end.success) return end;
    const first = start.value,
      last = end.value;
    if (
      first.type !== 'Date' ||
      last.type !== 'Date' ||
      first.precision !== last.precision ||
      /[X?~%S]/.test(text) ||
      first.minMs > last.maxMs
    )
      return invalid('Range endpoints must be ordered exact dates of equal precision');
    elements.push({ first, last, earlier, later });
  }
  return { success: true, value: elements, level: 2 };
}
