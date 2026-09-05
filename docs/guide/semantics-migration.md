# EDTF semantics and multilingual migration

This release changes incorrect outputs directly. Persisted values retain their original EDTF meaning; reparse the original natural-language input when migrating stored data. A stored interval cannot reveal whether its author originally meant an event-date constraint.

## Meaning changes

| Input or behavior | Previous result | Corrected result |
|---|---|---|
| `no earlier than 1870` | `../1870` | `[1870..]` |
| `before 1870`, `pre-1870` | `../1870` or rejected | `[..1869]` |
| `after 1870`, `post-1870` | `1870/..` or rejected | `[1871..]` |
| `1870 or earlier` | Inconsistent boundary handling | `[..1870]` |
| `1870 or later` | `1870/..` | `[1870..]` |
| Known day in an unspecified month | English could omit the day; translated phrases failed to parse | `1870-XX-12` retains day 12 in all renderings |
| `March 5` | Only `0005-03` | `XXXX-03-05` first, then `0005-03`; `March 0005` selects the historical month |
| `19th century?` | Only the ending year was qualified | `1801?/1900?` |
| `since 1870` | `1870/..` | `1870/..` |
| `One of: 1870, 1871, 1872` | `[1870,1871,1872]` | `[1870..1872]`; same date choices, compact spelling |
| Rendered Spanish/French open interval | Could fail to parse | `1870 a fin abierto` / `1870 à fin ouverte` → `1870/..` |
| Exact extended-year rendering | Could round away trailing digits | All year digits retained |
| `sometime between 1870 and 1880` | Rejected | `[1870..1880]` |
| `nineteenth century` | `18XX` | `1801/1900` |
| `1 BCE` | Could produce a negative zero | `0000` |
| Literal `~2004-06` | `2004-06~` | `~2004-06`, preserving qualification of the year only |
| `1–3 March 2024` | Could include `0001/2024-03-03` | `2024-03-01/2024-03-03` |
| `December–January 2024` | Reversed interval | `2023-12/2024-01`, then `2024-12/2025-01`; both ambiguous |
| Age 20 with a June birthday, on June 1, 2025 | Could choose only one birth year | `[2004-06-02..2004-06-30,2005-06-01]` |
| Age 20–23 with birthday March 15, on June 1, 2025 | Continuous interval between birthdays | `[2002-03-15,2003-03-15,2004-03-15,2005-03-15]` |

