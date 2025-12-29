# @edtf-ts/utils

Utility functions for working with EDTF dates from [@edtf-ts/core](../core).

## Features

- **Validators**: Range checking, leap years, uncertainty detection
- **Formatters**: Human-readable output, ISO 8601 conversion, range formatting
- **Comparators**: Sorting, grouping, duration calculations, overlap detection
- **Type-Safe**: Fully typed with TypeScript 5.0+
- **Zero Additional Dependencies**: Only depends on @edtf-ts/core
- **Tree-Shakeable**: Import only what you need
- **Well-Tested**: 68 test cases covering all utilities

## Installation

```bash
pnpm add @edtf-ts/utils
# or
npm install @edtf-ts/utils
# or
yarn add @edtf-ts/utils
```

## Quick Start

```typescript
import { parse } from '@edtf-ts/core';
import { formatHuman, isInRange, sort } from '@edtf-ts/utils';

// Format dates as human-readable strings
const date = parse('1985-04-12');
if (date.success) {
  formatHuman(date.value); // "April 12, 1985"
}

// Check if a date is in range
const testDate = parse('2000-06-15');
const start = parse('2000-01-01');
const end = parse('2000-12-31');

if (testDate.success && start.success && end.success) {
  isInRange(testDate.value, start.value, end.value); // true
}

// Sort dates
const dates = [parse('2001'), parse('2000'), parse('1999')];
const validDates = dates.filter(d => d.success).map(d => d.value);
sort(validDates); // [1999, 2000, 2001]
```

## API Reference

### Validators

#### `isInRange(date, start, end): boolean`

Check if a date falls within a given range (with overlap detection).

```typescript
const date = parse('2000-06-15');
const start = parse('2000-01-01');
const end = parse('2000-12-31');

if (date.success && start.success && end.success) {
  isInRange(date.value, start.value, end.value); // true
}
```

#### `isCompletelyInRange(date, start, end): boolean`

Check if a date is completely contained within a given range.

```typescript
const month = parse('2000-06');
const year = parse('2000');

if (month.success && year.success) {
  isCompletelyInRange(month.value, year.value.min, year.value.max); // true
}
```

#### `isLeapYear(year): boolean`

Check if a year is a leap year.

```typescript
isLeapYear(2000); // true
isLeapYear(2001); // false
isLeapYear(2004); // true
```

#### `getDaysInMonth(year, month): number`

Get the number of days in a given month.

```typescript
getDaysInMonth(2000, 2); // 29 (leap year)
getDaysInMonth(2001, 2); // 28
getDaysInMonth(2000, 4); // 30
```

#### `isValidDate(year, month, day): boolean`

Check if a date is valid (proper month and day values).

```typescript
isValidDate(2000, 2, 29); // true (leap year)
isValidDate(2001, 2, 29); // false (not a leap year)
isValidDate(2000, 13, 1); // false (invalid month)
```

#### `isValidInterval(interval): boolean`

Check if an interval is valid (start is before or equal to end).

```typescript
const interval = parse('2000/2010');
if (interval.success && isEDTFInterval(interval.value)) {
  isValidInterval(interval.value); // true
}
```

#### `isUncertain(date): boolean`

Check if a date has any uncertainty qualifications.

```typescript
const uncertain = parse('1984?');
if (uncertain.success && isEDTFDate(uncertain.value)) {
  isUncertain(uncertain.value); // true
}
```

#### `isApproximate(date): boolean`

Check if a date has any approximation qualifications.

```typescript
const approx = parse('1984~');
if (approx.success && isEDTFDate(approx.value)) {
  isApproximate(approx.value); // true
}
```

#### `hasUnspecified(date): boolean`

Check if a date has any unspecified digits.

```typescript
const unspec = parse('199X');
if (unspec.success && isEDTFDate(unspec.value)) {
  hasUnspecified(unspec.value); // true
}
```

### Formatters

#### `formatHuman(value, options?): string`

Format an EDTF date as a human-readable string.

**Options:**
- `includeQualifications` (boolean): Include uncertainty/approximation indicators (default: `true`)
- `dateStyle` ('full' | 'long' | 'medium' | 'short'): Date format style (default: `'full'`)
- `locale` (string): Locale for month/day names (default: `'en-US'`)

