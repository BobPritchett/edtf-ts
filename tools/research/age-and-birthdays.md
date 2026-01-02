# Age and Birthdays (EDTF-first) spec for `parseBirthdate()` and `renderBirthdate()`

This spec defines two functions for parsing and rendering age- and birthdate-related strings into **EDTF Level 2** (date-only; no times). It assumes the system already has **excellent EDTF parsing + formatting**, including approximate/uncertain qualifiers, partial dates, intervals, lists/sets, and open bounds.

Key preference changes vs the original spec:

- **No “mid-year” hard-coding** (no “June 30” / “July 1” proxies when deriving birth ranges from ages).
- For “exact age in years” (e.g., “35”, “35yo”), we use **today’s date** and assume the person’s birthday is either:
  - **in the last 6 months**, or
  - **in the next 6 months**
    This yields a **union of two date intervals** (expressed as an EDTF list of intervals).

- Adds support for life-stage phrases like **“early teens” / “mid teens” / “late teens”** (and parallels for “early twenties”, etc., already covered by decade logic).
- Adds parsing for infant ages like **`6mo`**, **`6 months`**, **`6 months old`** (plus weeks/days).

---

## EDTF conventions used here

We store results as EDTF strings:

- **Exact date:** `YYYY-MM-DD`
- **Partial date:** `YYYY`, `YYYY-MM`, `XXXX-MM` (unknown year, known month), etc.
- **Interval:** `start/end` (either bound can be open: `../YYYY`, `YYYY/..`)
- **List (set) of EDTF items:** `[item1,item2,...]`
  We use this to represent **a union of two intervals**, e.g. `[A/B,C/D]`.
- **Approximate/uncertain qualifiers** apply to the whole expression when possible: `~`, `?`, `%`.

> Note: If your EDTF implementation distinguishes between “list” and “set” (or “choice list”), keep using whatever your core EDTF layer already canonicalizes to. This spec just requires you can represent **a union**.

---

## Function signatures

### `parseBirthdate(input: string, currentDate: PlainDate) -> EDTF`

- `currentDate` is a date-only value (e.g., 2025-12-31). Avoid timezones entirely.

### `renderBirthdate(edtf: EDTF, currentDate: PlainDate) -> string`

- Produces friendly output (“Age: …; Birthday: …”) using the same `currentDate`.

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

If it’s not an explicit birthdate, attempt to parse:

- numeric ages (“35”, “35 years”, “35 years old”, “35yo”)
- infant ages (“6 months”, “6mo”, “6 months old”, “2 weeks old”, “10 days”)
- life-stage vocabulary (“toddler”, “teenager”, “early teens”, “young adult”, “senior”, etc.)
- decade phrases (“early 30s”, “mid-fifties”, “late twenties”)

If multiple signals exist (“early 30s, May birthday”), parse **age/range first**, then apply birthday constraints (month/day) as a refinement step.

---

## Age grammar (inputs you must support)

### A) Numeric years

Accept:

- `N` (if context strongly suggests age; otherwise require “years/yo/old”)
- `N years`
- `N years old`
- `Nyo`, `N yo`, `N y/o`
- `age N`

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

An age-range implies a birthdate range:

- Older age → earlier birthdate.
- Younger age → later birthdate.

But for “exact integer age N years”, we **do not** assume a uniform distribution over the year. We instead encode “birthday within ±6 months of today”, yielding **two possible intervals**.

### Date arithmetic rules (calendar-aware)

All subtraction/addition should be **calendar-based**:

- subtracting “1 year” preserves month/day when possible (handle Feb 29 deterministically in your date library)
- subtracting “6 months” is a true month shift (not 182.5 days)

You can implement this with your internal date type (Temporal.PlainDate recommended), but the spec is date-library agnostic.

---

## Age derivation cases

### Case 1: Exact integer age in years (“N years old”)

If the parsed meaning is **exactly** age `N` with no modifier (not “about”, not “early”, not “range”), derive **two intervals** based on `currentDate`:

Let:

- `T = currentDate`
- `TminusN = T - N years`
- `TminusNminus1 = T - (N+1) years`
- `Tminus6mo = T - 6 months`
- `Tplus6mo = T + 6 months`

Interpretation:

- If birthday was in the **last 6 months**, birthdate is in `[TminusNminus6mo, TminusN]`
- If birthday is in the **next 6 months**, birthdate is in `[TminusNminus1, TminusNminus1plus6mo]`

