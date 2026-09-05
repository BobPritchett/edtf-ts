import { describe, expect, it } from 'vitest';
import {
  parse,
  FuzzyDate,
  normalize,
  formatISO,
  formatHuman,
  equals,
  compare,
  isEDTFDateTime,
} from '../src/index.js';

function datetime(input: string) {
  const result = parse(input);
  if (!result.success || !isEDTFDateTime(result.value))
    throw new Error(`Invalid fixture: ${input}`);
  return result.value;
}

describe('ISO timestamp extensions', () => {
  it.each([
    0,
    123,
    -1,
    Date.UTC(2024, 1, 29, 23, 59, 59, 987),
    -62167219200000, // Year zero
    -62198755200000, // Negative year, signed six-digit ISO spelling
    253402300800000, // Year 10000
    -8640000000000000,
    8640000000000000, // Native Date limits
  ])('preserves Date.toISOString() at epoch %i', (epoch) => {
    const iso = new Date(epoch).toISOString();
    const value = datetime(iso);
    expect(value.edtf).toBe(iso);
    expect(value.min.getTime()).toBe(epoch);
    expect(value.max.getTime()).toBe(epoch);
    expect(value.minMs).toBe(BigInt(epoch));
    expect(value.maxMs).toBe(BigInt(epoch));
    expect(normalize(value).members[0]).toMatchObject({
      sMin: BigInt(epoch),
      eMax: BigInt(epoch),
      timeDomain: 'absolute',
    });
    expect(formatISO(value)).toBe(iso);
    expect(FuzzyDate.parse(iso).toISO()).toBe(iso);
    expect(FuzzyDate.from(iso).success).toBe(true);
  });

  it.each([
    ['', 0, 999],
    ['.0', 0, 99],
    ['.1', 100, 199],
    ['.12', 120, 129],
    ['.120', 120, 120],
    ['.000', 0, 0],
    ['.999', 999, 999],
  ] as const)('retains the written resolution of %s', (fraction, first, last) => {
    const value = datetime(`1970-01-01T00:00:00${fraction}Z`);
    expect(value.minMs).toBe(BigInt(first));
    expect(value.maxMs).toBe(BigInt(last));
    expect(value.precision).toBe('second'); // No new case in the public precision union.
    expect(value.fractionalSecond).toBe(fraction ? fraction.slice(1) : undefined);
    expect(normalize(value).members[0]).toMatchObject({ sMin: BigInt(first), eMax: BigInt(last) });
    expect(FuzzyDate.DateTime.from(value.edtf)).toMatchObject({ success: true });
    const wrapped = FuzzyDate.DateTime.from(value.edtf);
    if (wrapped.success) expect(wrapped.value.fractionalSecond).toBe(value.fractionalSecond);
    expect(value.toJSON()).toEqual({
      type: 'DateTime',
      year: 1970,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      timezone: 'Z',
      ...(fraction ? { fractionalSecond: fraction.slice(1) } : {}),
    });
  });

  it('orders distinct milliseconds and preserves timezone offsets across dates', () => {
    const early = datetime('1969-12-31T23:59:59.998Z');
    const late = datetime('1970-01-01T05:29:59.999+05:30');
    expect(early.minMs).toBe(-2n);
    expect(late.minMs).toBe(-1n);
    expect(compare(early, late)).toBe(-1);
    expect(equals(early, late)).toBe('NO');
    expect(equals(late, datetime('1969-12-31T23:59:59.999Z'))).toBe('YES');
    expect(equals(late, datetime('1969-12-31T23:59:59.999'))).toBe('UNKNOWN');
  });

  it.each(['en-US', 'en-GB', 'es-ES', 'fr-FR'])('renders the fraction in %s', (locale) => {
    expect(formatHuman(datetime('2024-01-02T03:04:05.123Z'), { locale })).toMatch(/[.,]123/);
    expect(formatHuman(datetime('2024-01-02T03:04:05.120Z'), { locale })).toMatch(/[.,]120/);
  });

  it.each(['2024-01-02T03:04:05.000Z', '+010000-01-01T00:00:00Z'])(
    'accepts %s by default and reports an extension in strict mode',
    (input) => {
      expect(parse(input, 0).success).toBe(true);
      expect(parse(input, { conformance: 'strict' })).toMatchObject({
        success: false,
        errors: [{ code: 'UNSUPPORTED_EXTENSION', path: '$' }],
      });
    }
  );

  it.each([
    '2024-01-02T03:04:05.Z',
    '2024-01-02T03:04:05.1234Z',
    '2024-01-02T03:04:05.123000Z',
    '2024-02-30T03:04:05.123Z',
    '2024-01-02T24:04:05.123Z',
    '2024-01-02T03:04:05.123+24:00',
    '-000000-01-01T00:00:00.000Z',
  ])('rejects invalid or finer-than-millisecond input %s', (input) => {
    expect(parse(input).success).toBe(false);
  });
});
