# Migrating from 0.5.0 to 0.6.0

Version 0.6.0 retains the existing exports and required call arguments. Ordinary calendar-date parsing, formatting, and comparisons remain available. All 14 code examples from the deployed Getting Started guide were run against the published npm 0.5.0 packages and the 0.6.0 build with the same results. This check does not cover every application or every input.

The important upgrade risks are new exceptions, comparison return types, and assumptions about age-result shapes. Changes to the meaning or spelling of successfully parsed dates are listed separately below. Update `@edtf-ts/core` and `@edtf-ts/natural` together.

## Changes that can stop existing code

| Existing usage | What can fail in 0.6.0 | What to change |
|---|---|---|
| Parsing an interval with time-of-day endpoints | Rejected even in extended mode; `FuzzyDate.parse()` throws. | Check input with `FuzzyDate.from()` or core `parse()`. Keep instant-to-instant durations outside EDTF calendar-date intervals. Standalone `Date.toISOString()` input remains supported. |
| `parseNatural(text, { locale: navigator.language })` for English input | `locale` now selects a grammar. Unsupported languages throw; Spanish/French locales require matching input unless `language` is specified. The same language selection applies to `parseAgeBirthday()`. | Set `language: 'en'` when the field accepts English regardless of the user's region, or restrict the field to the supported input languages. |
| Numeric use of `compare()` or `.compareTo()` | The return type is now `number \| 'UNKNOWN'`. Numeric assignments and direct `Array.sort()` callbacks can fail TypeScript compilation. In JavaScript, treating `'UNKNOWN'` as a number can silently misorder results. | Handle `'UNKNOWN'` explicitly before arithmetic or numeric comparison. |
| `sort()`, `earliest()`, `latest()`, or `FuzzyDate.compare()` on mixed time bases | Throws when comparing a timezone-qualified timestamp with a calendar date or a datetime without a timezone. | Sort values with the same time basis, or resolve a timezone using application knowledge before comparison. Do not append `Z` to an unknown local time. |
| Treating every age-derived result as an interval | An age such as `20 yo` now returns a one-of set. Accessing interval-only properties such as `.start` without a type check can fail in caller code. | Check the returned type, or use `.edtf` and `formatHuman(result.parsed)` when storing/displaying the result. |

Core `parse()` and `FuzzyDate.from()` still return a success/failure result for invalid EDTF strings; `FuzzyDate.parse()` still throws. `parseNatural()` still returns an array or throws. There is no new requirement to replace it with `tryParseNatural()`, which is an optional API for handling expected input failures as structured outcomes.

### Timestamp input

```ts
import { FuzzyDate } from '@edtf-ts/core';

const iso = new Date('2020-01-01T12:30:00.123Z').toISOString();
const result = FuzzyDate.from(iso);
if (result.success) {
  console.log(result.value.toISO()); // 2020-01-01T12:30:00.123Z
  console.log(result.value.min.toISOString()); // 2020-01-01T12:30:00.123Z
} else {
  console.error(result.errors);
}
```

`Date.toISOString()` input is accepted in the default extended profile, including `.000Z` and signed six-digit years. Fractions with one to three digits are retained. Strict mode excludes these ISO extensions; datetime interval endpoints and fractions longer than three digits remain unsupported.

Version 0.5.0 accepted fractions but ignored them in bounds and `toISO()` output. Version 0.6.0 preserves their resolution: `.123` is one exact millisecond, `.12` spans milliseconds 120–129, and an omitted fraction still spans the whole second. This can change comparison results without changing the call signature. `precision` stays `'second'`; the optional `fractionalSecond` property records the written digits. See the [datetime reference](../api/types/datetime) for details.

### Input language and regional date order

```ts
import { parseNatural } from '@edtf-ts/natural';

// An English-language field used by someone with German regional settings:
const results = parseNatural('January 12, 1940', {
  locale: 'de-DE',
  language: 'en',
});
console.log(results[0]!.edtf); // 1940-01-12
```

`language` selects English, Spanish, or French grammar; `locale` still supplies the regional numeric-date preference. Core date formatting with `locale: 'de-DE'` remains supported; the grammar restriction concerns natural-language parsing. Continue handling parse failures for unrecognized input.

