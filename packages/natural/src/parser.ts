import en from './generated/en.js';
import es from './generated/es.js';
import fr from './generated/fr.js';
import { createNaturalParser } from './parser-factory.js';
export { ParseError } from './parser-factory.js';
export type { ParseResult, ParseNaturalOptions } from './parser-factory.js';
export const parseNatural = createNaturalParser({ en, es, fr });
