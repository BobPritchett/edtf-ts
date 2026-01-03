# @edtf-ts/natural

Natural language date parsing for EDTF. Convert human-readable date expressions into Extended Date/Time Format.

## Installation

```bash
pnpm add @edtf-ts/natural
```

::: tip
@edtf-ts/natural depends on @edtf-ts. Both packages will be installed.
:::

## Overview

The natural language parser converts everyday date expressions into precise EDTF strings. It handles:

- **Multiple formats** - US/EU date formats, full month names, abbreviated months
- **Uncertainty & approximation** - "circa", "about", "around", "maybe"
- **Intervals & ranges** - "from... to...", "between... and...", decade/century ranges
- **Ambiguous dates** - Returns multiple interpretations with confidence scores
- **Historical dates** - BCE/BC dates, centuries, decades
- **Seasons** - "Spring 1985", "Winter of 2020"

## Quick Start

```typescript
import { parseNatural } from '@edtf-ts/natural';

// Simple date
const results = parseNatural('January 12, 1940');
// [{
//   edtf: '1940-01-12',
//   type: 'date',
//   confidence: 0.95,
//   interpretation: 'January 12, 1940'
// }]

// Ambiguous date (returns multiple interpretations)
const ambiguous = parseNatural('02/03/2020');
// [
//   { edtf: '2020-02-03', confidence: 0.6, interpretation: 'February 3, 2020 (US format)' },
//   { edtf: '2020-03-02', confidence: 0.4, interpretation: 'March 2, 2020 (EU format)' }
// ]

// Uncertain date
const uncertain = parseNatural('circa 1950');
// [{ edtf: '1950~', confidence: 0.95, ... }]

// Interval
const interval = parseNatural('from 1964 to 2008');
// [{ edtf: '1964/2008', type: 'interval', confidence: 0.95, ... }]
```

## API

### parseNatural()

```typescript
function parseNatural(
  input: string,
  options?: ParseNaturalOptions
): ParseResult[]
```

Parse natural language date input into EDTF format.

**Parameters:**
- `input` - Natural language date string
- `options` - Optional parsing configuration

**Returns:** Array of possible interpretations, sorted by confidence (highest first)

**Throws:** `ParseError` if the input cannot be parsed

### ParseResult

```typescript
interface ParseResult {
  edtf: string;           // The EDTF string representation
  type: 'date' | 'interval' | 'season' | 'set' | 'list';
  confidence: number;     // Confidence score (0-1)
  interpretation: string; // Human-readable interpretation
  parsed?: EDTFBase;      // Parsed EDTF object (if valid)
  ambiguous?: boolean;    // Whether this result is ambiguous
}
```

#### edtf
```typescript
edtf: string
```

The EDTF string representation of the parsed date.

```typescript
parseNatural('January 1985')[0].edtf;  // '1985-01'
parseNatural('the 1960s')[0].edtf;     // '196X'
parseNatural('circa 1950')[0].edtf;    // '1950~'
```

#### type
```typescript
type: 'date' | 'interval' | 'season' | 'set' | 'list'
```

The type of EDTF value produced.

```typescript
parseNatural('January 12, 1940')[0].type;      // 'date'
parseNatural('from 1964 to 2008')[0].type;     // 'interval'
parseNatural('Spring 1985')[0].type;           // 'season'
parseNatural('1985, 1990, 1995')[0].type;      // 'set'
```

#### confidence
```typescript
confidence: number  // 0-1
```

Confidence score for this interpretation.

- **0.95-1.0**: Very confident, unambiguous
- **0.8-0.94**: Confident, likely interpretation
- **0.6-0.79**: Moderate confidence, possibly ambiguous
- **0.4-0.59**: Lower confidence, multiple valid interpretations
- **0.0-0.39**: Low confidence, uncertain

```typescript
// Unambiguous input
parseNatural('January 12, 1940')[0].confidence;  // 0.95

// Ambiguous US/EU format
const results = parseNatural('02/03/2020');
results[0].confidence;  // 0.6 (US format - higher if locale is en-US)
results[1].confidence;  // 0.4 (EU format)

// Uncertain input
parseNatural('maybe 1950')[0].confidence;  // 0.8 (confident about format, "maybe" adds uncertainty marker)
```

#### interpretation
```typescript
interpretation: string
```

Human-readable description of the interpretation.

```typescript
parseNatural('02/03/2020')[0].interpretation;
// "February 3, 2020 (US format)"

parseNatural('circa 1950')[0].interpretation;
// "approximately 1950"

parseNatural('the 1960s')[0].interpretation;
// "1960s decade"
```

#### parsed
```typescript
parsed?: EDTFBase
```

