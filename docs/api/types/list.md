# EDTFList

Represents "all members" of a list of dates (Level 2).

## Interface

```typescript
interface EDTFList extends EDTFBase {
  type: 'List';
  values: (EDTFDate | EDTFDateTime | EDTFSeason)[];
  earlier?: boolean;
  later?: boolean;
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'List'` | Type discriminator |
| `values` | `Array` | Values in the list |
| `earlier` | `boolean?` | True if list includes earlier dates |
| `later` | `boolean?` | True if list includes later dates |

### Inherited from EDTFBase

| Property | Type | Description |
|----------|------|-------------|
| `level` | `2` | Always Level 2 |
| `edtf` | `string` | Original EDTF string |
| `precision` | `Precision` | Based on list contents |
| `min` | `Date` | Earliest date |
| `max` | `Date` | Latest date |

## Usage

Lists are enclosed in curly braces `{}` and represent "all of these":

```typescript
import { parse, isEDTFList } from '@edtf-ts/core';

const result = parse('{1667,1668,1670..1672}');

if (result.success && isEDTFList(result.value)) {
  const list = result.value;

  console.log(list.values.length);  // Number of values in list
  for (const value of list.values) {
    console.log(value.edtf);
  }
}
```

## List Syntax

### Simple List

A comma-separated list of dates:

```typescript
parse('{1667,1668,1669}');
// All of: 1667, 1668, and 1669
```

### List with Ranges

Use `..` to specify ranges within a list:

```typescript
parse('{1667,1668,1670..1672}');
// All of: 1667, 1668, 1670, 1671, and 1672
```

### Earlier Values

Use `..` at the start to include all earlier values:

```typescript
parse('{..1760-12}');
// December 1760 and all earlier dates
```

```typescript
const result = parse('{..1760-12}');
if (result.success && isEDTFList(result.value)) {
  console.log(result.value.earlier);  // true
}
```

### Later Values

Use `..` at the end to include all later values:

```typescript
parse('{1760-12..}');
// December 1760 and all later dates
```

```typescript
const result = parse('{1760-12..}');
if (result.success && isEDTFList(result.value)) {
  console.log(result.value.later);  // true
}
```

## Examples

```typescript
// Years
parse('{1667,1668,1669}');

// Months
parse('{2004-01,2004-02,2004-03}');

// Days
parse('{2004-06-01,2004-06-02,2004-06-03}');

// Mixed precision
parse('{1667,1668-12}');

// With ranges
parse('{1760..1765,1770}');

// Open-ended
parse('{..1760}');    // 1760 and earlier
parse('{1760..}');    // 1760 and later
```

## Semantic Meaning

Lists express "all of" semantics:

```typescript
const result = parse('{1667,1668,1669}');
// Meaning: The event occurred in ALL of 1667, 1668, and 1669
// (e.g., an annual event that happened each of those years)
```

This is different from [Sets](/api/types/set) which express "one of" semantics.

## Comparison with Sets

| | Set `[]` | List `{}` |
|---|----------|-----------|
| **Meaning** | One of | All of |
| **Example** | `[1667,1668]` | `{1667,1668}` |
| **Interpretation** | Either 1667 or 1668 | Both 1667 and 1668 |

## Min/Max Bounds

The `min` and `max` properties span the entire list:

```typescript
const result = parse('{1667,1668,1672}');
if (result.success) {
  console.log(result.value.min);  // 1667-01-01
  console.log(result.value.max);  // 1672-12-31
}
```

## Type Guard

```typescript
import { isEDTFList } from '@edtf-ts/core';

const result = parse(input);
if (result.success && isEDTFList(result.value)) {
  // TypeScript knows result.value is EDTFList
  console.log(result.value.values);
}
```

## Related

- [EDTFSet](/api/types/set) - "One of" semantics (square brackets)
