/**
 * @edtf-ts
 * Modern TypeScript implementation of Extended Date/Time Format (EDTF)
 * with comprehensive temporal reasoning capabilities.
 */

export const VERSION = '0.2.0';

// ============================================================
// CORE (formerly @edtf-ts/core)
// ============================================================

// Types
export type {
  EDTFBase,
  EDTFDate,
  EDTFDateTime,
  EDTFInterval,
  EDTFSeason,
  EDTFSet,
  EDTFList,
  EDTFLevel,
  EDTFType,
  Precision,
  ParseResult,
  ParseError,
  DateComponents,
  Qualification,
  UnspecifiedDigits,
} from './types/index.js';

// Date range constants
export { DATE_MIN_MS, DATE_MAX_MS } from './types/index.js';

// Parsers
export { parse, isValid, parseLevel0, parseLevel1, parseLevel2 } from './parser.js';

// Type guards
export {
  isEDTFDate,
  isEDTFDateTime,
  isEDTFInterval,
  isEDTFSeason,
  isEDTFSet,
  isEDTFList,
} from './type-guards.js';

// ============================================================
// COMPARE (formerly @edtf-ts/compare)
// ============================================================

// Compare types
export type {
  BoundKind,
  Qualifiers,
  Member,
  Shape,
  Truth,
  Quantifier,
  AllenRelation,
  AllenRelationName,
  DerivedRelationName,
  DbColumns,
  PrepareOptions,
  OverlapQuery,
  QueryOptions,
} from './compare-types/index.js';

// Normalization
export { normalize, normalizeToMembers, normalizeToConvexHull } from './normalization/index.js';
export type { SeasonMapping } from './normalization/season.js';
export { DEFAULT_SEASON_MAPPINGS } from './normalization/season.js';

// Allen relations (Member-level functions)
export { allen } from './relations/allen.js';
export {
  before as allenBefore,
  after as allenAfter,
  meets as allenMeets,
  metBy as allenMetBy,
  overlaps as allenOverlaps,
  overlappedBy as allenOverlappedBy,
  starts as allenStarts,
  startedBy as allenStartedBy,
  during as allenDuring,
  contains as allenContains,
  finishes as allenFinishes,
  finishedBy as allenFinishedBy,
  equals as allenEquals,
} from './relations/allen.js';

// Derived relations (Member-level functions)
export { derived } from './relations/derived.js';
export {
  intersects as derivedIntersects,
  disjoint as derivedDisjoint,
  touches as derivedTouches,
  duringOrEqual as derivedDuringOrEqual,
  containsOrEqual as derivedContainsOrEqual,
} from './relations/derived.js';

// Truth value combinators
export { combineWithAny, combineWithAll, negate, and, or } from './relations/truth.js';

// EDTF-level comparison API (evaluator wrappers)
export {
  evaluateRelation,
  evaluate,
  isBefore,
  isAfter,
  meets,
  overlaps,
  starts,
  during,
  contains,
  finishes,
  equals,
  intersects,
  disjoint,
  touches,
  duringOrEqual,
  containsOrEqual,
} from './relations/evaluator.js';

// Epoch conversion
export {
  dateToEpochMs,
  startOfYear,
  startOfMonth,
  startOfDay,
  endOfYear,
  endOfMonth,
  endOfDay,
} from './normalization/epoch.js';
export type { DateComponents as EpochDateComponents } from './normalization/epoch.js';

// BigInt utilities
export {
  minBigInt,
  maxBigInt,
  clampBigInt,
  bigIntToNumber,
  isSafeBigInt,
} from './compare-utils/bigint.js';

// Calendar utilities
export {
  isLeapYear,
  getDaysInMonth,
  daysSinceEpoch,
  astronomicalToHistorical,
  historicalToAstronomical,
} from './compare-utils/calendar.js';

// ============================================================
// UTILS (formerly @edtf-ts/utils)
// ============================================================

// Formatters
export {
  formatHuman,
  formatISO,
  formatRange,
  type FormatOptions,
} from './formatters.js';

// Validators
export { isInRange, isCompletelyInRange } from './validators.js';

// Comparators
export {
  compare,
  sort,
  earliest,
  latest,
  type ComparisonMode,
} from './comparators.js';

// Age/Birthday constants and utilities
export * from './age-constants.js';
export {
  renderAgeBirthday,
  calculateAgeRange,
  type RenderAgeBirthdayResult,
  type RenderAgeBirthdayOptions,
} from './age-birthday.js';

// Date helpers
export {
  calculateAge,
  createDate,
  daysInMonth,
  getDateComponents,
  subtractYears,
  addYears,
  subtractMonths,
  addMonths,
  subtractDays,
  addDays,
  isBefore as dateIsBefore,
  isAfter as dateIsAfter,
  isSameDay,
  hasBirthdayPassedThisYear,
  formatDateISO,
  isLeapYear as dateIsLeapYear,
} from './utils-date-helpers.js';

// ============================================================
// FUZZYDATE (Temporal-inspired API)
// ============================================================

export {
  FuzzyDate,
  FuzzyDateBase,
  FuzzyDateDate,
  FuzzyDateTime,
  FuzzyDateInterval,
  FuzzyDateSeason,
  FuzzyDateSet,
  FuzzyDateList,
  FuzzyDateParseError,
  type IFuzzyDate,
  type IFuzzyDateDate,
  type IFuzzyDateTime,
  type IFuzzyDateInterval,
  type IFuzzyDateSeason,
  type IFuzzyDateSet,
  type IFuzzyDateList,
  type FuzzyDateParseResult,
  type FuzzyDateInput,
  type FuzzyDateType,
} from './fuzzy-date/index.js';
