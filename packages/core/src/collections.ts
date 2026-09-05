import type { EDTFBase, EDTFSet, EDTFList } from './types/index.js';
import { parse } from './parser.js';

// Only exact calendar years can join a run. Qualifications, masks, and other
// precisions retain their original spelling and act as boundaries between runs.
const year = '(?:-?\\d{4}|Y-?\\d{5,})';
const yearPart = new RegExp(`^(${year})(?:\\.\\.(${year}))?$`);
const yearNumber = (text: string) => BigInt(text.replace(/^Y/, ''));

function compactMembers(members: string[]): string[] {
  const result: string[] = [];
  let first: string | undefined;
  let last: string | undefined;
  const flush = () => {
    if (first !== undefined) result.push(first === last ? first : `${first}..${last}`);
    first = last = undefined;
  };
  for (const member of members) {
    const match = yearPart.exec(member);
    if (!match) {
      flush();
      result.push(member);
    } else {
      if (last === undefined || yearNumber(match[1]!) !== yearNumber(last) + 1n) {
        flush();
        first = match[1]!;
      }
      last = match[2] ?? match[1]!;
    }
  }
  flush();
  return result;
}

/**
 * Compact ascending runs of adjacent exact years in a parsed set or list.
 * Preserve member order, gaps, duplicates, open bounds, and all other syntax.
 * The parsed object and its original `edtf` string are never modified.
 * Non-collection values return their original EDTF string.
 */
export function compactYearRanges(value: EDTFBase): string {
  if (value.type !== 'Set' && value.type !== 'List') return value.edtf;
  return (
    value.edtf[0] +
    compactMembers(value.edtf.slice(1, -1).split(',')).join(',') +
    value.edtf.slice(-1)
  );
}

/** Render the written elements, preserving enumerations and ranges at every precision. */
export function collectionGroups(collection: EDTFSet | EDTFList) {
  const members = new Map(collection.values.map((value) => [value.edtf, value]));
  const member = (text: string) => {
    const existing = members.get(text);
    if (existing) return existing;
    const result = parse(text);
    if (!result.success) throw new Error(`Invalid collection endpoint: ${text}`);
    return result.value;
  };
  return collection.edtf
    .slice(1, -1)
    .split(',')
    .map((part) => {
      const earlier = part.startsWith('..'),
        later = part.endsWith('..');
      const [first, last] = part.replace(/^\.\.|\.\.$/g, '').split('..');
      return { first: member(first!), last: last ? member(last) : undefined, earlier, later };
    });
}
