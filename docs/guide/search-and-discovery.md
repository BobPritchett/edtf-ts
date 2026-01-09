# Search, Discovery, and Fuzzy Dates

EDTF-TS provides a "Discovery Layer" that expands date bounds heuristically for improved search relevance. While the strict `min`/`max` properties represent exact EDTF semantics, the `searchMin`/`searchMax` properties account for human uncertainty when expressing dates.

## Integrity vs. Discovery

EDTF-TS maintains two sets of bounds for every date:

| Property | Purpose | Description |
|----------|---------|-------------|
| `min` / `max` | **Integrity** | Strict EDTF bounds - the exact range defined by the specification |
| `searchMin` / `searchMax` | **Discovery** | Heuristic bounds - expanded range accounting for human uncertainty |

### Example

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const circaDate = FuzzyDate.parse('1920~'); // Approximate year

// Strict EDTF bounds: Jan 1, 1920 to Dec 31, 1920
console.log(circaDate.min.getFullYear()); // 1920
console.log(circaDate.max.getFullYear()); // 1920

// Heuristic search bounds: ~1918 to ~1922 (±2 years for approximate)
console.log(circaDate.searchMin.getFullYear()); // 1917 or 1918
console.log(circaDate.searchMax.getFullYear()); // 1922 or 1923
```

## The Heuristics

Search bounds are expanded based on the date's **precision** and **qualifiers**:

### Padding by Qualifier

| Qualifier | Symbol | Multiplier | Meaning |
|-----------|--------|------------|---------|
| None | - | ±0 units | Exact date |
| Uncertain | `?` | ±1 unit | "I think it was..." |
| Approximate | `~` | ±2 units | "Around..." / "Circa" |
| Both | `%` | ±3 units | "Roughly around..." |

### Unit by Precision

| Precision | Unit Duration | Example |
|-----------|--------------|---------|
| Year | ~365.25 days | `1920~` expands by ±2 years |
| Month | ~30.44 days | `1920-05~` expands by ±2 months |
| Day | 24 hours | `1920-05-15~` expands by ±2 days |

### Concrete Examples

```typescript
import { FuzzyDate } from '@edtf-ts/core';

// Year precision, approximate (~): ±2 years
const circa1920 = FuzzyDate.parse('1920~');
// searchMin: ~Jan 1, 1918
// searchMax: ~Dec 31, 1922

// Month precision, uncertain (?): ±1 month
const maybeSpring = FuzzyDate.parse('1920-04?');
// searchMin: ~March 1, 1920
// searchMax: ~May 31, 1920

// Day precision, both (%): ±3 days
const roughDay = FuzzyDate.parse('1920-05-15%');
// searchMin: ~May 12, 1920
// searchMax: ~May 18, 1920
```

## Overlap Scoring (Jaccard Index)

The `overlapScore()` method calculates how well two date ranges overlap, returning a value between 0.0 (no overlap) and 1.0 (perfect match). This enables ranking search results by relevance.

### How It Works

The method computes the **Jaccard Index** (Intersection over Union):

```
Score = Intersection Duration / Union Duration
```

Both dates use their **search bounds** for maximum discovery potential.

### Usage

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const query = FuzzyDate.parse('1919');

const exact1919 = FuzzyDate.parse('1919');
const circa1919 = FuzzyDate.parse('1919~');
const circa1920s = FuzzyDate.parse('192X~');

console.log(query.overlapScore(exact1919));  // 1.0 (perfect match)
console.log(query.overlapScore(circa1919));  // ~0.2 (high overlap)
console.log(query.overlapScore(circa1920s)); // ~0.05 (partial overlap)
```

### Ranking Search Results

Use overlap scoring to rank results by relevance:

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const query = FuzzyDate.parse('1919');

const results = [
  { id: 1, date: FuzzyDate.parse('1919') },
  { id: 2, date: FuzzyDate.parse('1919~') },
  { id: 3, date: FuzzyDate.parse('1920~') },
  { id: 4, date: FuzzyDate.parse('192X~') },
];

