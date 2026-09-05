import { describe, it, expect } from 'vitest';
import {
  parse,
  formatHuman,
  renderAgeBirthday,
  LIFE_STAGES,
  compare,
  FuzzyDate,
} from '@edtf-ts/core';
import { parseNatural, parseAgeBirthday } from '../src/index.js';
import { localizedLifeStages } from '../../core/src/life-stage-locales.js';

describe('boundary precision, scope, and Unicode', () => {
  it.each([
    ['pre1870', '[..1869]'],
    ['pre 1870', '[..1869]'],
    ['pre‑1870', '[..1869]'],
    ['post1870', '[1871..]'],
    ['post 1870', '[1871..]'],
    ['post-1870', '[1871..]'],
    ['on or before 1870', '[..1870]'],
    ['not later than 1870', '[..1870]'],
    ['not after 1870', '[..1870]'],
    ['on or after 1870', '[1870..]'],
    ['not earlier than 1870', '[1870..]'],
    ['not before 1870', '[1870..]'],
    ['before January 1870', '[..1869-12]'],
    ['after December 1870', '[1871-01..]'],
    ['before March 1, 1900', '[..1900-02-28]'],
    ['after February 29, 2000', '[2000-03-01..]'],
    ['before 1 CE', '[..0000]'],
    ['before 1 BCE', '[..-0001]'],
    ['after 2 BCE', '[0000..]'],
    ['before 10001', '[..Y10000]'],
    ['after December 31, 0', '[0001-01-01..]'],
    ['March 1–3, 2024', '2024-03-01/2024-03-03'],
    ['1st century', '0001/0100'],
    ['1st century BCE', '-0099/0000'],
  ])('%s → %s', (input, expected) =>
    expect(parseNatural(input).map((r) => r.edtf)).toEqual([expected])
  );
  it.each(['before circa 1870', 'before 187X', 'before 1870?', 'after 1870~'])(
    'explains fuzzy cutoff rejection: %s',
    (input) => expect(() => parseNatural(input)).toThrow(/cutoff.*exact/)
  );
  it.each([
    '~2004-06',
    '2004-~06',
    '?2004-06-~11',
    '[..1870]',
    '200X-02-29',
    '2004-06-11T12:30:00+02:00',
  ])('preserves literal %s exactly', (edtf) => {
    const result = parseNatural(edtf)[0]!;
    expect(result.edtf).toBe(edtf);
    expect(result.parsed.toJSON()).toEqual((parse(edtf) as any).value.toJSON());
  });
  it.each(['February 30, 2024', 'March 3–1, 2024', 'January 2024 to December 2023', '..1870'])(
    'rejects invalid %s',
    (input) => expect(() => parseNatural(input)).toThrow()
  );
  it('discards invalid BCE alternatives', () => {
    const results = parseNatural('50–40 BC');
    expect(results.map((r) => r.edtf)).toEqual(['-0049/-0039']);
    expect(results.every((r) => parse(r.edtf).success)).toBe(true);
  });
});

describe('locale and candidate contract', () => {
  it('propagates numeric alternatives inside ranges and collections', () => {
    expect(
      parseNatural('circa 01/02/2020 to 03/04/2020', { locale: 'en-GB' }).map((r) => r.edtf)
    ).toEqual(['2020-02-01~/2020-04-03', '2020-01-02~/2020-03-04']);
    expect(
      parseNatural('01/02/2020 ou 03/04/2020', { locale: 'fr-FR' }).map((r) => r.edtf)
    ).toEqual(['[2020-02-01,2020-04-03]', '[2020-01-02,2020-03-04]']);
  });
  it('filters confidence and retains parsed objects on every success', () => {
    const results = parseNatural('01/02/2020', { minConfidence: 0.5 });
    expect(results[0]!.ambiguous).toBe(true);
    expect(results).toHaveLength(1);
    expect(results[0]!.parsed).toBeDefined();
    expect(() => parseNatural('01/02/2020', { minConfidence: 0.9 })).toThrow();
  });
  it('supports numeric-order overrides independently of grammar language', () => {
    expect(parseNatural('01/02/2020', { locale: 'es-MX', dateOrder: 'MDY' })[0]!.edtf).toBe(
      '2020-01-02'
    );
    expect(parseNatural('2020/02/01', { dateOrder: 'YMD' })[0]!.edtf).toBe('2020-02-01');
    expect(parseNatural('antes de 1870', { language: 'es' })[0]!.interpretation).toContain('antes');
  });
  it('resolves regional locales and rejects unsupported parsing languages', () => {
    expect(parseNatural('12 mars 1870', { locale: 'fr-CA' })[0]!.edtf).toBe('1870-03-12');
    expect(() => parseNatural('1870', { locale: 'de-DE' })).toThrow(/Unsupported language/);
  });
  it('retains valid trailing-year alternatives for a year-first locale', () => {
    const results = parseNatural('vers 01/02/2020', { locale: 'fr-CA' });
    expect(results.map((r) => r.edtf)).toEqual(['2020-01-02~', '2020-02-01~']);
    for (const result of results) {
      expect(result.ambiguous).toBe(true);
      expect(result.parsed.edtf).toBe(result.edtf);
      expect(parse(result.edtf).success).toBe(true);
    }
    expect(parseNatural('vers 2020/01/02', { locale: 'fr-CA' }).map((r) => r.edtf)).toEqual([
      '2020-01-02~',
    ]);
    expect(parseNatural('01/02/2020 à 03/04/2020', { locale: 'fr-CA' }).map((r) => r.edtf)).toEqual(
      ['2020-01-02/2020-03-04', '2020-02-01/2020-04-03']
    );
  });
  it('keeps ambiguity metadata when filtering year-first alternatives', () => {
    const options = { dateOrder: 'YMD' as const, referenceDate: new Date(2026, 0, 1) };
    const results = parseNatural('05/01/02', options);
    expect(results[0]!.edtf).toBe('2005-01-02');
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.ambiguous && parse(r.edtf).success)).toBe(true);
    expect(parseNatural('05/01/02', { ...options, minConfidence: 0.5 })).toMatchObject([
      { edtf: '2005-01-02', ambiguous: true },
    ]);
  });
  it('keeps per-call reference-year resolution isolated across centuries', () => {
    const future = { referenceDate: new Date(2090, 0, 1) };
    expect(parseNatural('01/05/05', future).every((r) => r.edtf.startsWith('2105-'))).toBe(true);
    expect(
      parseNatural('01/05/05', { referenceDate: new Date(1990, 0, 1) }).every((r) =>
        r.edtf.startsWith('2005-')
      )
    ).toBe(true);
    expect(parseNatural('01/05/05', future).every((r) => r.edtf.startsWith('2105-'))).toBe(true);
  });
  it('handles NFC and conventional unaccented aliases', () => {
    for (const month of ['février', 'fevrier', 'fe\u0301vrier'])
      expect(parseNatural(`12 ${month} 1870`, { locale: 'fr-FR' })[0]!.edtf).toBe('1870-02-12');
  });
});