```typescript
const date = parse('1985-04-12');
if (date.success) {
  formatHuman(date.value); // "April 12, 1985"
  formatHuman(date.value, { dateStyle: 'medium' }); // "Apr 12, 1985"
  formatHuman(date.value, { dateStyle: 'short' }); // "4/12/1985"
}

const uncertain = parse('1984?');
if (uncertain.success) {
  formatHuman(uncertain.value); // "1984 (uncertain)"
  formatHuman(uncertain.value, { includeQualifications: false }); // "1984"
}

const partial = parse('?2004-06-~11');
if (partial.success) {
  formatHuman(partial.value);
  // "June 11, 2004 (year uncertain, day approximate)"
}
```

#### `formatISO(value): string`

Format an EDTF date as an ISO 8601 string (when possible). Falls back to EDTF string for dates that can't be represented in ISO 8601.

```typescript
const date = parse('1985-04-12');
if (date.success) {
  formatISO(date.value); // "1985-04-12"
}

const uncertain = parse('1984?');
if (uncertain.success) {
  formatISO(uncertain.value); // "1984?" (can't be ISO 8601)
}

const dt = parse('1985-04-12T23:20:30Z');
if (dt.success) {
  formatISO(dt.value); // "1985-04-12T23:20:30Z"
}
```

#### `formatRange(value, options?): string`

Format a date range (min/max) as a human-readable string.

```typescript
const date = parse('1985-04');
if (date.success) {
  formatRange(date.value); // "April 1, 1985 to April 30, 1985"
}
```

### Comparators

#### `compare(a, b, mode?): number`

Compare two EDTF dates. Returns a negative number if a < b, positive if a > b, zero if equal.

**Modes:**
- `'min'`: Compare using the earliest possible date (default)
- `'max'`: Compare using the latest possible date
- `'midpoint'`: Compare using the midpoint between min and max

```typescript
const d1 = parse('2000');
const d2 = parse('2001');

if (d1.success && d2.success) {
  compare(d1.value, d2.value); // negative (2000 < 2001)
  compare(d2.value, d1.value); // positive (2001 > 2000)
  compare(d1.value, d1.value); // 0 (equal)
}
```

#### `sort(dates, mode?, order?): EDTFBase[]`

Sort an array of EDTF dates.

**Parameters:**
- `dates`: Array of dates to sort
- `mode`: Comparison mode (default: `'min'`)
- `order`: Sort order: `'asc'` or `'desc'` (default: `'asc'`)

```typescript
const dates = [parse('2001'), parse('2000'), parse('1999')];
const validDates = dates.filter(d => d.success).map(d => d.value);

sort(validDates); // [1999, 2000, 2001]
sort(validDates, 'min', 'desc'); // [2001, 2000, 1999]
```

#### `earliest(dates, mode?): EDTFBase | undefined`

Find the earliest date in an array.

```typescript
const dates = [parse('2001'), parse('2000'), parse('1999')];
const validDates = dates.filter(d => d.success).map(d => d.value);

earliest(validDates); // 1999
```

#### `latest(dates, mode?): EDTFBase | undefined`

Find the latest date in an array.

```typescript
const dates = [parse('2001'), parse('2000'), parse('1999')];
const validDates = dates.filter(d => d.success).map(d => d.value);

latest(validDates); // 2001
```

#### `groupByYear(dates): Map<number, EDTFDate[]>`

Group dates by year.

```typescript
const dates = [parse('2000-01'), parse('2000-06'), parse('2001-01')];
const validDates = dates.filter(d => d.success && isEDTFDate(d.value)).map(d => d.value);

groupByYear(validDates);
// Map {
//   2000 => [2000-01, 2000-06],
//   2001 => [2001-01]
// }
```

#### `groupByMonth(dates): Map<string, EDTFDate[]>`

Group dates by month (within the same year).

```typescript
const dates = [parse('2000-01-15'), parse('2000-01-20'), parse('2000-02-10')];
const validDates = dates.filter(d => d.success && isEDTFDate(d.value)).map(d => d.value);

groupByMonth(validDates);
// Map {
//   '2000-01' => [2000-01-15, 2000-01-20],
//   '2000-02' => [2000-02-10]
// }
```

#### `duration(start, end, mode?): number`

Calculate the duration between two dates in milliseconds.

```typescript
const start = parse('2000-01-01');
const end = parse('2000-12-31');

if (start.success && end.success) {
  duration(start.value, end.value); // milliseconds in ~1 year
}
```

