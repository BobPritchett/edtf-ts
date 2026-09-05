import { parseNatural } from './parser.js';
import { createAgeBirthdayParser } from './age-parser.js';
export type { ParseAgeBirthdayOptions, ParseAgeBirthdayResult } from './age-parser.js';
export const parseAgeBirthday = createAgeBirthdayParser(parseNatural);
