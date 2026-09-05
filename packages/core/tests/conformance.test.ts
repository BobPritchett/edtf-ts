import { describe, expect, it } from 'vitest';
import {
  parse,
  normalize,
  normalizeToConvexHull,
  intersects,
  equals,
  evaluate,
  evaluateRelation,
  allen,
  FuzzyDate,
  formatHuman,
  type EDTFDate,
} from '../src/index.js';

// Source: https://www.loc.gov/standards/datetime/ — EDTF profile, levels 0–2.
// Bounds for seasons are library conventions; LOC defines the codes, not their calendar mapping.
const corpus: [string, 0 | 1 | 2][] = [
  ['1985-04-12', 0],
  ['1985-04', 0],
  ['1985', 0],
  ['0000', 0],
  ['0085-04-12', 0],
  ['1985-04-12T23:20:30', 0],
  ['1985-04-12T23:20:30Z', 0],
  ['1985-04-12T23:20:30+04:30', 0],
  ['1964/2008', 0],
  ['2004-06/2006-08', 0],
  ['../1985', 1],
  ['1985/..', 1],
  ['2004-25/2005-26', 2],
  ['2004-29~/2005-30?', 2],
  ['/1985', 1],
  ['1984?', 1],
  ['2004-06~', 1],
  ['2004-06-11%', 1],
  ['-1985', 1],
  ['Y170000002', 1],
  ['201X', 1],
  ['20XX', 1],
  ['2004-XX', 1],
  ['2004-06-XX', 1],
  ['2004-XX-XX', 1],
  ['2004-1X', 2],
  ['1XXX', 2],
  ['XXXX-03-15', 2],
  ['2004-XX-31', 2],
  ['200X-02-29', 2],
  ['~2004-06', 2],
  ['2004?-06-11', 2],
  ['2004-~06-11', 2],
  ['?2004-06-~11', 2],
  ['[..1870]', 2],
  ['[1870..]', 2],
  ['[1667,1668,1670..1672]', 2],
  ['{1667,1668,1670..1672}', 2],
  ['[..1760-12,1761-01,1761-03..1761-05]', 2],
  ['[1760-12..1761-02,1761-05..]', 2],
  ...Array.from({ length: 21 }, (_, i): [string, 1 | 2] => [`2004-${21 + i}`, i < 4 ? 1 : 2]),
];
const value = (edtf: string) => {
  const r = parse(edtf);
  if (!r.success) throw new Error(edtf + ': ' + JSON.stringify(r.errors));
  return r.value;
};
describe('LOC conformance and level boundaries', () => {
  it.each(corpus)('%s requires level %i', (edtf, level) => {
    const r = parse(edtf);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.level).toBe(level);
      expect(r.value.level).toBe(level);
    }
    expect(parse(edtf, level).success).toBe(true);
    if (level > 0) expect(parse(edtf, (level - 1) as 0 | 1).success).toBe(false);
  });
  it.each([
    '..1870',
    '1870..',
    '2024-02-30',
    '2001-02-29',
    '2004-3X',
    '2004-00',
    '2001-02-3X',
    'Y1E999',
    'Y999999999999999999999',
    '2004-06-11T12:30Z',
    '2004-02-01T00:00:00/2004-02-02T00:00:00',
    '2004-06-11T12:00:00.1234Z',
    '2004-06-11T12:00:00+24:00',
    '2004-06-11T12:00:00+01:60',
    '[1870,]',
    '[,1870]',
    '[1870,,1880]',
    '[1870, 1880]',
    '[1870 1880]',
    '[1880..1870]',
    '1880/1870',
    '[1870-01..1871]',
  ])('rejects non-profile or impossible %s', (edtf) => expect(parse(edtf).success).toBe(false));
  it('retains all component qualification scopes', () => {
    expect(value('~2004-06') as EDTFDate).toMatchObject({
      yearQualification: { approximate: true },
    });
    expect((value('~2004-06') as EDTFDate).monthQualification).toBeUndefined();
    expect(value('~2004?-06') as EDTFDate).toMatchObject({
      yearQualification: { uncertainApproximate: true },
    });
  });
});