So produce the EDTF union:

- `[ (T - N years - 6 months)/(T - N years), (T - (N+1) years)/(T - (N+1) years + 6 months) ]`

**Canonicalization:**

- Store as an EDTF list of two intervals: `[a/b,c/d]`
- If your EDTF canonicalizer can represent this more compactly while preserving meaning, allow it.

**If the input includes an approximation marker** (“about 35”, “~35”), apply `~` to the whole EDTF expression, not by widening the windows again.

Examples (assuming `T = 2025-12-31`):

- “35 years old” →
  - last-6mo interval: `(1990-06-30)/(1990-12-31)`
  - next-6mo interval: `(1989-12-31)/(1990-06-30)`
  - EDTF: `[(1989-12-31/1990-06-30),(1990-06-30/1990-12-31)]`
    (Your canonicalizer may reorder; ordering is not semantically important.)

> Notice: no arbitrary “mid-year”; everything is anchored to **today** and **±6 months**.

### Case 2: Explicit age ranges (“30–35”, “early 30s”, “teenager”)

If you have a min/max age range `[Amin, Amax]` (in years, inclusive intent), derive a single birth interval:

- `birthStart = T - (Amax + 1) years` (older bound; safe inclusive)
- `birthEnd   = T - Amin years` (younger bound; safe inclusive)

Return `birthStart/birthEnd`.

Why the `+1`? Because someone who is “Amax years old” could have their next birthday tomorrow, so their birthdate can be almost `(Amax+1)` years back. This keeps the interval conservative without inventing midpoints.

If the phrase is inherently fuzzy (“young adult”, “middle-aged”), you may optionally add `~` unless the user already provided a qualifier.

### Case 3: Sub-year ages (“6 months old”, “2 weeks old”)

For sub-year ages, users typically mean “approximately”, unless they’re in a medical context. Recommended defaults:

- Treat “N months old” as **a tight interval**:
  - `birthStart = T - (N+1) months`
  - `birthEnd = T - N months`

- Treat “N weeks old” similarly:
  - `birthStart = T - (N+1) weeks`
  - `birthEnd = T - N weeks`

- Treat “N days old” similarly:
  - `birthStart = T - (N+1) days`
  - `birthEnd = T - N days`

Return `birthStart/birthEnd`.

If the input includes “about/around”, apply `~` to the interval.

### Case 4: Open-ended (“senior”, “65+”, “elderly”)

If the meaning is “at least Amin” with no max:

- `birthEnd = T - Amin years`
- return `../birthEnd`

Example: “senior” (65+) on 2025-12-31 → `../1960-12-31`

---

## Applying birthday-only constraints (month/day) on top of an age-derived range

Users may add:

- month only: “June birthday”, “born in May”
- month + day: “May 12”, “12 May”, “May 12th”

### Rule: intersect, don’t enumerate unless necessary

Given a derived EDTF expression `E` (interval or list of intervals), and a birthday constraint:

- If **month only** (MM):
  - Intersect `E` with all dates whose month is MM.
  - Represent as:
    - If `E` is a single interval spanning multiple years: `[(YYYY-MM)/... ]` is not valid EDTF by itself, so prefer:
      - Keep as interval but attach a structured “birthdayMonth=MM” constraint in metadata, _or_
      - Convert to a list of year-month values `[YYYY-MM, YYYY+1-MM, ...]` **only when the year span is small** (e.g., ≤ 10 years), otherwise keep metadata.

- If **month+day** (MM-DD):
  - Same logic: enumerate `[YYYY-MM-DD, ...]` only if the span is small; otherwise keep metadata.

**Recommendation (practical):**

- Because you said you already have excellent EDTF support, add a parallel “constraints” object returned by `parseBirthdate()` in your internal parse result (even if the public API returns only EDTF), then:
  - try to emit a precise EDTF list when it is small,
  - otherwise store EDTF for the age range and preserve the constraint in metadata for downstream rendering/search.

If you _must_ encode everything in EDTF only, define a policy:

- enumerate when `(maxYear - minYear + 1) ≤ 12`
- otherwise drop to month-only partial (`XXXX-MM` or `XXXX-MM-DD`) and keep the age-derived EDTF as the primary truth.

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

# `renderBirthdate(edtf, currentDate)` rules

Rendering has two jobs:

