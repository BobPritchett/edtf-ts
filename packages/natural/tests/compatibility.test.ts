import { describe, expect, it } from 'vitest';
import { formatHuman, parse } from '@edtf-ts/core';
import { parseNatural } from '../src/index.js';
import fixtures from './fixtures/compatibility.json';

describe('reviewed user and edtfy examples', () => {
  for (const fixture of fixtures) {
    it(`${fixture.locale}: ${fixture.input}`, () => {
      const run = () =>
        parseNatural(fixture.input, {
          locale: fixture.locale,
          referenceDate: new Date(2026, 0, 1),
        });
      if (fixture.reject) {
        expect(fixture.reason).toBeTruthy();
        expect(run).toThrow();
        return;
      }
      const results = run();
      expect(results.map((result) => result.edtf)).toEqual(fixture.expected);
      for (const result of results) {
        expect(parse(result.edtf).success).toBe(true);
        expect(result.type).toBe(result.parsed.type.toLowerCase());
        expect(result.fuzzyDate.edtf).toBe(result.edtf);
        expect(result.ambiguous).toBe(results.length > 1);
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });
  }
});

describe('unknown date components and season intervals across locales', () => {
  for (const source of [
    '1870-XX-01',
    '1870-XX-11',
    '1870-XX-12',
    '1870-XX-13',
    '1870-XX-21',
    '1870-XX-22',
    '1870-XX-23',
    '1870-XX-31',
    '1870-XX-12?',
    '1870-XX-12%',
    '0000-XX-12',
    'XXXX-XX-12',
    'XXXX-01-12',
    'XXXX-01',
    'XXXX-01-XX',
    'XXXX-XX',
    'XXXX-XX-XX',
    '1988-03/1990-21',
    '1988-21/1990-03',
    '1988-03/2005-24?',
    '1988-21~/1990-22%',
    '-0003-21',
    '1801?/1900?',
  ]) {
    it(`round-trips ${source} through all six regional locales`, () => {
      let current = parse(source);
      expect(current.success).toBe(true);
      for (const locale of ['en-US', 'fr-FR', 'es-ES', 'en-GB', 'fr-CA', 'es-MX']) {
        if (!current.success) throw new Error('Invalid fixture');
        const rendered = formatHuman(current.value, { locale });
        const candidates = parseNatural(rendered, { locale });
        expect(candidates.map((result) => result.edtf)).toEqual([source]);
        current = parse(candidates[0]!.edtf);
      }
    });
  }

  it.each(['32nd of unknown month, 1870', 'January 32nd', 'February 30th'])(
    'rejects impossible day expressions: %s',
    (input) => expect(() => parseNatural(input)).toThrow()
  );

  it.each(['1970/open', '2020,2021', '186X?~', '1849-21-XX%'])(
    'does not label obsolete or unsupported syntax as modern EDTF: %s',
    (input) => expect(parse(input).success).toBe(false)
  );
});

// Preferred formatting may differ from the borrowed wording, but retains the
// same modern EDTF meaning through each language's parser.
describe('preferred rendering equivalents for supplied examples', () => {
  it.each([
    '1975-07-01',
    '1975?',
    '1975-22',
    '199X',
    '19XX',
    '1970/1980',
    '1970/..',
    '1970/',
    '1970~/1980~',
    '1999-XX',
    '{2020..2021}',
  ])('%s keeps its meaning', (source) => {
    const parsed = parse(source);
    if (!parsed.success) throw new Error('Invalid fixture');
    for (const locale of ['en-US', 'fr-FR', 'es-ES']) {
      const rendered = formatHuman(parsed.value, { locale });
      expect(parseNatural(rendered, { locale })[0]!.edtf).toBe(source);
    }
  });
});