The parsed and validated EDTF object. Only present if the generated EDTF string is valid.

```typescript
import { isEDTFDate } from '@edtf-ts';

const result = parseNatural('January 12, 1940')[0];
if (result.parsed && isEDTFDate(result.parsed)) {
  console.log(result.parsed.year);   // 1940
  console.log(result.parsed.month);  // 1
  console.log(result.parsed.day);    // 12
}
```

#### ambiguous
```typescript
ambiguous?: boolean
```

Indicates if this interpretation is one of multiple valid interpretations.

```typescript
const results = parseNatural('02/03/2020');
results[0].ambiguous;  // true
results[1].ambiguous;  // true

const unambiguous = parseNatural('January 12, 1940');
unambiguous[0].ambiguous;  // false (or undefined)
```

### ParseNaturalOptions

```typescript
interface ParseNaturalOptions {
  locale?: string;              // Default: 'en-US'
  returnAllResults?: boolean;   // Default: true
  minConfidence?: number;       // Default: 0
}
```

#### locale
```typescript
locale?: string
```

Locale for date interpretation. Affects confidence scores for ambiguous dates.

```typescript
// US locale prefers MM/DD/YYYY
parseNatural('02/03/2020', { locale: 'en-US' });
// [
//   { edtf: '2020-02-03', confidence: 0.6 },  // February 3 (higher)
//   { edtf: '2020-03-02', confidence: 0.4 }   // March 2 (lower)
// ]

// EU locale prefers DD/MM/YYYY
parseNatural('02/03/2020', { locale: 'en-GB' });
// [
//   { edtf: '2020-03-02', confidence: 0.6 },  // March 2 (higher)
//   { edtf: '2020-02-03', confidence: 0.4 }   // February 3 (lower)
// ]
```

#### returnAllResults
```typescript
returnAllResults?: boolean  // Default: true
```

Whether to return all interpretations or just the most confident one.

```typescript
// Return all interpretations
parseNatural('02/03/2020', { returnAllResults: true });
// [{ edtf: '2020-02-03', ... }, { edtf: '2020-03-02', ... }]

// Return only the most confident
parseNatural('02/03/2020', { returnAllResults: false });
// [{ edtf: '2020-02-03', ... }]
```

#### minConfidence
```typescript
minConfidence?: number  // 0-1, Default: 0
```

Minimum confidence threshold. Filters out results below this score.

```typescript
const results = parseNatural('02/03/2020', { minConfidence: 0.5 });
// Only returns results with confidence >= 0.5
// Might return just [{ edtf: '2020-02-03', confidence: 0.6 }]
```

### ParseError

```typescript
class ParseError extends Error {
  input: string;     // The input string that failed to parse
  position?: number; // Character position where parsing failed
}
```

Thrown when parsing completely fails.

```typescript
try {
  parseNatural('not a date at all');
} catch (error) {
  if (error instanceof ParseError) {
    console.log(error.input);     // 'not a date at all'
    console.log(error.position);  // Character position
    console.log(error.message);   // Error description
  }
}
```

## Supported Patterns

### Simple Dates

#### Full Month Names
```typescript
parseNatural('January 12, 1940');        // '1940-01-12'
parseNatural('12 January 1940');         // '1940-01-12'
parseNatural('January 1940');            // '1940-01'
parseNatural('1940');                    // '1940'
```

#### Abbreviated Months
```typescript
parseNatural('Jan 12, 1940');            // '1940-01-12'
parseNatural('12 Jan 1940');             // '1940-01-12'
parseNatural('Jan 1940');                // '1940-01'
parseNatural('Feb. 2020');               // '2020-02'
```

#### Numeric Formats
```typescript
parseNatural('1940-01-12');              // '1940-01-12'
parseNatural('1940/01/12');              // '1940-01-12'
parseNatural('01/12/1940');              // '1940-01-12' (US) or '1940-12-01' (EU)
parseNatural('12.01.1940');              // '1940-01-12' (EU format)
```

#### Two-Digit Years
```typescript
parseNatural('01/12/85');                // '1985-01-12' (>=30 → 1900s)
parseNatural('01/12/20');                // '2020-01-12' (<30 → 2000s)
```

### Uncertainty & Approximation

#### Approximate Dates
```typescript
parseNatural('circa 1950');              // '1950~'
parseNatural('about 1950');              // '1950~'
parseNatural('around 1950');             // '1950~'
parseNatural('c. 1950');                 // '1950~'
parseNatural('ca. 1950');                // '1950~'
parseNatural('c1950');                   // '1950~'
```

#### Uncertain Dates
```typescript
parseNatural('maybe 1950');              // '1950?'
parseNatural('possibly 1950');           // '1950?'
parseNatural('probably 1950');           // '1950?'
```