1. derive an **age display** (single value or range)
2. derive a **birthday display** (month/day if knowable)

### 1) EDTF → candidate date set/range

Use your EDTF engine to compute:

- the earliest possible birthdate
- the latest possible birthdate
- and whether the expression is a **union** (list of intervals)

Do **not** invent midpoints for rendering. Only use endpoints + “possible” logic.

### 2) Birthdate range → age range

Compute age for a birthdate `B` relative to `T = currentDate` in the normal calendar way:

- `age = T.year - B.year - ( (T.month, T.day) < (B.month, B.day) ? 1 : 0 )`

For partials:

- If month/day unknown, compute a **min/max** age by taking best/worst case within that year/month.

For a birth interval:

- minAge comes from the **latest** possible birthdate
- maxAge comes from the **earliest** possible birthdate

For a union of intervals:

- compute minAge/min across all parts
- compute maxAge/max across all parts
- If both intervals imply the same integer age (common for the ±6mo construction), render as a single age.

### 3) Age range → friendly phrasing

- If exact integer age: render `Age: N`
- If small numeric range (span ≤ 2): render `Age: N–M`
- If matches a decade bucket exactly: prefer “early 30s”, etc.
- If matches teens buckets exactly: prefer “early teens”, “mid teens”, “late teens”
- If matches life-stage mapping exactly: prefer that (“teenager”, “toddler”, “young adult”)
- If open-ended: `Age: Amin+`

For ages under 1 year:

- Prefer months/weeks:
  - If interval corresponds cleanly to month windows, render “~N months old”
  - Else render “under 1 year old” or “newborn/infant” if it matches those bands

### 4) Birthday rendering

From EDTF:

- Exact `YYYY-MM-DD` → render “Birthday: Month D”
- Exact `YYYY-MM` → “Birthday: in Month”
- `XXXX-MM` → “Birthday: in Month”
- `XXXX-MM-DD` → “Birthday: Month D”
- Anything else or inconsistent month/day across candidates → “Birthday: unknown” (or “varies” if you prefer)

### 5) Output format

Recommended:

- If both meaningful: `Age: …; Birthday: …`
- If only one: just render the one (don’t clutter)
- If qualifier present: add “approximately” / “possibly” as appropriate

Examples:

- `1990-09-15` on 2025-12-31 → `Age: 35; Birthday: September 15`
- `[(1989-12-31/1990-06-30),(1990-06-30/1990-12-31)]` → `Age: 35; Birthday: unknown`
- `../1960-12-31` → `Age: 65+; Birthday: unknown`
- `2025-06/2025-07~` → `Age: approximately newborn; Birthday: unknown`

---

## Parsing examples (with `currentDate = 2025-12-31`)

- `b. 1902` → handoff → `1902`
- `born c. 1871` → handoff → `1871~`
- `35` (only if your UI context is “age field”) → same as `35 years old`:
  - `[(1989-12-31/1990-06-30),(1990-06-30/1990-12-31)]`

- `early 30s`:
  - age range 30–33 → `1991-12-31/1995-12-31` (using the conservative `Amax+1` rule)

- `early teens`:
  - 13–15 → `2009-12-31/2012-12-31`

- `6mo` / `6 months old`:
  - `2025-05-31/2025-06-30` (depending on your month subtraction semantics; the key is the 1-month window bracketing “6 months”)

- `teenager, May birthday`:
  - base: `2005-12-31/2012-12-31`
  - plus constraint: month=05 (apply your “enumerate if small span” policy, else keep metadata)

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

### `parseBirthdate()` → `@edtf-ts/natural`

- Lives alongside `parseNatural()` in `packages/natural/src/`
- New file: `birthdate.ts` (or integrate into `parser.ts`)
- Reuses existing grammar patterns and `parseNatural()` for birth-marker handoff
- Follows the `ParseResult` pattern with confidence scores

**Signature (aligned with codebase conventions):**

```typescript
interface ParseBirthdateOptions {
  currentDate?: Date; // defaults to new Date()
  contextIsAgeField?: boolean; // allows bare numbers like "35"
  locale?: string; // for month name parsing
}

interface ParseBirthdateResult {
  edtf: string; // EDTF representation
  type: 'date' | 'interval' | 'list';
  confidence: number; // 0-1
  interpretation: string; // "35 years old → birth year ~1990"
  parsed?: EDTFBase; // parsed EDTF object
  ageRange?: [min: number, max: number | null]; // derived age
  birthdayConstraint?: {
    // metadata for partial constraints
    month?: number;
    day?: number;
  };
}

function parseBirthdate(
  input: string,
  options?: ParseBirthdateOptions
): ParseBirthdateResult | ParseBirthdateResult[];
```

