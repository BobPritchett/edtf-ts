# Formatters

Formatting utilities from `@edtf-ts/core` for converting EDTF dates to strings.

::: tip
These functions are part of the main `@edtf-ts/core` package.
:::

## Functions

### formatHuman()

Format an EDTF date as a human-readable string.

```typescript
function formatHuman(value: EDTFBase, options?: FormatOptions): string
```

#### Options

```typescript
interface FormatOptions {
  /** Include uncertainty/approximation indicators (default: true) */
  includeQualifications?: boolean;
  /** Date format style (default: 'full') */
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  /** Locale for month/day names (default: 'en-US') */
  locale?: string;
  /** Era marker style: 'long', 'short', or 'narrow' (default: 'short') */
  era?: 'long' | 'short' | 'narrow';
  /** When to show era: 'auto', 'always', or 'never' (default: 'auto') */
  eraDisplay?: 'auto' | 'always' | 'never';
  /** Era notation: 'bc-ad' or 'bce-ce' (default: 'bc-ad') */
  eraNotation?: 'bc-ad' | 'bce-ce';
}
```

#### Examples

```typescript
import { parse } from '@edtf-ts/core';
import { formatHuman } from '@edtf-ts/core';

// Basic formatting
const date = parse('1985-04-12');
if (date.success) {
  formatHuman(date.value);  // "April 12, 1985"
  formatHuman(date.value, { dateStyle: 'medium' });  // "Apr 12, 1985"
  formatHuman(date.value, { dateStyle: 'short' });   // "4/12/1985"
}

// Qualified dates
const uncertain = parse('1984?');
if (uncertain.success) {
  formatHuman(uncertain.value);  // "1984 (uncertain)"
  formatHuman(uncertain.value, { includeQualifications: false });  // "1984"
}

// Intervals
const interval = parse('1964/2008');
if (interval.success) {
  formatHuman(interval.value);  // "1964 to 2008"
}

// Seasons
const season = parse('2001-21');
if (season.success) {
  formatHuman(season.value);  // "Spring 2001"
}

// BC/BCE dates
const bc = parse('-0043');  // 44 BC
if (bc.success) {
  formatHuman(bc.value);  // "44 BC"
  formatHuman(bc.value, { era: 'long' });  // "44 Before Christ"
  formatHuman(bc.value, { eraNotation: 'bce-ce' });  // "44 BCE"
}
```

### formatISO()

Format an EDTF date as an ISO 8601 string (when possible).

```typescript
function formatISO(value: EDTFBase): string
```

Falls back to the EDTF string for dates that can't be represented in ISO 8601.

```typescript
const date = parse('1985-04-12');
if (date.success) {
  formatISO(date.value);  // "1985-04-12"
}

const datetime = parse('1985-04-12T23:20:30Z');
if (datetime.success) {
  formatISO(datetime.value);  // "1985-04-12T23:20:30Z"
}

// EDTF-specific features can't be converted to ISO 8601
const uncertain = parse('1984?');
if (uncertain.success) {
  formatISO(uncertain.value);  // "1984?" (returns EDTF, not ISO)
}
```

### formatRange()

Format a date's min/max range as a human-readable string.

```typescript
function formatRange(value: EDTFBase, options?: FormatOptions): string
```

Useful for showing the full span of an imprecise date.

```typescript
const month = parse('1985-04');
if (month.success) {
  formatRange(month.value);  // "April 1, 1985 to April 30, 1985"
}

const year = parse('1985');
if (year.success) {
  formatRange(year.value);  // "January 1, 1985 to December 31, 1985"
}

const decade = parse('198X');
if (decade.success) {
  formatRange(decade.value);  // "January 1, 1980 to December 31, 1989"
}
```

## Localization

All formatters support localization via the `locale` option:

```typescript
const date = parse('1985-04-12');
if (date.success) {
  formatHuman(date.value, { locale: 'en-US' });  // "April 12, 1985"
  formatHuman(date.value, { locale: 'de-DE' });  // "12. April 1985"
  formatHuman(date.value, { locale: 'fr-FR' });  // "12 avril 1985"
  formatHuman(date.value, { locale: 'ja-JP' });  // "1985年4月12日"
}
```

## Date Style Examples

| Style | Example |
|-------|---------|
| `'full'` | April 12, 1985 |
| `'long'` | April 12, 1985 |
| `'medium'` | Apr 12, 1985 |
| `'short'` | 4/12/1985 |

## Era Formatting

| Era Style | BC Example | AD Example |
|-----------|------------|------------|
| `'long'` (bc-ad) | Before Christ | Anno Domini |
| `'long'` (bce-ce) | Before Common Era | Common Era |
| `'short'` (bc-ad) | BC | AD |
| `'short'` (bce-ce) | BCE | CE |
| `'narrow'` | B | A |
