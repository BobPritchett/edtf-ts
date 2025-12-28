# Claude Code Handoff - EDTF TypeScript Implementation

## Project Overview

You are implementing a **modern TypeScript library for EDTF (Extended Date/Time Format)** - a date standard for handling uncertain, approximate, and complex historical dates.

**Package Name:** `@edtf-ts/core` (and related packages)  
**Repository:** `edtf-ts` (monorepo)  
**License:** MIT  
**Target:** TypeScript 5.0+, Node 18+, Modern browsers

## Background Research

📁 **CRITICAL: Read these first** (in `tools/research/`):
1. `edtf-research-report.md` - Complete EDTF analysis and specifications
2. `fork-vs-fresh-analysis.md` - Why we're starting fresh with TypeScript
3. `edtfy-impact-analysis.md` - Learnings from existing natural language parser

## Phase 1 Goal: Core Parser + Level 0

**Target:** Fully functional EDTF Level 0 parser in `packages/core`

### What is Level 0?

Level 0 is the ISO 8601 profile - basic dates and intervals:
- Complete dates: `1985-04-12`
- Year-month: `1985-04`
- Year only: `1985`
- Date with time: `1985-04-12T23:20:30Z`
- Intervals: `1964/2008`, `2004-06/2006-08`

**No uncertainty, approximation, or unspecified digits in Level 0.**

## Implementation Strategy

### Step 1: Study Reference Implementations

Before writing code, study these:

