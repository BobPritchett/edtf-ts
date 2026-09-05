# Formatting EDTF Dates

This guide covers formatting EDTF objects into human-readable strings.

## Overview

EDTF dates can be formatted in several ways:
- **EDTF format** - The standard EDTF string representation (always available via `.edtf`)
- **Human-readable** - Natural language representation using `formatHuman()`
- **ISO 8601** - Standard ISO format when applicable using `formatISO()`

## The `.edtf` Property

Every parsed EDTF object has an `.edtf` property containing the original parsed EDTF string:

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

Use the `formatHuman()` function from `@edtf-ts/core` to create natural language strings:

```typescript
import { parse } from '@edtf-ts/core';
import { formatHuman } from '@edtf-ts/core';

const date = parse('1985-04-12');
if (date.success) {
  formatHuman(date.value);  // 'April 12, 1985'
}
```

### English, Spanish, and French

```typescript
const result = parse('1870-03-12');
if (result.success) {
  formatHuman(result.value, { locale: 'es-ES' }); // '12 de marzo de 1870'
  formatHuman(result.value, { locale: 'fr-FR' }); // '12 mars 1870'
}
```

Locale selects complete phrases for qualifiers, intervals, sets, seasons, eras, and age/birthday rendering, as well as date names and ordering. Pass the same locale to `parseNatural` or `parseAgeBirthday`. APIs default to `en-US`; the [playground](../playground) instead starts with the browser’s locale and provides one page-wide override.

Display phrases are not a lossless serialization format. Preserve the EDTF string for storage, including component qualification scope. See the [tested multilingual examples](./language-examples) and [migration guide](./semantics-migration).

### Known days in unspecified months

`1870-XX-12` retains day 12 even though the month is unspecified. It renders as `12th of unknown month, 1870` in English, `día 12 de mes desconocido, 1870` in Spanish, and `12 d'un mois inconnu, 1870` in French. These phrases round-trip, including ordinal endings, year zero, qualifiers, and unknown years. `XXXX-01-12` renders in English as `January 12, unknown year`.

Date-to-season intervals such as `1988-03/1990-21` also round-trip. See the [compatibility review](./compatibility-review) for the preferred equivalents of the supplied rendering examples; modern EDTF keeps open/unknown endpoints, numbered centuries/year masks, and intervals/unspecified months distinct.

### Compact year collections

`formatHuman` groups runs of two or more adjacent exact years without sorting members or filling gaps. Sets remain date choices; lists still include every member. For `[1870..1880]`, the renderings are `One of: 1870 through 1880`, `Una de estas fechas: 1870 a 1880`, and `Une de ces dates: 1870 à 1880`. They parse back to the same compact EDTF range.

Use `compactYearRanges` for the EDTF spelling itself:

```typescript
import { parse, compactYearRanges } from '@edtf-ts/core';

const years = parse('[1667,1668,1670,1671,1672]');
if (years.success) {
  compactYearRanges(years.value); // '[1667..1668,1670..1672]'
  years.value.edtf;              // '[1667,1668,1670,1671,1672]'
}
```

Compaction preserves order, duplicates, open bounds, gaps, and qualifications. It does not merge qualified years, masks, seasons, months, or days. Non-collection values return their original string. Exact extended years render with all digits (without thousands separators or rounded “million” wording), preserving range endpoints.

### Format Options

```typescript
interface FormatOptions {
  /** Include uncertainty/approximation indicators */
  includeQualifications?: boolean;  // default: true

  /** Date format style */
  dateStyle?: 'full' | 'long' | 'medium' | 'short';  // default: 'full'

  /** Locale for complete phrases, date names, and ordering */
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
import { formatISO } from '@edtf-ts/core';

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
import { formatRange } from '@edtf-ts/core';

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
