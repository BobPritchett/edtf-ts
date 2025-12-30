Below is a **clean, self-contained specification** suitable for handing to an LLM (or a human engineer) to **extend an EDTF library** with:

- correct **comparison semantics**
- **normalization to start/end envelopes**
- **conversion to epoch milliseconds**
- **database-friendly indexing strategy**
- **BigInt vs number policy**

It intentionally avoids prose and reads like an implementation spec.

---

# EDTF Comparison & Database Preparation Specification

## 0. Scope and goals

This spec defines how to:

1. Parse any EDTF (Levels 0–2) into **normalized temporal envelopes**
2. Compare EDTF values using **sound interval relations**
3. Convert envelopes to **epoch milliseconds** (with BigInt support)
4. Prepare EDTF values for **efficient database querying**
5. Preserve correctness for:
   - reduced precision
   - uncertainty / approximation
   - unspecified digits
   - open vs unknown interval endpoints
   - sets and ranges
   - date-times with time zones

This spec **does not** require databases or APIs to be EDTF-complete internally; it enables **lossless semantics** with **pragmatic storage**.

---

## 1. Core concepts

### 1.1 Fundamental principle

> EDTF values represent **sets of possible instants or intervals**, not a single timestamp.

Therefore:

- All comparisons must reason over **ranges of possibility**
- All DB queries must be **supersets**, then refined precisely

---

## 2. Normalized temporal model

### 2.1 Bound kinds

```ts
type BoundKind =
  | 'closed' // concrete bound exists
  | 'open' // unbounded (EDTF "..")
  | 'unknown'; // bound exists but unknown (EDTF empty endpoint)
```

**Important:**
`open` ≠ `unknown`

- open ⇒ infinite, comparable
- unknown ⇒ indeterminate, propagates UNKNOWN truth

---

### 2.2 Normalized member (single envelope)

A single possible interpretation of an EDTF value.

```ts
type Member = {
  // possible start instants
  sMin: bigint | null;
  sMax: bigint | null;

  // possible end instants
  eMin: bigint | null;
  eMax: bigint | null;

  startKind: BoundKind;
  endKind: BoundKind;

  precision: 'time' | 'day' | 'month' | 'year' | 'subyear' | 'mixed' | 'unknown';

  qualifiers?: {
    uncertain?: boolean; // ?
    approximate?: boolean; // ~
  };
};
```

All EDTF features (X digits, seasons, significant digits, etc.) normalize into **one or more Members**.

---

### 2.3 Shape (handles sets)

```ts
type Shape = {
  members: Member[];
  listMode?: 'oneOf' | 'allOf'; // [] vs {}
};
```

- `[]` → exactly one member is chosen
- `{}` → all members apply

---

## 3. Normalization rules (summary)

### 3.1 Dates and date-times

- A date or date-time becomes a **closed range**
- Reduced precision expands to full span:
  - `1985` → Jan 1 00:00:00.000 → Dec 31 23:59:59.999
  - `1985-04` → April 1 → April 30

- Date-time with zone → normalize to UTC instant

### 3.2 Intervals (`start/end`)

- Start is **sometime within** start endpoint
- End is **sometime within** end endpoint
- Mixed precision is allowed

### 3.3 Unspecified digits (`X`)

- Expand masked component to min/max range
- E.g. `1985-04-XX` → entire April 1985

### 3.4 Qualification (`? ~ %`)

- Do **not** widen time bounds
- Record qualifiers as metadata only

### 3.5 Open vs unknown endpoints

- `..` ⇒ `open`, bounds = null
- empty endpoint ⇒ `unknown`, bounds = null

### 3.6 Sets and ranges

- `[a,b]` → two Members, `listMode="oneOf"`
- `{a,b}` → two Members, `listMode="allOf"`
- `a..b` → single Member spanning inclusive range

---

## 4. Comparison semantics

### 4.1 Truth values

```ts
type Truth = 'YES' | 'NO' | 'MAYBE' | 'UNKNOWN';
```