describe('independent Gregorian and timestamp checks', () => {
  it.each([-400, -100, -4, -1, 0, 1, 4, 50, 99, 100, 400, 1900, 2000, 2024])(
    'matches native setUTCFullYear for year %i',
    (year) => {
      const date = new Date(0);
      date.setUTCFullYear(year, 1, 28);
      date.setUTCHours(0, 0, 0, 0);
      const text = (year < 0 ? '-' : '') + String(Math.abs(year)).padStart(4, '0') + '-02-28';
      const v = value(text);
      expect(v.minMs).toBe(BigInt(date.getTime()));
      expect(normalize(v).members[0]!.sMin).toBe(BigInt(date.getTime()));
    }
  );
  it('uses exact 400-year Gregorian cycles beyond Date limits', () => {
    expect(value('Y1000400').minMs - value('Y1000000').minMs).toBe(146097n * 86400000n);
  });
  it('normalizes offsets to equivalent instants', () => {
    const a = value('2004-06-11T12:00:00+02:30'),
      b = value('2004-06-11T09:30:00Z');
    expect(a.minMs).toBe(b.minMs);
    expect(equals(a, b)).toBe('YES');
    expect(equals(a, value('2004-06-11T09:30:00'))).toBe('UNKNOWN');
  });
  it('checks real possibilities in calendar masks', () => {
    expect(value('200X-02-29').minMs).toBe(value('2000-02-29').minMs);
    expect(value('200X-02-29').maxMs).toBe(value('2008-02-29').maxMs);
  });
  it('zero-pads finite ranges across year zero', () => {
    const r = value('[-0001..0001]');
    expect(r.type).toBe('Set');
    expect((r as any).values.map((v: any) => v.edtf)).toEqual(['-0001', '0000', '0001']);
  });
});

describe('symbolic calendar choices retain membership and quantifiers', () => {
  it('includes earlier dates without turning a date choice into an interval', () => {
    const a = value('[..1870]');
    expect(intersects(a, value('1850'))).toBe('YES');
    expect(intersects(a, value('1880'))).toBe('NO');
    expect(intersects(a, value('1850'), 'ALL')).toBe('NO');
    expect(equals(a, value('../1870'))).toBe('NO');
    expect(normalize(a).members.some((m) => m.calendarRange)).toBe(true);
    expect(normalizeToConvexHull(a).sMin).toBeNull();
    expect(FuzzyDate.parse('[..1870]').equals(FuzzyDate.parse('1850'))).toBe('YES');
  });
  it('preserves a gap between open tails', () => {
    const a = value('[..1870,1880..]');
    expect(intersects(a, value('1875'))).toBe('NO');
    expect(intersects(a, value('1900'))).toBe('YES');
  });
  it('evaluates nested quantifiers over two unbounded choices', () => {
    const a = value('[..1870]'),
      b = value('[..1880]');
    expect(evaluate(a, b, allen.after, 'ALL', 'ANY')).toBe('YES');
    expect(evaluate(a, b, allen.before, 'ANY', 'ALL')).toBe('NO');
    expect(evaluate(a, b, allen.before, 'ALL', 'ANY')).toBe('YES');
  });
  it('rejects custom callbacks instead of feeding them a misleading interval', () => {
    expect(() =>
      evaluateRelation(normalize(value('[..1870]')), normalize(value('1850')), () => 'YES')
    ).toThrow(/symbolic/);
  });
});

describe('season mappings and rendering', () => {
  const starts = [3, 6, 9, 12, 3, 6, 9, 12, 9, 12, 3, 6, 1, 4, 7, 10, 1, 5, 9, 1, 7];
  it.each(starts.map((month, i) => [21 + i, month]))(
    'maps season %i to month %i',
    (code, month) => {
      const v = value(`2004-${code}`);
      const n = normalize(v).members[0]!;
      expect(n.sMin).toBe(value(`2004-${String(month).padStart(2, '0')}-01`).minMs);
      expect(v.minMs).toBe(n.sMin);
      for (const locale of ['en-US', 'es-ES', 'fr-FR'])
        expect(formatHuman(v, { locale })).not.toBe(v.edtf);
    }
  );
});
