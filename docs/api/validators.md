# Validators

Validation utilities from `@edtf-ts/core` for checking EDTF date properties.

::: tip
These functions are part of the main `@edtf-ts/core` package.
:::

## Functions

### isInRange()

Check if a date falls within a given range (with overlap detection).

```typescript
function isInRange(
  date: EDTFDate | EDTFDateTime,
  start: EDTFDate | EDTFDateTime | Date,
  end: EDTFDate | EDTFDateTime | Date
): boolean
```

A date is "in range" if its possible values overlap with the given range.

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';
import { isInRange } from '@edtf-ts/core';

const date = parse('2000-06');  // June 2000
const start = new Date('2000-01-01');
const end = new Date('2000-12-31');

if (date.success && isEDTFDate(date.value)) {
  isInRange(date.value, start, end);  // true
}
```

### isCompletelyInRange()

Check if a date is **completely** contained within a range.

```typescript
function isCompletelyInRange(
  date: EDTFDate | EDTFDateTime,
  start: EDTFDate | EDTFDateTime | Date,
  end: EDTFDate | EDTFDateTime | Date
): boolean
```

Unlike `isInRange`, this requires the entire date range to be within the bounds.

```typescript
const month = parse('2000-06');
const year = parse('2000');

if (month.success && year.success &&
    isEDTFDate(month.value) && isEDTFDate(year.value)) {
  isCompletelyInRange(month.value, year.value.min, year.value.max);  // true
}
```

### isLeapYear()

Check if a year is a leap year.

```typescript
function isLeapYear(year: number): boolean
```

```typescript
import { isLeapYear } from '@edtf-ts/core';

isLeapYear(2000);  // true (divisible by 400)
isLeapYear(2001);  // false
isLeapYear(2004);  // true (divisible by 4)
isLeapYear(1900);  // false (divisible by 100 but not 400)
```

### getDaysInMonth()

Get the number of days in a given month.

```typescript
function getDaysInMonth(year: number, month: number): number
```

```typescript
import { getDaysInMonth } from '@edtf-ts/core';

getDaysInMonth(2000, 2);  // 29 (leap year)
getDaysInMonth(2001, 2);  // 28
getDaysInMonth(2000, 4);  // 30
getDaysInMonth(2000, 12); // 31
```

### isValidDate()

Check if a date is valid (proper month and day values).

```typescript
function isValidDate(year: number, month: number, day: number): boolean
```

```typescript
import { isValidDate } from '@edtf-ts/core';

isValidDate(2000, 2, 29);  // true (leap year)
isValidDate(2001, 2, 29);  // false
isValidDate(2000, 13, 1);  // false (invalid month)
isValidDate(2000, 4, 31);  // false (April has 30 days)
```

### isValidInterval()

Check if an interval is valid (start is before or equal to end).

```typescript
function isValidInterval(interval: EDTFInterval): boolean
```

```typescript
import { parse, isEDTFInterval } from '@edtf-ts/core';
import { isValidInterval } from '@edtf-ts/core';

const valid = parse('2000/2010');
const invalid = parse('2010/2000');

if (valid.success && isEDTFInterval(valid.value)) {
  isValidInterval(valid.value);  // true
}
```

### isUncertain()

Check if a date has any uncertainty qualifications.

```typescript
function isUncertain(date: EDTFDate): boolean
```

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';
import { isUncertain } from '@edtf-ts/core';

const uncertain = parse('1984?');
const certain = parse('1984');

if (uncertain.success && isEDTFDate(uncertain.value)) {
  isUncertain(uncertain.value);  // true
}

if (certain.success && isEDTFDate(certain.value)) {
  isUncertain(certain.value);  // false
}
```

### isApproximate()

Check if a date has any approximation qualifications.

```typescript
function isApproximate(date: EDTFDate): boolean
```

```typescript
const approximate = parse('1984~');
const exact = parse('1984');

if (approximate.success && isEDTFDate(approximate.value)) {
  isApproximate(approximate.value);  // true
}
```

### hasUnspecified()

Check if a date has any unspecified digits.

```typescript
function hasUnspecified(date: EDTFDate): boolean
```

```typescript
const decade = parse('198X');
const year = parse('1984');

if (decade.success && isEDTFDate(decade.value)) {
  hasUnspecified(decade.value);  // true
}

if (year.success && isEDTFDate(year.value)) {
  hasUnspecified(year.value);  // false
}
```
