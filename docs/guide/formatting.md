# Formatting EDTF Dates

This guide covers formatting EDTF objects into human-readable strings.

## Overview

EDTF dates can be formatted in several ways:
- **EDTF format** - The standard EDTF string representation (always available via `.edtf`)
- **Human-readable** - Natural language representation using `formatHuman()`
- **ISO 8601** - Standard ISO format when applicable using `formatISO()`

## The `.edtf` Property

Every parsed EDTF object has an `.edtf` property containing the canonical EDTF string:

```typescript
import { parse } from '@edtf-ts/core';

const result = parse('1985-04-12');
if (result.success) {
  console.log(result.value.edtf);  // '1985-04-12'
}

const qualified = parse('1984?');
if (qualified.success) {
  console.log(qualified.value.edtf);  // '1984?'
}
```

## Human-Readable Formatting

Use the `formatHuman()` function from `@edtf-ts/utils` to create natural language strings:

```typescript
import { parse } from '@edtf-ts/core';
import { formatHuman } from '@edtf-ts/utils';

const date = parse('1985-04-12');
if (date.success) {
  formatHuman(date.value);  // 'April 12, 1985'
}
```

### Format Options

```typescript
interface FormatOptions {
  /** Include uncertainty/approximation indicators */
  includeQualifications?: boolean;  // default: true

  /** Date format style */
  dateStyle?: 'full' | 'long' | 'medium' | 'short';  // default: 'full'

  /** Locale for month/day names */
  locale?: string;  // default: 'en-US'
}
```

### Examples

```typescript
const date = parse('1985-04-12');
if (date.success) {
  formatHuman(date.value, { dateStyle: 'full' });    // 'April 12, 1985'
  formatHuman(date.value, { dateStyle: 'long' });    // 'April 12, 1985'
  formatHuman(date.value, { dateStyle: 'medium' });  // 'Apr 12, 1985'
  formatHuman(date.value, { dateStyle: 'short' });   // '4/12/1985'
}
```

### Qualified Dates

Qualifications are included by default:

```typescript
const uncertain = parse('1984?');
if (uncertain.success) {
  formatHuman(uncertain.value);  // '1984 (uncertain)'
  formatHuman(uncertain.value, { includeQualifications: false });  // '1984'
}

const approximate = parse('1950~');
if (approximate.success) {
  formatHuman(approximate.value);  // 'circa 1950' or '1950 (approximate)'
}

const both = parse('1984%');
if (both.success) {
  formatHuman(both.value);  // '1984 (uncertain and approximate)'
}
```

### Intervals

```typescript
const interval = parse('1964/2008');
if (interval.success) {
  formatHuman(interval.value);  // '1964 to 2008'
}

const openEnd = parse('1985-04-12/..');
if (openEnd.success) {
  formatHuman(openEnd.value);  // 'April 12, 1985 onwards'
}
```

### Seasons

```typescript
const season = parse('2001-21');
if (season.success) {
  formatHuman(season.value);  // 'Spring 2001'
}
```

## ISO 8601 Formatting

Use `formatISO()` to get ISO 8601 format when possible:

```typescript
import { formatISO } from '@edtf-ts/utils';

const date = parse('1985-04-12');
if (date.success) {
  formatISO(date.value);  // '1985-04-12'
}

// EDTF-specific features can't be converted to ISO 8601
const uncertain = parse('1984?');
if (uncertain.success) {
  formatISO(uncertain.value);  // '1984?' (returns EDTF, not ISO)
}
```

## Date Range Formatting

Use `formatRange()` to format the min/max bounds of a date:

```typescript
import { formatRange } from '@edtf-ts/utils';

const decade = parse('198X');
if (decade.success) {
  formatRange(decade.value);  // '1980 to 1989'
}

const interval = parse('1964/2008');
if (interval.success) {
  formatRange(interval.value);  // '1964 to 2008'
}
```

## Accessing Date Components

All parsed dates have a standard set of accessors:

```typescript
const result = parse('1985-04-12');
if (result.success) {
  const date = result.value;

  // Direct component access
  console.log(date.year);   // 1985
  console.log(date.month);  // 4
  console.log(date.day);    // 12

  // Min/max bounds (as JavaScript Date objects)
  console.log(date.min);    // Date: 1985-04-12T00:00:00.000Z
  console.log(date.max);    // Date: 1985-04-12T23:59:59.999Z

  // Precision
  console.log(date.precision);  // 'day'
}
```

### Precision-Based Bounds

Imprecise dates have different min/max values:

```typescript
const year = parse('1985');
if (year.success) {
  console.log(year.value.min);  // 1985-01-01
  console.log(year.value.max);  // 1985-12-31
}

const month = parse('1985-04');
if (month.success) {
  console.log(month.value.min);  // 1985-04-01
  console.log(month.value.max);  // 1985-04-30
}
```

## Converting to JavaScript Date

Use the `.min` and `.max` properties to get JavaScript Date objects:

```typescript
const result = parse('1985-04-12');
if (result.success) {
  const jsDate = result.value.min;
  console.log(jsDate.toISOString());  // '1985-04-12T00:00:00.000Z'
}
```

::: warning
For imprecise or uncertain dates, `.min` and `.max` may differ significantly. Always consider which bound is appropriate for your use case.
:::

## Localization

Format dates in different locales:

```typescript
const date = parse('1985-04-12');
if (date.success) {
  formatHuman(date.value, { locale: 'en-US' });  // 'April 12, 1985'
  formatHuman(date.value, { locale: 'de-DE' });  // '12. April 1985'
  formatHuman(date.value, { locale: 'ja-JP' });  // '1985年4月12日'
}
```