#### `durationInDays(start, end, mode?): number`

Calculate the duration between two dates in days.

```typescript
const start = parse('2000-01-01');
const end = parse('2000-01-08');

if (start.success && end.success) {
  durationInDays(start.value, end.value); // ~7
}
```

#### `durationInYears(start, end, mode?): number`

Calculate the duration between two dates in years.

```typescript
const start = parse('2000');
const end = parse('2005');

if (start.success && end.success) {
  durationInYears(start.value, end.value); // ~5
}
```

#### `findOverlaps(dates): [EDTFBase, EDTFBase][]`

Find overlapping dates in an array. Returns pairs of dates whose min/max ranges overlap.

```typescript
const dates = [parse('2000'), parse('2000-06'), parse('2001')];
const validDates = dates.filter(d => d.success).map(d => d.value);

findOverlaps(validDates);
// [[2000, 2000-06]] (2000-06 is contained within 2000)
```

#### `unique(dates): EDTFBase[]`

Remove duplicate dates from an array. Dates are considered duplicates if they have the same EDTF string representation.

```typescript
const dates = [parse('2000'), parse('2000'), parse('2001')];
const validDates = dates.filter(d => d.success).map(d => d.value);

unique(validDates); // [2000, 2001]
```

## Examples

### Range Validation

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';
import { isInRange, isCompletelyInRange } from '@edtf-ts/utils';

// Check if a specific date falls in a year
const date = parse('2000-06-15');
const year = parse('2000');

if (date.success && year.success && isEDTFDate(date.value) && isEDTFDate(year.value)) {
  isInRange(date.value, year.value.min, year.value.max); // true
  isCompletelyInRange(date.value, year.value.min, year.value.max); // true
}

// Check if a year overlaps with a month (but is not completely contained)
if (year.success && date.success && isEDTFDate(year.value) && isEDTFDate(date.value)) {
  isInRange(year.value, date.value.min, date.value.max); // true (overlaps)
  isCompletelyInRange(year.value, date.value.min, date.value.max); // false (not fully contained)
}
```

### Formatting with Qualifications

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';
import { formatHuman } from '@edtf-ts/utils';

const dates = [
  '1984?',           // Uncertain
  '1984~',           // Approximate
  '1984%',           // Uncertain and approximate
  '?2004-06-~11',   // Partial qualification
];

for (const edtf of dates) {
  const result = parse(edtf);
  if (result.success && isEDTFDate(result.value)) {
    console.log(formatHuman(result.value));
  }
}
// Output:
// "1984 (uncertain)"
// "1984 (approximate)"
// "1984 (uncertain/approximate)"
// "June 11, 2004 (year uncertain, day approximate)"
```

### Sorting and Grouping

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';
import { sort, groupByYear } from '@edtf-ts/utils';

const edtfStrings = [
  '2001-06',
  '2000-12',
  '2001-01',
  '2000-06',
  '1999-12',
];

const dates = edtfStrings
  .map(s => parse(s))
  .filter(d => d.success && isEDTFDate(d.value))
  .map(d => d.value);

// Sort chronologically
const sorted = sort(dates);
console.log(sorted.map(d => d.edtf));
// ['1999-12', '2000-06', '2000-12', '2001-01', '2001-06']

// Group by year
const byYear = groupByYear(dates);
for (const [year, dates] of byYear) {
  console.log(`${year}: ${dates.map(d => d.edtf).join(', ')}`);
}
// 1999: 1999-12
// 2000: 2000-06, 2000-12
// 2001: 2001-01, 2001-06
```

### Duration Calculations

```typescript
import { parse } from '@edtf-ts/core';
import { durationInDays, durationInYears } from '@edtf-ts/utils';

const start = parse('2000-01-01');
const end = parse('2005-12-31');

if (start.success && end.success) {
  console.log(`Days: ${durationInDays(start.value, end.value)}`);
  console.log(`Years: ${durationInYears(start.value, end.value)}`);
}
// Days: ~2190
// Years: ~6
```

## Development

```bash
# Run tests
pnpm test

# Build
pnpm build

# Watch mode for development
pnpm dev

# Type check
pnpm type-check
```

## License

MIT

## Related Packages

- [@edtf-ts/core](../core) - Core EDTF parsing and validation

## Contributing

This is part of the `edtf-ts` monorepo. See the main repository for contribution guidelines.