Regional variants of a supported language already work: `en-ZA`, `en-AU`, and `en-IN` all select English without requiring separate language packs. The full region is retained for date ordering. See [locales and bundle sizes](./locales-and-bundles).

### Comparisons

```ts
import { FuzzyDate } from '@edtf-ts/core';

const local = FuzzyDate.parse('2020-01-01T12:00:00');
const absolute = FuzzyDate.parse('2020-01-01T12:00:00Z');
const ordering = local.compareTo(absolute);
if (ordering === 'UNKNOWN') {
  console.log('A timezone is needed to order these values.');
} else {
  console.log(ordering < 0 ? 'Earlier' : ordering > 0 ? 'Later' : 'Equal');
}
```

Even calls comparing two ordinary years have the wider static return type, so TypeScript callers may need a guard although those particular values remain comparable. The existing four-valued relation APIs, such as `isBefore()` and `equals()`, retain their `YES`/`NO`/`MAYBE`/`UNKNOWN` return type.

### Age-result shape

```ts
import { formatHuman, isEDTFSet } from '@edtf-ts/core';
import { parseAgeBirthday } from '@edtf-ts/natural';

const birth = parseAgeBirthday('20 yo', { currentDate: new Date(2025, 5, 1) });
console.log(birth.type); // set
console.log(birth.edtf); // [2004-06-02..2005-06-01]
console.log(formatHuman(birth.parsed));
if (isEDTFSet(birth.parsed)) {
  // Handle possible birthdates as a set, without reading interval endpoints.
  console.log(birth.parsed.type); // Set
}
```

Code that stores `.edtf` or displays the result through the formatter can keep that flow. Code that reparses it specifically as an interval, reads interval endpoints, or switches only on `date`/`interval` must handle `set` too. Forwarded literal dates can also yield other supported result types.

## Public interfaces

These TypeScript changes matter primarily to callers doing numeric comparisons, constructing objects themselves, or exhaustively checking result types:

| Interface | Compatibility impact |
|---|---|
| `compare()` / `IFuzzyDate.compareTo()` | Return `number \| 'UNKNOWN'`; narrow the result before numeric use. |
| Natural `ParseResult` | `parsed` and `fuzzyDate` are required. Old handwritten results or mocks missing them no longer type-check. `type` now declares `datetime`, which 0.5.0 already returned at runtime for literal datetimes. |
| `ParseAgeBirthdayResult` | `parsed` is required. The `type` union expands beyond `date`/`interval`; exhaustive switches and narrowed assignments need updating. |
| `EDTFInterval` | `start`/`end` no longer accept `EDTFDateTime`. Calendar-date endpoints remain supported; season endpoints remain supported in the default extended profile. |

Receiving required `parsed`/`fuzzyDate` fields does not itself break normal result consumption. Prefer producing fixtures with the parser instead of manually imitating its result objects. Existing imports, synchronous calls, numeric EDTF-level arguments, and `ParseError` constructor calls remain supported. New parsing options, language entry points, and core operations are additive.

### Advanced integrations

`Member` adds optional `calendarRange` and `timeDomain` metadata. Custom callbacks passed to `evaluate()` or `evaluateRelation()` now throw for symbolic open date choices such as `[1870..]`. Use the built-in relation functions for these values. The built-in functions support the new representation; custom callbacks remain supported for nonsymbolic inputs.

An unbounded age with a recurring birthday, such as `senior, March birthday`, now raises an error rather than dropping the birthday constraint. Ask for a finite age range when the application needs this combination.

## Meaning changes

The following examples compare the published 0.5.0 behavior with 0.6.0 defaults. A changed successful result is not automatically a crash; it matters when caller code assumes a particular type, spelling, ranking, or boundary meaning.

