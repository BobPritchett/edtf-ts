import { expect, it } from 'vitest';
import { formatHuman, parse } from '../src/index.js';

it.each([
  ['en-US', '1870-XX-12', '12th of unknown month, 1870'],
  ['en-GB', '1870-XX-21', '21st of unknown month, 1870'],
  ['es-ES', '1870-XX-12', 'día 12 de mes desconocido, 1870'],
  ['fr-FR', '1870-XX-12', "12 d'un mois inconnu, 1870"],
  ['fr-CA', '1870-XX-01', "1er d'un mois inconnu, 1870"],
  ['en-US', 'XXXX-01-12', 'January 12, unknown year'],
  ['en-US', 'XXXX-01', 'January, unknown year'],
])('preserves known components in %s: %s', (locale, source, expected) => {
  const result = parse(source);
  expect(result.success).toBe(true);
  if (!result.success) throw new Error('Invalid fixture');
  expect(formatHuman(result.value, { locale })).toBe(expected);
});
