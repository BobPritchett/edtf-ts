# Age and Birthdays (EDTF-first) spec for `parseAgeBirthday()` and `renderAgeBirthday()`

This spec defines three functions for parsing, rendering, and calculating age- and birthdate-related strings using **EDTF Level 2** (date-only; no times). It assumes the system already has **excellent EDTF parsing + formatting**, including approximate/uncertain qualifiers, partial dates, intervals, and component-level qualification.

**Exports:**
- `parseAgeBirthday(input, currentDate)` — parse natural language to EDTF
- `renderAgeBirthday(edtf, currentDate, options)` — render EDTF to human-friendly string
- `calculateAgeRange(edtf, currentDate)` — extract `[minAge, maxAge]` from EDTF

## Core Design Principle: Single Interval with Component Uncertainty

**Key insight:** A birthdate can always be expressed as a **single EDTF interval** (never a set/list of intervals). We use **EDTF Level 2 component-level qualification** (`?` on individual components) to indicate which parts of the date are known vs. uncertain:

- If we know the **exact birthday** (month + day), those components have no `?` marker
- If we only know the **birth month**, the day component gets `?`
- If we only know an **age range**, both month and day get `?`
- If we know a **birthday but not the year**, we use `XXXX-MM-DD` (unspecified year)

This approach:

- Eliminates the need for sets/lists of intervals
- Preserves birthday information even within year ranges
- Enables accurate age calculation from the interval bounds
- Uses standard EDTF Level 2 features

---

## EDTF Representation Patterns

### Pattern 1: Exact birthdate known

```
2005-03-15
```

All components certain. Age can be calculated precisely.

### Pattern 2: Age only (no birthday info)

```
?2004-?06-?02/?2005-?06-?01
```

Year range derived from age; month and day are placeholders (anchored to currentDate) marked uncertain. The interval bounds define the possible birth window.

### Pattern 3: Age + birth month known

```
2005-03-?01/2005-03-?31
```

Year is certain (derived from age + known month); month is certain; day is uncertain (spans the whole month).

### Pattern 4: Age range + birthday known

```
?2002-03-15/?2005-03-15
```

Multiple possible years, but the month-day is certain on both bounds.

### Pattern 5: Birthday only (no age info)

```
XXXX-03-15
```

Unspecified year with known month-day. For age calculation, this implies 0-120+ years.

### Pattern 6: Open-ended age (senior, 65+)

```
../?1960-?06-?01
```

Open start with uncertain month/day on the end bound.

---

## Worked Examples

All examples use **currentDate = 2025-06-01** and reference John Doe (true birthdate: 2005-03-15).

### Example A: "20 yo" (age only)

**Input:** `20 yo`
**Logic:** Person is currently 20. They could turn 21 tomorrow (earliest birth: 2004-06-02) or turned 20 today (latest birth: 2005-06-01).
**EDTF:** `?2004-?06-?02/?2005-?06-?01`
**Interpretation:** Year spans 2004–2005; month and day are uncertain (anchored to currentDate ± 1 day).

### Example B: "20 y/o, March birthday" (age + month)

**Input:** `20 y/o, March birthday`
**Logic:** Birthday already passed this year (March < June), so birth year is 2005. Day unknown within March.
**EDTF:** `2005-03-?01/2005-03-?31`
**Interpretation:** Year and month certain; day spans 1–31.

### Example C: "20 y/o, birthday 3/15" (age + full birthday)

**Input:** `20 y/o, birthday 3/15`
**Logic:** Full birthday known, and it passed this year, so birth year is 2005.
**EDTF:** `2005-03-15`
**Interpretation:** Exact date—no interval needed.

### Example D: "early 20s, birthday 3/15" (age range + birthday)

**Input:** `early 20s, birthday 3/15`
**Logic:** "Early 20s" = ages 20–23. Since birthday (March) has passed, possible birth years are 2002–2005.
**EDTF:** `?2002-03-15/?2005-03-15`
**Interpretation:** Year uncertain (spans 4 years); month and day certain.

### Example E: "March 15th birthday" (birthday only, no age)

**Input:** `March 15th birthday`
**Logic:** No age info—could be any age 0–120+.
**EDTF:** `XXXX-03-15`
**Interpretation:** Unspecified year; month and day certain.

### Example F: "senior" (open-ended age)

**Input:** `senior`
**Logic:** Age 65+ with no upper bound. Latest possible birth: 1960-06-01.
**EDTF:** `../?1960-?06-?01`
**Interpretation:** Open start; month and day uncertain on end bound.

---

## Function signatures

### `parseAgeBirthday(input: string, currentDate: PlainDate) -> EDTF`

- `currentDate` is a date-only value (e.g., 2025-06-01). Avoid timezones entirely.
- Returns a single EDTF interval (or exact date) with component-level qualification.

### `renderAgeBirthday(edtf: EDTF, currentDate: PlainDate, options?) -> string`

- Produces friendly output using the same `currentDate`.
- Uses component uncertainty to determine what birthday info can be displayed.
- See **Rendering format options** below for output styles.

### `calculateAgeRange(edtf: string | EDTF, currentDate: PlainDate) -> [number, number | null]`

- Returns `[minAge, maxAge]` as integers (years).
- `maxAge` is `null` for open-ended intervals (e.g., "senior" → `[65, null]`).
- For unspecified years (`XXXX-MM-DD`), returns `[0, 120]` (practical maximum).

---

## High-level parsing pipeline (important ordering)

Given `input`:

### 0) Normalize

- Trim, collapse whitespace, normalize punctuation, lowercase for matching (but preserve original for display if needed).
- Normalize common age shorthands:
  - `yo`, `y/o`, `yrs` → “years”
  - `mo`, `mos`, `mths` → “months”
  - `wk`, `wks` → “weeks”
  - `d`, `day(s)` → “days”

- Normalize `6mo` → `6 months` (do not treat “m” alone as months unless you’re confident it won’t collide with “male” or other abbreviations in your domain).

### 1) Direct birthdate handoff (EDTF-first)

If the (normalized) string begins with a birth marker, hand off the remainder to the existing EDTF natural language parser:

