# EDTFSet

Represents "one of a set" of dates (Level 2).

## Interface

```typescript
interface EDTFSet extends EDTFBase {
  type: 'Set';
  values: (EDTFDate | EDTFDateTime | EDTFSeason)[];
  earlier?: boolean;
  later?: boolean;
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'Set'` | Type discriminator |
| `values` | `Array` | Values in the set |
| `earlier` | `boolean?` | True if set includes earlier dates |
| `later` | `boolean?` | True if set includes later dates |

### Inherited from EDTFBase

| Property | Type | Description |
|----------|------|-------------|
| `level` | `2` | Always Level 2 |
| `edtf` | `string` | Original EDTF string |
| `precision` | `Precision` | Based on set contents |
| `min` | `Date` | Earliest possible date |
| `max` | `Date` | Latest possible date |

## Usage

Sets are enclosed in square brackets `[]` and represent "one of these":

```typescript
import { parse, isEDTFSet } from '@edtf-ts/core';

const result = parse('[1667,1668,1670..1672]');

if (result.success && isEDTFSet(result.value)) {
  const set = result.value;

  console.log(set.values.length);  // Number of values in set
  for (const value of set.values) {
    console.log(value.edtf);
  }
}
```

## Set Syntax

### Simple Set

A comma-separated list of dates:

```typescript
parse('[1667,1668,1669]');
// One of: 1667, 1668, or 1669
```

### Set with Ranges

Use `..` to specify ranges within a set:

```typescript
parse('[1667,1668,1670..1672]');
// One of: 1667, 1668, 1670, 1671, or 1672
```

### Earlier Values

Use `..` at the start to include all earlier values:

```typescript
parse('[..1760-12]');
// December 1760 or earlier
```

```typescript
const result = parse('[..1760-12]');
if (result.success && isEDTFSet(result.value)) {
  console.log(result.value.earlier);  // true
}
```

### Later Values

Use `..` at the end to include all later values:

```typescript
parse('[1760-12..]');
// December 1760 or later
```

```typescript
const result = parse('[1760-12..]');
if (result.success && isEDTFSet(result.value)) {
  console.log(result.value.later);  // true
}
```

## Examples

```typescript
// Years
parse('[1667,1668,1669]');

// Months
parse('[2004-01,2004-02,2004-03]');

// Days
parse('[2004-06-01,2004-06-02,2004-06-03]');

// Mixed precision
parse('[1667,1668-12]');

// With ranges
parse('[1760..1765,1770]');

// Open-ended
parse('[..1760]');    // 1760 or earlier
parse('[1760..]');    // 1760 or later
```

## Semantic Meaning

Sets express "one of" semantics:

```typescript
const result = parse('[1667,1668,1669]');
// Meaning: The event occurred in ONE of 1667, 1668, or 1669
// (but we don't know which one)
```

This is different from [Lists](/api/types/list) which express "all of" semantics.

## Min/Max Bounds

The `min` and `max` properties span the entire set:

```typescript
const result = parse('[1667,1668,1672]');
if (result.success) {
  console.log(result.value.min);  // 1667-01-01
  console.log(result.value.max);  // 1672-12-31
}
```

## Type Guard

```typescript
import { isEDTFSet } from '@edtf-ts/core';

const result = parse(input);
if (result.success && isEDTFSet(result.value)) {
  // TypeScript knows result.value is EDTFSet
  console.log(result.value.values);
}
```

## Related

- [EDTFList](/api/types/list) - "All of" semantics (curly braces)
