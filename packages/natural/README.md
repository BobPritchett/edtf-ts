# @edtf-ts/natural

[![npm version](https://img.shields.io/npm/v/@edtf-ts/natural.svg)](https://www.npmjs.com/package/@edtf-ts/natural)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Natural language to EDTF parser with locale support and ambiguity handling.

Use `tryParseNatural()` for structured outcomes, or retain the existing throwing `parseNatural()` API. [Parsing policies](https://bobpritchett.github.io/edtf-ts/guide/parsing-policies) document conversion notes and opt-in `literalPreference`, `rangeQualification`, and `boundaryMode` options. The [migration guide](https://bobpritchett.github.io/edtf-ts/guide/semantics-migration) covers changes from 0.5.0.

**[GitHub Repository](https://github.com/BobPritchett/edtf-ts)** | **[Documentation](https://bobpritchett.github.io/edtf-ts/)** | **[Interactive Playground](https://bobpritchett.github.io/edtf-ts/playground)**

## Upgrading from 0.5.0 to 0.6.0

`parseNatural()` still returns an array or throws; switching to `tryParseNatural()` is optional. Existing exports and required call arguments remain available. Check these cases before updating both packages:

- **Language selection:** `locale` now selects the grammar. English input with a Spanish/French locale can fail, and unsupported languages throw. Set `language: 'en'` for an English field that uses the user's regional locale. This also applies to `parseAgeBirthday()`.
- **Age-result shape:** Age-derived birthdates can now be sets. Guard interval-only access such as `.parsed.start`; storing `.edtf` and formatting `.parsed` remain supported flows.
- **Validation and TypeScript:** More inputs are rejected, including datetime intervals passed through to core. Standalone `Date.toISOString()` timestamps remain accepted by default, with milliseconds preserved. Continue handling parser errors. Handwritten result objects and mocks may need required `parsed` / `fuzzyDate` fields; exhaustive type switches may need more cases.

See the [migration guide](https://bobpritchett.github.io/edtf-ts/guide/semantics-migration) for examples and the separate list of changed parsing results. It also covers comparison changes if you compare or sort the parsed dates.

## Installation

```bash
npm install @edtf-ts/natural @edtf-ts/core
# or
pnpm add @edtf-ts/natural @edtf-ts/core
# or
yarn add @edtf-ts/natural @edtf-ts/core
```

## Features

- **Natural Language Parsing** - Parse human-readable date expressions
- **Locale Support** - US and EU date format handling
- **Confidence Scoring** - Automatic confidence assessment for each interpretation
- **Ambiguity Handling** - Returns multiple interpretations for ambiguous inputs
- **Zero Config** - Works out of the box with sensible defaults
- **Powered by Nearley** - Uses Earley parser for handling ambiguous grammars

## Quick Start

```typescript
import { parseNatural } from '@edtf-ts/natural';

// Parse a simple date
const results = parseNatural('January 12, 1940');
console.log(results[0].edtf); // '1940-01-12'

// Parse uncertain dates
const uncertain = parseNatural('possibly 1984');
console.log(uncertain[0].edtf); // '1984?'

// Parse approximate dates
const circa = parseNatural('circa 1950');
console.log(circa[0].edtf); // '1950~'

// Parse intervals
const interval = parseNatural('from 1964 to 2008');
console.log(interval[0].edtf); // '1964/2008'
console.log(interval[0].type); // 'interval'

// Parse seasons
const season = parseNatural('Spring 2001');
console.log(season[0].edtf); // '2001-21'

// Parse decades
const decade = parseNatural('the 1960s');
console.log(decade[0].edtf); // '196X'
```

## Handling Ambiguity

The parser returns multiple interpretations for ambiguous input with confidence scores:

```typescript
// Ambiguous numeric date (could be MM/DD or DD/MM)
const ambiguous = parseNatural('02/03/2020', { locale: 'en-US' });

console.log(ambiguous);
// [
//   {
//     edtf: '2020-02-03',
//     confidence: 0.6,
//     interpretation: 'February 3, 2020 (US format: MM/DD/YYYY)',
//     type: 'date',
//     ambiguous: true
//   },
//   {
//     edtf: '2020-03-02',
//     confidence: 0.4,
//     interpretation: 'March 2, 2020 (EU format: DD/MM/YYYY)',
//     type: 'date',
//     ambiguous: true
//   }
// ]

// Get only the best result
const bestOnly = parseNatural('02/03/2020', { returnAllResults: false });
console.log(bestOnly.length); // 1
```

## Supported Formats

### Complete Dates

```typescript
parseNatural('January 12, 1940'); // US long format
parseNatural('12 January 1940'); // EU long format
parseNatural('Jan 12, 1940'); // US abbreviated
parseNatural('12 Jan 1940'); // EU abbreviated
```

### Partial Dates

```typescript
parseNatural('January 2020'); // Month and year
parseNatural('2020'); // Year only
```

### Uncertain Dates (?)

```typescript
parseNatural('possibly 1984');
parseNatural('maybe 1984');
parseNatural('perhaps 1984');
parseNatural('probably 1984');
parseNatural('1984?');
```

### Approximate Dates (~)

```typescript
parseNatural('circa 1950');
parseNatural('c. 1950');
parseNatural('about 1950');
parseNatural('around 1950');
parseNatural('approximately 1950');
parseNatural('~1950');
```

### Intervals

```typescript
parseNatural('from 1964 to 2008');
parseNatural('1964 to 2008');
parseNatural('between 1964 and 2008');
parseNatural('before 1930'); // [..1929]
parseNatural('after 1930'); // [1931..]
parseNatural('since 1930'); // 1930/..
```

### Seasons

```typescript
parseNatural('Spring 2001'); // 2001-21
parseNatural('Summer 2001'); // 2001-22
parseNatural('Fall 2001'); // 2001-23
parseNatural('Winter 2001'); // 2001-24
```

### Decades and Centuries

```typescript
parseNatural('the 1960s'); // 196X
parseNatural('1960s'); // 196X
parseNatural('the 1800s'); // 18XX
parseNatural('19th century'); // 1801/1900
```

### Sets and Lists

```typescript
parseNatural('1667 or 1668'); // [1667,1668] (one of)
parseNatural('April 12th or 14th 1985'); // [1985-04-12,1985-04-14]
parseNatural('April 12, 14, or 16, 1985'); // [1985-04-12,1985-04-14,1985-04-16]
parseNatural('1667 and 1668'); // {1667,1668} (all of)
parseNatural('1984 or earlier'); // [..1984]
```

Day alternatives can share a month and year, including day-first wording such as
`12 or 14 April 1985`, Spanish `12 o 14 de abril de 1985`, and French
`12 ou 14 avril 1985`. These return one set result containing the stated dates;
every member must be a valid calendar date. A dash still denotes an interval:
`April 12-14, 1985` includes the intervening day.

## API

### `parseNatural(input, options?)`

Parse natural language date input into EDTF format.

**Parameters:**

- `input` (string): Natural language date string
- `options` (object, optional):
  - `locale` (string): Locale for date interpretation (default: 'en-US')
  - `returnAllResults` (boolean): Return all possible interpretations (default: true)
  - `minConfidence` (number): Minimum confidence threshold 0-1 (default: 0)

**Returns:** Array of `ParseResult` objects, sorted by confidence (highest first)

**ParseResult:**

```typescript
interface ParseResult {
  edtf: string; // The EDTF string representation
  type: 'date' | 'datetime' | 'interval' | 'season' | 'set' | 'list';
  confidence: number; // Confidence score (0-1)
  interpretation: string; // Human-readable interpretation
  parsed: EDTFBase; // Validated EDTF object
  fuzzyDate: IFuzzyDate; // Required wrapper
  ambiguous?: boolean; // Whether this result is ambiguous
  warnings?: ParseWarning[]; // Weekday mismatch diagnostics in warning mode
}
```

### `ParseError`

Error class thrown when parsing fails.

```typescript
try {
  parseNatural('invalid input');
} catch (error) {
  if (error instanceof ParseError) {
    console.log(error.message);
    console.log(error.input);
    console.log(error.position);
  }
}
```

## English, Spanish, and French

The default import includes all three grammars. Use `@edtf-ts/natural/en`, `/es`, or `/fr` for a smaller bundle with the same synchronous API, including age and birthday parsing.

`locale` defaults to `en-US`; regional locales select their language pack. Optional `language: 'en' | 'es' | 'fr'` and `dateOrder: 'MDY' | 'DMY' | 'YMD'` overrides separate syntax from numeric ordering. Unsupported languages raise an error.

All `en-*` regions use one English grammar. Shared semantics resolve the captured numbers and rank candidates using the runtime's `Intl` locale data: `en-GB` prefers DMY, `en-US` prefers MDY, and `en-ZA` prefers YMD. The preference stays consistent across qualifiers, intervals, and collection members. An unambiguous date such as `06/15/26` still resolves to June 15 in a DMY locale; alternatives remain available when both orders are valid. Use `dateOrder` when an application needs a fixed order independent of runtime locale-data updates.

The 0.6.0 browser measurements are approximately **49.3 KiB gzip for English only** and **65.6 KiB gzip for all three languages**, including core and the shared parser runtime. Regional variants add no grammar code. The default import retains all grammars even when a call specifies `locale: 'en-US'`; use the `/en` entry point to exclude Spanish and French. See [locales and bundle sizes](https://bobpritchett.github.io/edtf-ts/guide/locales-and-bundles) for the full table and loading guidance. After building, reproduce the measurements with `pnpm --filter @edtf-ts/natural measure:bundles`.

```typescript
const referenceDate = new Date(2026, 0, 1); // Fix the rolling short-year window for this example.
parseNatural('06/05/26', { locale: 'en-GB', referenceDate })[0].edtf; // '2026-05-06'
parseNatural('06/05/26', { locale: 'en-GB', dateOrder: 'MDY', referenceDate })[0].edtf; // '2026-06-05'
parseNatural('Toutes ces dates: 1667, 1668 et 1670', { locale: 'fr-FR' })[0].edtf;
// '{1667,1668,1670}'
```

Cross-language round-trip tests in `tests/locale-roundtrip.test.ts` follow key dates, sets, lists, qualifiers, and open boundaries through English, French, and Spanish, checking the preferred result and every alternative at each step.

The [interactive playground](https://bobpritchett.github.io/edtf-ts/playground) defaults to the browser’s locale. Its top-level chooser overrides parsing and rendering in both date inputs and the age/birthday section, with regional presets and a custom locale field. Select **Browser default** or reload to reset. This browser behavior does not change the API’s `en-US` default.

See the [migration guide](https://bobpritchett.github.io/edtf-ts/guide/semantics-migration) and [tested examples](https://bobpritchett.github.io/edtf-ts/guide/language-examples).

## Options

### Locale Support

The parser supports different date format preferences based on locale:

```typescript
// US locale (MM/DD/YYYY preference)
parseNatural('02/03/2020', { locale: 'en-US' });
// Returns US format (Feb 3) with higher confidence

// EU locale (DD/MM/YYYY preference)
parseNatural('02/03/2020', { locale: 'en-GB' });
// Returns EU format (Mar 2) with higher confidence
```

### Confidence Threshold

Filter results by minimum confidence:

```typescript
const results = parseNatural('ambiguous date', {
  minConfidence: 0.7,
});
// Only returns interpretations with confidence >= 0.7
```

## How It Works

The parser uses [Nearley](https://nearley.js.org/), an Earley parser generator, which is specifically designed to handle ambiguous grammars. Unlike PEG parsers that return the first match, Nearley can return **all valid parse trees**, which is essential for natural language date parsing where ambiguity is common.

### Why Nearley?

- **Handles Ambiguity**: Returns all valid interpretations for ambiguous input
- **Proven in EDTF Space**: Used successfully by edtf.js
- **Rich Grammar Support**: Supports complex, overlapping patterns gracefully

### Confidence Scoring

The parser assigns confidence scores based on:

- Format specificity (ISO format = 1.0, numeric MM/DD = 0.6)
- Locale preferences (US locale prefers MM/DD over DD/MM)
- Ambiguity (unambiguous results get higher scores)
- Number of valid interpretations (single valid interpretation = 0.9)

## Unknown components and mixed interval endpoints

`12th of unknown month, 1870`, `día 12 de mes desconocido, 1870`, and `12 d'un mois inconnu, 1870` parse to `1870-XX-12` with their corresponding locales. Renderings preserve that known day. `January` parses to `XXXX-01`; `January 12` produces only `XXXX-01-12`. Use `January 0012` to select that early year, or `January 12, unknown year` to select the unspecified year explicitly.

`march 1988 - spring 1990` parses to `1988-03/1990-21` as a supported extension, excluded by strict mode. Date, season, and period endpoints share range handling, including prefix/suffix qualifiers. French `De 1970 environ à 1980 environ` parses to `1970~/1980~`. Semicolons enumerate inclusive lists: `2020; 2021` → `{2020,2021}`. Write `0090` or `90 CE` for historical year 90; `'90` uses the rolling reference-year window.

The [compatibility review](../../docs/guide/compatibility-review.md) lists every supplied example, selected edtfy tests, preferred renderings, and reasons for intentional rejections. Its fixtures check every returned candidate. Weekdays must match their dates; arbitrary bibliographic prose is not silently truncated.

## Round-Trip Conversion

Canonical phrases have tested round-trip support. Use EDTF itself for lossless storage. The natural language parser supports **bidirectional conversion** - you can parse EDTF-formatted output back into EDTF. This is particularly useful when displaying formatted dates to users and allowing them to type natural language that gets parsed back.

```typescript
import { parse } from '@edtf-ts/core';
import { formatHuman } from '@edtf-ts/core';
import { parseNatural } from '@edtf-ts/natural';

// Parse EDTF -> Format to natural language -> Parse back to EDTF
const edtf = '1985/..';
const result = parse(edtf);

if (result.success) {
  const formatted = formatHuman(result.value);
  console.log(formatted); // "1985 to open end"

  // Parse the formatted text back to EDTF
  const roundTrip = parseNatural(formatted);
  console.log(roundTrip[0].edtf); // "1985/.."
}
```

Natural-language sets and lists preserve enumerations: `One of: 1870, 1871, 1872` becomes `[1870,1871,1872]`. Explicit ranges retain range spelling, and day/month ranges render concisely. Use core `compactYearRanges` for explicit year compaction. Natural parsing normalizes year-only qualifiers (`~1950` → `1950~`, `~1984?` → `1984%`); core preserves accepted literal spelling.

All three languages parse rendered year ranges and open/unknown interval endpoints. For example, `1870 a fin abierto` with `es-ES` and `1870 à fin ouverte` with `fr-FR` both return `1870/..`. Unknown endpoint phrases retain an empty endpoint (`1870/`), distinct from an open endpoint (`1870/..`). These cases are exercised across regional locales in chained round-trip tests.

### Supported Round-Trip Patterns

**Open and Unknown Endpoints:**

```typescript
// Open end
parseNatural('1985 to open end'); // '1985/..'
parseNatural('1985 onward'); // '1985/..'
parseNatural('1985 onwards'); // '1985/..'

// Open start
parseNatural('open start to 1985'); // '../1985'

// Unknown endpoints
parseNatural('1985 to unknown'); // '1985/'
parseNatural('unknown to 1985'); // '/1985'
```

**Qualified Dates:**

```typescript
parseNatural('1984 (uncertain)'); // '1984?'
parseNatural('June 2004 (approximate)'); // '2004-06~'
parseNatural('June 11, 2004 (uncertain/approximate)'); // '2004-06-11%'
```

**Intervals:**

```typescript
parseNatural('February 1, 2004 to February 2005'); // '2004-02-01/2005-02'
parseNatural('1964 to 2008'); // '1964/2008'
```

This round-trip capability makes @edtf-ts/natural ideal for building user interfaces where users need to view and edit EDTF dates in natural language.

## Development Status

This package is in active development. The grammar currently supports:

- Supported: Complete dates (various formats)
- Supported: Partial dates (month/year, year only)
- Supported: Uncertain and approximate qualifiers
- Supported: Basic intervals
- Supported: Seasons
- Supported: Decades and centuries (partial)
- Supported: Sets and lists (basic)
- Planned: All 200+ patterns from the specification (iterative refinement)

See the [parser specification](../../tools/research/parser-and-formats-spec.md) for the complete list of planned formats.

## Contributing

Language syntax lives in `src/languages/en.ne`, `es.ne`, and `fr.ne`, backed by `shared.ne` and shared TypeScript semantics. To modify it:

1. Edit the relevant language syntax or shared semantics and add equivalent feature fixtures for all three languages
2. Run `pnpm build:grammar` to compile
3. Run `pnpm test` to verify

Contributions to expand grammar coverage are welcome!

## License

MIT Copyright 2025 Bob Pritchett

## Related Packages

- **[@edtf-ts/core](https://www.npmjs.com/package/@edtf-ts/core)** - Core EDTF parser, comparison, and types

## Resources

- [EDTF Specification](https://www.loc.gov/standards/datetime/)
- [Nearley Documentation](https://nearley.js.org/)
- [Natural Language Parser Research](../../tools/research/parser-and-formats-spec.md)

## Interoperability and migration

Bare one- or two-digit years require an era marker or four-digit spelling. `conformance: 'strict'` excludes the documented season combinations; extended support remains the default. `weekdayMismatch: 'warn'` returns the calendar date with structured warnings; rejection remains the default. Age-derived birth dates now use a date or one-of set and carry `derivation` metadata instead of artificial component qualifiers. See the [policy and migration guide](../../docs/guide/interoperability.md) for exact contracts and examples.