**Birth markers (prefix match):**

- `b.` / `b ` / `born` / `born:` / `birth:` / `dob:` / `date of birth:`

**Rule:**

- Strip the marker.
- Pass the remainder to the EDTF NL parser exactly as you do elsewhere (including “circa”, “about”, seasons, uncertain, etc.).
- Return the EDTF output directly.

Examples:

- `b. c. 1902` → `1902~` (or whatever your existing EDTF parser emits)
- `born spring 1871?` → `1871-21?` (if your system uses season codes) or its canonical equivalent

### 2) Otherwise: age-based derivation

If it's not an explicit birthdate, attempt to parse:

- numeric ages ("35", "35 years", "35 years old", "35yo")
- numeric age ranges ("22-26", "22-26 yo", "22 to 26 years old")
- infant ages ("6 months", "6mo", "6 months old", "2 weeks old", "10 days")
- life-stage vocabulary ("toddler", "teenager", "early teens", "young adult", "senior", etc.)
- decade phrases ("early 30s", "mid-fifties", "late twenties")

If multiple signals exist (“early 30s, May birthday”), parse **age/range first**, then apply birthday constraints (month/day) as a refinement step.

---

## Age grammar (inputs you must support)

### A) Numeric years

Accept:

- `N` (if context strongly suggests age; otherwise require "years/yo/old")
- `N years`
- `N years old`
- `Nyo`, `N yo`, `N y/o`
- `age N`
- `N-M`, `N-M yo`, `N-M years old` (numeric ranges, e.g., "22-26 yo")
- `N to M`, `N to M years old` (word-form ranges, e.g., "22 to 26 years old")

### B) Infant / sub-year ages

Accept:

- `N months`, `N months old`, `Nmo`
- `N weeks`, `N weeks old`
- `N days`, `N days old`
- `newborn` (treated as an age-range; see table below)

### C) Decades + early/mid/late

Accept:

- `30s`, `thirties`, `mid-30s`, `early thirties`, `late twenties`
- hyphen/space variants: `mid 30s`, `mid-thirties`, etc.

### D) Teens (explicit support)

Accept:

- `teens`, `teenager`, `adolescent` (13–19)
- `early teens`, `mid teens`, `late teens`

### E) Life-stage vocabulary

Support at least the vocabulary you already listed, plus teens subdivisions.

---

## Vocabulary → age-range mapping

Represent all age meanings as a **closed range** `[minAge, maxAge]` in **years**, where `maxAge` can be open-ended.

### Life stages (recommended defaults)

(Keep your existing table, but explicitly add teens subdivisions.)

| Friendly name                 | min (years) | max (years) | Notes                               |
| ----------------------------- | ----------: | ----------: | ----------------------------------- |
| newborn                       |           0 |      0.0833 | 0–1 month                           |
| infant                        |      0.0833 |           1 | 1–12 months                         |
| toddler                       |           1 |           3 |                                     |
| preschooler                   |           3 |           5 |                                     |
| child / school-age            |           6 |          12 |                                     |
| pre-teen / tween              |           9 |          12 |                                     |
| middle-schooler               |          11 |          14 | (optional tweak; overlaps are fine) |
| teenager / adolescent / teens |          13 |          19 |                                     |
| **early teens**               |          13 |          15 |                                     |
| **mid teens**                 |          16 |          17 |                                     |
| **late teens**                |          18 |          19 |                                     |
| young adult                   |          18 |          29 |                                     |
| adult                         |          30 |          64 |                                     |
| middle-aged                   |          45 |          65 |                                     |
| senior / elderly              |          65 |           ∞ | open-ended                          |

### Decade partitions (early/mid/late)

For decades D0–D9 (20–29, 30–39, etc.), keep your 4-3-3 split:

- early: D0–D3
- mid: D4–D6
- late: D7–D9

---

## Converting an age-range into an EDTF birthdate expression

### Core idea

An age implies a birthdate range:

- Older age → earlier birthdate (interval start)
- Younger age → later birthdate (interval end)

We always produce a **single EDTF interval** with **component-level uncertainty markers** (`?`) to indicate which parts are known vs. derived.

### Date arithmetic rules (calendar-aware)

All subtraction/addition should be **calendar-based**:

- Subtracting "1 year" preserves month/day when possible
- Feb 29 → Feb 28 in non-leap years (clamp to last day of month)
- Subtracting "6 months" is a true month shift (not 182.5 days)
- Month-end clamping: Aug 31 - 6 months → Feb 28 (not Feb 31)

---

## Age derivation cases

### Case 1: Exact integer age in years ("N years old")

For age `N` with no birthday info, derive the full possible birth window:

**Logic:**

- Person could turn `N+1` tomorrow → earliest birth = `T - (N+1) years + 1 day`
- Person could have turned `N` today → latest birth = `T - N years`

**Formula:**

```
birthStart = (T - (N+1) years) + 1 day
birthEnd   = T - N years
```

**EDTF:** `?{startYear}-?{startMM}-?{startDD}/?{endYear}-?{endMM}-?{endDD}`

All components marked uncertain since we only know the age, not the actual birthday.

**Example:** "20 yo" on 2025-06-01

- birthStart = 2004-06-02 (could turn 21 on 2025-06-02)
- birthEnd = 2005-06-01 (could have turned 20 today)
- EDTF: `?2004-?06-?02/?2005-?06-?01`

### Case 2: Exact age + known birth month

When we know the age AND the birth month, we can narrow the year:

**Logic:**

- If birth month has **already passed** this year: birth year = T.year - N
- If birth month has **not yet passed** this year: birth year = T.year - N - 1

The day is unknown, so it spans 1 to end-of-month.

**EDTF:** `{year}-{MM}-?01/{year}-{MM}-?{lastDay}`

Year and month certain; day uncertain.

**Example:** "20 y/o, March birthday" on 2025-06-01

- March < June, so birthday passed → year = 2005
- EDTF: `2005-03-?01/2005-03-?31`

### Case 3: Exact age + full birthday (month + day)

When we know age AND full birthday, we can calculate the exact birth date:

**Logic:**