#### Both Uncertain and Approximate
```typescript
parseNatural('maybe circa 1950');        // '1950%'
parseNatural('possibly around 1950');    // '1950%'
```

### Intervals & Ranges

#### Year Ranges
```typescript
parseNatural('from 1964 to 2008');       // '1964/2008'
parseNatural('1964 to 2008');            // '1964/2008'
parseNatural('1964-2008');               // '1964/2008'
parseNatural('between 1964 and 2008');   // '1964/2008'
```

#### Date Ranges
```typescript
parseNatural('from January 1985 to December 1990');
// '1985-01/1990-12'

parseNatural('between Jan 1, 1985 and Dec 31, 1990');
// '1985-01-01/1990-12-31'
```

#### Open-Ended Intervals
```typescript
parseNatural('before 1950');             // '../1950'
parseNatural('after 1950');              // '1950/..'
parseNatural('since 1950');              // '1950/..'
parseNatural('until 1950');              // '../1950'
```

### Decades & Centuries

#### Decades
```typescript
parseNatural('the 1960s');               // '196X'
parseNatural('the 1960\'s');             // '196X'
parseNatural('the sixties');             // '196X'
parseNatural('1960s');                   // '196X'
```

#### Early/Mid/Late Decades
```typescript
parseNatural('early 1960s');             // '1960/1963' (interval)
parseNatural('mid 1960s');               // '1964/1966' (interval)
parseNatural('late 1960s');              // '1967/1969' (interval)
```

#### Centuries
```typescript
parseNatural('the 20th century');        // '19XX'
parseNatural('20th century');            // '19XX'
parseNatural('the twentieth century');   // '19XX'
```

#### Early/Mid/Late Centuries
```typescript
parseNatural('early 20th century');      // '1900/1933' (interval)
parseNatural('mid 20th century');        // '1934/1966' (interval)
parseNatural('late 20th century');       // '1967/1999' (interval)
```

### Historical Dates

#### BCE/BC Dates
```typescript
parseNatural('100 BC');                  // '-0099'
parseNatural('100 BCE');                 // '-0099'
parseNatural('100 B.C.');                // '-0099'
parseNatural('100 B.C.E.');              // '-0099'
```

#### CE/AD Dates
```typescript
parseNatural('100 AD');                  // '0100'
parseNatural('100 CE');                  // '0100'
parseNatural('100 A.D.');                // '0100'
parseNatural('100 C.E.');                // '0100'
```

#### BCE/BC Ranges
```typescript
parseNatural('from 500 BC to 400 BC');   // '-0499/-0399'
parseNatural('500-400 BC');              // '-0499/-0399'
parseNatural('500-400 BCE');             // '-0499/-0399'
```

### Seasons

```typescript
parseNatural('Spring 1985');             // '1985-21'
parseNatural('Summer of 2020');          // '2020-22'
parseNatural('Autumn 1995');             // '1995-23'
parseNatural('Fall 1995');               // '1995-23'
parseNatural('Winter 1990');             // '1990-24'
```

### Sets & Lists

#### Multiple Dates (Sets)
```typescript
parseNatural('1985, 1990, 1995');        // '[1985,1990,1995]'
parseNatural('Jan 1985, Feb 1985');      // '[1985-01,1985-02]'
```

::: tip
The grammar is extensible. Patterns are defined in `grammar.ne` using Nearley syntax.
:::

## Ambiguity Handling

The parser recognizes ambiguous input and returns multiple interpretations with confidence scores.

### Numeric Date Formats

```typescript
const results = parseNatural('02/03/2020');

// US locale (default)
results[0].edtf;            // '2020-02-03' (MM/DD/YYYY)
results[0].confidence;      // 0.6
results[0].interpretation;  // 'February 3, 2020 (US format)'

results[1].edtf;            // '2020-03-02' (DD/MM/YYYY)
results[1].confidence;      // 0.4
results[1].interpretation;  // 'March 2, 2020 (EU format)'
```

### Resolving Ambiguity

#### Use Locale
```typescript
// Prefer EU format
parseNatural('02/03/2020', { locale: 'en-GB' });
// First result: '2020-03-02' (confidence 0.6)

// Prefer US format
parseNatural('02/03/2020', { locale: 'en-US' });
// First result: '2020-02-03' (confidence 0.6)
```

#### Return Only Top Result
```typescript
parseNatural('02/03/2020', { returnAllResults: false });
// [{ edtf: '2020-02-03', confidence: 0.6 }]
```

#### Filter by Confidence
```typescript
parseNatural('02/03/2020', { minConfidence: 0.55 });
// [{ edtf: '2020-02-03', confidence: 0.6 }]
// Lower confidence result (0.4) is filtered out
```

