import grammar from './generated/es.js';
import { createNaturalParser } from './parser-factory.js';
import { createAgeBirthdayParser } from './age-parser.js';
export { ParseError } from './parser-factory.js';
export type { ParseResult, ParseNaturalOptions } from './parser-factory.js';
export type { ParseAgeBirthdayOptions, ParseAgeBirthdayResult } from './age-parser.js';
export const parseNatural = createNaturalParser({ es: grammar }, 'es-ES');
export const parseAgeBirthday = createAgeBirthdayParser(parseNatural, 'es-ES');