- If birthday has **already passed** this year: birth year = T.year - N
- If birthday has **not yet passed** this year: birth year = T.year - N - 1

**EDTF:** `{year}-{MM}-{DD}` (no interval needed)

**Example:** "20 y/o, birthday 3/15" on 2025-06-01

- March 15 < June 1, so birthday passed → year = 2005
- EDTF: `2005-03-15`

### Case 4: Age range + known birthday

For age ranges like "early 20s" (ages 20–23) with a known birthday:

**Logic:**

- Calculate year range based on whether birthday has passed
- If birthday passed: years = [T.year - maxAge, T.year - minAge]
- If birthday not passed: years = [T.year - maxAge - 1, T.year - minAge - 1]

**EDTF:** `?{startYear}-{MM}-{DD}/?{endYear}-{MM}-{DD}`

Year uncertain (range); month and day certain.

**Example:** "early 20s, birthday 3/15" on 2025-06-01

- Early 20s = ages 20–23
- March 15 already passed → years = [2002, 2005]
- EDTF: `?2002-03-15/?2005-03-15`

### Case 5: Age range without birthday info

For age ranges like "early 30s", "teenager" without birthday info:

**Formula:**

```
birthStart = (T - (maxAge + 1) years) + 1 day
birthEnd   = T - minAge years
```

All components uncertain.

**EDTF:** `?{startYear}-?{startMM}-?{startDD}/?{endYear}-?{endMM}-?{endDD}`

**Example:** "teenager" (13–19) on 2025-06-01

- birthStart = 2005-06-02 (could turn 20 tomorrow)
- birthEnd = 2012-06-01 (could have turned 13 today)
- EDTF: `?2005-?06-?02/?2012-?06-?01`

### Case 6: Birthday only (no age info)

When only the birthday is known without any age information:

**EDTF:** `XXXX-{MM}-{DD}` (unspecified year)

This represents "some year, March 15" and implies age 0–120+.

**Example:** "March 15th birthday" → `XXXX-03-15`

### Case 7: Sub-year ages ("6 months old", "2 weeks old")

For sub-year ages, derive a tight interval:

- "N months old": `birthStart = T - (N+1) months`, `birthEnd = T - N months`
- "N weeks old": `birthStart = T - (N+1) weeks`, `birthEnd = T - N weeks`
- "N days old": `birthStart = T - (N+1) days`, `birthEnd = T - N days`

Mark month/day as uncertain since exact birthday unknown.

**Example:** "6 months old" on 2025-06-01

- EDTF: `?2024-?11-?01/?2024-?12-?01` (approximately)

### Case 8: Open-ended ("senior", "65+", "elderly")

For "at least Amin years old" with no maximum:

**EDTF:** `../birthEnd` where birthEnd = T - Amin years

Mark end components uncertain.

**Example:** "senior" (65+) on 2025-06-01

- EDTF: `../?1960-?06-?01`

---

## Applying birthday constraints (month/day) to age-derived ranges

With the single-interval approach, birthday constraints **refine** the interval rather than creating enumerated sets:

### Month-only constraint ("June birthday")

When we know the birth month but not the day:

1. Determine which year(s) are possible based on whether the month has passed
2. Set month component as **certain** (no `?`)
3. Day spans 1 to end-of-month with `?` markers

**Result:** Single interval with certain month, uncertain day.

### Full birthday constraint ("March 15th birthday")

When we know both month and day:

1. Determine which year(s) are possible based on whether the date has passed
2. Set month AND day components as **certain** (no `?`)
3. Year may still be uncertain (range) or certain (exact age)

**Result:** Single interval (or exact date) with certain month and day.

### No enumeration needed

The key insight is that we **never need to enumerate** multiple year-month or year-month-day combinations. Instead:

- Year uncertainty is expressed via the interval bounds with `?` on year
- Known birthday components are **repeated identically** on both interval bounds without `?`

This keeps everything in a single EDTF expression.

---

## Qualifiers and uncertainty

If the input contains:

- approximate markers: `about`, `around`, `circa`, `approx`, `~` → apply `~`
- uncertain markers: `maybe`, `possibly`, `?` → apply `?`
- both → apply `%` if your EDTF layer supports it

Apply the qualifier to the whole expression rather than repeatedly widening ranges.

---

## Unknown / empty input

- Return `../..` (unknown) if input is empty or cannot be interpreted.

---

# `renderAgeBirthday(edtf, currentDate, options)` rules

Rendering has two jobs:

1. Derive an **age display** (single value or range)
2. Derive a **birthday display** (month/day if knowable, based on component uncertainty)

---

## Step 1: Calculate Age Range from EDTF

For any EDTF birthdate expression, extract the interval bounds and calculate ages:

```
minAge = calculateAge(latestBirthdate, currentDate)   // youngest possible
maxAge = calculateAge(earliestBirthdate, currentDate) // oldest possible
```

**Age calculation formula:**

```
age = currentDate.year - birthdate.year
if (currentDate.month, currentDate.day) < (birthdate.month, birthdate.day):
    age = age - 1
```

**For interval bounds:** Strip the `?` markers to get the raw dates, then calculate ages.

**For open intervals:** `../YYYY` → age is `minAge+` (open-ended)

**For unspecified years:** `XXXX-MM-DD` → age range is 0–120+ (practical maximum)

---

## Step 2: Determine Birthday Display from Component Uncertainty

The key insight: **check if month and day are uncertain** on the interval bounds.

| Interval Pattern                                        | Month/Day Display    |
| ------------------------------------------------------- | -------------------- |
| `2005-03-15` (exact date)                               | "March 15"           |
| `2005-03-?01/2005-03-?31` (day uncertain)               | "March" (month only) |
| `?2004-?06-?02/?2005-?06-?01` (month+day uncertain)     | "unknown"            |
| `?2002-03-15/?2005-03-15` (year uncertain, m/d certain) | "March 15"           |
| `XXXX-03-15` (unspecified year)                         | "March 15"           |

**Rule:** If the month component has NO `?` marker → display the month. If the day has NO `?` marker → display the day too.

---

## Step 3: Age Range → Friendly Phrasing

