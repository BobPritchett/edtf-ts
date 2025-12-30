# EDTF Range Normalization, Comparison, and Database Preparation

_(Revised Specification)_

## 0. Scope and design constraints

This specification defines how to:

1. Normalize EDTF (Levels 0–2) into **ranges of possible time**
2. Compare EDTF values using **range algebra** (Allen relations)
3. Convert ranges to **epoch milliseconds**
4. Prepare EDTF values for **efficient database querying**
5. Balance **infinite EDTF semantics** with **finite database types**

### Explicit constraint (important)

> **All EDTF values are modeled as ranges.**
> There is no distinction between:
>
> - “instant with low precision” and
> - “duration”
>
> A date-time to the minute means:
> _start of that minute → end of that minute_
> A year means:
> _start of the year → end of the year_

This is intentional and aligns with:

- search semantics
- timeline visualization
- database indexing
- user expectations (“find things during 1985”)

---

## 1. Core temporal model

### 1.1 Bound kinds

```ts
type BoundKind =
  | 'closed' // concrete bound exists
  | 'open' // unbounded (EDTF "..")
  | 'unknown'; // bound exists but is unknown (EDTF empty endpoint)
```

**Rules**

- `open` = infinite and comparable
- `unknown` = indeterminate and propagates `UNKNOWN` in comparisons

---

### 1.2 Normalized range member

A **Member** represents one possible time range implied by an EDTF expression.

```ts
type Member = {
  // earliest/latest possible start
  sMin: bigint | null;
  sMax: bigint | null;

  // earliest/latest possible end
  eMin: bigint | null;
  eMax: bigint | null;

  startKind: BoundKind;
  endKind: BoundKind;

  precision: 'minute' | 'hour' | 'day' | 'month' | 'year' | 'subyear' | 'mixed' | 'unknown';

  qualifiers?: {
    uncertain?: boolean; // ?
    approximate?: boolean; // ~
  };
};
```

**Invariant**

- A Member always represents a **range**, never a point.
- Precision determines how wide the range is.

---

### 1.3 Shapes and sets

```ts
type Shape = {
  members: Member[];
  listMode?: 'oneOf' | 'allOf'; // [] vs {}
};
```

- `[...]` → one member applies (exclusive choice)
- `{...}` → all members apply (inclusive list)

---

## 2. Normalization rules (EDTF → Members)

### 2.1 Dates and date-times

| EDTF                | Normalized range                   |
| ------------------- | ---------------------------------- |
| `1985`              | Jan 1 00:00 → Dec 31 23:59:59.999  |
| `1985-04`           | Apr 1 00:00 → Apr 30 23:59:59.999  |
| `1985-04-12`        | Apr 12 00:00 → Apr 12 23:59:59.999 |
| `2024-05-01T10:32Z` | 10:32:00.000 → 10:32:59.999        |

**Rule**

- Date-times are expanded to the **full smallest unit they specify**
- All bounds are `closed`

---

### 2.2 Intervals (`start/end`)

- Start is **sometime during** the start endpoint
- End is **sometime during** the end endpoint
- Mixed precision is allowed

Example:

```
2004-02-01/2005-02
```

Normalizes to:

```
sMin = 2004-02-01 00:00
sMax = 2004-02-01 23:59:59.999
eMin = 2005-02-01 00:00
eMax = 2005-02-28 23:59:59.999
```

---

### 2.3 Unspecified digits (`X`)

- Masked components expand to their numeric min/max
- Resulting component defines the range

Examples:

- `201X` → 2010-01-01 → 2019-12-31
- `1985-04-XX` → entire April 1985
- `1984-1X` → Oct 1 → Dec 31 1984

---

### 2.4 Qualification (`? ~ %`)

**Policy**

- Qualifiers **do not widen bounds**
- They are stored as metadata only

Rationale:

- EDTF does not define numeric tolerances
- Widening is application-specific and optional

Applications MAY:

- widen bounds heuristically at query time
- rank exact matches above approximate ones

---

### 2.5 Open vs unknown endpoints

| Syntax                   | Meaning   | Representation           |
| ------------------------ | --------- | ------------------------ |
| `..`                     | unbounded | `open`, bounds = null    |
| empty endpoint (`1985/`) | unknown   | `unknown`, bounds = null |

Unknown endpoints propagate `UNKNOWN` in comparison logic.

---

### 2.6 Seasons and sub-year groupings

EDTF season / grouping codes (`21–41`) MUST map to fixed month spans.

**Normative policy (example)**
_(You may choose different spans, but must document them)_

