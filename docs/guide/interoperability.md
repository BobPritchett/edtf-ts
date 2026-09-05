# Interoperability and parsing policies

EDTF-TS preserves explicit enumerations and ranges, distinguishes a possible event date from a duration, and supports an optional conservative interoperability profile. The [LOC EDTF specification](https://www.loc.gov/standards/datetime/) is the primary reference; this profile is not a claim of complete formal ISO validation.

## Strict and extended parsing

Extended support remains the default. Use `conformance: 'strict'` to exclude the combinations listed below. The maximum EDTF feature level is independent of this option.

```typescript
import { parse, isValid, FuzzyDate } from '@edtf-ts/core';
import { parseNatural, parseAgeBirthday } from '@edtf-ts/natural';

parse('1984?', 1); // Existing positional level calls still work
parse('1984?', { level: 1, conformance: 'strict' });
isValid('1988-03/1990-21', { conformance: 'strict' }); // false
FuzzyDate.from('1988-03/1990-21', { conformance: 'strict' }); // failure result
parseNatural('spring 1988 to summer 1990'); // supported extension
parseNatural('spring 1988 to summer 1990', { conformance: 'strict' }); // throws
parseAgeBirthday('born 1988-03/1990-21', { conformance: 'strict' }); // throws
```

| Combination | Extended | Strict |
| --- | --- | --- |
| Standalone unqualified season/sub-year code 21–41 | Accepted | Accepted at the required level |
| Calendar-date interval with qualified calendar endpoints | Accepted | Accepted |
| Qualified calendar-date set/list members, e.g. `[1870?,1880~]` | Accepted | Accepted |
| ISO fractional seconds (1–3 digits), including `Date.toISOString()` output | Accepted, fraction preserved | Rejected |
| Signed six-digit ISO datetime year, e.g. `+010000-01-01T00:00:00Z` | Accepted | Rejected |
| Season as an interval endpoint | Accepted | Rejected |
| Season as a set/list member | Accepted | Rejected |
| Qualified season, including standalone `1988-21~` | Accepted | Rejected |
| Chained open/range syntax such as `[..1667..1668]` | Rejected | Rejected |
| Datetime interval endpoints or more than three fractional digits | Rejected | Rejected |

Season interval endpoints are a supported extension/interoperability feature. Calendar mappings for seasons remain application conventions. Strict mode conservatively excludes season combinations that are not explicitly illustrated by the current LOC profile. These are library interoperability restrictions, not assertions that every such combination was historically forbidden.

The [superseded LOC draft grammar](https://lcnetdev.github.io/standards/datetime/pre-submission.html) explicitly admitted qualified dates in collections and seasons in intervals. It is historical evidence, not a replacement for the current specification. Qualified calendar members therefore remain supported in strict mode. Overlapping left/right qualifications such as `~1984?` also remain accepted by core; the current published prose does not explicitly prohibit that combination. Natural parsing emits the simpler equivalent `1984%` for a year-only value.

Strict checks inspect interval endpoints and collection members recursively. Core returns `UNSUPPORTED_EXTENSION` errors with a structural `path`, such as `$.end` or `$.values[1]`. Natural parsing checks both literal input and generated candidates. It reports an error instead of silently translating a season into a calendar month.

## Collection structure and open boundaries

```text
One of: 1667, 1668, 1670 through 1672 → [1667,1668,1670..1672]
All of: 1670, 1671, 1672             → {1670,1671,1672}
One of: January 2025 through November 2026 → [2025-01..2026-11]
```

Natural parsing and human formatting preserve written enumeration/range structure. Explicit day and month ranges render as ranges. The core `compactYearRanges` utility is still available as an explicit transformation; open boundary members stop compaction, so it cannot generate chained open/range syntax. The original parsed object's `edtf` and expanded `values` remain unchanged.

Open collections must use a single value at each open boundary: use `[..1667,1668,1670..]`, not `[..1667..1668,1670..]`. A phrase explicitly adding earlier values to a finite range can absorb that range into its upper boundary, yielding `[..1668,1670..]`. The valid inclusive list `{..1668,1670..}` includes every year except 1669.

| Natural phrase | Representation |
| --- | --- |
| 1870 and earlier | `../1870` |
| 1870 and after | `1870/..` |
| 1870 or earlier | `[..1870]` |
| 1870 or later | `[1870..]` |
| before 1870 | `[..1869]` |
| after 1870 | `[1871..]` |
| until 1870 | `../1870` |
| since 1870 | `1870/..` |

Explicit “All of” and “One of” prefixes retain their collection meaning. Open endpoints (`..`) remain distinct from unknown endpoints (empty text).

## Short years and qualifications

Bare one- and two-digit numbers such as `5` and `90` now require an era marker (`5 CE`) or four-digit spelling (`0005`). Three-digit historical years, apostrophe years (`'90`), numeric-date windows, and contextual short range end years retain their behavior. `March 5` now means only `XXXX-03-05`; write `March 0005` for the historical month. Invalid day/month combinations do not fall back to small historical years. Early-CE rendering includes an era marker by default so the rendered value can be parsed unambiguously; explicitly hiding eras can prevent round trips.

`parseNatural('~1950')` and `parseNatural('~ 1950')` both return `1950~`; `~1984?` returns `1984%`. This intentionally changes literal pass-through for year-only qualifier spellings. Core parsing preserves the spelling of accepted input. Qualification scope is retained: `~2004-06` still qualifies only the year, while `2004-06~` qualifies both year and month.

## Age-derived birth dates

An age calculation describes one possible birth date. It now returns a `date` when exactly one day is possible and a `set` otherwise, including open choices for unbounded ages. With reference date June 1, 2025:

| Input | EDTF | Type |
| --- | --- | --- |
| 10 days | `2025-05-22` | `date` |
| 20 years old | `[2004-06-02..2005-06-01]` | `set` |
| 20 years old, March birthday | `[2005-03-01..2005-03-31]` | `set` |
| senior | `[..1960-06-01]` | `set` |

Consumers previously expecting an `interval` must handle `set`. Result metadata includes `ageRange`, `birthdayKnown` when provided, and `derivation` with `kind: 'age'`, the original `source`, and the local calendar `referenceDate`. Infant-age metadata also records `unit` and `amount`.

Calculated components no longer receive artificial `?` prefixes. Genuine uncertainty and approximation in the user's input remain meaningful EDTF qualifiers, and known birthday components stay exact. Qualified choices are represented explicitly rather than inventing qualified range-endpoint syntax. Equivalent whole-date and individual component qualifications now have the same effect on age/birthday rendering; old component `?` prefixes are no longer treated as private “derived” metadata. Unbounded age plus a recurring birthday still requires a finite age range.

## Weekday mismatches

Strict weekday checking remains the default. To retain the stated calendar date and receive a warning:

```typescript
const [result] = parseNatural('Monday, March 29, 1988', {
  weekdayMismatch: 'warn',
});
// result.edtf === '1988-03-29'
// result.warnings[0]:
// { code: 'WEEKDAY_MISMATCH', date: '1988-03-29',
//   writtenWeekday: 1, actualWeekday: 2, message: '...' }
```

Weekday numbers follow JavaScript's Sunday=0 convention. Warnings survive interval/collection construction, candidate deduplication, and birth-marker handoff through `parseAgeBirthday`. Matching weekdays produce no warning. Warning mode never adjusts the calendar date or admits an impossible date. The `weekdayMismatch` option is separate from EDTF `conformance`.
