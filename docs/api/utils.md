# Formatting & Utilities

Utility functions for formatting, validating, and working with EDTF dates. These functions are included in the main `@edtf-ts` package.

::: tip
This functionality was previously in a separate `@edtf-ts/utils` package. It's now part of the main `@edtf-ts` package.
:::

## Validators

Functions for validating and checking EDTF dates.

### isInRange()

```typescript
function isInRange(
  date: EDTFDate | EDTFDateTime,
  start: EDTFDate | EDTFDateTime | Date,
  end: EDTFDate | EDTFDateTime | Date
): boolean
```

Check if a date falls within a given range (with overlap detection).

```typescript
import { parse, isEDTFDate } from '@edtf-ts';
import { isInRange } from '@edtf-ts';

const date = parse('2000-06-15');
const start = parse('2000-01-01');
const end = parse('2000-12-31');

if (date.success && start.success && end.success &&
    isEDTFDate(date.value) && isEDTFDate(start.value) && isEDTFDate(end.value)) {
  isInRange(date.value, start.value, end.value);  // true
}
```

### isCompletelyInRange()

```typescript
function isCompletelyInRange(
  date: EDTFDate | EDTFDateTime,
  start: EDTFDate | EDTFDateTime | Date,
  end: EDTFDate | EDTFDateTime | Date
): boolean
```

Check if a date is completely contained within a given range.

### isLeapYear()

```typescript
function isLeapYear(year: number): boolean
```

Check if a year is a leap year.

```typescript
import { isLeapYear } from '@edtf-ts';

isLeapYear(2000);  // true
isLeapYear(2001);  // false
isLeapYear(2004);  // true
```

### isValidDate()

```typescript
function isValidDate(year: number, month: number, day: number): boolean
```

Check if a date is valid (proper month and day values).

### isUncertain()

```typescript
function isUncertain(date: EDTFDate): boolean
```

Check if a date has any uncertainty qualifications.

### isApproximate()

```typescript
function isApproximate(date: EDTFDate): boolean
```

Check if a date has any approximation qualifications.

### hasUnspecified()

```typescript
function hasUnspecified(date: EDTFDate): boolean
```

Check if a date has any unspecified digits.

[See all validators →](./validators)

## Formatters

Functions for formatting EDTF dates as human-readable strings.

### formatHuman()

```typescript
function formatHuman(value: EDTFBase, options?: FormatOptions): string
```

Format an EDTF date as a human-readable string.

```typescript
import { parse } from '@edtf-ts';
import { formatHuman } from '@edtf-ts';

const date = parse('1985-04-12');
if (date.success) {
  formatHuman(date.value);  // "April 12, 1985"
  formatHuman(date.value, { dateStyle: 'medium' });  // "Apr 12, 1985"
}

const uncertain = parse('1984?');
if (uncertain.success) {
  formatHuman(uncertain.value);  // "1984 (uncertain)"
}
```

**Options:**
- `includeQualifications` (boolean) - Include uncertainty/approximation indicators (default: `true`)
- `dateStyle` ('full' | 'long' | 'medium' | 'short') - Date format style (default: `'full'`)
- `locale` (string) - Locale for month/day names (default: `'en-US'`)

### formatISO()

```typescript
function formatISO(value: EDTFBase): string
```

Format an EDTF date as an ISO 8601 string (when possible).

```typescript
import { formatISO } from '@edtf-ts';

const date = parse('1985-04-12');
if (date.success) {
  formatISO(date.value);  // "1985-04-12"
}

const uncertain = parse('1984?');
if (uncertain.success) {
  formatISO(uncertain.value);  // "1984?" (can't be ISO 8601)
}
```

### formatRange()

```typescript
function formatRange(value: EDTFBase, options?: FormatOptions): string
```

Format a date range (min/max) as a human-readable string.

[See all formatters →](./formatters)

## Comparators

Functions for comparing and sorting EDTF dates.

### compare()

```typescript
function compare(
  a: EDTFBase,
  b: EDTFBase,
  mode?: 'min' | 'max' | 'midpoint'
): number
```

Compare two EDTF dates. Returns a negative number if a < b, positive if a > b, zero if equal.

```typescript
import { compare } from '@edtf-ts';

const d1 = parse('2000');
const d2 = parse('2001');

if (d1.success && d2.success) {
  compare(d1.value, d2.value);  // negative (2000 < 2001)
}
```

### sort()

```typescript
function sort(
  dates: EDTFBase[],
  mode?: 'min' | 'max' | 'midpoint',
  order?: 'asc' | 'desc'
): EDTFBase[]
```

Sort an array of EDTF dates.

```typescript
import { sort } from '@edtf-ts';

const dates = [parse('2001'), parse('2000'), parse('1999')]
  .filter(d => d.success)
  .map(d => d.value);

sort(dates);  // [1999, 2000, 2001]
sort(dates, 'min', 'desc');  // [2001, 2000, 1999]
```

### earliest() / latest()

```typescript
function earliest(dates: EDTFBase[], mode?: ComparisonMode): EDTFBase | undefined
function latest(dates: EDTFBase[], mode?: ComparisonMode): EDTFBase | undefined
```

Find the earliest or latest date in an array.

### groupByYear() / groupByMonth()

```typescript
function groupByYear(dates: (EDTFDate | EDTFDateTime)[]): Map<number, (EDTFDate | EDTFDateTime)[]>
function groupByMonth(dates: (EDTFDate | EDTFDateTime)[]): Map<string, (EDTFDate | EDTFDateTime)[]>
```

Group dates by year or month.

### duration()

```typescript
function duration(start: EDTFBase, end: EDTFBase, mode?: ComparisonMode): number
function durationInDays(start: EDTFBase, end: EDTFBase, mode?: ComparisonMode): number
function durationInYears(start: EDTFBase, end: EDTFBase, mode?: ComparisonMode): number
```

Calculate duration between two dates.

[See all comparators →](./comparators)