### `renderBirthdate()` → `@edtf-ts/utils`

- Lives alongside formatters in `packages/utils/src/`
- New file: `birthdate.ts` (or add to `formatters.ts`)
- Reuses `formatHuman()`, duration utilities, and comparison logic

**Signature:**

```typescript
interface RenderBirthdateOptions {
  currentDate?: Date;
  locale?: string;
  includeQualifiers?: boolean; // default: true
  format?: 'full' | 'age-only' | 'birthday-only';
}

interface RenderBirthdateResult {
  age: string; // "35" or "early 30s" or "65+"
  birthday: string | null; // "September 15" or null
  formatted: string; // "Age: 35; Birthday: September 15"
  qualifier?: 'approximate' | 'uncertain' | 'both';
}

function renderBirthdate(
  edtf: string | EDTFBase,
  options?: RenderBirthdateOptions
): RenderBirthdateResult;
```

### Helper Functions (internal)

Following existing naming patterns:

```typescript
// In @edtf-ts/natural (birthdate.ts)
normalizeAgeInput(input: string): string
extractBirthMarker(input: string): { marker: string; remainder: string } | null
parseAgeExpression(input: string): AgeExpression | null
calculateBirthInterval(age: AgeExpression, currentDate: Date): string
applyBirthdayConstraint(edtf: string, constraint: BirthdayConstraint): string

// In @edtf-ts/utils (birthdate.ts)
calculateAgeFromBirthdate(birthdate: Date, currentDate: Date): number
formatAgeRange(min: number, max: number | null): string
matchLifeStage(min: number, max: number): string | null
formatBirthdayDisplay(edtf: EDTFBase): string | null
```

---

## Identified Weaknesses & Necessary Improvements

### 1. **Spec Ambiguity: "Set" vs "List" semantics**

The spec uses `[a/b,c/d]` notation but EDTF Level 2 distinguishes:

- **Set** `[...]`: "one of these" (choice)
- **List** `{...}`: "all of these" (conjunction)

For exact ages yielding two intervals, the semantic is "birthday could be in EITHER interval" — this is **Set** semantics (`[...]`), not List (`{...}`).

**Recommendation:** Clarify that we use EDTF **Set** notation for union of intervals.

### 2. **Edge Case: Feb 29 birthdays**

The spec mentions handling Feb 29 "deterministically" but doesn't specify the rule. When subtracting N years from a leap day:

- Option A: Feb 28 in non-leap years (conservative)
- Option B: Mar 1 in non-leap years (some systems)

**Recommendation:** Use Feb 28 (Option A) to stay within February, matching most calendar library defaults.

### 3. **Timezone handling is underspecified**

The spec says "avoid timezones entirely" and uses `PlainDate`, but:

- JavaScript `Date` always has timezone implications
- `currentDate` from user input may have unexpected timezone offsets

**Recommendation:**

- Accept `Date` but immediately extract year/month/day in local time
- Alternatively, define a simple `{year, month, day}` interface
- Document clearly that all calculations are timezone-naive

### 4. **"6 months" subtraction edge cases**

Subtracting 6 months from dates like Jan 30 → July 30 works, but:

- Aug 31 - 6 months → Feb 31? → Feb 28/29

**Recommendation:** When target month has fewer days, clamp to last day of month (standard calendar behavior).

### 5. **Bare number parsing risk**

The spec allows "35" as age only when `contextIsAgeField` is true, but:

- Doesn't define behavior when false
- Could conflict with year parsing (is "1990" an age or birth year?)

**Recommendation:**

- When `contextIsAgeField: false`, require explicit unit ("35 years", "35yo")
- Consider: numbers > 120 are likely years, not ages

### 6. **Render output format is too rigid**

The spec mandates "Age: X; Birthday: Y" format, but:

- Localization needs differ (order, labels, punctuation)
- Some UIs want structured data, not formatted strings

**Recommendation:**

- Return structured `RenderBirthdateResult` object
- Provide a `formatted` field for convenience
- Allow format options for different output styles

### 7. **Missing: negative ages / future birthdates**