| Age Range              | Display                                  |
| ---------------------- | ---------------------------------------- |
| Single age (min = max) | "35"                                     |
| Small range (span ≤ 2) | "35–36" or "35–37"                       |
| Matches decade bucket  | "early 30s", "mid 30s", "late 30s"       |
| Matches teens bucket   | "early teens", "mid teens", "late teens" |
| Matches life stage     | "teenager", "toddler", "young adult"     |
| Open-ended             | "65+"                                    |
| Under 1 year           | "6 months old", "newborn"                |

---

## Step 4: Combine Output

### Rendering format options

Output uses natural phrasing without labels. The style depends on what's known:

| Known Data | Format (`full`) | Format (`age-only`) | Format (`birthday-only`) |
|------------|-----------------|---------------------|--------------------------|
| Age + full birthday | "20 years old, birthday March 15th" | "20 years old" | "March 15th birthday" |
| Age + month only | "20 years old, March birthday" | "20 years old" | "March birthday" |
| Age only (no birthday) | "20 years old" | "20 years old" | — |
| Birthday only (no age) | "March 15th birthday" | — | "March 15th birthday" |
| Age range + birthday | "20–23 years old, birthday March 15th" | "20–23 years old" | "March 15th birthday" |
| Age range only | "20–23 years old" | "20–23 years old" | — |
| Life stage match | "teenager, birthday March 15th" | "teenager" | "March 15th birthday" |
| Open-ended | "65+ years old" | "65+" | — |

**Age style options:**

- `ageStyle: 'vocabulary'` (default): Map exact-match ranges back to vocabulary terms
  - `[13, 19]` → "teenager"
  - `[13, 15]` → "early teens"
  - `[1, 3]` → "toddler"
- `ageStyle: 'numeric'`: Always use numbers
  - `[13, 19]` → "13–19 years old"

**Age length options:**

- `ageLength: 'short'`: "20yo", "teenager"
- `ageLength: 'medium'`: "20 y/o", "teenager"
- `ageLength: 'long'` (default): "20 years old", "teenager"

**With qualifiers:** If the EDTF has `~` or `?` on the whole expression:

- `~` → "approximately 20 years old"
- `?` → "possibly 20 years old"

---

## Rendering Examples

All examples use `currentDate = 2025-06-01`.

| EDTF | Age (numeric) | Birthday | `full` output |
|------|---------------|----------|---------------|
| `2005-03-15` | 20 | March 15 | "20 years old, birthday March 15th" |
| `2005-03-?01/2005-03-?31` | 20 | March | "20 years old, March birthday" |
| `?2004-?06-?02/?2005-?06-?01` | 20 | — | "20 years old" |
| `?2002-03-15/?2005-03-15` | 20–23 | March 15 | "20–23 years old, birthday March 15th" |
| `XXXX-03-15` | — | March 15 | "March 15th birthday" |
| `../?1960-?06-?01` | 65+ | — | "65+ years old" |
| `?2005-?06-?02/?2012-?06-?01` | 13–19 | — | "teenager" (with `ageStyle: 'vocabulary'`) |

---

## Parsing examples (with `currentDate = 2025-06-01`)

| Input                      | EDTF Output                   |
| -------------------------- | ----------------------------- |
| `b. 1902`                  | `1902`                        |
| `born c. 1871`             | `1871~`                       |
| `20 yo`                    | `?2004-?06-?02/?2005-?06-?01` |
| `20 y/o, March birthday`   | `2005-03-?01/2005-03-?31`     |
| `20 y/o, birthday 3/15`    | `2005-03-15`                  |
| `early 20s`                | `?2001-?06-?02/?2005-?06-?01` |
| `early 20s, birthday 3/15` | `?2002-03-15/?2005-03-15`     |
| `teenager`                 | `?2005-?06-?02/?2012-?06-?01` |
| `March 15th birthday`      | `XXXX-03-15`                  |
| `senior`                   | `../?1960-?06-?01`            |
| `6 months old`             | `?2024-?12-?01/?2025-?01-?01` |

---

## Implementation notes (non-goals but important)

- Keep **all math date-only** and **calendar-based** (years/months/weeks/days), not `365.25` approximations.
- Do not enumerate huge year ranges into lists; prefer intervals + constraints metadata when needed.
- Let the EDTF layer handle canonicalization and qualifiers wherever possible.

If you want, I can also draft the exact regex/token patterns for the new items ("6mo", "months old", "early teens", "mid teens", "late teens") in the same parser-pattern style you used for your time/date checklist work.

---

# Implementation Analysis

## Module Placement & Naming

Based on the existing codebase patterns:

### `parseAgeBirthday()` → `@edtf-ts/natural`

- Lives alongside `parseNatural()` in `packages/natural/src/`
- New file: `age-birthday.ts`
- Reuses existing grammar patterns and `parseNatural()` for birth-marker handoff
- Returns single EDTF interval (never sets/lists)

**Signature (aligned with codebase conventions):**

```typescript
interface ParseAgeBirthdayOptions {
  currentDate?: Date; // defaults to new Date()
  contextIsAgeField?: boolean; // allows bare numbers like "35"
  locale?: string; // for month name parsing
}

interface ParseAgeBirthdayResult {
  edtf: string; // EDTF interval or date with component qualifications
  type: 'date' | 'interval'; // never 'list' or 'set'
  confidence: number; // 0-1
  interpretation: string; // "20 years old → born 2004-06-02 to 2005-06-01"
  parsed?: EDTFBase; // parsed EDTF object
  ageRange?: [min: number, max: number | null]; // derived age range
  birthdayKnown?: {
    month?: number; // 1-12 if month is certain
    day?: number; // 1-31 if day is certain
  };
}

function parseAgeBirthday(input: string, options?: ParseAgeBirthdayOptions): ParseAgeBirthdayResult;
```

### `renderAgeBirthday()` → `@edtf-ts/utils`

- Lives alongside formatters in `packages/utils/src/`
- New file: `age-birthday.ts`
- Inspects component-level qualification to determine birthday display

**Signature:**