describe('localized life-stage conventions and age accuracy', () => {
  const currentDate = new Date(2025, 5, 1);
  for (const stage of LIFE_STAGES)
    it(`${stage.name} has the same age convention in all languages`, () => {
      const english = parseAgeBirthday(stage.name, { currentDate });
      for (const language of ['es', 'fr'] as const) {
        const input = localizedLifeStages[language][stage.name]!;
        expect(input).toBeTruthy();
        const result = parseAgeBirthday(input, { locale: language, currentDate });
        expect(result.edtf).toBe(english.edtf);
        expect(result.ageRange).toEqual(english.ageRange);
        expect(
          renderAgeBirthday(result.edtf, { locale: language, currentDate }).formatted
        ).not.toMatch(/years old|birthday/);
      }
    });
  it('rejects impossible birthdays rather than dropping the birthday constraint', () => {
    for (const input of [
      'birthday 13/15',
      'birthday April 31',
      'birthday February 30',
      '20 years old, birthday 02/29',
    ])
      expect(() => parseAgeBirthday(input, { currentDate })).toThrow();
  });
  it('uses disjoint choices when an age range has a known birthday', () => {
    const result = parseAgeBirthday('20 to 23 years old, birthday February 29', { currentDate });
    expect(result.edtf).toBe('2004-02-29');
    expect(result.type).toBe('date');
  });
  it('retains forwarded set and datetime result types', () => {
    expect(parseAgeBirthday('born before 1870').type).toBe('set');
    expect(parseAgeBirthday('born 2004-06-11T12:00:00Z').type).toBe('datetime');
  });
  it('applies DMY ordering to birthdays', () => {
    expect(
      parseAgeBirthday('20 years old, birthday 04/03', { locale: 'en-GB', currentDate }).edtf
    ).toBe('2005-03-04');
  });
});

describe('localized rendering and canonical round trips', () => {
  it.each([
    ['es-ES', '1870-03-12', '12 de marzo de 1870'],
    ['fr-FR', '1870-03-12', '12 mars 1870'],
    ['es-ES', '0000', '1 a. C.'],
    ['fr-FR', '0000', '1 av. J.-C.'],
    ['es-ES', '~2004-06', 'junio de 2004 (año aproximado)'],
    ['fr-FR', '~2004-06', 'juin 2004 (année approximative)'],
  ])('%s renders %s without losing scope', (locale, edtf, expected) => {
    const result = parse(edtf);
    if (!result.success) throw new Error(edtf);
    expect(formatHuman(result.value, { locale })).toBe(expected);
    expect(parseNatural(expected, { locale })[0]!.edtf).toBe(edtf);
  });
  it.each([
    ['es-ES', '20 años', '15 de marzo', '20 años, cumpleaños 15 de marzo'],
    ['fr-FR', '20 ans', '15 mars', '20 ans, anniversaire 15 mars'],
  ])('renders complete birthday phrases in %s', (locale, age, birthday, formatted) => {
    expect(
      renderAgeBirthday('2005-03-15', {
        locale,
        currentDate: new Date(2025, 5, 1),
        ageStyle: 'numeric',
      })
    ).toMatchObject({ age, birthday, formatted });
  });
  it('compares absolute timestamps consistently and preserves open-choice gaps in FuzzyDate scoring', () => {
    const a = FuzzyDate.parse('2004-06-11T12:00:00+02:00'),
      b = FuzzyDate.parse('2004-06-11T10:00:00Z');
    expect(compare(a.inner, b.inner)).toBe(0);
    expect(a.compareTo(FuzzyDate.parse('2004-06-11T10:00:00'))).toBe('UNKNOWN');
    expect(FuzzyDate.parse('[..1870,1880..]').overlapScore(FuzzyDate.parse('1875'))).toBe(0);
    expect(FuzzyDate.parse('[..1870]').overlapScore(FuzzyDate.parse('1850'))).toBe(1);
  });
});

describe('age reference-date edge cases', () => {
  it('clamps anniversaries when the reference day is February 29', () => {
    const result = parseAgeBirthday('21 years old', { currentDate: new Date(2024, 1, 29) });
    expect(result.edtf).toBe('?2002-?03-?01/?2003-?02-?28');
    expect(parse(result.edtf).success).toBe(true);
  });
});
