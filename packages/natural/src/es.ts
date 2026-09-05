import { createNaturalOutcomeParser } from './outcome.js';
export type { NaturalParseOutcome, NoMatchReason } from './outcome.js';
export type { ParseNote, ParseNoteCode, NaturalErrorCode } from './diagnostics.js';
import grammar from './generated/es.js';
import { createNaturalParser } from './parser-factory.js';
import { createAgeBirthdayParser } from './age-parser.js';
export { ParseError } from './parser-factory.js';
export type { ParseResult, ParseNaturalOptions, ParseWarning } from './parser-factory.js';
export type { ParseAgeBirthdayOptions, ParseAgeBirthdayResult } from './age-parser.js';
export const parseNatural = createNaturalParser({ es: grammar }, 'es-ES');
export const parseAgeBirthday = createAgeBirthdayParser(parseNatural, 'es-ES');

/** Nonthrowing outcome for expected input/option failures. */
export const tryParseNatural = createNaturalOutcomeParser(parseNatural);