// Sort by overlap score (highest first)
const ranked = results
  .map(r => ({ ...r, score: query.overlapScore(r.date) }))
  .sort((a, b) => b.score - a.score);

console.log(ranked);
// [
//   { id: 1, score: 1.0 },    // Exact match
//   { id: 2, score: ~0.2 },   // High overlap
//   { id: 3, score: ~0.1 },   // Some overlap (adjacent year)
//   { id: 4, score: ~0.05 },  // Partial overlap (decade)
// ]
```

## Special Cases

### Intervals

For intervals like `1985~/1990?`, the start and end qualifiers are applied separately:

```typescript
const interval = FuzzyDate.parse('1985~/1990?');

// Start (~approximate): padded by ±2 years → ~1983
// End (?uncertain): padded by ±1 year → ~1991
```

### Seasons

Seasons (like `2001-21` for Spring 2001) use month-level precision for padding:

```typescript
const circaSpring = FuzzyDate.parse('2001-21~');
// Approximate season expands by ±2 months
```

### Sets and Lists

Sets (`[1667,1668,1670]`) and Lists (`{1667,1668,1670}`) apply padding to the convex hull (overall min/max):

```typescript
const set = FuzzyDate.parse('[1667,1668,1670]');
// Sets are inherently uncertain (we don't know which member is actual)
// searchMin: padded start of 1667
// searchMax: padded end of 1670
```

### Unspecified Digits

Dates with unspecified digits (like `199X~`) combine the unspecified range with qualifier padding:

```typescript
const circaDecade = FuzzyDate.parse('199X~');
// Strict bounds: 1990-1999
// Search bounds: ~1988-2001 (decade + ±2 years)
```

## Database Integration

### Postgres Schema

Store both strict and search bounds for maximum flexibility:

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  edtf_raw TEXT,
  -- STRICT BOUNDS (for filtering "events strictly within X")
  fact_range tstzrange,
  -- HEURISTIC BOUNDS (for finding "events around X")
  search_range tstzrange
);

-- Index for fast overlap queries
CREATE INDEX idx_search ON events USING GIST (search_range);
```

### Storing from TypeScript

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const date = FuzzyDate.parse('1920~');

const row = {
  edtf_raw: date.edtf,
  fact_range: `[${date.min.toISOString()}, ${date.max.toISOString()}]`,
  search_range: `[${date.searchMin.toISOString()}, ${date.searchMax.toISOString()}]`,
};
```

### Querying with Overlap Ranking

```sql
-- Find events relevant to "1919" (ranked by overlap)
-- Assume $1 = '1919-01-01' and $2 = '1920-01-01' (query search bounds)

SELECT id, edtf_raw,
  -- Calculate overlap score (Intersection / Union)
  EXTRACT(EPOCH FROM
    upper(search_range * tstzrange($1, $2)) -
    lower(search_range * tstzrange($1, $2))
  ) /
  EXTRACT(EPOCH FROM
    upper(range_merge(search_range, tstzrange($1, $2))) -
    lower(range_merge(search_range, tstzrange($1, $2)))
  ) AS score
FROM events
WHERE search_range && tstzrange($1, $2)  -- Overlap check
ORDER BY score DESC;
```

## API Reference

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `searchMin` | `Date` | Heuristic earliest bound (clamped to JS Date range) |
| `searchMax` | `Date` | Heuristic latest bound (clamped to JS Date range) |
| `searchMinMs` | `bigint` | Heuristic earliest bound in epoch milliseconds |
| `searchMaxMs` | `bigint` | Heuristic latest bound in epoch milliseconds |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `overlapScore(other)` | `number` | Jaccard Index (0.0 to 1.0) with another date |

### Constants

```typescript
import {
  ONE_DAY_MS,      // 86,400,000n ms
  ONE_MONTH_MS,    // 2,629,800,000n ms (~30.44 days)
  ONE_YEAR_MS,     // 31,557,600,000n ms (~365.25 days)
  getSearchPadding // Helper function
} from '@edtf-ts/core';
```