| Code | Meaning | Months  |
| ---- | ------- | ------- |
| 21   | Spring  | Mar–May |
| 22   | Summer  | Jun–Aug |
| 23   | Autumn  | Sep–Nov |
| 24   | Winter  | Dec–Feb |

Resulting Member spans those months.

---

### 2.7 Negative years

- Use **astronomical year numbering**
  - Year 0 = 1 BC
  - Year -1 = 2 BC

- All bigint math assumes astronomical numbering

---

## 3. Comparison semantics

### 3.1 Truth values

```ts
type Truth = 'YES' | 'NO' | 'MAYBE' | 'UNKNOWN';
```

---

### 3.2 Supported relations

Base (Allen algebra):

```
before, after,
meets, metBy,
overlaps, overlappedBy,
starts, startedBy,
during, contains,
finishes, finishedBy,
equals
```

Derived:

```
intersects
disjoint
touches
duringOrEqual
containsOrEqual
```

---

### 3.3 Evaluation pattern

For each Member pair `(A,B)`:

1. If bounds force relation → `YES`
2. If bounds forbid relation → `NO`
3. If required bound is `unknown` → `UNKNOWN`
4. Else → `MAYBE`

Results are then lifted across sets using quantifiers.

---

### 3.4 Set evaluation

```ts
type Quantifier = 'ANY' | 'ALL';
```

Defaults:

- Search/filtering: `ANY/ANY`
- Validation/constraints: `ALL/ALL`

---

## 4. Epoch millisecond conversion

### 4.1 BigInt policy

- **Internal normalization:** always `bigint`
- **Database storage:** `number` (`BIGINT`) when representable
- Extreme values are flagged

```ts
type InstantMs = { kind: 'number'; value: number } | { kind: 'bigint'; value: bigint };
```

---

### 4.2 Time scale

**Normative choice**

- Proleptic Gregorian calendar
- Unix time (UTC, ignoring leap seconds)

Leap-second precision is not preserved.

---

## 5. Database preparation

### 5.1 Stored columns

```sql
edtf_text          TEXT NOT NULL,

start_min_ms       BIGINT NULL,
start_max_ms       BIGINT NULL,
end_min_ms         BIGINT NULL,
end_max_ms         BIGINT NULL,

has_open_start     BOOLEAN NOT NULL,
has_open_end       BOOLEAN NOT NULL,
has_unknown_start  BOOLEAN NOT NULL,
has_unknown_end    BOOLEAN NOT NULL,

precision_rank     SMALLINT NOT NULL,
is_set             BOOLEAN NOT NULL,
set_mode           SMALLINT NULL,

out_of_range       BOOLEAN NOT NULL
```

---

### 5.2 Set flattening policy (explicit)

When `is_set = true`:

1. `start_min_ms` = minimum of all members’ `sMin`
2. `end_max_ms` = maximum of all members’ `eMax`
3. `start_max_ms` / `end_min_ms` likewise
4. This forms a **convex hull**

**Application responsibility**

- The DB may return false positives for gaps
- Application must re-evaluate EDTF precisely

---

### 5.3 Out-of-range policy (clamping)

To preserve sortable timelines:

- Define `MIN_DB_MS`, `MAX_DB_MS`
- If a bound exceeds limits:
  - clamp to min/max
  - set `out_of_range = true`

This preserves ordering while signaling loss of precision.

---

### 5.4 Canonical overlap query (superset)

```sql
WHERE
  (end_max_ms IS NULL OR end_max_ms >= :qStart)
  AND
  (start_min_ms IS NULL OR start_min_ms <= :qEnd)
```

No false negatives are permitted.

---

### 5.5 Indexing

```sql
CREATE INDEX ON items (start_min_ms);
CREATE INDEX ON items (end_max_ms);
```

Optional (Postgres):

- `int8range` for single ranges
- `int8multirange` if sets are common and performance-critical

---

## 6. Sorting

Canonical chronological order:

```sql
ORDER BY
  start_min_ms ASC,
  end_max_ms ASC,
  precision_rank DESC,
  edtf_text ASC
```

Clamping ensures deep-time values remain ordered.

---

## 7. Division of responsibility

**Database**

- Fast candidate selection
- Coarse chronological ordering

**Application**

- Exact EDTF semantics
- Truth classification
- Set logic
- Unknown-endpoint propagation

---

## 8. Final invariant

> **The database must never exclude a possible match.**
> **The comparison engine must never assert certainty without proof.**

This revised plan satisfies both while remaining implementable, performant, and aligned with EDTF’s full expressive power.
