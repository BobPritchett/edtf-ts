import { describe, it, expect } from 'vitest';
import { compactYearRanges, formatHuman, parse } from '@edtf-ts/core';
import { parseNatural } from '../src/index.js';

const referenceDate = new Date(2026, 0, 1);
const routes = [
  ['en-US', 'fr-FR', 'es-ES', 'en-GB'],
  ['en-GB', 'fr-CA', 'es-MX', 'en-US'],
];
const examples = [
  ['March 12, 1870', '1870-03-12'],
  ['March 1870', '1870-03'],
  ['circa 1870', '1870~'],
  ['possibly circa 1870', '1870%'],
  ['1870 (year uncertain)', '?1870'],
  ['from 1870 to 1880', '1870/1880'],
  ['sometime between 1870 and 1880', '[1870..1880]'],
  ['since 1870', '1870/..'],
  ['open start to 1870', '../1870'],
  ['1870 to unknown', '1870/'],
  ['unknown to 1870', '/1870'],
  ['One of: 1870 through 1880', '[1870..1880]'],
  ['All of: 1870 through 1880', '{1870..1880}'],
  ['One of: 2 BC through 1', '[-0001..0001]'],
  ['One of: 9999 through 10001', '[9999..Y10001]'],
  ['before 1870', '[..1869]'],
  ['after 1870', '[1871..]'],
  ['One of: 1667, 1668, 1670', '[1667..1668,1670]'],
  ['All of: 1667, 1668, 1670', '{1667..1668,1670}'],
  ['One of: 1667', '[1667]'],
  ['All of: 1667', '{1667}'],
  ['One of: 1870 (uncertain), 1880 (approximate)', '[1870?,1880~]'],
  ['spring 1870 (northern hemisphere)', '1870-25'],
  ['1 BCE', '0000'],
  ['One of: March 12, 1870, April 13, 1880', '[1870-03-12,1880-04-13]'],
  ['All of: 1667, 1668, 1669, and 1670', '{1667..1670}'],
  ['Earlier or one of: 1667, 1668, 1670, or later', '[..1667..1668,1670..]'],
  ['Earlier and all of: 1667, 1668, 1670, and later', '{..1667..1668,1670..}'],
];

describe('collection reduction and interval endpoint round trips', () => {
  for (const locale of ['en-US', 'en-GB', 'es-ES', 'es-MX', 'fr-FR', 'fr-CA'])
    it.each([
      '[1870..1880]',
      '[1870,1871,1872,1873,1874,1875,1876,1877,1878,1879,1880]',
      '{1870..1880}',
      '[1870..1872,1880..1882]',
      '[..1870..1872,1880..1882..]',
      '{..1870..1872,1880..1882..}',
      '[1870?,1871,1872,1873~]',
      '[-0002..0002]',
      '[0098..0100]',
      '[9999..Y10001]',
      '[Y-10001..-9999]',
      '1870/..',
      '../1870',
      '1870/',
      '/1870',
    ])(`${locale}: %s retains its meaning`, (source) => {
      const result = parse(source);
      if (!result.success) throw new Error('Invalid fixture');
      // Literal pass-through remains lossless, even for an uncompressed collection.
      expect(parseNatural(source, { locale })[0]!.edtf).toBe(source);
      const rendered = formatHuman(result.value, { locale });
      const candidates = parseNatural(rendered, { locale, referenceDate });
      expect(candidates.length).toBeGreaterThan(0);
      for (const candidate of candidates) {
        expect(candidate.edtf).toBe(compactYearRanges(result.value));
        expect(candidate.parsed.type).toBe(result.value.type);
        expect(candidate.fuzzyDate.edtf).toBe(candidate.edtf);
      }
    });
});

describe('cross-language rendering and parsing chains', () => {
  for (const route of routes)
    it.each(examples)(`${route.join(' → ')}: %s`, (input, expected) => {
      let candidates = parseNatural(input!, { locale: route[0], referenceDate });
      const checkCandidates = () => {
        // Follow the locale's preferred reading at each hop, while validating
        // every alternative (including alternate grouping of comma-separated dates).
        expect(candidates[0]!.edtf).toBe(expected);
        for (const candidate of candidates) {
          expect(parse(candidate.edtf).success).toBe(true);
          expect(candidate.type).toBe(candidate.parsed.type.toLowerCase());
          expect(candidate.parsed.edtf).toBe(candidate.edtf);
          expect(candidate.fuzzyDate.edtf).toBe(candidate.edtf);
          expect(candidate.ambiguous).toBe(candidates.length > 1);
        }
      };
      checkCandidates();
      for (const locale of route.slice(1)) {
        const rendered = formatHuman(candidates[0]!.parsed, { locale });
        candidates = parseNatural(rendered, { locale, referenceDate });
        checkCandidates();
      }
    });

  it.each(['en-US', 'en-GB', 'es-ES', 'es-MX', 'fr-FR', 'fr-CA'])(
    'ranks the matching short-date interpretation first in %s',
    (locale) => {
      const source = parse('2026-06-05');
      if (!source.success) throw new Error('Invalid fixture');
      const rendered = formatHuman(source.value, { locale, dateStyle: 'short' });
      const candidates = parseNatural(rendered, { locale, referenceDate });
      expect(candidates[0]!.edtf).toBe(source.value.edtf);
      for (const candidate of candidates) expect(parse(candidate.edtf).success).toBe(true);
    }
  );
});

describe('numeric date order is shared across language grammars', () => {
  it.each(['en-GB', 'es-ES', 'es-MX', 'fr-FR'])(
    '%s prefers DMY and supports an explicit MDY override',
    (locale) => {
      expect(parseNatural('06/05/26', { locale, referenceDate })[0]!.edtf).toBe('2026-05-06');
      expect(parseNatural('06/05/26', { locale, dateOrder: 'MDY', referenceDate })[0]!.edtf).toBe(
        '2026-06-05'
      );
      expect(parseNatural('06/15/26', { locale, referenceDate }).map((r) => r.edtf)).toEqual([
        '2026-06-15',
      ]);
    }
  );
  it('supports a DMY override in US English without another grammar', () => {
    expect(
      parseNatural('06/05/26', { locale: 'en-US', dateOrder: 'DMY', referenceDate })[0]!.edtf
    ).toBe('2026-05-06');
  });
  it.each([
    ['en-GB', '01/02/2026 to 03/03/2026', '2026-02-01/2026-03-03'],
    ['es-ES', '01/02/2026 a 03/03/2026', '2026-02-01/2026-03-03'],
    ['fr-FR', '01/02/2026 à 03/03/2026', '2026-02-01/2026-03-03'],
    ['en-GB', 'One of: 01/02/2026, 03/03/2026', '[2026-02-01,2026-03-03]'],
  ])('retains the %s preference throughout %s', (locale, input, expected) => {
    const candidates = parseNatural(input!, { locale, referenceDate });
    expect(candidates[0]!.edtf).toBe(expected);
    expect(candidates[0]!.confidence).toBeGreaterThan(candidates[1]!.confidence);
    expect(candidates.every((candidate) => candidate.ambiguous)).toBe(true);
  });
  it('uses one consistent numeric ordering for the whole expression', () => {
    expect(
      parseNatural('06/15/26 to 07/08/26', { locale: 'en-GB', referenceDate }).map((r) => r.edtf)
    ).toEqual(['2026-06-15/2026-07-08']);
  });
});
