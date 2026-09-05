# Consultant test review and fix plan

Reviewed and implemented 2026-09-05. All eleven tasks below are complete. The original assessment and acceptance criteria are retained as the implementation record.

The report identifies real weaknesses in the tests and several undesirable outputs. Its claims about qualified collection members and qualifier legality need qualification. Adjacent-year compaction is an intentional documented policy, rather than a parser accident, but the requested policy is now to preserve enumerations.

**Evidence and scope.** Source inspection and direct source-module probes reproduced the reported outputs. Eight existing test files pass: 56 core tests and 358 natural tests, 414 total. This is a targeted baseline, not a full conformance audit. The normal `pnpm exec vitest` launcher was unavailable, so the installed Vitest module was invoked directly with Node. No dependencies were changed.

**Specification assessment.** The [current LOC EDTF specification](https://www.loc.gov/standards/datetime/) is the primary reference. It defines choices, inclusive lists, and qualification scope, but does not explicitly say that a component may have only one qualifier across its two sides. Consequently, the categorical rejection of `~1984?` needs stronger evidence; emitting `1984%` is nevertheless clearer. Its example `[1667,1668,1670..1672]` does not impose a canonical spelling. Changing an enumeration to an equivalent range is a representation policy, not a conformance failure.

The [superseded LOC draft BNF](https://lcnetdev.github.io/standards/datetime/pre-submission.html#bnf), used only as historical evidence, distinguishes `earlier`, `later`, and `consecutives`; it cannot produce `..a..b`. It explicitly includes qualified dates among collection members and permits `dateOrSeason` in interval endpoints. This contradicts treating those combinations as categorically forbidden throughout EDTF's history. The [LOC background](https://www.loc.gov/standards/datetime/background.html) explains why the old draft should not replace the current specification. Season endpoints will still be documented as a supported extension/interoperability feature, as requested.

**Decisions recorded from the review.**

- Retain season interval endpoints and qualified collection members; add an optional strict-spec mode.
- Reject bare one- and two-digit natural-language year inputs unless an era is supplied or the year is written with four digits.
- Preserve explicit enumerations; use compact range spelling for explicit ranges. Keep the core compaction utility available as an explicit operation.
- Use a date or one-of set for age-derived birth dates, with derivation recorded in metadata.
- Make standalone “X and earlier” / “X and after” symmetric intervals; retain choices for “X or earlier/later.”
- Keep strict weekday checking by default; add an optional warning mode returning the calendar date with a diagnostic.
- Normalize year-only qualifier spellings in natural parsing; core retains the original spelling of accepted input.

**Assessment of each reported issue.**

| Report | Finding | Planned response |
| --- | --- | --- |
| Vacuous formatting tests | Confirmed: all 27 tests guard their assertions with `if (result.success)` and never require success. | Fail immediately on parse failure; use exact reviewed expectations. |
| Negative year | Confirmed loose test; renderer already returns `1986 BC` for `-1985`. | Pin default and BCE-option output, including year zero and the BCE/CE boundary. |
| Month/day ranges | Confirmed: ranges are expanded by the parser; formatting only reconstructs year runs. The 23-month example enumerates all months. | Render source ranges as ranges at all three calendar precisions. |
| Unspecified day / significant / exponential years | Weak assertions confirmed. Significant digits also assert `1950`, so “only nonempty” slightly overstates that case. | Pin `some day in April 1985`, `1950 (century precision: 1900s)`, and a reviewed large-year rendering plus its exact parsed value. |
| Open marker plus closed range | Confirmed in both parser and serializers. `compactYearRanges` can turn valid input into the malformed spelling. | Fix every producer and reject malformed core literals. |
| Canonical set example | Both core formatting and natural parsing compact adjacent enumerated years. This behavior is documented and directly tested. | Change the representation contract per the user's decision; test spelling and semantics separately. |
| Prefix/suffix qualifiers | Exact pass-through explains `~1950` versus `~ 1950`; misleading comments are confirmed. Dual-side prohibition is not established by the cited current prose. | Normalize approved natural forms by semantic scope; specify strict-mode treatment with sources. |
| Seasons / qualified members | Accepted today. The historical BNF supports both; current-profile interoperability needs explicit documentation. | Retain support and add the requested strict/extended distinction without calling all historical support invalid. |
| Bare small years | Confirmed: `5` and `90` become early CE with confidence 0.95 and `ambiguous: false`. | Apply the approved explicit-year requirement. |
| Month plus small number | Confirmed: `March 5` has both day and year-5 candidates. Bare `January` has no competing numeric token, so that alone is not a logical inconsistency. | Remove the unwanted historical alternative when a valid month/day reading exists. |
| Open-ended asymmetry | Confirmed for the “and” pair. `before`/`after` already mirror one another, as do `until`/`since`. | Fix the broken pair; preserve exclusion/inclusion and choice/interval distinctions. |
| Age results | Confirmed degenerate interval and inconsistent result types. Component prefixes also carry undocumented application meaning in core age rendering. | Coordinate date/set output, metadata, and certainty consumers. |
| Weekday mismatch | Confirmed deliberate constraint, not a calendar calculation bug. | Follow the chosen strict/warning policy. |
| Locale fixtures | Confirmed awkward open phrasing, capitalized Spanish/French seasons, and `depuis … à …`. | Review natural phrasing first, then update renderer, parsers, fixtures, and generated docs. |
| All years except 1669 | This is a useful gap-preservation edge case despite the awkward prose and invalid spelling. | Keep the semantic test in valid syntax; use clearer examples in user-facing docs. |
| Items reported correct | No proposed semantic change to season codes, BCE arithmetic, leap handling, obsolete-syntax rejection, or calendar validation. | Preserve the existing regression suites; do not treat this targeted review as independent verification of every such claim. |

**Ordered implementation tasks.** P0 establishes trustworthy tests and stops malformed output. P1 changes public behavior and needs migration notes. P2 improves language and documentation. Checked tasks are implemented and verified.

1. [x] **P0 — Make formatting tests fail on parse failure.**

   Primary file: `packages/core/tests/format-compliance.test.ts`. Introduce a small throwing parse helper with the input and parse errors in the failure message. Replace all 27 conditional assertion blocks. Select explicit locale/options for exact strings. Separate readable-output tests from actual conformance cases in `tests/parser/spec-compliance.test.ts` and `tests/conformance.test.ts`.

   Acceptance: a rejected fixture fails the test; `-1985` renders `1986 BC` by default and `1986 BCE` with that option; unspecified day retains both uncertainty of day and known month/year. For `Y-17E7`, assert parsed year `-170000000` and the reviewed display `170.0 million BC`. That display is rounded: it must not become an oracle for exact BCE arithmetic. Significant-digit tests check the estimate and represented precision, not just text length. Remove comments that permit arbitrary historical-year conventions.

2. [x] **P0 — Repair collection serialization and reject chained open/range syntax.**

   Files: `packages/core/src/parser/level2.ts`, `packages/core/src/collections.ts`, `packages/natural/src/semantics.ts`, and collection rules in `packages/natural/src/shared.ne`. Cover both direct core input and natural output. Open markers must attach to a single boundary value; do not strip a marker and then accept another range on that same element. Apply equivalent checks to lists, which share parsing code.

   Preserve valid `[..1667,1668,1670..]`. Never serialize it as `[..1667..1668,1670..]`. A natural phrase explicitly denoting “1667 or earlier, plus 1667 through 1668, or 1670 or later” may resolve to the equivalent `[..1668,1670..]`. Such absorption is for overlapping open coverage, not a reason to compact unrelated enumerations. Also cover trailing forms (`a..b..`), both-open forms, misplaced open elements, mixed precisions, descending ranges, leap days, and BCE boundaries. Preserve gaps and set/list meaning; do not use min/max alone as an equivalence check.

   Acceptance: malformed literal cases fail in core and natural literal pass-through. Every generated collection has independent expected syntax as well as a successful parse. The explicit `compactYearRanges` utility never emits chained syntax and remains idempotent. Old malformed spellings are not added as an extension without a separate migration decision.

3. [x] **P1 — Preserve enumeration and explicit range structure through rendering.**

   Files: `packages/core/src/collections.ts`, `formatters.ts`, `localized-format.ts`; `packages/natural/src/parser-factory.ts`; collection and locale round-trip tests. Stop automatically invoking `compactYearRanges` for natural results. Replace rendering based on inferred adjacent-year runs with shared handling of source collection elements, retaining an explicit range's endpoints and precision. Initially preserve the public expanded `values` representation to avoid an unnecessary public data-model change.

   Acceptance: `[1667,1668,1670..1672]` renders with the first two years enumerated and the last member as a range, then parses to that same structure. “All of: 1670, 1671, 1672” produces `{1670,1671,1672}`. “One of: 1670 through 1672” produces `[1670..1672]`. `[2025-01..2026-11]` renders `One of: January 2025 through November 2026`; explicit short day/month ranges also remain ranges. Separate tests verify literal spelling, natural structure, explicit compaction, and semantic equivalence. Remove `compactYearRanges` from ordinary round-trip expected values.

4. [x] **P1 — Introduce the strict/extended parsing contract and extension documentation.**

   Files: `packages/core/src/parser.ts`, `types/index.ts`, `fuzzy-date/index.ts`; natural parser options and all language entry points; `docs/api/core.md`, `docs/api/natural.md`, interval/collection type docs, and package READMEs. Preserve existing positional `parse(input, level)` calls; design an additive options overload with level and conformance mode. Keep extended support as the compatibility default. A maximum EDTF level and an extension policy are separate controls.

   Acceptance: strict checks run recursively on endpoints and collection members and cannot be bypassed by natural literal pass-through or generated candidates. Report an unsupported feature with its location. Document season endpoints, qualified seasons, season collection members, and qualified date members separately rather than assuming one permission implies all combinations. Do not invent calendar-date replacements for season endpoints.

   Before fixing the strict allowlist, record the current normative basis for each restriction. Qualified collection members have positive historical grammar evidence; they should not be excluded solely on the consultant's assertion. If current-profile evidence cannot resolve a combination, retain it in extended mode and clearly identify any conservative strict exclusion as this library's interoperability policy. Do not advertise complete formal ISO validation from this review alone.

5. [x] **P1 — Normalize natural qualifier output without changing scope.**

   Approved behavior: `~1950` and `~ 1950` both produce `1950~`; `~1984?` produces `1984%`. Core retains original spelling for accepted inputs. Update pass-through documentation and incorrect “Normalized to Level 1 suffix format” comments.

   Files: `packages/natural/src/parser-factory.ts`, qualifier helpers in `shared.ne` / `semantic-helpers.ts`, core qualification parser and formatter coverage. Resolve effective qualification for each component before simplifying. Never globally move a prefix to the end of a full date: `~2004-06` qualifies only the year, while `2004-06~` also qualifies the month. Test overlapping group qualifiers, individual prefixes, `%`, all-known and partly-known components, and canonicalization idempotence. Avoid declaring every overlapping qualifier invalid until the strict syntax rule is sourced.

6. [x] **P1 — Remove bare-small-year guesses and month/day noise.**

   Files: `packages/natural/src/shared.ne`, shared semantics and parser ranking; `short-year.test.ts`, `partial-dates.test.ts`, compatibility and language fixtures. Preserve token width and explicit era information until interpretation is chosen. Reject bare `5`, `79`, and `90`; accept `0005`, `0079`, `0090`, `5 CE`, and `79 BC`. Preserve three-digit historical years, apostrophe years, existing numeric-date window behavior, and contextual short range end years.

   Acceptance: `March 5` produces only `XXXX-03-05`, and `January 12` only `XXXX-01-12`; `January 0012` remains historical. Invalid month/day combinations must not silently fall back to early-CE years. Scope the restriction to bare numbers and competing month/day interpretations; do not silently change unambiguous complete-date, season-year, or three-digit-year rules.

   Update early-CE rendering where necessary: rejecting bare `5` would otherwise break rendering/parsing of `0005`, which currently displays as `5`. Include an era or preserve padding wherever the rendered text could be mistaken for a day. Add round trips for dates, months, collections, and BCE-to-CE ranges across all six locales. Confidence and `ambiguous` must describe the surviving candidates.

7. [x] **P1 — Make open-ended phrasing symmetric while preserving meaning.**

   Files: boundary and collection productions in `shared.ne`, helpers in `semantics.ts`, interval/collection tests, multilingual fixtures, and generated examples. “1870 and earlier” becomes `../1870`; “1930 and after” remains `1930/..`. “1870 or earlier/later” remains a choice with inclusive cutoff. Explicit “All of” continues to mean an inclusive list even when its members are open-ended.

   Acceptance: `before X` / `after X` remain exclusive choices by shifting one calendar unit; `until X` / `since X` remain inclusive intervals. Exercise year/month/day precision and date arithmetic across leap days and year zero. Distinguish open from unknown endpoints. Do not reinterpret explicit set/list prefixes using standalone conjunction rules.

8. [x] **P1 — Use date/set birth-date results and move derivation out of qualifiers.**

   Files: `packages/natural/src/age-parser.ts`, `packages/core/src/age-birthday.ts`, age result types, age tests, fixtures, and API docs. Represent one possible birth day as a `date`, a bounded group of possible days as a `set`, and an open age cutoff as an open choice. Preserve genuine approximation/uncertainty supplied by the user; derive uncertainty of which day was selected from the one-of structure. Keep source age, reference date, and known birthday components in result metadata instead of injecting `?` solely because a component was calculated.

   Acceptance with reference date June 1, 2025: “10 days” gives `2025-05-22`; “20 years old” gives `[2004-06-02..2005-06-01]`; “20 years old, March birthday” remains `[2005-03-01..2005-03-31]`. Retain completed-unit month/week calculations, leap-year birthday choices, clamping, age ranges, open ages, and impossible constraint rejection. Account for the existing refusal to encode an unbounded recurring birthday as a finite expression.

   Coordinate birthday extraction, certainty detection, and age rendering: they currently distinguish suffix qualifiers from equivalent component qualifications and sometimes inspect only `.uncertain`. Tests must compare effective qualification and birthday meaning, not internal placement. Approximate ages with known birthdays must preserve the exact known month/day. Do not generate qualified range endpoints such as `[a?..b?]` as a shortcut; retain explicit qualified choices when needed and permitted by the selected conformance policy. Record the public `interval` → `set` type change in migration notes.

9. [x] **P1 — Set the weekday conflict policy.**

   Approved behavior: strict rejection remains the default, with an optional mode returning the stated calendar date and a structured weekday-mismatch warning. Files: `packages/natural/src/semantics.ts`, `parser-factory.ts`, result/options types, and locale grammar tests. Propagate diagnostics through composed expressions and deduplication so warnings cannot disappear during ranking.

   Acceptance: matching weekdays succeed without warnings; “Monday, March 29, 1988” errors by default and, when warning mode is enabled, returns `1988-03-29` with the mismatch recorded. Do not silently adjust the date to a nearby Monday or suppress invalid calendar dates.

10. [x] **P2 — Replace captured locale prose with reviewed expected language.**

    Files: `packages/core/src/localized-format.ts`, English collection formatters, `packages/natural/src/languages/{en,es,fr}.ne`, locale vocabulary, and `tests/fixtures/languages.json`. Use lowercase Spanish/French seasons in ordinary phrases. Use `de 1870 à 1880` as the representative French interval. Keep old awkward strings only as clearly labeled lenient-input compatibility cases if desired.

    Describe each open boundary alongside its value, using an appropriate choice or inclusive-list conjunction; remove constructions such as `Antes o Una de estas fechas`. Review French typography and Spanish interval wording along with grammar. Keep a valid all-years-except-1669 case such as `{..1668,1670..}` in semantic regression coverage. Exact expected prose must be written independently of renderer output; round trips supplement language review, not replace it.

11. [x] **P2 — Refresh contracts, generated artifacts, and migration documentation.**

    Update both fixture sources and generators: `packages/natural/scripts/generate-examples.cjs`, `generate-compatibility.cjs`, `docs/guide/language-examples.md`, `compatibility-review.md`, and relevant READMEs. Rebuild grammars from `.ne` sources using `build:grammar`; do not hand-edit generated grammar JavaScript. Clearly distinguish conforming examples, supported interoperability features, and lenient natural inputs. Document the selected defaults and all changed strings/result types.

    Acceptance: exact reviewed rendering tests and natural fixtures agree across en-US, en-GB, es-ES, es-MX, fr-FR, and fr-CA. Strict and extended tests have explicit expectations, including rejection cases. Every returned `edtf`, `parsed.edtf`, `fuzzyDate.edtf`, result type, and diagnostic agrees. Spec fixtures come from cited rules/examples, not whatever the current parser accepts.

**Dependencies and validation.** Implement tasks 1–3 together before regenerating collection fixtures; they share the same source-structure problem. Establish task 4's policy before finalizing qualifier or age output that uses optional combinations. Task 6 requires its early-year rendering changes in the same change set. Task 8 must include core age consumers, not only string replacements. Finish locale wording before regenerating documentation. Run focused tests while implementing, then both package suites, type checks, grammar generation, package builds, and the docs build once the coordinated changes are complete. Preserve existing leap-day, BCE, obsolete-syntax, and impossible-date regression tests. Output equivalence must include discrete members, gaps, precision, qualifications, and collection kind; matching bounds alone is insufficient.

**Migration risk.** The main intentional compatibility changes are natural rejection of bare short years, preserved enumeration strings, removal of malformed collection literals, natural qualifier canonicalization, and age result types. Extended support remains the default for previously supported season/qualified-member combinations. Where strict EDTF cannot express a result, return an explicit unsupported-feature error instead of inventing replacement syntax.

**Implementation validation (2026-09-05).** All 826 core and 1,260 natural tests pass (2,086 total), including the new strict-profile, qualification-equivalence, source-structure, weekday-warning, and six-locale round-trip regressions. Core and natural type checks, ESM/CJS/declaration builds, 684 packaged-output checks, grammar generation, documentation generators, the VitePress build, and `git diff --check` pass. Vitest ran with fork workers to avoid a Node 24 worker-thread shutdown crash observed during an earlier run. The docs build emits a non-fatal mixed static/dynamic import chunking warning.

**Final strict-mode policy.** Qualified calendar members and overlapping left/right qualifications remain accepted; natural year-only qualifiers normalize. The optional strict interoperability profile excludes season interval endpoints, season collection members, and qualified seasons. Extended support remains the default. See [the shipped policy and migration guide](../../docs/guide/interoperability.md) for the API and examples.
