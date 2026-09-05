import { describe, it, expect } from 'vitest';
import { parse, formatHuman, renderAgeBirthday } from '@edtf-ts/core';
import { parseNatural, parseAgeBirthday } from '../src/index.js';
import { parseNatural as parseEnglish } from '../src/en.js';
import { parseNatural as parseSpanish } from '../src/es.js';
import { parseNatural as parseFrench } from '../src/fr.js';

const referenceDate = new Date(2025, 5, 1);
const locales = ['en-US', 'en-GB', 'es-ES', 'es-MX', 'fr-FR', 'fr-CA'];

describe('reviewed natural parsing policies', () => {
  it.each([
    ['~1950', '1950~'],
    ['~ 1950', '1950~'],
    ['~1984?', '1984%'],
    ['?1984~', '1984%'],
    ['~2004-06', '~2004-06'],
    ['~2004-06?', '~2004-06?'],
    ['One of: 1667, 1668', '[1667,1668]'],
    ['All of: 1670, 1671, 1672', '{1670,1671,1672}'],
    ['One of: 1670 through 1672', '[1670..1672]'],
    ['Earlier or one of: 1667 through 1668, 1670 or later', '[..1668,1670..]'],
    ['One of: 1667 through 1668 or later', '[1667..]'],
    ['March 5', 'XXXX-03-05'],
    ['January 12', 'XXXX-01-12'],
    ['January 0012', '0012-01'],
    ['1870 and earlier', '../1870'],
    ['1870 and after', '1870/..'],
    ['1870 or earlier', '[..1870]'],
    ['1870 or later', '[1870..]'],
    ['before March 1, 2024', '[..2024-02-29]'],
    ['after December 31, 2024', '[2025-01-01..]'],
    ['until 1870', '../1870'],
    ['since 1870', '1870/..'],
  ])('%s → %s', (input, expected) => {
    const result = parseNatural(input, { referenceDate });
    expect(result.map((r) => r.edtf)).toEqual([expected]);
    expect(result[0].parsed.edtf).toBe(expected);
    expect(result[0].fuzzyDate.edtf).toBe(expected);
    expect(parseNatural(expected)[0].edtf).toBe(expected);
  });

  it.each([
    '5',
    '79',
    '90',
    '00',
    'April 31',
    'February 30',
    '[..1667..1668,1670..]',
    '{1667..1668..}',
    'Earlier or one of: 1880 through 1870',
  ])('rejects %s', (input) => expect(() => parseNatural(input)).toThrow());

  for (const locale of locales)
    it.each([
      '0000',
      '0001',
      '0090',
      '0012-01',
      '0005-03-15',
      '[-0001..0001]',
      '[1667,1668,1670..1672]',
      '[2025-01..2026-11]',
      '{..1668,1670..}',
    ])(`${locale} round-trips %s`, (source) => {
      const result = parse(source);
      if (!result.success) throw new Error('Invalid fixture ' + source);
      const text = formatHuman(result.value, { locale });
      expect(parseNatural(text, { locale, referenceDate })[0].edtf).toBe(source);
    });
});

describe('strict mode and weekday diagnostics', () => {
  it.each([parseNatural, parseEnglish, parseSpanish, parseFrench])(
    'checks literals in every entry point',
    (parser) => {
      expect(() => parser('1988-03/1990-21', { conformance: 'strict' })).toThrow(/strict/);
      expect(parser('[1870?,1880~]', { conformance: 'strict' })[0].edtf).toBe('[1870?,1880~]');
    }
  );
  it.each([
    ['en-US', 'march 1988 to spring 1990'],
    ['es-ES', 'marzo 1988 a primavera 1990'],
    ['fr-FR', 'mars 1988 à printemps 1990'],
  ])('checks generated endpoints in %s', (locale, input) => {
    expect(parseNatural(input, { locale })[0].edtf).toBe('1988-03/1990-21');
    expect(() => parseNatural(input, { locale, conformance: 'strict' })).toThrow(/strict/);
    expect(() => parseAgeBirthday('born 1988-03/1990-21', { conformance: 'strict' })).toThrow(
      /strict/
    );
  });
  it.each([
    ['en-US', 'Monday, March 29, 1988'],
    ['es-ES', 'lunes, 29 marzo 1988'],
    ['fr-FR', 'lundi, 29 mars 1988'],
  ])('reports weekday mismatches in %s', (locale, input) => {
    expect(() => parseNatural(input, { locale })).toThrow(/weekday/);
    const result = parseNatural(input, { locale, weekdayMismatch: 'warn' })[0];
    expect(result.edtf).toBe('1988-03-29');
    expect(result.warnings).toEqual([
      {
        code: 'WEEKDAY_MISMATCH',
        date: '1988-03-29',
        writtenWeekday: 1,
        actualWeekday: 2,
        message: 'The weekday does not match the calendar date',
      },
    ]);
  });
  it('preserves warnings through interval construction and birth-marker handoff', () => {
    const input = 'Monday, March 29, 1988 to March 30, 1988';
    expect(parseNatural(input, { weekdayMismatch: 'warn' })[0].warnings).toHaveLength(1);
    expect(
      parseAgeBirthday('born Monday, March 29, 1988', { weekdayMismatch: 'warn' }).warnings
    ).toHaveLength(1);
    expect(
      parseNatural('Tuesday, March 29, 1988', { weekdayMismatch: 'warn' })[0].warnings
    ).toBeUndefined();
    expect(() => parseNatural('Monday, February 30, 1988', { weekdayMismatch: 'warn' })).toThrow();
  });
});

describe('age derivation metadata and single-choice semantics', () => {
  it.each([
    ['10 days', '2025-05-22', 'date'],
    ['20 years old', '[2004-06-02..2005-06-01]', 'set'],
    ['20 years old, March birthday', '[2005-03-01..2005-03-31]', 'set'],
    ['senior', '[..1960-06-01]', 'set'],
  ])('%s → %s', (input, expected, type) => {
    const result = parseAgeBirthday(input, { currentDate: referenceDate, conformance: 'strict' });
    expect(result.edtf).toBe(expected);
    expect(result.type).toBe(type);
    expect(result.parsed.type.toLowerCase()).toBe(type);
    expect(result.derivation).toMatchObject({
      kind: 'age',
      source: input,
      referenceDate: '2025-06-01',
    });
    expect(result.edtf).not.toMatch(/[?~%]/);
  });
  it('preserves genuine approximation and an exact known birthday', () => {
    const result = parseAgeBirthday('about 20 years old, birthday March 15', {
      currentDate: referenceDate,
    });
    expect(result.edtf).toBe('~2005-03-15');
    expect(renderAgeBirthday(result.edtf, { currentDate: referenceDate }).birthdayKnown).toEqual({
      month: true,
      day: true,
    });
  });
  it('retains the open boundary when an age is qualified', () => {
    const result = parseAgeBirthday('about 65+', { currentDate: referenceDate });
    expect(result.edtf).toBe('[..~1960-06-01]');
    expect(renderAgeBirthday(result.edtf, { currentDate: referenceDate }).ageRange).toEqual([
      65,
      null,
    ]);
  });
});
