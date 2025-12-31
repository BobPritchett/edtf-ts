# EDTFSeason

Represents a season within a year (Levels 1 and 2).

## Interface

```typescript
interface EDTFSeason extends EDTFBase {
  type: 'Season';
  year: number;
  season: number;
  qualification?: Qualification;
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'Season'` | Type discriminator |
| `year` | `number` | Year |
| `season` | `number` | Season code (21-41) |
| `qualification` | `Qualification?` | Uncertainty/approximation flags |

### Inherited from EDTFBase

| Property | Type | Description |
|----------|------|-------------|
| `level` | `1 \| 2` | Level 1 or 2 |
| `edtf` | `string` | Original EDTF string |
| `precision` | `'month'` | Always 'month' precision |
| `min` | `Date` | First day of the season |
| `max` | `Date` | Last day of the season |

## Season Codes

### Northern Hemisphere (Level 1)

| Code | Season | Months |
|------|--------|--------|
| 21 | Spring | March - May |
| 22 | Summer | June - August |
| 23 | Autumn | September - November |
| 24 | Winter | December - February |

### Southern Hemisphere (Level 2)

| Code | Season | Months |
|------|--------|--------|
| 25 | Spring | September - November |
| 26 | Summer | December - February |
| 27 | Autumn | March - May |
| 28 | Winter | June - August |

### Quarters (Level 2)

| Code | Quarter | Months |
|------|---------|--------|
| 29 | Q1 | January - March |
| 30 | Q2 | April - June |
| 31 | Q3 | July - September |
| 32 | Q4 | October - December |

### Quadrimesters (Level 2)

| Code | Quadrimester | Months |
|------|--------------|--------|
| 33 | First | January - April |
| 34 | Second | May - August |
| 35 | Third | September - December |

### Semesters (Level 2)

| Code | Semester | Months |
|------|----------|--------|
| 37 | First | January - June |
| 38 | Second | July - December |

## Usage

```typescript
import { parse, isEDTFSeason } from '@edtf-ts/core';

const result = parse('2001-21');

if (result.success && isEDTFSeason(result.value)) {
  const season = result.value;

  console.log(season.year);    // 2001
  console.log(season.season);  // 21 (Spring)
  console.log(season.min);     // Date: 2001-03-01
  console.log(season.max);     // Date: 2001-05-31
}
```

## Examples

```typescript
// Northern Hemisphere seasons
parse('2001-21');  // Spring 2001
parse('2001-22');  // Summer 2001
parse('2001-23');  // Autumn 2001
parse('2001-24');  // Winter 2001

// Southern Hemisphere seasons
parse('2001-25');  // Spring 2001 (Southern)
parse('2001-26');  // Summer 2001 (Southern)

// Quarters
parse('2001-29');  // Q1 2001
parse('2001-30');  // Q2 2001

// Semesters
parse('2001-37');  // First semester 2001
parse('2001-38');  // Second semester 2001
```

## Qualified Seasons

Seasons can have qualifications (Level 1):

```typescript
parse('2001-21?');  // Uncertain spring
parse('2001-21~');  // Approximate spring
parse('2001-21%');  // Uncertain and approximate
```

```typescript
const result = parse('2001-21?');
if (result.success && isEDTFSeason(result.value)) {
  console.log(result.value.qualification?.uncertain);  // true
}
```

## Type Guard

```typescript
import { isEDTFSeason } from '@edtf-ts/core';

const result = parse(input);
if (result.success && isEDTFSeason(result.value)) {
  // TypeScript knows result.value is EDTFSeason
  console.log(result.value.season);
}
```

## Formatting

```typescript
import { formatHuman } from '@edtf-ts/utils';

const result = parse('2001-21');
if (result.success) {
  formatHuman(result.value);  // 'Spring 2001'
}
```