| Input or behavior | 0.5.0 | 0.6.0 |
|---|---|---|
| `no earlier than 1870` | Rejected | `[1870..]` |
| `before 1870`, `pre-1870` | `../1870` or rejected | `[..1869]` |
| `after 1870`, `post-1870` | `1870/..` or rejected | `[1871..]` |
| `1870 or earlier` | `[..1870]` | `[..1870]` (unchanged) |
| `1870 or later` | `1870/..` | `[1870..]` |
| Known day in an unspecified month | English could omit the day; translated phrases failed to parse | `1870-XX-12` retains day 12 in all renderings |
| `March 5` | `0005-03` | `XXXX-03-05`; use `March 0005` for the historical month |
| `19th century?` | `18XX?` | `1801?/1900?` |
| `since 1870` | `1870/..` | `1870/..` |
| `One of: 1870, 1871, 1872` | `[1870,1871,1872]` | `[1870,1871,1872]` (unchanged; compaction is explicit) |
| `sometime between 1870 and 1880` | Rejected | `[1870..1880]` |
| `nineteenth century` | `18XX` | `1801/1900` |
| `1 BCE` | `-0000` | `0000` |
| Literal `~2004-06` | `2004-06~` | `~2004-06`, preserving qualification of the year only |
| `1–3 March 2024` | `0001/2024-03-03` | `2024-03-01/2024-03-03` |
| `December–January 2024` | `2024-12/2024-01` | `2023-12/2024-01`, then `2024-12/2025-01`; both ambiguous |
| `20 yo`, on June 1, 2025 | `?2004-?06-?02/?2005-?06-?01` | `[2004-06-02..2005-06-01]` |
| `20 yo, birthday June`, on June 1, 2025 | `2005-06-?01/2005-06-?30` | `[2004-06-02..2004-06-30,2005-06-01]` |
| `20-23 yo, birthday March 15`, on June 1, 2025 | `?2002-03-15/?2005-03-15` | `[2002-03-15,2003-03-15,2004-03-15,2005-03-15]` |

The [LOC EDTF specification](https://www.loc.gov/standards/datetime/) distinguishes an open interval (`../1870`) from a date choice (`[..1870]`). Bare `..1870` remains invalid. The error suggests both meaningful alternatives.

By default, before/after boundaries shift an exact year, month, or day by one calendar unit. February, leap years, year zero, and negative years use Gregorian arithmetic. Inclusive boundaries preserve the cutoff. Fuzzy natural-language cutoffs raise an error under the default policy. The optional `boundaryMode: 'open-interval'` retains the cutoff as an inclusive interval endpoint, for example `before 1870` → `../1870`; use it only if that meaning fits the application. See [parsing policies](./parsing-policies#before-and-after). It is not a general 0.5.0 compatibility mode.

The numeric prefixes accept hyphenated, closed, and spaced forms: `pre-1870`, `pre1870`, `pre 1870`, and the corresponding `post` forms. Documentation uses hyphenated forms. Numeric ambiguity is retained within qualified dates, intervals, and collections. Each numeric interpretation applies a consistent date order to the entire expression.

All successful natural-language candidates are validated before ranking and filtering. Inputs such as `February 30, 2020`, previously returned as invalid candidates, now raise an error. Bare one- or two-digit years such as `20` also require an era marker or four-digit spelling. Continue handling parse failures for user input. Human-readable `interpretation` text, confidence scores, and error details can change; avoid using display/error strings as identifiers.

Stored EDTF strings are not automatically rewritten. Some formerly accepted strings no longer parse, as described above. If you want stored natural-language inputs to receive the new interpretations, reparse the original input after reviewing the differences. An old interval alone cannot reveal whether its author meant an event-date constraint or a duration.

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

Rendered collection prefixes (`One of`, `All of`, `Una de estas fechas`, `Todas estas fechas`, `Une de ces dates`, and `Toutes ces dates`) use language vocabulary with shared member parsing. Singleton collections retain their set/list type, and rendered open members retain their inclusion boundaries. Explicit enumerations and ranges preserve their structure in parsing and formatting. Use `compactYearRanges` explicitly for compact year spelling; it preserves gaps, duplicates, source order, and qualifications without modifying the parsed object. The playground also uses it to compare equivalent year collections. Open interval endpoint phrases are language-owned tokens, retaining Spanish/French noun and adjective order.

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