```typescript
interface RenderAgeBirthdayOptions {
  currentDate?: Date;
  locale?: string;
  includeQualifiers?: boolean; // default: true
  format?: 'full' | 'age-only' | 'birthday-only';
  ageStyle?: 'numeric' | 'vocabulary'; // 'vocabulary' maps to "teenager" when exact match
  ageLength?: 'short' | 'medium' | 'long'; // '25yo' vs '25 y/o' vs '25 years old'
  // Intl.DateTimeFormat options for birthday display
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  weekday?: 'long' | 'short' | 'narrow';
}

interface RenderAgeBirthdayResult {
  age: string; // "20 years old" or "20–23 years old" or "teenager" or "65+"
  birthday: string | null; // "March 15th" or "March" or null
  formatted: string; // "20 years old, birthday March 15th"
  ageRange: [min: number, max: number | null]; // numeric range
  birthdayKnown: { month: boolean; day: boolean }; // what's certain
  qualifier?: 'approximate' | 'uncertain' | 'both';
}

function renderAgeBirthday(
  edtf: string | EDTFBase,
  options?: RenderAgeBirthdayOptions
): RenderAgeBirthdayResult;
```

### `calculateAgeRange()` → `@edtf-ts/utils`

Standalone function for extracting age range from any EDTF birthdate expression.

**Signature:**

```typescript
/**
 * Calculate the age range from an EDTF birthdate expression.
 *
 * @param edtf - EDTF string or parsed object
 * @param currentDate - Reference date for age calculation
 * @returns [minAge, maxAge] where maxAge is null for open-ended intervals
 *
 * @example
 * calculateAgeRange('2005-03-15', new Date('2025-06-01')); // [20, 20]
 * calculateAgeRange('?2002-03-15/?2005-03-15', new Date('2025-06-01')); // [20, 23]
 * calculateAgeRange('../?1960-?06-?01', new Date('2025-06-01')); // [65, null]
 * calculateAgeRange('XXXX-03-15', new Date('2025-06-01')); // [0, 120]
 */
function calculateAgeRange(
  edtf: string | EDTFBase,
  currentDate: Date
): [min: number, max: number | null];
```

### Helper Functions (internal)

Following existing naming patterns:

```typescript
// In @edtf-ts/natural (age-birthday.ts)
normalizeAgeInput(input: string): string
extractBirthMarker(input: string): { marker: string; remainder: string } | null
parseAgeExpression(input: string): AgeExpression | null
calculateBirthInterval(age: AgeExpression, birthday: Birthday | null, currentDate: Date): string
formatIntervalWithUncertainty(start: Date, end: Date, certainComponents: CertainComponents): string

// In @edtf-ts/utils (age-birthday.ts)
extractBirthdayFromInterval(edtf: EDTFInterval): { month?: number; day?: number }
formatAgeRange(min: number, max: number | null, options: RenderOptions): string
matchLifeStage(min: number, max: number): string | null
isBirthdayComponentCertain(edtf: EDTFInterval, component: 'month' | 'day'): boolean
```

---

## Identified Weaknesses & Necessary Improvements

### 1. ~~**Spec Ambiguity: "Set" vs "List" semantics**~~ ✅ RESOLVED

**Resolution:** We now always use a **single EDTF interval** with component-level qualification. No sets or lists needed.

### 2. **Edge Case: Feb 29 birthdays**

When subtracting N years from a leap day:

**Rule:** Use Feb 28 in non-leap years (clamp to last day of month). This matches standard calendar library behavior.

### 3. **Timezone handling**

JavaScript `Date` always has timezone implications.

**Rule:**

- Accept `Date` but immediately extract year/month/day in local time
- Consider accepting `{year, month, day}` interface as alternative
- Document clearly that all calculations are timezone-naive

### 4. **Month subtraction edge cases**

Aug 31 - 6 months → Feb 31?

**Rule:** Clamp to last day of month (Feb 28/29).

### 5. **Bare number parsing**

Numbers like "35" vs "1990" are ambiguous.

**Rule:**

- When `contextIsAgeField: false`, require explicit unit ("35 years", "35yo")
- Numbers > 120 should be treated as years, not ages

### 6. ~~**Render output format is too rigid**~~ ✅ RESOLVED

**Resolution:** Return structured `RenderAgeBirthdayResult` object with separate `age`, `birthday`, and `formatted` fields. Output uses natural phrasing (e.g., "20 years old, birthday March 15th") instead of labels. Options include `ageStyle`, `ageLength`, and Intl.DateTimeFormat options.

### 7. **Future birthdates**

What if calculation yields negative age?

**Rule:**

- If birthdate > currentDate, age = "not yet born" or negative value
- Validate in most contexts that birthdate ≤ currentDate

### 8. **Age ceiling for "senior"**

Consider adding optional life stages:

- centenarian: 100+
- supercentenarian: 110+

### 9. ~~**Constraint metadata not in EDTF**~~ ✅ RESOLVED

**Resolution:** Component-level qualification (`?`) now encodes which parts are known directly in EDTF. No separate metadata needed.

### 10. **Compound ages like "2 years 3 months"**

Add grammar support for compound age expressions, normalized to total months for calculation.

### 11. **Decimal ages in life-stage table**

Store life-stage bounds in **months** for sub-year stages to avoid floating-point precision issues.

### 12. **Unknown vs parse failure**

**Rule:**

- Return parse failure for unparseable input
- Reserve `../..` for explicit "unknown" markers in input
- `XXXX-MM-DD` for known birthday, unknown year

---

## Parsing Architecture: Hand-Written Regex Parser (Option C)

After evaluating three approaches, we chose a **hand-written regex-based parser** over integrating into the existing Nearley grammar or creating a separate Nearley grammar.

### Why Not Nearley Grammar?

1. **Context-dependent output**: Age parsing requires `currentDate` to produce EDTF output—Nearley grammars produce static ASTs, not context-aware transforms
2. **Two-phase process anyway**: Even with Nearley, we'd need post-processing to convert `AgeExpression` → EDTF interval
3. **Mixed parsing already**: Birth marker handoff (`b. 1902`) calls `parseNatural()` anyway, so we're not maintaining parser purity
4. **Grammar maintenance overhead**: Nearley rebuilds, debugging CST issues, etc. for relatively constrained input patterns

