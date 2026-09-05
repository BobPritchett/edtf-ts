import type { EDTFBase, EDTFSet, EDTFList } from './types/index.js';

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
  const collection = value as EDTFSet | EDTFList;
  let content = value.edtf.slice(1, -1);
  if (collection.earlier) content = content.slice(2);
  if (collection.later) content = content.slice(0, -2);
  return (
    value.edtf[0] +
    (collection.earlier ? '..' : '') +
    compactMembers(content.split(',')).join(',') +
    (collection.later ? '..' : '') +
    value.edtf.slice(-1)
  );
}

/** Group expanded parser values for concise rendering using the same year rule. */
export function collectionYearGroups(collection: EDTFSet | EDTFList) {
  const members = new Map(collection.values.map((value) => [value.edtf, value]));
  return compactMembers(collection.values.map((value) => value.edtf)).map((part) => {
    const [first, last] = part.split('..');
    return { first: members.get(first!)!, last: last ? members.get(last)! : undefined };
  });
}
