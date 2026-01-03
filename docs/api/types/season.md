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

### Seasons (Independent of Location) (Level 1)

| Code | Season | Months |
|------|--------|--------|
| 21 | Spring | March - May |
| 22 | Summer | June - August |
| 23 | Autumn | September - November |
| 24 | Winter | December - February |

### Northern Hemisphere Seasons (Level 2)

| Code | Season | Months |
|------|--------|--------|
| 25 | Spring (Northern Hemisphere) | March - May |
| 26 | Summer (Northern Hemisphere) | June - August |
| 27 | Autumn (Northern Hemisphere) | September - November |
| 28 | Winter (Northern Hemisphere) | December - February |

### Southern Hemisphere Seasons (Level 2)

| Code | Season | Months |
|------|--------|--------|
| 29 | Spring (Southern Hemisphere) | September - November |
| 30 | Summer (Southern Hemisphere) | December - February |
| 31 | Autumn (Southern Hemisphere) | March - May |
| 32 | Winter (Southern Hemisphere) | June - August |

### Quarters (Level 2)

| Code | Quarter | Months |
|------|---------|--------|
| 33 | Quarter 1 | January - March |
| 34 | Quarter 2 | April - June |
| 35 | Quarter 3 | July - September |
| 36 | Quarter 4 | October - December |

### Quadrimesters (Level 2)

| Code | Quadrimester | Months |
|------|--------------|--------|
| 37 | Quadrimester 1 | January - April |
| 38 | Quadrimester 2 | May - August |
| 39 | Quadrimester 3 | September - December |

### Semestrals (Level 2)

| Code | Semestral | Months |
|------|-----------|--------|
| 40 | Semestral 1 | January - June |
| 41 | Semestral 2 | July - December |

## Usage

```typescript
import { parse, isEDTFSeason } from '@edtf-ts';

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
// Seasons (independent of location)
parse('2001-21');  // Spring 2001
parse('2001-22');  // Summer 2001
parse('2001-23');  // Autumn 2001
parse('2001-24');  // Winter 2001

// Northern Hemisphere seasons
parse('2001-25');  // Spring (Northern Hemisphere) 2001
parse('2001-26');  // Summer (Northern Hemisphere) 2001
parse('2001-27');  // Autumn (Northern Hemisphere) 2001
parse('2001-28');  // Winter (Northern Hemisphere) 2001

// Southern Hemisphere seasons
parse('2001-29');  // Spring (Southern Hemisphere) 2001
parse('2001-30');  // Summer (Southern Hemisphere) 2001
parse('2001-31');  // Autumn (Southern Hemisphere) 2001
parse('2001-32');  // Winter (Southern Hemisphere) 2001

// Quarters
parse('2001-33');  // Quarter 1 2001
parse('2001-34');  // Quarter 2 2001
parse('2001-35');  // Quarter 3 2001
parse('2001-36');  // Quarter 4 2001

// Quadrimesters
parse('2001-37');  // Quadrimester 1 2001
parse('2001-38');  // Quadrimester 2 2001
parse('2001-39');  // Quadrimester 3 2001

// Semestrals
parse('2001-40');  // Semestral 1 2001
parse('2001-41');  // Semestral 2 2001
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
import { isEDTFSeason } from '@edtf-ts';

const result = parse(input);
if (result.success && isEDTFSeason(result.value)) {
  // TypeScript knows result.value is EDTFSeason
  console.log(result.value.season);
}
```

## Formatting

```typescript
import { parse, formatHuman } from '@edtf-ts';

const result = parse('2001-21');
if (result.success) {
  formatHuman(result.value);  // 'Spring 2001'
}
```