### Parser Structure

```typescript
function parseAgeBirthday(input: string, options: ParseAgeBirthdayOptions): ParseAgeBirthdayResult {
  const normalized = normalizeAgeInput(input);

  // 1. Check for birth marker → hand off to parseNatural()
  const birthMarker = extractBirthMarker(normalized);
  if (birthMarker) {
    return handleBirthMarker(birthMarker.remainder, options);
  }

  // 2. Parse age expression (regex-based)
  const ageExpr = parseAgeExpression(normalized);

  // 3. Parse birthday constraint (regex-based)
  const birthday = parseBirthdayConstraint(normalized);

  // 4. Convert to EDTF interval with currentDate
  return buildResult(ageExpr, birthday, options.currentDate);
}
```

### Regex Patterns (Draft)

```typescript
const AGE_PATTERNS = {
  // Numeric: "35", "35 years", "35yo", "35 y/o", "age 35"
  numeric: /^(?:age\s+)?(\d+)\s*(?:years?(?:\s+old)?|yo|y\/o)?$/i,

  // Numeric range: "22-26", "22-26 yo", "22 to 26 years old"
  numericRange: /^(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?(?:\s+old)?|yo|y\/o)?$/i,

  // Infant: "6 months", "6mo", "2 weeks", "10 days"
  infant: /^(\d+)\s*(months?|mos?|weeks?|wks?|days?)\s*(?:old)?$/i,

  // Decade: "30s", "thirties", "early 30s", "mid-thirties", "late twenties"
  decade: /^(early|mid|late)?\s*-?\s*(\d0s|(?:twenties|thirties|forties|fifties|sixties|seventies|eighties|nineties))$/i,

  // Teens: "teens", "teenager", "early teens"
  teens: /^(early|mid|late)?\s*-?\s*(teens?|teenager|adolescent)$/i,

  // Life stage: "newborn", "toddler", "senior", etc.
  lifeStage: /^(newborn|infant|toddler|preschooler|child|pre-?teen|tween|young\s+adult|adult|middle-?aged|senior|elderly)$/i,
};

const BIRTHDAY_PATTERNS = {
  // "March birthday", "May 12th birthday", "birthday 3/15"
  withKeyword: /(?:birthday|bday)\s*(?:(?:on|is|:)?\s*)?(.+)|(.+?)\s*(?:birthday|bday)/i,

  // Month names and dates are handled by existing date parsing
};
```

### Benefits of This Approach

1. **Simpler debugging**: Regex patterns are explicit and testable in isolation
2. **No build step**: No `nearley compile` required
3. **Full control**: Easy to adjust precedence, add special cases
4. **Context-aware**: Direct access to `currentDate` during parsing
5. **Lightweight**: No Nearley runtime dependency for this functionality

### Trade-offs

1. **Less formal**: No grammar specification document
2. **Manual maintenance**: Adding new patterns requires updating regex
3. **No automatic ambiguity detection**: Must manually test edge cases

This trade-off is acceptable because age expressions are relatively constrained compared to full natural language date parsing.

---

## Phased Implementation Plan

### Phase 1: Core Infrastructure (Foundation)

**Goal:** Establish types, date arithmetic helpers, and module structure.

- [ ] **1.1** Create `packages/natural/src/age-birthday.ts` with type definitions
  - `ParseAgeBirthdayOptions`, `ParseAgeBirthdayResult`, `AgeExpression`
  - `BirthdayConstraint` interface (month and/or day)

- [ ] **1.2** Create `packages/utils/src/age-birthday.ts` with type definitions
  - `RenderAgeBirthdayOptions`, `RenderAgeBirthdayResult`

- [ ] **1.3** Add calendar-aware date arithmetic to `packages/core/src/utils/date-helpers.ts`
  - `subtractYears(date, n)` → handles Feb 29
  - `subtractMonths(date, n)` → handles month-end clamping
  - `subtractWeeks(date, n)`
  - `subtractDays(date, n)`
  - `addDays(date, n)` → for birthStart = (T - (N+1) years) + 1 day
  - `calculateAge(birthdate, currentDate)` → integer years

- [ ] **1.4** Add life-stage lookup table
  - `LIFE_STAGES` constant with min/max in months
  - `getLifeStageFromAge(ageInMonths)` helper
  - `getAgeRangeFromLifeStage(name)` helper

- [ ] **1.5** Write unit tests for date arithmetic edge cases
  - Feb 29 subtraction
  - Month-end clamping
  - Year boundary crossing

### Phase 2: Age Expression Parsing

**Goal:** Parse age-related input into structured `AgeExpression` objects.

- [ ] **2.1** Implement `normalizeAgeInput()`
  - Shorthand expansion (yo → years, mo → months, etc.)
  - Whitespace normalization
  - Case normalization (preserving original for display)

- [ ] **2.2** Implement age parsing with hand-written regex parser (see **Parsing Architecture** below)
  - Numeric years: `N years`, `Nyo`, `age N`
  - Numeric ranges: `N-M`, `N-M yo`, `N to M years old`
  - Infant ages: `N months`, `N weeks`, `N days`
  - Decades: `30s`, `thirties`, `early 30s`, `mid-thirties`
  - Teens: `teens`, `teenager`, `early teens`, `mid teens`, `late teens`
  - Life stages: `newborn`, `toddler`, `senior`, etc.
  - Compound ages: `2 years 3 months` (stretch goal)

- [ ] **2.3** Test age parsing
  - Verify all age forms produce correct `AgeExpression`
  - Test ambiguous inputs

- [ ] **2.4** Implement qualifier detection
  - `about`, `approximately`, `circa` → approximate
  - `maybe`, `possibly` → uncertain
  - Combined handling

### Phase 3: Birth Marker Handoff

**Goal:** Route "born X" patterns to existing EDTF parser.

- [ ] **3.1** Implement `extractBirthMarker()`
  - Detect: `b.`, `b `, `born`, `born:`, `birth:`, `dob:`, `date of birth:`
  - Return remainder for EDTF parsing