What if someone enters a future birthdate? Or calculation yields negative age?

**Recommendation:**

- Return age as "not yet born" or similar for future dates
- Validate that birthdate ≤ currentDate in most contexts

### 8. **Missing: age ceiling for "senior"**

The spec shows "senior" as 65+∞, but:

- Very old ages (100+) might warrant special handling
- "Centenarian" is a recognized life stage

**Recommendation:** Add optional life stages for very old ages:

- centenarian: 100+
- supercentenarian: 110+

### 9. **Constraint metadata not in EDTF**

The spec recommends keeping `birthdayConstraint` in metadata when enumeration would be too large. This means:

- The EDTF string alone doesn't capture full information
- Downstream consumers need to understand the metadata format

**Recommendation:**

- Define a clear schema for constraint metadata
- Consider: could use EDTF comments or annotations if supported

### 10. **Missing: compound ages like "2 years 3 months"**

Real-world infant ages often use compound forms:

- "18 months" vs "1 year 6 months"
- "2 years and 3 months old"

**Recommendation:** Add grammar support for compound age expressions, normalized to months for sub-year precision.

### 11. **Decimal ages in life-stage table**

The table uses `0.0833` for 1 month — this works but:

- Loses precision (1/12 ≈ 0.0833333...)
- Better to use months internally and convert

**Recommendation:** Store life-stage bounds in months for sub-year stages, years for older stages.

### 12. **Missing: explicit handling of "unknown" input**

The spec says return `../..` for unknown, but:

- Need to distinguish "couldn't parse" from "explicitly unknown"
- `../..` is valid EDTF for completely open interval

**Recommendation:**

- Return parse failure (not success with `../..`) for unparseable input
- Reserve `../..` for explicit "unknown" markers in input

---

## Phased Implementation Plan

### Phase 1: Core Infrastructure (Foundation)

**Goal:** Establish types, date arithmetic helpers, and module structure.

- [ ] **1.1** Create `packages/natural/src/birthdate.ts` with type definitions
  - `ParseBirthdateOptions`, `ParseBirthdateResult`, `AgeExpression`
  - `BirthdayConstraint` interface

- [ ] **1.2** Create `packages/utils/src/birthdate.ts` with type definitions
  - `RenderBirthdateOptions`, `RenderBirthdateResult`

- [ ] **1.3** Add calendar-aware date arithmetic to `packages/core/src/utils/date-helpers.ts`
  - `subtractYears(date, n)` → handles Feb 29
  - `subtractMonths(date, n)` → handles month-end clamping
  - `subtractWeeks(date, n)`
  - `subtractDays(date, n)`
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

- [ ] **2.2** Implement age grammar rules in `grammar.ne`
  - Numeric years: `N years`, `Nyo`, `age N`
  - Infant ages: `N months`, `N weeks`, `N days`
  - Decades: `30s`, `thirties`, `early 30s`, `mid-thirties`
  - Teens: `teens`, `teenager`, `early teens`, `mid teens`, `late teens`
  - Life stages: `newborn`, `toddler`, `senior`, etc.
  - Compound ages: `2 years 3 months` (stretch goal)

- [ ] **2.3** Rebuild grammar and test age parsing
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

### Phase 4: Age-to-Birthdate Conversion

**Goal:** Convert parsed ages to EDTF interval expressions.

- [ ] **4.1** Implement `calculateBirthInterval()` for exact ages
  - Two-interval union for ±6 month window
  - Proper EDTF Set notation `[a/b,c/d]`

- [ ] **4.2** Implement `calculateBirthInterval()` for age ranges
  - Single interval with +1 year for max (conservative)
  - Handle open-ended (senior → `../YYYY-MM-DD`)

- [ ] **4.3** Implement `calculateBirthInterval()` for sub-year ages
  - Month/week/day intervals
  - Proper calendar arithmetic

- [ ] **4.4** Write comprehensive tests
  - All age derivation cases from spec
  - Edge cases: year boundaries, leap years

### Phase 5: Birthday Constraints

**Goal:** Apply month/day constraints to age-derived ranges.

- [ ] **5.1** Implement birthday constraint parsing
  - "May birthday", "born in June", "May 12", "12th of May"
  - Add to grammar as optional suffix

- [ ] **5.2** Implement `applyBirthdayConstraint()`
  - Intersection logic
  - Enumeration for small year spans (≤12 years)
  - Metadata preservation for large spans

