# @edtf-ts

Core EDTF parsing, comparison, and formatting. This is the main package that includes all functionality previously split across @edtf-ts/core, @edtf-ts/compare, and @edtf-ts/utils.

## Installation

```bash
pnpm add @edtf-ts
```

## parse()

Parse an EDTF string and return a result object.

```typescript
function parse(input: string, level?: EDTFLevel): ParseResult
```

### Parameters

- `input` - The EDTF string to parse
- `level` - Optional conformance level (0, 1, or 2). If omitted, auto-detects the level.

### Returns

On success:
```typescript
{
  success: true;
  value: EDTFBase;
  level: 0 | 1 | 2;
}
```

On failure:
```typescript
{
  success: false;
  errors: ParseError[];
}
```

### Example

```typescript
import { parse } from '@edtf-ts/core';

const result = parse('1985-04-12');

if (result.success) {
  console.log(result.value.type);       // 'Date'
  console.log(result.value.precision);  // 'day'
  console.log(result.level);            // 0
} else {
  console.error(result.errors[0].message);
}
```

## isValid()

Validate an EDTF string.

```typescript
function isValid(input: string, level?: EDTFLevel): boolean
```

### Parameters

- `input` - The EDTF string to validate
- `level` - Optional conformance level (0, 1, or 2)

### Returns

`true` if valid, `false` otherwise

### Example

```typescript
import { isValid } from '@edtf-ts/core';

isValid('1985-04-12');  // true
isValid('1985-13-01');  // false
isValid('2000-02-29');  // true (leap year)
isValid('1984?');       // true (Level 1)
isValid('[1667,1668]'); // true (Level 2)
```

## Type Guards

### isEDTFDate()

```typescript
function isEDTFDate(value: unknown): value is EDTFDate
```

Check if a value is an EDTFDate.

```typescript
const result = parse('1985-04-12');
if (result.success && isEDTFDate(result.value)) {
  console.log(result.value.year);  // TypeScript knows this is EDTFDate
}
```

### isEDTFDateTime()

```typescript
function isEDTFDateTime(value: unknown): value is EDTFDateTime
```

Check if a value is an EDTFDateTime.

### isEDTFInterval()

```typescript
function isEDTFInterval(value: unknown): value is EDTFInterval
```

Check if a value is an EDTFInterval.

### isEDTFSeason()

```typescript
function isEDTFSeason(value: unknown): value is EDTFSeason
```

Check if a value is an EDTFSeason.

### isEDTFSet()

```typescript
function isEDTFSet(value: unknown): value is EDTFSet
```

Check if a value is an EDTFSet.

### isEDTFList()

```typescript
function isEDTFList(value: unknown): value is EDTFList
```

Check if a value is an EDTFList.

## Level-Specific Parsers

### parseLevel0()

```typescript
function parseLevel0(input: string): ParseResult
```

Parse using only Level 0 features (ISO 8601 profile).

### parseLevel1()

```typescript
function parseLevel1(input: string): ParseResult
```

Parse using Level 0 and Level 1 features.

### parseLevel2()

```typescript
function parseLevel2(input: string): ParseResult
```

Parse using all levels (0, 1, and 2).

## Types

See the [Types Reference](./types/date) for detailed type information.

## Constants

### VERSION

```typescript
const VERSION: string
```

The current version of @edtf-ts/core.

```typescript
import { VERSION } from '@edtf-ts/core';
console.log(VERSION);  // "0.1.0"
```

### DATE_MIN_MS / DATE_MAX_MS

```typescript
const DATE_MIN_MS: bigint  // -8640000000000000n
const DATE_MAX_MS: bigint  //  8640000000000000n
```

The minimum and maximum epoch milliseconds that JavaScript `Date` objects can represent (approximately ±270,000 years from epoch).

```typescript
import { DATE_MIN_MS, DATE_MAX_MS } from '@edtf-ts/core';

// Use these to detect if a bigint epoch value exceeds Date limits
const ms = someEdtfValue.minMs;
if (ms < DATE_MIN_MS || ms > DATE_MAX_MS) {
  console.log('Date beyond JavaScript Date range');
}
```

## Extended Years and Date Clamping

JavaScript `Date` objects have a limited range of approximately ±270,000 years from the Unix epoch. EDTF supports extended years (e.g., `Y2000123456` for year 2 billion) that exceed this range.

To handle this, all EDTF objects provide:

| Property | Type | Description |
|----------|------|-------------|
| `min` | `Date` | Earliest date (clamped to valid Date range if needed) |
| `max` | `Date` | Latest date (clamped to valid Date range if needed) |
| `minMs` | `bigint` | Earliest date as epoch milliseconds (always accurate) |
| `maxMs` | `bigint` | Latest date as epoch milliseconds (always accurate) |
| `isBoundsClamped` | `boolean?` | `true` if Date values were clamped |

### Example: Extended Year

```typescript
import { parse } from '@edtf-ts/core';

// Parse an extended year (2 billion years in the future)
const result = parse('Y2000123456');

if (result.success) {
  const value = result.value;

  console.log(value.year);            // 2000123456
  console.log(value.isBoundsClamped); // true

  // Date objects are clamped to the maximum representable date
  console.log(value.min.toISOString());
  // +275760-09-13T00:00:00.000Z (max Date)

  // BigInt values are always accurate
  console.log(value.minMs); // 63117737727846912000n
  console.log(value.maxMs); // 63117737759469311999n
}
```

### Example: Normal Date

```typescript
// Normal dates work as expected
const normal = parse('2024-06-15');

if (normal.success) {
  console.log(normal.value.isBoundsClamped); // undefined (not clamped)
  console.log(normal.value.min.toISOString());
  // 2024-06-15T00:00:00.000Z
  console.log(normal.value.minMs);
  // 1718409600000n
}
```

### When to Use BigInt Values

- **Normal use**: Use `min`/`max` Date properties for typical date ranges
- **Extended years**: Check `isBoundsClamped`, use `minMs`/`maxMs` for accurate values
- **Database storage**: Use `minMs`/`maxMs` for precise storage of any date
- **Comparison**: The comparison functions use BigInt internally for accurate temporal reasoning
