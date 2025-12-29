# @edtf-ts/natural

Natural language to EDTF parser with locale support and ambiguity handling.

## Installation

```bash
npm install @edtf-ts/natural @edtf-ts/core
# or
pnpm add @edtf-ts/natural @edtf-ts/core
# or
yarn add @edtf-ts/natural @edtf-ts/core
```

## Features

- 🗣️ **Natural Language Parsing** - Parse human-readable date expressions
- 🌍 **Locale Support** - US and EU date format handling
- 🎯 **Confidence Scoring** - Automatic confidence assessment for each interpretation
- 🔀 **Ambiguity Handling** - Returns multiple interpretations for ambiguous inputs
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🔧 **Powered by Nearley** - Uses Earley parser for handling ambiguous grammars

## Quick Start

```typescript
import { parseNatural } from '@edtf-ts/natural';

// Parse a simple date
const results = parseNatural('January 12, 1940');
console.log(results[0].edtf);  // '1940-01-12'

// Parse uncertain dates
const uncertain = parseNatural('possibly 1984');
console.log(uncertain[0].edtf);  // '1984?'

// Parse approximate dates
const circa = parseNatural('circa 1950');
console.log(circa[0].edtf);  // '1950~'

// Parse intervals
const interval = parseNatural('from 1964 to 2008');
console.log(interval[0].edtf);  // '1964/2008'
console.log(interval[0].type);  // 'interval'

// Parse seasons
const season = parseNatural('Spring 2001');
console.log(season[0].edtf);  // '2001-21'

// Parse decades
const decade = parseNatural('the 1960s');
console.log(decade[0].edtf);  // '196X'
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
console.log(bestOnly.length);  // 1
```

## Supported Formats

### Complete Dates

```typescript
parseNatural('January 12, 1940');   // US long format
parseNatural('12 January 1940');    // EU long format
parseNatural('Jan 12, 1940');       // US abbreviated
parseNatural('12 Jan 1940');        // EU abbreviated
```

### Partial Dates

```typescript
parseNatural('January 2020');       // Month and year
parseNatural('2020');                // Year only
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
parseNatural('before 1930');         // ../1930
parseNatural('after 1930');          // 1930/..
parseNatural('since 1930');          // 1930/..
```

### Seasons

```typescript
parseNatural('Spring 2001');         // 2001-21
parseNatural('Summer 2001');         // 2001-22
parseNatural('Fall 2001');           // 2001-23
parseNatural('Winter 2001');         // 2001-24
```

### Decades and Centuries

```typescript
parseNatural('the 1960s');           // 196X
parseNatural('1960s');               // 196X
parseNatural('the 1800s');           // 18XX
parseNatural('19th century');        // 18XX
```

### Sets and Lists

```typescript
parseNatural('1667 or 1668');                    // [1667,1668] (one of)
parseNatural('1667 and 1668');                   // {1667,1668} (all of)
parseNatural('1984 or earlier');                 // [..1984]
```

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
  edtf: string;                    // The EDTF string representation
  type: 'date' | 'interval' | 'season' | 'set' | 'list';
  confidence: number;              // Confidence score (0-1)
  interpretation: string;          // Human-readable interpretation
  parsed?: EDTFBase;               // Parsed EDTF object (from @edtf-ts/core)
  ambiguous?: boolean;             // Whether this result is ambiguous
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
  minConfidence: 0.7
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

## Development Status

This package is in active development. The grammar currently supports:
- ✅ Complete dates (various formats)
- ✅ Partial dates (month/year, year only)
- ✅ Uncertain and approximate qualifiers
- ✅ Basic intervals
- ✅ Seasons
- ✅ Decades and centuries (partial)
- ✅ Sets and lists (basic)
- 🚧 All 200+ patterns from the specification (iterative refinement)

See the [parser specification](../../tools/research/parser-and-formats-spec.md) for the complete list of planned formats.

## Contributing

The grammar is located in `src/grammar.ne`. To modify it:

1. Edit `src/grammar.ne`
2. Run `pnpm build:grammar` to compile
3. Run `pnpm test` to verify

Contributions to expand grammar coverage are welcome!

## License

MIT

## Related Packages

- [@edtf-ts/core](../core) - Core EDTF parser and types
- [@edtf-ts/utils](../utils) - Utilities for working with EDTF dates

## Resources

- [EDTF Specification](https://www.loc.gov/standards/datetime/)
- [Nearley Documentation](https://nearley.js.org/)
- [Natural Language Parser Research](../../tools/research/parser-and-formats-spec.md)