- [ ] **5.3** Implement constraint-aware EDTF generation
  - `[1990-05, 1991-05, ..., 1995-05]` for enumerated
  - Interval + metadata for large spans

- [ ] **5.4** Write tests for constraint application
  - "teenager, May birthday"
  - "early 30s, born December 25"

### Phase 6: Complete `parseBirthdate()`

**Goal:** Assemble full parsing pipeline.

- [ ] **6.1** Implement main `parseBirthdate()` function
  - Normalize → birth marker check → age parsing → conversion
  - Error handling for unparseable input

- [ ] **6.2** Implement confidence scoring
  - Birth markers: high confidence
  - Explicit ages: high confidence
  - Bare numbers (in context): medium confidence
  - Life stages: medium-low confidence

- [ ] **6.3** Implement interpretation generation
  - Human-readable description of what was parsed
  - Include derived age range

- [ ] **6.4** Export from `@edtf-ts/natural` package
  - Add to `index.ts` exports
  - Update package documentation

- [ ] **6.5** Write integration tests
  - All spec examples
  - Round-trip with renderer

### Phase 7: Age Rendering

**Goal:** Compute age from EDTF birthdates.

- [ ] **7.1** Implement `calculateAgeFromBirthdate()`
  - Calendar-aware age calculation
  - Handle partial dates (min/max age)
  - Handle intervals (age range)
  - Handle sets/lists (union age range)

- [ ] **7.2** Implement `formatAgeRange()`
  - Single age: "35"
  - Small range: "35–36"
  - Decade match: "early 30s"
  - Life stage match: "teenager", "toddler"
  - Open-ended: "65+"
  - Sub-year: "6 months old", "newborn"

- [ ] **7.3** Implement `matchLifeStage()`
  - Reverse lookup from age range to vocabulary
  - Prefer more specific (early/mid/late) when matching

### Phase 8: Birthday Rendering

**Goal:** Extract and format birthday information.

- [ ] **8.1** Implement `formatBirthdayDisplay()`
  - Exact date → "September 15"
  - Year-month → "in September"
  - Partial month → "in September"
  - Unknown/varies → null

- [ ] **8.2** Handle sets and lists
  - Check consistency across members
  - Consistent month/day → display
  - Inconsistent → null

### Phase 9: Complete `renderBirthdate()`

**Goal:** Assemble full rendering pipeline.

- [ ] **9.1** Implement main `renderBirthdate()` function
  - Parse EDTF if string
  - Calculate age range
  - Format age
  - Format birthday
  - Combine with qualifiers

- [ ] **9.2** Implement output formatting
  - Full: "Age: 35; Birthday: September 15"
  - Age-only: "35"
  - Birthday-only: "September 15"
  - With qualifiers: "Age: approximately 35"

- [ ] **9.3** Export from `@edtf-ts/utils` package
  - Add to `index.ts` exports
  - Update package documentation

- [ ] **9.4** Write integration tests
  - All spec examples
  - Round-trip: parse → render → verify

### Phase 10: Documentation & Polish

**Goal:** Complete documentation and edge case handling.

- [ ] **10.1** Write API documentation
  - JSDoc with examples for all public functions
  - README updates for both packages

- [ ] **10.2** Add guide documentation
  - `docs/guide/age-and-birthdays.md`
  - Common use cases and examples

- [ ] **10.3** Add API reference documentation
  - `docs/api/birthdate.md`
  - Full type documentation

- [ ] **10.4** Edge case audit
  - Future birthdates
  - Very old ages (centenarians)
  - Invalid inputs
  - Locale-specific date formats

- [ ] **10.5** Performance review
  - Grammar compilation impact
  - Date arithmetic hot paths
  - Consider caching for repeated operations

---

## Testing Strategy

### Unit Tests

- Date arithmetic helpers (Phase 1)
- Age parsing grammar (Phase 2)
- Birth marker extraction (Phase 3)
- Interval calculation (Phase 4)
- Constraint application (Phase 5)

### Integration Tests

- Full `parseBirthdate()` pipeline (Phase 6)
- Full `renderBirthdate()` pipeline (Phase 9)
- Round-trip: parse → render → verify (Phase 9)

### Spec Compliance Tests

- All examples from this spec document
- Edge cases identified in weaknesses section

### Regression Tests

