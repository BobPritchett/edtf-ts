import { describe, expect, it } from 'vitest';
import { parse, type Language } from '@edtf-ts/core';
import { parseNatural, parseAgeBirthday } from '../src/index.js';
import fixtures from './fixtures/languages.json';

export function languageContract(language: Language, locale: string) {
  describe(`${language}: shared semantic feature contract`, () => {
    for (const fixture of fixtures)
      it(fixture.id, () => {
        const input = fixture[language];
        expect(input).toBeTruthy();
        const run = () =>
          fixture.age
            ? [parseAgeBirthday(input, { locale, currentDate: new Date(2025, 5, 1) })]
            : parseNatural(input, { locale });
        if (fixture.reject) {
          expect(run).toThrow();
          return;
        }
        const results = run();
        expect(results.map((r) => r.edtf)).toEqual(fixture.expected);
        for (const result of results) {
          expect(parse(result.edtf).success).toBe(true);
          expect(result.parsed.edtf).toBe(result.edtf);
          expect(result.type).toBe(result.parsed.type.toLowerCase());
          expect(result.confidence).toBeGreaterThan(0);
          expect(result.confidence).toBeLessThanOrEqual(1);
          expect(result.interpretation.length).toBeGreaterThan(0);
          if (!fixture.age) {
            expect('fuzzyDate' in result && result.fuzzyDate).toBeTruthy();
            expect('ambiguous' in result && result.ambiguous).toBe(!!fixture.ambiguous);
          }
        }
      });
  });
}
