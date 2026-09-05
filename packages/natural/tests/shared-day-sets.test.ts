import { describe, expect, it } from 'vitest';
import { formatHuman } from '@edtf-ts/core';
import { parseNatural, tryParseNatural, ParseError } from '../src/index.js';
import { parseNatural as english } from '../src/en.js';
import { parseNatural as spanish } from '../src/es.js';
import { parseNatural as french } from '../src/fr.js';
import fixtures from './fixtures/languages.json';

const languages = [
  {
    language: 'en',
    locales: ['en-US', 'en-GB'],
    month: 'April',
    february: 'February',
    or: 'or',
    parse: english,
  },
  {
    language: 'es',
    locales: ['es-ES', 'es-MX'],
    month: 'abril',
    february: 'febrero',
    or: 'o',
    parse: spanish,
  },
  {
    language: 'fr',
    locales: ['fr-FR', 'fr-CA'],
    month: 'avril',
    february: 'février',
    or: 'ou',
    parse: french,
  },
] as const;

for (const { language, locales, month, february, or, parse } of languages) {
  for (const locale of locales) {
    describe(`shared day choices in ${locale}`, () => {
      it.each(fixtures.filter((fixture) => fixture.id.startsWith('set.sharedDays')))(
        '$id is one set, including through the language entry point',
        (fixture) => {
          const input = fixture[language];
          const results = parseNatural(input, { locale });
          expect(results.map((result) => result.edtf)).toEqual(fixture.expected);
          expect(results[0]).toMatchObject({ type: 'set', ambiguous: false });
          expect(parse(input, { locale }).map((result) => result.edtf)).toEqual(fixture.expected);
          expect(tryParseNatural(input, { locale })).toMatchObject({ kind: 'matched' });
          expect(
            parseNatural(formatHuman(results[0]!.parsed, { locale }), { locale }).map(
              (result) => result.edtf
            )
          ).toEqual(fixture.expected);
        }
      );

      it.each([`${month} 12 ${or} 14, 1985`, `12 ${or} 14 ${month} 1985`])(
        'shares the month and year in %s',
        (input) => {
          expect(
            parseNatural(input, { locale, conformance: 'strict' }).map((result) => result.edtf)
          ).toEqual(['[1985-04-12,1985-04-14]']);
        }
      );

      it('supports repeated conjunctions and preserves nonchronological choices', () => {
        expect(
          parseNatural(`14 ${or} 12 ${or} 16 ${month} 1985`, { locale }).map(
            (result) => result.edtf
          )
        ).toEqual(['[1985-04-14,1985-04-12,1985-04-16]']);
      });

      it('accepts a leap day only when the shared year permits it', () => {
        expect(parseNatural(`27 ${or} 29 ${february} 1984`, { locale })[0]!.edtf).toBe(
          '[1984-02-27,1984-02-29]'
        );
      });

      it.each([
        `28 ${or} 29 ${february} 1985`,
        `28 ${or} 30 ${february} 1984`,
        `0 ${or} 14 ${month} 1985`,
        `32 ${or} 14 ${month} 1985`,
        `30 ${or} 28 ${february} 1984`,
        `12 ${or} 32 ${month} 1985`,
        `${month} 12, ${or} 1985`,
        `${month} 12 ${or} 14 ${or} 1985`,
      ])('rejects the entire expression when a member is invalid: %s', (input) => {
        expect(() => parseNatural(input, { locale })).toThrow(ParseError);
      });

      it('keeps ordinary dates, explicit alternatives, and dash intervals intact', () => {
        expect(parseNatural(`${month} 12, 1985`, { locale }).map((result) => result.edtf)).toEqual([
          '1985-04-12',
        ]);
        expect(
          parseNatural(`${month} 12, 1985 ${or} ${month} 14, 1985`, { locale }).map(
            (result) => result.edtf
          )
        ).toEqual(['[1985-04-12,1985-04-14]']);
        expect(
          parseNatural(`${month} 12-14, 1985`, { locale }).map((result) => result.edtf)
        ).toEqual(['1985-04-12/1985-04-14']);
        expect(
          parseNatural(`0012 ${or} 14 ${month} 1985`, { locale }).map((result) => result.edtf)
        ).toEqual(['[0012,1985-04-14]']);
      });
    });
  }
}

it.each([
  ['either April 12th or 14th 1985', '[1985-04-12,1985-04-14]'],
  ['the 12th or 14th of April, 1985', '[1985-04-12,1985-04-14]'],
  ['Apr. 12 or 14, 1985', '[1985-04-12,1985-04-14]'],
  ['April 12 or 14, 1 BC', '[0000-04-12,0000-04-14]'],
  ['12 or 14 April 2 BC', '[-0001-04-12,-0001-04-14]'],
  ['12 BC or 14 April 1985', '[-0011,1985-04-14]'],
])('retains articles, abbreviations, and explicit eras in %s', (input, expected) => {
  expect(parseNatural(input).map((result) => result.edtf)).toEqual([expected]);
});
