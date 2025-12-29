# Basic Usage Examples

Practical examples for getting started with EDTF-TS.

## Parsing Simple Dates

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';

// Complete date
const complete = parse('1985-04-12');
if (complete.success && isEDTFDate(complete.value)) {
  console.log(complete.value.year);   // 1985
  console.log(complete.value.month);  // 4
  console.log(complete.value.day);    // 12
}

// Year and month
const yearMonth = parse('1985-04');
if (yearMonth.success && isEDTFDate(yearMonth.value)) {
  console.log(yearMonth.value.year);   // 1985
  console.log(yearMonth.value.month);  // 4
  console.log(yearMonth.value.day);    // undefined
}

// Year only
const yearOnly = parse('1985');
if (yearOnly.success && isEDTFDate(yearOnly.value)) {
  console.log(yearOnly.value.year);   // 1985
  console.log(yearOnly.value.month);  // undefined
}
```

## Working with Uncertainty

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';

// Uncertain date
const uncertain = parse('1984?');
if (uncertain.success && isEDTFDate(uncertain.value)) {
  console.log(uncertain.value.qualification?.uncertain);  // true
  console.log(uncertain.value.edtf);  // '1984?'
}

// Approximate date
const approx = parse('1950~');
if (approx.success && isEDTFDate(approx.value)) {
  console.log(approx.value.qualification?.approximate);  // true
}

// Both uncertain and approximate
const both = parse('2004-06%');
if (both.success && isEDTFDate(both.value)) {
  console.log(both.value.qualification?.uncertainApproximate);  // true
}
```

## Unspecified Digits

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';

// Decade (1990s)
const decade = parse('199X');
if (decade.success && isEDTFDate(decade.value)) {
  console.log(decade.value.year);  // "199X"
  console.log(decade.value.min);   // 1990-01-01T00:00:00.000Z
  console.log(decade.value.max);   // 1999-12-31T23:59:59.999Z
}

// Century (1900s)
const century = parse('19XX');
if (century.success && isEDTFDate(century.value)) {
  console.log(century.value.min);  // 1900-01-01T00:00:00.000Z
  console.log(decade.value.max);   // 1999-12-31T23:59:59.999Z
}

// Unspecified month
const unspecMonth = parse('2004-XX');

// Unspecified day
const unspecDay = parse('2004-06-XX');
```

## Date Intervals

```typescript
import { parse, isEDTFInterval } from '@edtf-ts/core';

// Simple interval
const interval = parse('1964/2008');
if (interval.success && isEDTFInterval(interval.value)) {
  console.log(interval.value.start?.year);  // 1964
  console.log(interval.value.end?.year);    // 2008
}

// Iterate through years
if (interval.success && isEDTFInterval(interval.value)) {
  for (const year of interval.value.by!('year')) {
    console.log(year.edtf);  // '1964', '1965', ..., '2008'
  }
}

// Open-ended intervals
const openEnd = parse('1985-04-12/..');
const openStart = parse('../1985-04-12');

// Unknown endpoints
const unknownEnd = parse('1985-04-12/');
const unknownStart = parse('/1985-04-12');
```

## Comparison Methods

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';

const d1 = parse('2000');
const d2 = parse('2001');

if (d1.success && d2.success && isEDTFDate(d1.value) && isEDTFDate(d2.value)) {
  console.log(d1.value.isBefore!(d2.value));  // true
  console.log(d2.value.isAfter!(d1.value));   // true
  console.log(d1.value.equals!(d2.value));    // false
}

// Coverage (containment)
const year = parse('2000');
const month = parse('2000-06');

if (year.success && month.success && isEDTFDate(year.value) && isEDTFDate(month.value)) {
  console.log(year.value.covers!(month.value));  // true (year contains month)
}
```

## Formatting Dates

```typescript
import { parse } from '@edtf-ts/core';
import { formatHuman, formatISO } from '@edtf-ts/utils';

// Format as human-readable
const date = parse('1985-04-12');
if (date.success) {
  formatHuman(date.value);  // "April 12, 1985"
  formatHuman(date.value, { dateStyle: 'medium' });  // "Apr 12, 1985"
  formatHuman(date.value, { dateStyle: 'short' });   // "4/12/1985"
}

// Format with qualifications
const uncertain = parse('1984?');
if (uncertain.success) {
  formatHuman(uncertain.value);  // "1984 (uncertain)"
  formatHuman(uncertain.value, { includeQualifications: false });  // "1984"
}

// Format as ISO 8601
const iso = parse('1985-04-12');
if (iso.success) {
  formatISO(iso.value);  // "1985-04-12"
}
```

## Validation

```typescript
import { isValid } from '@edtf-ts/core';
import { isValidDate, isLeapYear } from '@edtf-ts/utils';

// Validate EDTF strings
isValid('1985-04-12');  // true
isValid('1985-13-01');  // false (invalid month)
isValid('2000-02-29');  // true (leap year)
isValid('2001-02-29');  // false (not a leap year)

// Validate individual dates
isValidDate(2000, 2, 29);  // true
isValidDate(2001, 2, 29);  // false

// Check leap years
isLeapYear(2000);  // true
isLeapYear(1900);  // false (century rule)
```

## Sorting Dates

```typescript
import { parse } from '@edtf-ts/core';
import { sort, earliest, latest } from '@edtf-ts/utils';

const dates = [
  parse('2001'),
  parse('2000'),
  parse('1999')
].filter(d => d.success).map(d => d.value);

// Sort ascending
const sorted = sort(dates);  // [1999, 2000, 2001]

// Sort descending
const desc = sort(dates, 'min', 'desc');  // [2001, 2000, 1999]

// Find earliest/latest
earliest(dates);  // 1999
latest(dates);    // 2001
```

## Error Handling

```typescript
import { parse } from '@edtf-ts/core';

const result = parse('1985-13-01');

if (!result.success) {
  console.log(result.errors[0].code);        // 'INVALID_MONTH'
  console.log(result.errors[0].message);     // 'Month must be 01-12, got: 13'
  console.log(result.errors[0].position);    // { start: 5, end: 7 }
}
```

## Working with JavaScript Dates

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';

const result = parse('1985-04-12');

if (result.success && isEDTFDate(result.value)) {
  // Get min/max as JavaScript Date objects
  const minDate: Date = result.value.min;
  const maxDate: Date = result.value.max;

  // Compare with JavaScript dates
  const jsDate = new Date('1985-04-12');
  console.log(result.value.isBefore!(jsDate));
}
```

## Next Steps

- [Parsing Guide](../guide/parsing) - Deep dive into parsing
- [Formatting Guide](../guide/formatting) - Advanced formatting
- [Interval Examples](./intervals) - Working with date ranges
- [Cultural Heritage](./cultural-heritage) - Real-world museum use case
