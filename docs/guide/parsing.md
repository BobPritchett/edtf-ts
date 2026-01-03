# Parsing EDTF Strings

This guide covers parsing EDTF strings into structured objects.

## Basic Parsing

Use the `parse()` function to convert an EDTF string into a typed object:

```typescript
import { parse } from '@edtf-ts';

const result = parse('1985-04-12');

if (result.success) {
  console.log(result.value.type);  // 'Date'
  console.log(result.value.year);  // 1985
  console.log(result.value.month); // 4
  console.log(result.value.day);   // 12
}
```

## Result Types

The `parse()` function returns a discriminated union:

```typescript
type ParseResult =
  | { success: true; value: EDTFBase; level: 0 | 1 | 2 }
  | { success: false; errors: ParseError[] };
```

Always check `result.success` before accessing `result.value`:

```typescript
const result = parse(userInput);

if (result.success) {
  // Safe to use result.value
  processDate(result.value);
} else {
  // Handle errors
  console.error(result.errors[0].message);
}
```

## Level-Specific Parsing

EDTF has three conformance levels. You can parse at a specific level:

```typescript
import { parse, parseLevel0, parseLevel1, parseLevel2 } from '@edtf-ts';

// Auto-detect level (tries all levels)
parse('1984?');  // Works - Level 1

// Parse only Level 0 (strict ISO 8601)
parseLevel0('1984?');  // Fails - '?' not allowed in Level 0

// Parse Level 1 and below
parseLevel1('1984?');  // Works

// Parse all levels
parseLevel2('[1667,1668]');  // Works - Level 2 sets
```

## Type Guards

After parsing, use type guards to narrow the type:

```typescript
import {
  parse,
  isEDTFDate,
  isEDTFInterval,
  isEDTFSeason
} from '@edtf-ts';

const result = parse(input);

if (result.success) {
  if (isEDTFDate(result.value)) {
    // TypeScript knows this is EDTFDate
    console.log(result.value.year);
  } else if (isEDTFInterval(result.value)) {
    // TypeScript knows this is EDTFInterval
    console.log(result.value.start);
  } else if (isEDTFSeason(result.value)) {
    // TypeScript knows this is EDTFSeason
    console.log(result.value.season);
  }
}
```

## Parsing Examples

### Dates

```typescript
parse('2024');           // Year only
parse('2024-06');        // Year and month
parse('2024-06-15');     // Complete date
parse('2024-06-15T14:30:00Z');  // DateTime with timezone
```

### Qualified Dates (Level 1)

```typescript
parse('1984?');          // Uncertain year
parse('1984~');          // Approximate year
parse('1984%');          // Uncertain and approximate
parse('2004-06?');       // Uncertain month
parse('2004-06-~11');    // Approximate day
```

### Unspecified Digits (Level 1)

```typescript
parse('199X');           // 1990s decade
parse('19XX');           // 1900s century
parse('2004-XX');        // Unknown month
parse('2004-06-XX');     // Unknown day
```

### Intervals

```typescript
parse('1964/2008');           // Year interval
parse('2004-06/2006-08');     // Month interval
parse('../1985-04-12');       // Open start (before)
parse('1985-04-12/..');       // Open end (after)
parse('1984-06-02?/2004-08-08~');  // Qualified endpoints
```

### Sets and Lists (Level 2)

```typescript
parse('[1667,1668,1670..1672]');  // One of these
parse('{1667,1668,1670..1672}');  // All of these
parse('[..1760]');               // One of these or earlier
parse('{1760..}');               // All of these and later
```

### Seasons

```typescript
parse('2001-21');  // Spring 2001
parse('2001-22');  // Summer 2001
parse('2001-23');  // Autumn 2001
parse('2001-24');  // Winter 2001
```

## Error Handling

When parsing fails, you get detailed error information:

```typescript
const result = parse('invalid-date');

if (!result.success) {
  for (const error of result.errors) {
    console.log(`Error: ${error.message}`);
    console.log(`Position: ${error.position}`);
  }
}
```

## Validation Without Parsing

Use `isValid()` for simple validation:

```typescript
import { isValid } from '@edtf-ts';

isValid('1985-04-12');  // true
isValid('1985-13-01');  // false (invalid month)
isValid('1984?');       // true
isValid('garbage');     // false
```

## Natural Language Parsing

For natural language input, use the `@edtf-ts/natural` package:

```typescript
import { parseNatural } from '@edtf-ts/natural';

parseNatural('January 12, 1940');
// [{ edtf: '1940-01-12', confidence: 0.95, ... }]

parseNatural('circa 1950');
// [{ edtf: '1950~', confidence: 0.95, ... }]

parseNatural('early 20th century');
// [{ edtf: '1901/1933', confidence: 0.95, ... }]
```

See the [@edtf-ts/natural API reference](/api/natural) for more details.
