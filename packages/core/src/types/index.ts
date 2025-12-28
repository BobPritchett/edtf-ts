/**
 * Core EDTF Types
 * These are the foundational types for all EDTF objects
 */

// Precision levels
export type Precision = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

// EDTF conformance levels
export type EDTFLevel = 0 | 1 | 2;

// Specific EDTF types
export type EDTFType =
  | 'Date'
  | 'DateTime'
  | 'Interval'
  | 'Season'
  | 'Set'
  | 'List'
  | 'Year'
  | 'Decade'
  | 'Century';

// Base interface for all EDTF types
export interface EDTFBase {
  readonly type: EDTFType;
  readonly level: EDTFLevel;
  readonly edtf: string;
  readonly precision: Precision;

  // Min/max range for the date
  readonly min: Date;
  readonly max: Date;

  // Serialization
  toJSON(): object;
  toString(): string;
}

// Qualification flags for Level 1+
export interface Qualification {
  uncertain?: boolean;      // ? = uncertain
  approximate?: boolean;    // ~ = approximate
  uncertainApproximate?: boolean;  // % = both uncertain and approximate
}

// Unspecified digit tracking
export interface UnspecifiedDigits {
  year?: string;   // e.g., "20XX" or "2XXX"
  month?: string;  // e.g., "XX"
  day?: string;    // e.g., "XX"
}

// Date components
export interface DateComponents {
  year: number | string;  // Can be number or string with X for unspecified
  month?: number | string;  // 1-12 or "XX"
  day?: number | string;    // 1-31 or "XX"
}

// Level 0 Date (extended for Level 1)
export interface EDTFDate extends EDTFBase {
  type: 'Date';
  year: number | string;  // Can include 'X' for unspecified
  month?: number | string;
  day?: number | string;

  // Level 1+ properties
  qualification?: Qualification;
  unspecified?: UnspecifiedDigits;

  // For extended years (Y prefix)
  significantDigits?: number;
}

// Level 0 DateTime
export interface EDTFDateTime extends EDTFBase {
  type: 'DateTime';
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timezone?: string;
}

// Level 1 Season
export interface EDTFSeason extends EDTFBase {
  type: 'Season';
  year: number;
  season: number;  // 21=Spring, 22=Summer, 23=Autumn, 24=Winter
  qualification?: Qualification;
}

// Level 0 Interval (extended for Level 1)
export interface EDTFInterval extends EDTFBase {
  type: 'Interval';
  start: EDTFDate | EDTFDateTime | EDTFSeason | null;  // null for unknown start
  end: EDTFDate | EDTFDateTime | EDTFSeason | null;    // null for unknown end
  openStart?: boolean;  // .. at start
  openEnd?: boolean;    // .. at end
  qualification?: Qualification;
}

// Parse error
export interface ParseError {
  code: string;
  message: string;
  position?: { start: number; end: number };
  suggestion?: string;
}

// Parse result (discriminated union)
export type ParseResult<T = EDTFBase> =
  | { success: true; value: T; level: EDTFLevel }
  | { success: false; errors: ParseError[] };
