import { describe, expect, it } from 'vitest';
import { parseNatural, tryParseNatural, ParseError } from '../src/index.js';
import { tryParseNatural as english } from '../src/en.js';
import { tryParseNatural as spanish } from '../src/es.js';
import { tryParseNatural as french } from '../src/fr.js';
import baseline from './fixtures/review-baseline.json';

describe('compatibility with every previously accepted review input', () => {
  it.each(baseline.cases)('$input', ({ input, edtf }) => {
    expect(parseNatural(input).map((r) => r.edtf)).toEqual(edtf);
  });
  it.each(baseline.rejected)('preserves a rejected corpus input: %s', (input) => {
    expect(() => parseNatural(input)).toThrow(ParseError);
  });
});

describe('bounded natural-language vocabulary additions', () => {
  it.each([
    ['1862 guess', ['1862?']],
    ['uncertain: 1862', ['1862?']],
    ['uncertain: Jan 18 1862', ['1862-01-18?']],
    ['uncertain: approx 1862', ['1862%']],
    ['active 17-19th Centuries', ['1601/1900']],
    ['year in the 1860s', ['186X']],
    ['year in about the 1800s', ['18XX~', '180X~']],
    ['active 1910-30', ['1910-30']],
  ])('%s', (input, edtf) => expect(parseNatural(input).map((r) => r.edtf)).toEqual(edtf));
  it.each([
    '1863, printed 1870',
    'active 1870 painted by someone',
    'year in 1870 extra words',
    'notcirca 1860',
  ])('still requires the whole input: %s', (text) => {
    expect(() => parseNatural(text)).toThrow(ParseError);
  });
});

describe('opt-in policies', () => {
  it.each(['?', '~', '%'])('retains qualified literal and prose readings with %s', (qualifier) => {
    expect(
      parseNatural(`1910-30${qualifier}`, { literalPreference: 'all' }).map((result) => result.edtf)
    ).toEqual([`1910-30${qualifier}`, `1910/1930${qualifier}`]);
    expect(
      parseNatural(`1910-30${qualifier}`, {
        literalPreference: 'all',
        rangeQualification: 'both',
      }).map((result) => result.edtf)
    ).toEqual([`1910-30${qualifier}`, `1910${qualifier}/1930${qualifier}`]);
  });
  it.each(['1910-30', 'active 1910-30'])('surfaces the collision for %s', (input) => {
    const results = parseNatural(input, { literalPreference: 'all' });
    expect(results.map((r) => r.edtf)).toEqual(['1910-30', '1910/1930']);
    expect(results.every((r) => r.ambiguous)).toBe(true);
    expect(results[0]!.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SEASON_RANGE_COLLISION', policy: 'P1' }),
      ])
    );
  });
  it('makes scope explicit without changing the old result', () => {
    expect(parseNatural('1868-1871?')[0]!.edtf).toBe('1868/1871?');
    expect(parseNatural('1868-1871?', { rangeQualification: 'both' }).map((r) => r.edtf)).toEqual([
      '1868?/1871?',
    ]);
    expect(
      parseNatural('1868-1871?', { rangeQualification: 'ambiguous' }).map((r) => r.edtf)
    ).toEqual(['1868/1871?', '1868?/1871?']);
    expect(parseNatural('1868/1871?', { rangeQualification: 'both' })[0]!.edtf).toBe('1868/1871?');
  });
  it.each([
    ['before 1928', '../1928'],
    ['before approx January 18 1928', '../1928-01-18~'],
    ['before approx January 1928', '../1928-01~'],
    ['after approx January 1928', '1928-01~/..'],
    ['after approx Summer 1928', '1928-22~/..'],
    ['after about the 1920s', '192X~/..'],
    ['before 19th century', '../1801'],
  ])('supports an explicit open-interval policy for %s', (input, edtf) => {
    expect(parseNatural(input, { boundaryMode: 'open-interval' })[0]!.edtf).toBe(edtf);
  });
  it('preserves ambiguous masked cutoffs and explicit inclusive choices', () => {
    expect(
      parseNatural('before the 1900s', { boundaryMode: 'open-interval' }).map((r) => r.edtf)
    ).toEqual(['../190X', '../19XX']);
    expect(
      parseNatural('before about the 1900s', { boundaryMode: 'open-interval' }).map((r) => r.edtf)
    ).toEqual(['../19XX~', '../190X~']);
    expect(parseNatural('1870 or earlier', { boundaryMode: 'open-interval' })[0]!.edtf).toBe(
      '[..1870]'
    );
    expect(() =>
      parseNatural('after approx Summer 1928', {
        boundaryMode: 'open-interval',
        conformance: 'strict',
      })
    ).toThrow(/strict/);
  });
});

describe('structured outcomes and diagnostics', () => {
  it('distinguishes a single match, ambiguity, and date uncertainty', () => {
    expect(tryParseNatural('circa 1950')).toMatchObject({
      kind: 'matched',
      result: { edtf: '1950~' },
    });
    expect(tryParseNatural('10/7/2008')).toMatchObject({ kind: 'ambiguous' });
    expect(tryParseNatural('1863 or 1864')).toMatchObject({
      kind: 'matched',
      result: { edtf: '[1863,1864]' },
    });
    expect(tryParseNatural('10/7/2008', { returnAllResults: false })).toMatchObject({
      kind: 'ambiguous',
    });
  });
  it.each([
    ['not a date', 'outOfGrammar'],
    ['unknown', 'explicitNoDate'],
    ['', 'outOfGrammar'],
    ['February 30, 1985', 'impossibleDate'],
    ['before circa 1870', 'unsupportedPolicy'],
  ])('classifies %s', (input, reason) =>
    expect(tryParseNatural(input)).toMatchObject({ kind: 'noMatch', reason })
  );
  it('distinguishes option errors and filtered candidates from grammar failures', () => {
    expect(tryParseNatural('January 2000', { minConfidence: 1 })).toMatchObject({
      kind: 'noMatch',
      reason: 'filteredOut',
    });
    expect(tryParseNatural('2000', { dateOrder: 'bad' as any })).toMatchObject({
      kind: 'error',
      error: { code: 'INVALID_OPTIONS' },
    });
    expect(tryParseNatural('2000', { referenceDate: new Date(NaN) })).toMatchObject({
      kind: 'error',
    });
    expect(tryParseNatural('2000', { literalPreference: 'bad' as any })).toMatchObject({
      kind: 'error',
    });
  });
  it('reports the offending token in original text after whitespace and Unicode normalization', () => {
    const input = '  janvier  2020    incorrect';
    const result = french(input);
    expect(result).toMatchObject({
      kind: 'noMatch',
      error: { position: input.indexOf('incorrect') },
    });
    const decomposed = '  fe\u0301vrier 2020 incorrect';
    expect(french(decomposed)).toMatchObject({
      kind: 'noMatch',
      error: { position: decomposed.indexOf('incorrect') },
    });
  });
  it('exports the outcome API from each language entry point', () => {
    expect(english('January 2000')).toMatchObject({ kind: 'matched' });
    expect(spanish('enero 2000')).toMatchObject({ kind: 'matched' });
    expect(french('janvier 2000')).toMatchObject({ kind: 'matched' });
    expect(spanish('sin fecha')).toMatchObject({ kind: 'noMatch', reason: 'explicitNoDate' });
  });
});