- **YES**: always true
- **NO**: never true
- **MAYBE**: true for some interpretations
- **UNKNOWN**: blocked by unknown endpoint

---

### 4.2 Canonical relations (Allen algebra)

Supported base relations:

```
before, after,
meets, metBy,
overlaps, overlappedBy,
starts, startedBy,
during, contains,
finishes, finishedBy,
equals
```

Derived relations:

```
intersects
disjoint
touches
duringOrEqual
containsOrEqual
```

---

### 4.3 Relation evaluation pattern

Each relation `R(A,B)` is evaluated using:

1. **Forced YES** test using bounds
2. **Forced NO** test using bounds
3. If required bound is `unknown` → `UNKNOWN`
4. Otherwise → `MAYBE`

Relations are evaluated **per Member pair**, then lifted across sets.

---

### 4.4 Lifting across sets

```ts
type Quantifier = 'ANY' | 'ALL';
```

Evaluation:

- Compare every `(Ai, Bj)`
- Combine results with quantifiers
- Defaults:
  - search/filtering: `ANY/ANY`
  - constraints/validation: `ALL/ALL`

---

## 5. Intersection envelope (optional but useful)

```ts
type IntersectionResult = {
  truth: Truth;
  intersection?: Member; // overlapping envelope if computable
};
```

Used for:

- coverage queries
- gap detection
- UI timelines

---

## 6. Epoch millisecond conversion

### 6.1 Why BigInt

- EDTF Level 2 allows extreme years
- JS `number` is unsafe for large instants
- `BigInt` is built-in and exact

### 6.2 Policy

**Internal normalization:**
✔ Always use `bigint`

**Database storage:**
✔ Convert to `number` (BIGINT) **only when representable**
✔ Otherwise store `null` + `out_of_range=true`

---

### 6.3 Conversion helpers

```ts
type InstantMs = { kind: 'number'; value: number } | { kind: 'bigint'; value: bigint };

function instantToEpochMs(
  instant: bigint,
  policy: {
    minYear: number;
    maxYear: number;
  }
): InstantMs;
```

---

## 7. Database preparation

### 7.1 Stored columns

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

### 7.2 Why all four bounds matter

- `start_min`, `end_max` → **candidate overlap**
- `start_max`, `end_min` → **definitive before/after**, better sorting, fewer false positives

---

### 7.3 Canonical overlap query (superset)

```sql
WHERE
  (end_max_ms IS NULL OR end_max_ms >= :qStart)
  AND
  (start_min_ms IS NULL OR start_min_ms <= :qEnd)
```

Then apply **precise EDTF comparison** in application code.

---

### 7.4 Indexing

```sql
CREATE INDEX ON items (start_min_ms);
CREATE INDEX ON items (end_max_ms);
```

Optional (Postgres):

```sql
env_ms INT8RANGE GENERATED ALWAYS AS (
  CASE
    WHEN start_min_ms IS NOT NULL AND end_max_ms IS NOT NULL
    THEN int8range(start_min_ms, end_max_ms, '[]')
    ELSE NULL
  END
) STORED;

CREATE INDEX ON items USING GIST (env_ms) WHERE env_ms IS NOT NULL;
```

---

## 8. Sorting guidance

Default chronological sort:

```sql
ORDER BY
  start_min_ms ASC NULLS LAST,
  precision_rank DESC,
  end_max_ms ASC NULLS LAST,
  edtf_text ASC
```

---

## 9. BigInt vs number guidance (normative)

- `BigInt` is **built-in** (no package)
- Use `BigInt` internally for correctness
- Use `number`/`BIGINT` in DB for performance
- Clamp + flag extreme values
- Never mix `number` and `bigint` implicitly

---

## 10. Implementation boundary

**Database responsibilities**

- Fast candidate selection
- Ordering by coarse chronology

**Application responsibilities**

- Exact EDTF semantics
- Truth classification (YES/NO/MAYBE/UNKNOWN)
- Set logic
- Unknown endpoint propagation

---

## 11. Final invariant

> **The database must never exclude a possible match.
> The comparison engine must never assert certainty without proof.**

This spec guarantees both.