**edtf.js (BSD-2-Clause):**
- Clone: `git clone https://github.com/inukshuk/edtf.js`
- Focus on: `test/` directory (copy their test cases legally)
- Study: Bitmask approach for uncertainty (we'll use this in Level 1+)
- Reference: Grammar rules in `src/edtf.ne`

**edtfy (MIT):**
- Clone: `git clone https://github.com/nicompte/edtfy`
- Focus on: `locales/` directory (copy locale files legally)
- Study: Natural language patterns in `edtfy.pegjs`

**Official Spec:**
- Reference: https://www.loc.gov/standards/datetime/
- Use examples from specification for test cases

### Step 2: Create Test Suite First (TDD Approach)

**In `packages/core/tests/level0.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest';
import { parse, isValid } from '../src/index.js';

describe('Level 0 - Complete Date', () => {
  it('should parse complete date', () => {
    const result = parse('1985-04-12');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.type).toBe('Date');
      expect(result.value.year).toBe(1985);
      expect(result.value.month).toBe(4);
      expect(result.value.day).toBe(12);
    }
  });

  it('should validate complete date', () => {
    expect(isValid('1985-04-12')).toBe(true);
    expect(isValid('1985-13-12')).toBe(false); // Invalid month
    expect(isValid('1985-02-30')).toBe(false); // Invalid day
  });

  // Add more tests from edtf.js test suite
});

describe('Level 0 - Year and Month', () => {
  it('should parse year-month', () => {
    const result = parse('1985-04');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.year).toBe(1985);
      expect(result.value.month).toBe(4);
      expect(result.value.day).toBeUndefined();
    }
  });
});

describe('Level 0 - Year', () => {
  it('should parse year only', () => {
    const result = parse('1985');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.year).toBe(1985);
    }
  });
});

describe('Level 0 - Intervals', () => {
  it('should parse year interval', () => {
    const result = parse('1964/2008');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.type).toBe('Interval');
      expect(result.value.start.year).toBe(1964);
      expect(result.value.end.year).toBe(2008);
    }
  });

  it('should parse month interval', () => {
    const result = parse('2004-06/2006-08');
    expect(result.success).toBe(true);
  });
});
```

### Step 3: Define Type System

**In `packages/core/src/types/index.ts`:**

```typescript
/**
 * Core EDTF Types
 * These are the foundational types for all EDTF objects
 */

// Precision levels
export type Precision = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

// EDTF conformance levels
export type EDTFLevel = 0 | 1 | 2;

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

// Date components
export interface DateComponents {
  year: number;
  month?: number;  // 1-12
  day?: number;    // 1-31
}

// Level 0 Date
export interface EDTFDate extends EDTFBase {
  type: 'Date';
  year: number;
  month?: number;
  day?: number;
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

// Level 0 Interval
export interface EDTFInterval extends EDTFBase {
  type: 'Interval';
  start: EDTFDate | EDTFDateTime;
  end: EDTFDate | EDTFDateTime;
}

// Parse result (discriminated union)
export type ParseResult<T = EDTFBase> =
  | { success: true; value: T; level: EDTFLevel }
  | { success: false; errors: ParseError[] };

// Parse error
export interface ParseError {
  code: string;
  message: string;
  position?: { start: number; end: number };
  suggestion?: string;
}
```

### Step 4: Implement Parser

**Choice for Phase 1:** Hand-written parser (simpler, smaller bundle)

**In `packages/core/src/parser/level0.ts`:**

```typescript
import type { ParseResult, EDTFDate, EDTFDateTime, EDTFInterval } from '../types/index.js';

/**
 * Parse EDTF Level 0 strings
 */
export function parseLevel0(input: string): ParseResult {
  input = input.trim();
  
  // Try to parse as interval first (contains '/')
  if (input.includes('/')) {
    return parseInterval(input);
  }
  
  // Try to parse as datetime (contains 'T')
  if (input.includes('T')) {
    return parseDateTime(input);
  }
  
  // Parse as date
  return parseDate(input);
}

function parseDate(input: string): ParseResult<EDTFDate> {
  // Match: YYYY, YYYY-MM, or YYYY-MM-DD
  const match = input.match(/^(-?\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  
  if (!match) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_FORMAT',
        message: `Invalid date format: ${input}`,
        suggestion: 'Use format: YYYY, YYYY-MM, or YYYY-MM-DD'
      }]
    };
  }
  
  const year = parseInt(match[1], 10);
  const month = match[2] ? parseInt(match[2], 10) : undefined;
  const day = match[3] ? parseInt(match[3], 10) : undefined;
  
  // Validate month
  if (month !== undefined && (month < 1 || month > 12)) {
    return {
      success: false,
      errors: [{
        code: 'INVALID_MONTH',
        message: `Month must be 01-12, got: ${match[2]}`,
        position: { start: 5, end: 7 }
      }]
    };
  }
  
  // Validate day
  if (day !== undefined && month !== undefined) {
    const maxDay = daysInMonth(year, month);
    if (day < 1 || day > maxDay) {
      return {
        success: false,
        errors: [{
          code: 'INVALID_DAY',
          message: `Day must be 01-${maxDay} for ${year}-${String(month).padStart(2, '0')}, got: ${match[3]}`,
          position: { start: 8, end: 10 }
        }]
      };
    }
  }
  
  const edtfDate: EDTFDate = {
    type: 'Date',
    level: 0,
    edtf: input,
    precision: day ? 'day' : month ? 'month' : 'year',
    year,
    month,
    day,
    get min() {
      return calculateMin(this);
    },
    get max() {
      return calculateMax(this);
    },
    toJSON() {
      return { type: this.type, year: this.year, month: this.month, day: this.day };
    },
    toString() {
      return this.edtf;
    }
  };
  
  return { success: true, value: edtfDate, level: 0 };
}

function parseDateTime(input: string): ParseResult<EDTFDateTime> {
  // TODO: Implement datetime parsing
  // Format: YYYY-MM-DDTHH:MM:SS[Z|±HH:MM]
  return {
    success: false,
    errors: [{ code: 'NOT_IMPLEMENTED', message: 'DateTime parsing not yet implemented' }]
  };
}

function parseInterval(input: string): ParseResult<EDTFInterval> {
  // TODO: Implement interval parsing
  // Format: START/END where START and END are dates or datetimes
  const parts = input.split('/');
  if (parts.length !== 2) {
    return {
      success: false,
      errors: [{ code: 'INVALID_INTERVAL', message: 'Interval must have exactly one "/" separator' }]
    };
  }
  
  return {
    success: false,
    errors: [{ code: 'NOT_IMPLEMENTED', message: 'Interval parsing not yet implemented' }]
  };
}

// Helper: Days in month (accounting for leap years)
function daysInMonth(year: number, month: number): number {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return days[month - 1] || 0;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Helper: Calculate min/max dates
function calculateMin(date: EDTFDate): Date {
  const year = date.year;
  const month = date.month ?? 1;
  const day = date.day ?? 1;
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function calculateMax(date: EDTFDate): Date {
  const year = date.year;
  const month = date.month ?? 12;
  const day = date.day ?? daysInMonth(year, month);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}
```

### Step 5: Public API

**In `packages/core/src/index.ts`:**

```typescript
/**
 * @edtf-ts/core
 * Modern TypeScript implementation of Extended Date/Time Format
 */

export const VERSION = '0.1.0';

// Export types
export type {
  EDTFBase,
  EDTFDate,
  EDTFDateTime,
  EDTFInterval,
  EDTFLevel,
  EDTFType,
  Precision,
  ParseResult,
  ParseError,
  DateComponents
} from './types/index.js';

// Export parser
export { parseLevel0 } from './parser/level0.js';

// Main parse function (Level 0 only for now)
export function parse(input: string): ParseResult {
  return parseLevel0(input);
}

// Validation
export function isValid(input: string, level: EDTFLevel = 0): boolean {
  if (level !== 0) {
    throw new Error('Only Level 0 is currently supported');
  }
  const result = parse(input);
  return result.success;
}

// Type guards
export function isEDTFDate(value: unknown): value is EDTFDate {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Date';
}

export function isEDTFDateTime(value: unknown): value is EDTFDateTime {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'DateTime';
}

export function isEDTFInterval(value: unknown): value is EDTFInterval {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Interval';
}
```

### Step 6: Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

## What Success Looks Like (Phase 1)

After Phase 1, these should all work:

```typescript
import { parse, isValid } from '@edtf-ts/core';

// Basic dates
parse('1985');           // ✅ Year
parse('1985-04');        // ✅ Year-month
parse('1985-04-12');     // ✅ Complete date

// Validation
isValid('1985-04-12');   // ✅ true
isValid('1985-13-01');   // ✅ false (invalid month)
isValid('1985-02-30');   // ✅ false (invalid day)

// With time
parse('1985-04-12T23:20:30Z');  // ✅ DateTime

// Intervals
parse('1964/2008');             // ✅ Year interval
parse('2004-06/2006-08');       // ✅ Month interval
parse('2004-02-01/2005-02-08'); // ✅ Day interval

// Type safety
const result = parse('1985-04-12');
if (result.success) {
  result.value.year   // TypeScript knows this exists
  result.value.month  // TypeScript knows this exists
  result.value.min    // Returns Date object
  result.value.max    // Returns Date object
}
```

## Development Workflow

1. **Write tests first** (TDD)
2. **Implement feature** to pass tests
3. **Run tests** (`pnpm test`)
4. **Check types** (`pnpm build`)
5. **Commit** with clear message

## Key Principles

1. **Type Safety First** - Use TypeScript to its fullest
2. **Test Everything** - Copy tests from edtf.js, add more
3. **Small Commits** - Commit working features incrementally
4. **Zero Dependencies** - Core package has no runtime dependencies
5. **Tree-Shakeable** - Each function can be imported individually

## Resources

- EDTF Spec: https://www.loc.gov/standards/datetime/
- edtf.js (reference): https://github.com/inukshuk/edtf.js
- edtfy (NL patterns): https://github.com/nicompte/edtfy
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/

## Next Steps After Phase 1

Once Level 0 is complete and tested:
1. Implement Level 1 (uncertainty, approximation, unspecified)
2. Implement Level 2 (sets, exponential years, etc.)
3. Build natural language parser (`@edtf-ts/natural`)
4. Build formatter (`@edtf-ts/format`)

## Questions to Ask if Stuck

1. "How does edtf.js handle this case?" (study their tests)
2. "What does the EDTF spec say?" (refer to official spec)
3. "Is this a Level 0 feature?" (stick to Level 0 for Phase 1)
4. "Does this maintain type safety?" (TypeScript should help, not hurt)

---

Good luck! You're building something that the EDTF community needs. 🚀