## Error Handling

```typescript
import { parseNatural, ParseError } from '@edtf-ts/natural';

try {
  const results = parseNatural('not a valid date');
} catch (error) {
  if (error instanceof ParseError) {
    console.error('Parse failed:', error.message);
    console.error('Input:', error.input);
    console.error('Position:', error.position);
  }
}
```

## Integration with Other Packages

### Validate Parsed Results

```typescript
import { parseNatural } from '@edtf-ts/natural';
import { isValid } from '@edtf-ts';

const results = parseNatural('January 12, 1940');
const edtf = results[0].edtf;

if (isValid(edtf)) {
  console.log('Valid EDTF:', edtf);
}
```

### Format Results

```typescript
import { parseNatural } from '@edtf-ts/natural';
import { formatHuman } from '@edtf-ts';

const results = parseNatural('circa 1950');
const parsed = results[0].parsed;

if (parsed) {
  const formatted = formatHuman(parsed);
  console.log(formatted);  // "1950 (approximate)"
}
```

### Compare Results

```typescript
import { parseNatural } from '@edtf-ts/natural';
import { isBefore } from '@edtf-ts';

const date1 = parseNatural('January 1940')[0].parsed!;
const date2 = parseNatural('December 1945')[0].parsed!;

isBefore(date1, date2);  // 'YES'
```

## Use Cases

### User Input Forms

```typescript
function handleDateInput(userInput: string) {
  try {
    const results = parseNatural(userInput, {
      returnAllResults: false,  // Just give me the best guess
      minConfidence: 0.5        // Must be reasonably confident
    });

    if (results.length > 0) {
      const { edtf, confidence, interpretation } = results[0];

      if (confidence >= 0.8) {
        // High confidence - accept automatically
        return { edtf, needsConfirmation: false };
      } else {
        // Lower confidence - ask user to confirm
        return {
          edtf,
          needsConfirmation: true,
          message: `Did you mean: ${interpretation}?`
        };
      }
    }
  } catch (error) {
    return { error: 'Could not parse date' };
  }
}
```

### Search Query Parsing

```typescript
function parseSearchQuery(query: string) {
  const datePattern = /\b(?:from|before|after|circa|in|on)\s+[\w\s,.-]+/gi;
  const matches = query.match(datePattern);

  if (matches) {
    return matches.map(match => {
      try {
        const results = parseNatural(match);
        return results[0];  // Best interpretation
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  return [];
}

parseSearchQuery('Find documents from January 1940 to December 1945');
// [{ edtf: '1940-01/1945-12', type: 'interval', ... }]
```

### Archival Data Import

```typescript
import { parseNatural } from '@edtf-ts/natural';

function normalizeArchivalDate(freeText: string) {
  try {
    const results = parseNatural(freeText);

    // Return all interpretations for manual review
    return results.map(r => ({
      original: freeText,
      edtf: r.edtf,
      confidence: r.confidence,
      interpretation: r.interpretation,
      needsReview: r.confidence < 0.8 || r.ambiguous
    }));
  } catch (error) {
    return [{
      original: freeText,
      edtf: null,
      error: 'Could not parse',
      needsReview: true
    }];
  }
}

// Museum catalog entry
normalizeArchivalDate('circa Spring 1895');
// [{
//   original: 'circa Spring 1895',
//   edtf: '1895-21~',
//   confidence: 0.95,
//   interpretation: 'approximately Spring 1895',
//   needsReview: false
// }]
```

## Extending the Grammar

The grammar is defined in `grammar.ne` using [Nearley](https://nearley.js.org/) syntax. You can extend it to support additional patterns.

```nearley
# Add custom pattern in grammar.ne

date ->
    "the year of" __ numeric_year
      {% d => ({ type: 'date', edtf: pad4(d[2]), confidence: 0.95 }) %}
```

After modifying the grammar:

```bash
cd packages/natural
pnpm run build:grammar
```

## Limitations

- **English only** - Currently supports only English language patterns
- **Grammar-based** - Cannot learn new patterns without grammar updates
- **No semantic understanding** - Doesn't understand context like "next Tuesday"
- **Relative dates** - Doesn't support relative dates ("yesterday", "last week")
- **Ambiguity requires judgment** - Some dates are genuinely ambiguous and require human review

## See Also

- [@edtf-ts](/api/core) - Parse and validate EDTF strings
- [Formatting & Utilities](/api/utils) - Format EDTF for human reading
- [Natural Language Guide](/guide/natural-language) - Conceptual overview
- [Nearley Grammar](https://nearley.js.org/) - Grammar syntax documentation
