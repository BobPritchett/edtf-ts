import { describe, expect, it } from 'vitest';
import { formatHuman, parse, resolveDateOrder, resolveLanguage } from '@edtf-ts/core';
import { parseNatural } from '../src/index.js';
import { parseNatural as parseEnglish } from '../src/en.js';

const englishRegions = [
  'en',
  'en-US',
  'en-GB',
  'en-ZA',
  'en-CA',
  'en-AU',
  'en-NZ',
  'en-IN',
  'en-IE',
  'en-SG',
  'en-PH',
  'en-NG',
  'en-HK',
  'en-150',
];
const referenceDate = new Date(2026, 0, 1);

describe('regional locales share their base-language grammar', () => {
  it.each(englishRegions)('%s works in both the full and English-only entry points', (locale) => {
    expect(resolveLanguage(locale)).toBe('en');
    const source = parse('2026-06-05');
    if (!source.success) throw new Error('Invalid fixture');
    const short = formatHuman(source.value, { locale, dateStyle: 'short' });
    for (const parser of [parseNatural, parseEnglish]) {
      expect(parser('March 12, 1870', { locale })[0]!.edtf).toBe('1870-03-12');
      // Test the installed Intl data rather than freezing every country's CLDR rules.
      expect(parser(short, { locale, referenceDate })[0]!.edtf).toBe('2026-06-05');
    }
  });

  it.each([
    ['en-US', 'MDY', '06/05/26', '2026-06-05'],
    ['en-GB', 'DMY', '06/05/26', '2026-05-06'],
    ['en-ZA', 'YMD', '26/06/05', '2026-06-05'],
  ] as const)('%s demonstrates %s ordering', (locale, order, text, expected) => {
    expect(resolveDateOrder(locale)).toBe(order);
    expect(parseEnglish(text, { locale, referenceDate })[0]!.edtf).toBe(expected);
  });

  it('allows a deterministic override without changing the input language', () => {
    expect(
      parseEnglish('06/05/26', {
        locale: 'en-ZA',
        dateOrder: 'MDY',
        referenceDate,
      })[0]!.edtf
    ).toBe('2026-06-05');
  });

  it.each(['en-ZA', 'es-MX', 'fr-CA'])('preserves literal ISO milliseconds in %s', (locale) => {
    const iso = new Date('2024-02-29T12:30:00.123Z').toISOString();
    const [result] = parseNatural(iso, { locale });
    expect(result!.edtf).toBe(iso);
    expect(result!.type).toBe('datetime');
    expect(result!.parsed.minMs).toBe(BigInt(Date.parse(iso)));
    expect(result!.fuzzyDate.toISO()).toBe(iso);
    expect(() => parseNatural(iso, { locale, conformance: 'strict' })).toThrow();
  });
});