- [ ] **3.2** Integrate with `parseNatural()`
  - Strip marker, pass remainder
  - Preserve confidence from underlying parse
  - Handle qualifiers in birth expressions

- [ ] **3.3** Write tests for birth marker patterns
  - `b. 1902`, `born c. 1871`, `dob: spring 1985?`

### Phase 4: Age-to-Birthdate Conversion (Single Interval Approach)

**Goal:** Convert parsed ages to single EDTF interval with component-level `?` markers.

- [ ] **4.1** Implement `calculateBirthInterval()` for exact ages (no birthday info)
  - Formula: `birthStart = (T - (N+1) years) + 1 day`, `birthEnd = T - N years`
  - Output: `?{startY}-?{startM}-?{startD}/?{endY}-?{endM}-?{endD}`
  - All components marked `?` (uncertain)

- [ ] **4.2** Implement `calculateBirthInterval()` for age ranges (no birthday info)
  - Formula: `birthStart = (T - (maxAge+1) years) + 1 day`, `birthEnd = T - minAge years`
  - Output: `?{startY}-?{startM}-?{startD}/?{endY}-?{endM}-?{endD}`
  - Handle open-ended (senior → `../?{Y}-?{M}-?{D}`)

- [ ] **4.3** Implement `calculateBirthInterval()` for sub-year ages
  - Month/week/day intervals with `?` markers
  - Proper calendar arithmetic

- [ ] **4.4** Implement `formatIntervalWithUncertainty()`
  - Generate EDTF string with `?` on appropriate components
  - Handle single-date output (when start = end)

- [ ] **4.5** Write comprehensive tests
  - All age derivation cases from spec (Cases 1, 2, 5, 7, 8)
  - Edge cases: year boundaries, leap years

### Phase 5: Birthday Constraints (Refining Intervals)

**Goal:** Apply month/day constraints to refine age-derived intervals.

- [ ] **5.1** Implement birthday constraint parsing
  - "May birthday", "born in June", "May 12", "12th of May"
  - Add to grammar as optional suffix

- [ ] **5.2** Implement `applyBirthdayConstraint()` for month-only
  - Determine if birth month has passed this year
  - Set year accordingly (T.year - N or T.year - N - 1)
  - Output: `{year}-{MM}-?01/{year}-{MM}-?{lastDay}`
  - Month certain (no `?`), day uncertain (`?`)

- [ ] **5.3** Implement `applyBirthdayConstraint()` for month + day
  - Determine if full birthday has passed this year
  - Output exact date: `{year}-{MM}-{DD}` (no interval needed)
  - OR age-range interval: `?{startY}-{MM}-{DD}/?{endY}-{MM}-{DD}`
  - Month and day certain (no `?`), year may be uncertain

- [ ] **5.4** Implement birthday-only case (no age info)
  - Output: `XXXX-{MM}-{DD}` (unspecified year)

- [ ] **5.5** Write tests for constraint application
  - "20 y/o, March birthday" → `2005-03-?01/2005-03-?31`
  - "20 y/o, birthday 3/15" → `2005-03-15`
  - "early 20s, birthday 3/15" → `?2002-03-15/?2005-03-15`
  - "March 15th birthday" → `XXXX-03-15`

### Phase 6: Complete `parseAgeBirthday()`

**Goal:** Assemble full parsing pipeline.

- [ ] **6.1** Implement main `parseAgeBirthday()` function
  - Normalize → birth marker check → age parsing → interval generation
  - Apply birthday constraints if present
  - Error handling for unparseable input

- [ ] **6.2** Implement confidence scoring
  - Birth markers: high confidence
  - Explicit ages: high confidence
  - Bare numbers (in context): medium confidence
  - Life stages: medium-low confidence

- [ ] **6.3** Implement interpretation generation
  - Human-readable description of what was parsed
  - Include derived age range and known birthday components

- [ ] **6.4** Extract `birthdayKnown` metadata
  - Check which components lack `?` markers in the EDTF output
  - Populate `birthdayKnown: { month?: number, day?: number }`

- [ ] **6.5** Export from `@edtf-ts/natural` package
  - Add to `index.ts` exports
  - Update package documentation

- [ ] **6.6** Write integration tests
  - All spec examples from parsing table
  - Round-trip with renderer

### Phase 7: Age Rendering and `calculateAgeRange()`

**Goal:** Compute age from EDTF birthdate intervals.

- [ ] **7.1** Implement `calculateAgeRange()` (exported function)
  - Extract interval bounds (strip `?` markers for calculation)
  - `minAge = calculateAge(latestBirth, currentDate)`
  - `maxAge = calculateAge(earliestBirth, currentDate)`
  - Handle open intervals (`../...`) → `[minAge, null]`
  - Handle unspecified years (`XXXX-MM-DD`) → `[0, 120]`
  - Export from `@edtf-ts/utils`

- [ ] **7.2** Implement `formatAgeRange()`
  - Single age (min = max): "35"
  - Small range (span ≤ 2): "35–36" or "35–37"
  - Decade match: "early 30s", "mid 30s", "late 30s"
  - Life stage match: "teenager", "toddler"
  - Open-ended: "65+"
  - Sub-year: "6 months old", "newborn"

- [ ] **7.3** Implement `matchLifeStage()`
  - Reverse lookup from age range to vocabulary
  - Prefer more specific (early/mid/late) when matching

### Phase 8: Birthday Rendering (from Component Uncertainty)

**Goal:** Extract and format birthday information based on `?` markers.

- [ ] **8.1** Implement `isBirthdayComponentCertain()`
  - Check if month component has `?` marker → uncertain
  - Check if day component has `?` marker → uncertain
  - For intervals, check both bounds (should be consistent)

- [ ] **8.2** Implement `extractBirthdayFromInterval()`
  - If month certain: extract month value (1-12)
  - If day certain: extract day value (1-31)
  - Return `{ month?: number, day?: number }`

- [ ] **8.3** Implement `formatBirthdayDisplay()`
  - Month + day certain → "March 15" (use Intl.DateTimeFormat)
  - Month certain, day uncertain → "March"
  - Neither certain → null (unknown)
  - Handle `XXXX-MM-DD` → "March 15" (birthday known, year not)