The [LOC EDTF specification](https://www.loc.gov/standards/datetime/) distinguishes an open interval (`../1870`) from a date choice (`[..1870]`). Bare `..1870` remains invalid. The error suggests both meaningful alternatives.

Strict before/after boundaries shift an exact year, month, or day by one calendar unit. February, leap years, year zero, and negative years use Gregorian arithmetic. Inclusive boundaries preserve the cutoff. Approximate, uncertain, or masked natural-language cutoffs raise an explanatory error. Valid literal EDTF remains accepted unchanged.

The numeric prefixes accept hyphenated, closed, and spaced forms: `pre-1870`, `pre1870`, `pre 1870`, and the corresponding `post` forms. Documentation uses hyphenated forms. Numeric ambiguity is retained within qualified dates, intervals, and collections. Each numeric interpretation applies a consistent date order to the entire expression.

## Public interfaces

| Interface | Change |
|---|---|
| Core `compactYearRanges(value)` | Returns compact year sets/lists without changing the parsed object or other syntax |
| Natural `ParseResult` | `parsed` and `fuzzyDate` are required; `type` also includes `datetime` |
| Age/birthday result | `parsed` is required; forwarded dates retain their actual type, including sets and datetimes |
| `locale` | Defaults to `en-US`; selects a grammar language and regional numeric-order preference |
| `language` | Optional `en`, `es`, or `fr` override, independent of numeric-order preference |
| `dateOrder` | Optional `MDY`, `DMY`, or `YMD`; otherwise derived from `Intl.DateTimeFormat.formatToParts` |
| Unsupported languages | Raise an error rather than trying English silently |
| Language entry points | `@edtf-ts/natural/en`, `/es`, `/fr`; each includes one compiled grammar and defaults to its language |
| `compare` and `compareTo` | Return `number \| 'UNKNOWN'`; floating/absolute timestamp comparisons return `UNKNOWN` |
| Sorting, including `FuzzyDate.compare` | Throws when a floating/absolute pair cannot be ordered |
| Normalized `Member` | Optional `calendarRange` represents an unbounded family of calendar choices; optional `timeDomain` distinguishes absolute and floating timestamps |
| Custom relation callbacks | Explicitly reject symbolic calendar ranges until those callbacks support them |
| EDTF intervals | Date-only endpoints; datetime intervals are outside this profile |

All successful natural-language candidates are validated before ranking and filtering. Impossible dates, reversed intervals, malformed comma/space syntax in literal sets, impossible masks, invalid offsets, and non-profile fractional-second extensions are rejected. Do not rely on invalid secondary candidates being returned with a high confidence score.

## Multilingual use

```ts
import { parseNatural, parseAgeBirthday } from '@edtf-ts/natural';
import { formatHuman } from '@edtf-ts/core';

parseNatural('antes de 1870', { locale: 'es-ES' })[0].edtf; // [..1869]
parseNatural('avant 1870', { locale: 'fr-FR' })[0].edtf; // [..1869]
parseNatural('12 de marzo de 1870', { locale: 'es-MX' })[0].edtf; // 1870-03-12
parseNatural('12 mars 1870', { locale: 'fr-CA' })[0].edtf; // 1870-03-12

const birth = parseAgeBirthday('20 ans, anniversaire le 15 mars', {
  locale: 'fr-FR', currentDate: new Date(2025, 5, 1),
});
birth.edtf; // 2005-03-15
formatHuman(birth.parsed, { locale: 'fr-FR' }); // 15 mars 2005
```

Parsing stays synchronous. Unicode is normalized to NFC, retaining accents; selected conventional aliases such as French `fevrier` are accepted. Complete rendering paths localize qualifiers, date ordering, intervals, collections, seasons, eras, and birthday phrases. Canonical round-trip fixtures cover intentionally parseable phrases; arbitrary display strings are not a lossless serialization format. Use EDTF for storage.

Numeric ordering is a preference, not a restriction on valid alternatives. In a year-first locale such as `fr-CA`, `vers 2020/01/02` resolves directly; `vers 01/02/2020` retains both valid year-last interpretations. All alternatives are validated before ranking, and confidence filtering preserves their ambiguity metadata.

The shared numeric resolver assigns component roles after the grammar captures the numbers. English uses the same grammar for `en-US` and `en-GB`; the latter prefers DMY, unless `dateOrder` overrides it. Ambiguity is retained across every member of an expression, including when a later date has equal month/day numbers. Each candidate uses a consistent ordering, so an unambiguous MDY member cannot be combined with a DMY reading of another member in the same expression.

Rendered collection prefixes (`One of`, `All of`, `Una de estas fechas`, `Todas estas fechas`, `Une de ces dates`, and `Toutes ces dates`) use language vocabulary with shared member parsing. Singleton collections retain their set/list type, and rendered open members retain their inclusion boundaries. Ascending runs of adjacent exact years become finite range members in both parsing and rendering. This preserves gaps, duplicates, source order, and qualifications. Literal EDTF pass-through stays unchanged; the playground compares year collections using `compactYearRanges` so equivalent enumerations and ranges show green. Open interval endpoint phrases are language-owned tokens, retaining Spanish/French noun and adjective order.

The [interactive playground](../playground) initializes its top-level locale chooser from `navigator.language`. Regional presets and custom locale tags apply to both date inputs and all date/age rendering. The status line exposes the numeric-order preference; unsupported languages show an error. **Browser default** resets the selection, and reload clears an override. Library calls retain their `en-US` default.

The [compatibility review](./compatibility-review) records the additional supplied/edtfy examples, including unknown components, season intervals, articles, abbreviations, and deliberate rejections. Regenerate it after building core with `node packages/natural/scripts/generate-compatibility.cjs`.

## Internal structure and extension rules

`src/languages/en.ne`, `es.ne`, and `fr.ne` compile independently with [Nearley's shared grammar includes](https://nearley.js.org/docs/grammar). They own vocabulary, contractions, articles, ordinals, and word order. `shared.ne` holds reusable productions. Grammar reductions construct deferred semantic nodes; shared TypeScript resolves calendar arithmetic, qualification scope, cutoffs, alternatives, reference years, and validation after syntax parsing. Reference dates belong to each call; there is no mutable grammar-level clock.

`parser-factory.ts` supplies the synchronous dispatch and ranking pipeline. `age-parser.ts` shares age arithmetic and birthday intersections across language packs. Core `localized-format.ts` and `life-stage-locales.ts` supply localized rendering and messages. `Intl` handles calendar names, date order, plural rules, and lists using the runtime's locale data, consistent with [CLDR's date-pattern model](https://cldr.unicode.org/translation/date-time/date-time-patterns).

Add a feature identifier and English, Spanish, and French fixtures together in `tests/fixtures/languages.json`. The separate language suites run the same semantic contract, checking every candidate's validity, type, ambiguity, confidence, and parsed object. Add focused tests for calendar edge cases and rendering scope. Regenerate grammars with `pnpm --filter @edtf-ts/natural build:grammar`; do not edit generated JavaScript.

`tests/locale-roundtrip.test.ts` also runs chained English → French → Spanish → English conversions across regional locales. At each hop, it asserts the preferred EDTF remains unchanged and validates every returned candidate. Separate numeric tests cover locale ordering, explicit overrides, short years, and ambiguity inside expressions. These tests exercise canonical phrases; display-only formatting options can intentionally lose precision or qualifiers.

`node packages/natural/scripts/generate-examples.cjs` generates the [tested language examples](./language-examples.md) and the playground’s localized example buttons from the same fixture corpus. After clean package builds, `node packages/natural/scripts/check-packages.cjs` runs the fixture corpus against ESM and CommonJS language entry points and prepares the browser test page in `.tmp-browser`.

## Calendar and comparison conventions

Season codes 21–24 use March/June/September/December starts by application convention. Codes 25–28 use the same northern-hemisphere spans; 29–32 use southern-hemisphere spans. Codes 33–41 cover quarters, four-month periods, and semesters. Cross-year winter/summer spans end in the following year. LOC defines the codes; it does not prescribe these calendar dates.

Early/mid/late period divisions and life-stage age ranges remain documented library conventions. Life-stage translations use the same numeric ranges in all three languages, including school-related vocabulary. They do not infer local educational or legal age boundaries. Vague relative dates such as “recently” remain unsupported.

Open date choices remain symbolic during normalization and Allen comparisons. They are not one continuous infinite interval. Built-in relations handle `ANY` and `ALL`; `normalizeToConvexHull` explicitly discards gaps. For symbolic choices, `FuzzyDate.overlapScore` returns the best attainable calendar-member overlap score. Floating times have nominal calendar bounds, not an inferred time zone; absolute timestamps apply their explicit offsets before comparison.

Extended years use exact Gregorian integer arithmetic. The public numeric `year` representation is limited to JavaScript safe integers; larger years are rejected explicitly instead of silently rounded.

An unbounded age combined with a recurring birthday (for example, “senior, March birthday”) requires infinitely many disjoint choices. This combination raises an explanatory error asking for a finite age range. It never drops the birthday constraint. Finite month/week/day ages intersect birthday constraints with the actual possible birth-date window.
