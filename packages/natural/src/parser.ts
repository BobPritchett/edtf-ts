import { createNaturalOutcomeParser } from './outcome.js';
export type { NaturalParseOutcome, NoMatchReason } from './outcome.js';
export type { ParseNote, ParseNoteCode, NaturalErrorCode } from './diagnostics.js';
import en from './generated/en.js';
import es from './generated/es.js';
import fr from './generated/fr.js';
import { createNaturalParser } from './parser-factory.js';
export { ParseError } from './parser-factory.js';
export type { ParseResult, ParseNaturalOptions, ParseWarning } from './parser-factory.js';
export const parseNatural = createNaturalParser({ en, es, fr });

/** Nonthrowing outcome for expected input/option failures. */
export const tryParseNatural = createNaturalOutcomeParser(parseNatural);