- Ensure existing `parseNatural()` behavior unchanged
- Ensure existing formatters unchanged

---

# REVISION FEEDBACK -- NOT READY! THINK THROUGH EDTF OF ALL THE SCENARIOS

We could always store birthdate as an EDTF interval, even though we know it's a single day; the interval
is the range of possible days. We can mark month and day as 'uncertain' if we don't know them, and if they
aren't uncertain than we know that they are the correct birth month and/or birth day even if they are
part of a multi-year range.

TO DO: UPDATE with logic for how we calculate ages!

Examples:
John Doe has a true birthdate of 2005-03-15

On 2025-06-01 we are told John Doe is 20 years old. ("20 yo") Knowing only his age, on 2025-06-01, he could be
turning 21 tomorrow, in which case his earliest possible birthdate is 2004-06-02. And he could have turned
20 today, in which case his latest possible birthdate is 2005-06-01. So we store his birthdate as
EDTF: 2004-?06-?02/2005-?06-?02
FORMATTED: "June 2, 2004 (month uncertain, day uncertain) to June 2, 2005 (month uncertain, day uncertain)"

On 2025-06-01 we are told John Doe is 20 years old with a March birthday. ("20 y/o, March birthday") So
if his birthday is past, the earliest it could have been is 2005-03-01, and the latest it could have
been is 2005-03-31. So we store his birthdate as
EDTF: 2005-03-?01/2005-03-?31
FORMATTED: "March 1, 2005 (day uncertain) to March 31, 2005 (day uncertain)"

On 2025-06-01 we are told John Doe is 20 years old with a March 15th birthday. ("20 y/o, birthday 3/15") So
we store his birthdate as
EDTF: 2005-03-15
FORMATTED: "March 15, 2005"

On 2025-06-01 we are told John Doe is in his early 20s with a March 15th birthday. ("early 20s, birthday 3/15")
So he could be 20, 21, 22, or 23 by our 'early' logic. So his birth year could be 2005, 2004, 2003, or 2002.
So we store his birthdate as
EDTF: ?2002-03-15/?2005-03-15
FORMATTED: "March 15, 2002 (year uncertain) to March 15, 2005 (year uncertain)"

On 2025-06-01 we are told John Doe has a March 15th birthday. ("March 15th birthday"). So he could be any age, 0-120+,
but we really don't know. We could store a 120 year range but it's impractical; if we got even a small amount of
age information ('adult' or 'child') we could store a big range, but here we truly only have a birthday. So we
store his birthdate as
EDTF: XXXX-03-15
FORMATTED: "March 15 in the XX00s" // NOTE: Not a great formatted output

We must, of course, use our own custom formatter for age/birthday strings, relying on the uncertain flag to know
if month or day can be included, but we always have enough for an age range.

We don't need to keep any sets of intervals; a birthdate can always be expressed in a single EDTF item,
which may be a single interval, but never needs to be two.

RenderBirthdateOptions should include Intl object-like parameters to specify formatting and style; the caller
should be able to require numeric ages (disallowing 'teenager' and 'senior' in favor of 13-19 and 65+), or
choose a 'short', 'medium', or 'long' rendering (e.g. '25yo' vs vs '25 y/o' vs '25 years old') and Intl.DateTimeFormat
options that are relevant to a date.

NOTE: If we have all three components in unambiguous form (year, month, day) we can probably re-use

RenderBirthdateOptions {
currentDate?: Date;
locale?: string;
includeQualifiers?: boolean; // default: true
format?: 'full' | 'age-only' | 'birthday-only';
}

### Intl.DateTimeFormat() Options Relevant to Y/M/D Dates

Date-time component options
weekday
The representation of the weekday. Possible values are:
"long" E.g., Thursday
"short" E.g., Thu
"narrow" E.g., T. Two weekdays may have the same narrow style for some locales (e.g., Tuesday's narrow style is also T).

era
The representation of the era. Possible values are:
"long" E.g., Anno Domini
"short" E.g., AD
"narrow" E.g., A

year
The representation of the year. Possible values are "numeric" and "2-digit".

month
The representation of the month. Possible values are:
"numeric" E.g., 3
"2-digit" E.g., 03
"long" E.g., March
"short" E.g., Mar
"narrow" E.g., M). Two months may have the same narrow style for some locales (e.g., May's narrow style is also M).

day
The representation of the day. Possible values are "numeric" and "2-digit".
