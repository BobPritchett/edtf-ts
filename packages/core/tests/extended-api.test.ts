import { describe, expect, it } from 'vitest';
import {
  parse,
  FuzzyDate,
  canonicalize,
  canonicalLevel,
  getYearRange,
  getBounds,
  enumerateValues,
  EnumerationError,
  EDTFOperationError,
  relate,
  normalize,
  isBefore,
  type EDTFDate,
} from '../src/index.js';

const date = (text: string) => FuzzyDate.parse(text).inner as EDTFDate;
const values = (text: string) => [...enumerateValues(text)].map((v) => v.edtf);

describe('significant-digit semantics', () => {
  it.each([
    ['1950S2', 1900, 1999],
    ['0001S2', 0, 99],
    ['0000S4', 0, 0],
    ['Y171010000S3', 171000000, 171999999],
    ['Y3388E2S3', 338000, 338999],
    ['Y-3388E2S3', -338999, -338000],
  ])('%s retains its estimate and expands its bounds', (text, min, max) => {
    const value = date(text);
    expect(getYearRange(value)).toEqual({ min, max });
    const bounds = getBounds(value);
    expect(bounds.earliest).toMatchObject({
      kind: 'finite',
      date: { year: min, month: 1, day: 1 },
    });
    expect(bounds.latest).toMatchObject({
      kind: 'finite',
      date: { year: max, month: 12, day: 31 },
    });
    expect(value.minMs).toBe(normalize(value).members[0]!.sMin);
    expect(value.maxMs).toBe(normalize(value).members[0]!.eMax);
    expect(value.edtf).toBe(text);
  });
  it('does not overstate a comparison of an estimated year', () => {
    expect(date('1950S2').year).toBe(1950);
    expect(isBefore(date('1950S2'), date('1960'))).toBe('MAYBE');
    expect(isBefore(date('1950S2'), date('2000'))).toBe('YES');
  });
  it.each(['1950S0', '1950S5', 'Y171010000S0', 'Y3388E2S9', 'Y9007199254740991S1'])(
    'rejects invalid precision %s',
    (text) => {
      const result = parse(text);
      expect(result).toMatchObject({
        success: false,
        errors: [{ code: 'INVALID_SIGNIFICANT_DIGITS' }],
      });
    }
  );
});

describe('canonical formatting', () => {
  it.each([
    ['?2004-?06-?11', '2004-06-11?'],
    ['~2004-~06-11', '2004-06~-11'],
    ['~1984?', '1984%'],
    ['?2004-06-~11', '2004?-06-~11'],
    ['[?1984,1986..1988]', '[1984?,1986..1988]'],
    ['?1984/1986', '1984?/1986'],
  ])('canonicalizes %s without changing scope', (input, output) => {
    expect(canonicalize(input)).toBe(output);
    expect(canonicalize(output)).toBe(output);
  });
  it('retains original strings and syntax levels', () => {
    const value = FuzzyDate.parse('?2004-?06-?11');
    expect(canonicalize(value)).toBe('2004-06-11?');
    expect(canonicalLevel(value)).toBe(1);
    expect(value.level).toBe(2);
    expect(value.toString()).toBe('?2004-?06-?11');
  });
  it('preserves every combination of component qualifications', () => {
    const bits = (q: any) =>
      (q?.uncertain || q?.uncertainApproximate ? 1 : 0) |
      (q?.approximate || q?.uncertainApproximate ? 2 : 0);
    for (const y of ['', '?', '~', '%'])
      for (const m of ['', '?', '~', '%'])
        for (const d of ['', '?', '~', '%']) {
          const input = `${y}2004-${m}06-${d}11`,
            result = date(canonicalize(input));
          const global = bits(result.qualification);
          expect([
            bits(result.yearQualification) | global,
            bits(result.monthQualification) | global,
            bits(result.dayQualification) | global,
          ]).toEqual([y, m, d].map((q) => ['', '?', '~', '%'].indexOf(q)));
        }
  });
  it('reports invalid input with the core diagnostics', () => {
    expect(() => canonicalize('1985-02-30')).toThrow(EDTFOperationError);
  });
});

