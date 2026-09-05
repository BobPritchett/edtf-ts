import grammar from './generated/en.js';
import { createNaturalParser } from './parser-factory.js';
import { createAgeBirthdayParser } from './age-parser.js';
export { ParseError } from './parser-factory.js';
export type { ParseResult, ParseNaturalOptions } from './parser-factory.js';
export type { ParseAgeBirthdayOptions, ParseAgeBirthdayResult } from './age-parser.js';
export const parseNatural = createNaturalParser({ en: grammar }, 'en-US');
export const parseAgeBirthday = createAgeBirthdayParser(parseNatural, 'en-US');
