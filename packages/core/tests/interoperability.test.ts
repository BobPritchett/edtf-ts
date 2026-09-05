import { describe, expect, it } from 'vitest';
import { parse, isValid, FuzzyDate, formatHuman, renderAgeBirthday } from '../src/index.js';

describe('strict interoperability profile', () => {
  it.each([
    '1985-04-12',
    '2004-06-~01/2004-06-~20',
    '[1667,1668,1670..1672]',
    '[1870?,1880~]',
    '{1870?,1880~}',
    '[..1984]',
    '2001-21',
    '2001-41',
    '~1984?',
  ])('accepts %s', (input) => {
    expect(parse(input, { conformance: 'strict' }).success).toBe(true);
    expect(isValid(input, { conformance: 'strict' })).toBe(true);
  });

  it.each([
    ['1988-03/1990-21', '$.end'],
    ['1988-21~/1990-22%', '$.start'],
    ['[1870,1880-21]', '$.values[1]'],
    ['{1870-21,1880}', '$.values[0]'],
    ['1988-21~', '$'],
  ])('identifies the extension in %s', (input, path) => {
    expect(parse(input).success).toBe(true);
    expect(parse(input, { conformance: 'strict' })).toMatchObject({
      success: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'UNSUPPORTED_EXTENSION', path }),
      ]),
    });
    expect(FuzzyDate.from(input, { conformance: 'strict' }).success).toBe(false);
    expect(() => FuzzyDate.parse(input, { conformance: 'strict' })).toThrow();
  });

  it('keeps maximum feature level independent of conformance mode', () => {
    expect(parse('1984?', 0).success).toBe(false);
    expect(parse('1984?', { level: 0, conformance: 'strict' }).success).toBe(false);
    expect(parse('1984?', { level: 1, conformance: 'strict' }).success).toBe(true);
  });
});

describe('collection syntax and written structure', () => {
  it.each([
    '[..1667..1668,1670..]',
    '{..1667..1668,1670..}',
    '[1667..1668..]',
    '[..1667..]',
    '[1667,..1668]',
    '[1667..,1668]',
    '[1984-01..1985]',
    '[1985..1984]',
  ])('rejects %s in both modes', (input) => {
    expect(parse(input).success).toBe(false);
    expect(parse(input, { conformance: 'strict' }).success).toBe(false);
  });

  it.each([
    ['[1667,1668,1670..1672]', 'One of: 1667, 1668, 1670 through 1672'],
    ['[2025-01..2026-11]', 'One of: January 2025 through November 2026'],
    ['[2024-02-28..2024-03-01]', 'One of: February 28, 2024 through March 1, 2024'],
    ['{..1668,1670..}', 'All of: 1668 and all earlier dates, 1670 and all later dates'],
    ['0000', '1 BC'],
    ['-0001', '2 BC'],
    ['0001', '1 AD'],
  ])('renders %s without losing its structure', (input, expected) => {
    const result = parse(input);
    if (!result.success) throw new Error(JSON.stringify(result.errors));
    expect(formatHuman(result.value)).toBe(expected);
  });
});

describe('birthday qualification scope', () => {
  const options = { currentDate: new Date(2025, 5, 1) };
  it.each(['?', '~', '%'])('treats equivalent %s qualification spellings equally', (q) => {
    expect(renderAgeBirthday(`2005-03-15${q}`, options)).toEqual(
      renderAgeBirthday(`${q}2005-${q}03-${q}15`, options)
    );
    expect(renderAgeBirthday(`2005-03-15${q}`, options).birthdayKnown).toEqual({
      month: false,
      day: false,
    });
  });
  it('retains a known birthday with only the year qualified', () => {
    expect(renderAgeBirthday('~2005-03-15', options).birthdayKnown).toEqual({
      month: true,
      day: true,
    });
  });
});

describe('reviewed localized wording', () => {
  it.each([
    ['es-ES', '1988-03/1990-21', 'marzo de 1988 a primavera 1990'],
    ['fr-FR', '1988-03/1990-21', 'mars 1988 à printemps 1990'],
    ['es-ES', '[..1668,1670..]', 'Una de estas fechas: 1668 o antes o 1670 o después'],
    ['fr-FR', '[..1668,1670..]', 'Une de ces dates: 1668 ou avant ou 1670 ou après'],
    [
      'es-ES',
      '{..1668,1670..}',
      'Todas estas fechas: 1668 y todas las fechas anteriores y 1670 y todas las fechas posteriores',
    ],
    [
      'fr-FR',
      '{..1668,1670..}',
      'Toutes ces dates: 1668 et toutes les dates antérieures et 1670 et toutes les dates ultérieures',
    ],
  ])('%s: %s', (locale, input, expected) => {
    const result = parse(input);
    if (!result.success) throw new Error('Invalid fixture: ' + input);
    expect(formatHuman(result.value, { locale })).toBe(expected);
  });
});