describe('lazy value enumeration', () => {
  it('fills valid masked dates with their qualifiers', () => {
    expect(values('1985-0X-31~')).toEqual([
      '1985-01-31~',
      '1985-03-31~',
      '1985-05-31~',
      '1985-07-31~',
      '1985-08-31~',
    ]);
    expect(values('1560-X2')).toEqual(['1560-02', '1560-12']);
    expect(values('-000X')).toEqual([
      '-0009',
      '-0008',
      '-0007',
      '-0006',
      '-0005',
      '-0004',
      '-0003',
      '-0002',
      '-0001',
      '0000',
    ]);
  });
  it('retains written precision, order, and duplicates', () => {
    expect(values('{1985,1985,1986-01..1986-03}')).toEqual([
      '1985',
      '1985',
      '1986-01',
      '1986-02',
      '1986-03',
    ]);
    expect(values('2000-02-XX')).toHaveLength(29);
    expect(values('1950S2')).toHaveLength(100);
    expect(values('1985')).toEqual(['1985']);
  });
  it('starts huge finite sweeps without allocating all members', () => {
    expect(enumerateValues('XXXX-XX-XX').next().value.edtf).toBe('0000-01-01');
    const iterator = enumerateValues('{0000-01-01..9999-12-31}');
    expect(iterator.next().value.edtf).toBe('0000-01-01');
    expect(iterator.next().value.edtf).toBe('0000-01-02');
    expect(enumerateValues('Y171010000S3').next().value.edtf).toBe('Y171000000');
  });
  it('rejects nonfinite enumeration and validates the entire collection up front', () => {
    expect(() => enumerateValues('1985/1990')).toThrow(EnumerationError);
    expect(() => enumerateValues('[1985,1990..]')).toThrow(EnumerationError);
    expect(() => enumerateValues('{1985,2000-02-30}')).toThrow(EDTFOperationError);
    expect(() => enumerateValues('{1985S2..2000}')).toThrow(EDTFOperationError);
    expect(() => enumerateValues('[1985]', { level: 1 })).toThrow(EDTFOperationError);
    expect(() => enumerateValues('[2001-21]', { conformance: 'strict' })).toThrow(
      EDTFOperationError
    );
  });
  it('leaves legacy collection arrays available', () => {
    const value = FuzzyDate.Set.from('[1985..1987]');
    expect(value.success && value.value.values.map((v) => v.edtf)).toEqual([
      '1985',
      '1986',
      '1987',
    ]);
  });
});

describe('explicit bounds and relation summaries', () => {
  it('keeps unknown, infinite, and out-of-Date-range bounds distinct', () => {
    expect(getBounds('1985/').latest).toEqual({ kind: 'unknown' });
    expect(getBounds('1985/..').latest).toEqual({ kind: 'positiveInfinity' });
    expect(getBounds('[..1985]').earliest).toEqual({ kind: 'negativeInfinity' });
    expect(getBounds('Y170000002').earliest).toMatchObject({
      kind: 'finite',
      date: { year: 170000002 },
    });
  });
  it('retains sub-day comparisons and all 13 relation outcomes', () => {
    const result = relate('1985-04-12T01:00:00Z', '1985-04-12T23:00:00Z');
    expect(Object.keys(result.relations)).toHaveLength(13);
    expect(result.relations).toMatchObject({ before: 'YES', equals: 'NO' });
    expect(result.definite).toEqual(['before']);
    expect(relate('1985', '1985-06').relations.contains).toBe('YES');
  });
  it('keeps unknown separate and respects collection quantifiers', () => {
    expect(relate('1985/', '1990').unknown).toContain('before');
    expect(relate('[1980,2000]', '1990').relations.before).toBe('YES');
    expect(relate('[1980,2000]', '1990', { quantifierA: 'ALL' }).relations.before).toBe('NO');
  });
});
