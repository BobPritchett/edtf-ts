import grammar from './generated/fr.js';
import { createNaturalParser } from './parser-factory.js';
import { createAgeBirthdayParser } from './age-parser.js';
export { ParseError } from './parser-factory.js';
export type { ParseResult, ParseNaturalOptions } from './parser-factory.js';
export type { ParseAgeBirthdayOptions, ParseAgeBirthdayResult } from './age-parser.js';
export const parseNatural = createNaturalParser({ fr: grammar }, 'fr-FR');
export const parseAgeBirthday = createAgeBirthdayParser(parseNatural, 'fr-FR');