### Phase 9: Complete `renderAgeBirthday()`

**Goal:** Assemble full rendering pipeline.

- [ ] **9.1** Implement main `renderAgeBirthday()` function
  - Parse EDTF if string input
  - Use `calculateAgeRange()` for age bounds
  - Determine birthday display from component uncertainty
  - Apply Intl.DateTimeFormat options for locale-aware output

- [ ] **9.2** Implement natural phrasing output formatting
  - Full (age + birthday): "20 years old, birthday March 15th"
  - Full (age + month): "20 years old, March birthday"
  - Age-only: "20 years old" or "teenager" (based on `ageStyle`)
  - Birthday-only: "March 15th birthday"
  - With qualifiers: "approximately 20 years old"

- [ ] **9.3** Implement `ageStyle` option
  - `'numeric'`: always use numbers (13–19, not "teenager")
  - `'vocabulary'`: map exact-match ranges to life stage terms

- [ ] **9.4** Export from `@edtf-ts/utils` package
  - Export `renderAgeBirthday()` and `calculateAgeRange()`
  - Add to `index.ts` exports
  - Update package documentation

- [ ] **9.5** Write integration tests
  - All spec examples from rendering table
  - Round-trip: parse → render → verify age and birthday

### Phase 10: Documentation & Polish

**Goal:** Complete documentation and edge case handling.

- [ ] **10.1** Write API documentation
  - JSDoc with examples for all public functions
  - README updates for both packages

- [ ] **10.2** Add guide documentation
  - `docs/guide/age-and-birthdays.md`
  - Common use cases and examples
  - Explanation of component-level uncertainty approach

- [ ] **10.3** Add API reference documentation
  - `docs/api/age-birthday.md`
  - Full type documentation for all three exported functions

- [ ] **10.4** Edge case audit
  - Future birthdates (negative age handling)
  - Very old ages (centenarians, supercentenarians)
  - Invalid inputs
  - Locale-specific month name parsing

- [ ] **10.5** Performance review
  - Grammar compilation impact
  - Date arithmetic hot paths
  - Consider caching for repeated operations

---

## Testing Strategy

### Unit Tests

- Date arithmetic helpers (Phase 1)
  - `subtractYears()` with Feb 29 edge cases
  - `subtractMonths()` with month-end clamping
  - `calculateAge()` around birthday boundaries
- Age parsing grammar (Phase 2)
  - All age formats: numeric, numeric ranges, decades, life stages, sub-year
- Birth marker extraction (Phase 3)
- Single-interval generation with component `?` markers (Phase 4)
- Birthday constraint refinement (Phase 5)
  - Month-only constraints
  - Full birthday constraints
  - Birthday-only (no age) cases

### Integration Tests

- Full `parseAgeBirthday()` pipeline (Phase 6)
- Full `renderAgeBirthday()` pipeline (Phase 9)
- `calculateAgeRange()` standalone function (Phase 7)
- Round-trip: parse → render → verify (Phase 9)

### Spec Compliance Tests

All examples from this spec document, including:

| Input                      | Expected EDTF                 | Age     | Birthday |
| -------------------------- | ----------------------------- | ------- | -------- |
| `20 yo`                    | `?2004-?06-?02/?2005-?06-?01` | 20      | unknown  |
| `20 y/o, March birthday`   | `2005-03-?01/2005-03-?31`     | 20      | March    |
| `20 y/o, birthday 3/15`    | `2005-03-15`                  | 20      | March 15 |
| `22-26 yo`                 | `?1998-?06-?02/?2003-?06-?01` | 22–26   | unknown  |
| `early 20s, birthday 3/15` | `?2002-03-15/?2005-03-15`     | 20–23   | March 15 |
| `March 15th birthday`      | `XXXX-03-15`                  | unknown | March 15 |
| `senior`                   | `../?1960-?06-?01`            | 65+     | unknown  |

### Edge Case Tests

- Feb 29 birthdays across leap/non-leap years
- Year boundary crossings (December/January)
- Future birthdates (should error or return negative age)
- Very old ages (100+, 110+)
- Empty/invalid inputs

### Regression Tests

- Ensure existing `parseNatural()` behavior unchanged
- Ensure existing formatters unchanged
- Ensure EDTF Level 2 component qualification parsing works correctly

---

## Revision History

### 2025-01-02: Parsing Architecture Decision

Decided on **Option C: Hand-written regex-based parser** over Nearley grammar integration. Key reasons:
- Age parsing requires `currentDate` for EDTF output (context-dependent)
- Birth marker handoff to `parseNatural()` already mixes approaches
- Relatively constrained input patterns don't need formal grammar
- Simpler debugging and no Nearley build step

See **Parsing Architecture** section for full rationale and draft regex patterns.

### 2025-01-02: Single Interval Approach (Major Revision)

The original spec used sets of intervals (`[a/b,c/d]`) to represent birthdates with exact ages. This was revised to use a **single EDTF interval** with **component-level uncertainty markers** (`?`). Key changes:

1. **Core principle:** Birthdates are always expressed as a single interval (never sets/lists)
2. **Component uncertainty:** `?` on year/month/day indicates which parts are derived vs. known
3. **Birthday preservation:** Known month/day appear without `?` on both interval bounds
4. **Unspecified years:** `XXXX-MM-DD` for birthday-only cases
5. **Implementation plan:** Updated all phases to remove set/list handling

This approach is simpler, uses standard EDTF Level 2 features, and eliminates enumeration complexity.

### Reference: Age Calculation Algorithm

```python
def calculate_age_range(edtf_interval, anchor_date):
    """
    Calculate min/max age from an EDTF birthdate interval.

    - Earliest birth (interval start) → Maximum age
    - Latest birth (interval end) → Minimum age
    """
    start, end = parse_interval(edtf_interval)  # Strip '?' markers

    max_age = get_age(start, anchor_date)  # Oldest possible
    min_age = get_age(end, anchor_date)    # Youngest possible

    return min_age, max_age

def get_age(birth_date, current_date):
    age = current_date.year - birth_date.year
    if (current_date.month, current_date.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age
```
