# Changelog

Release notes for `@edtf-ts/core` and `@edtf-ts/natural`. Both packages use the same release version.

## 0.6.0 — Unreleased

This is the next planned release. The currently published npm version is 0.5.0.

### Breaking changes for callers

Existing exports and required call arguments remain available, but these cases need attention before upgrading:

- Datetime interval endpoints are now rejected. `FuzzyDate.parse()` throws; core `parse()` and `FuzzyDate.from()` return failure results. Standalone `Date.toISOString()` input remains accepted by default.
- `compare()` / `.compareTo()` now return `number | 'UNKNOWN'`. Numeric TypeScript callers need a guard. Sorting helpers throw when mixing timezone-qualified timestamps with calendar dates or timezone-free datetimes.
- Natural parser `locale` now selects the input language; unsupported languages throw. Use `language: 'en'` for English input with a different regional locale.
- Age-derived birthdates can now be sets. Callers assuming interval endpoints must inspect the result type. Natural result interfaces also gain required fields and broader type unions, affecting handwritten objects, mocks, and exhaustive switches.
- Custom relation callbacks reject symbolic open date choices. Unbounded ages combined with recurring birthdays require a finite age range.

See the [migration guide](https://bobpritchett.github.io/edtf-ts/guide/semantics-migration) for examples and adaptations. Parsing-result and display changes are described separately there.

### Added

- French natural language parsing and dedicated English, Spanish, and French entry points.
- Localized date and age/birthday formatting, with shared language examples and compatibility documentation.
- Optional strict interoperability checks, natural parsing policies, structured outcomes, and diagnostics.
- Canonicalization, bounded enumeration, date operations, and relation summaries in the core API.

### Changed

- Preserve explicit collection members and ranges when parsing and formatting.
- Improve interval, qualification, unspecified date, short year, and age/birthday handling.
- Use the core package version for the documentation navigation and exported `VERSION` constant.

### Fixed

- Preserve ISO fractional seconds (1–3 digits) in parsing, bounds, comparisons, JSON, and formatting. The 0.5.0 parser accepted fractions but ignored them in bounds and ISO formatting. The default extended profile also accepts signed six-digit ISO datetime years, covering `Date.toISOString()` throughout the native `Date` range; strict mode excludes these extensions. More than three fractional digits remain unsupported.
- Document regional language fallback and measured bundle sizes; add an English YMD playground example (`en-ZA`) and a repeatable bundle measurement command.
- Remove references to the missing logo and contributing guide; serve this changelog within the documentation site.
- Repair links to missing guide/example pages and enable documentation build checks for dead links.
- Fix documentation CI's Node/pnpm incompatibility by using Node 24 and pinning pnpm 11.19.0.
- Build documentation once, after package builds, type checks, and tests; rebuild it when package sources or release metadata change.

### Upgrade notes

Parsing and formatting corrections can change results for ambiguous or previously accepted expressions. Review the [semantics and language migration guide](https://bobpritchett.github.io/edtf-ts/guide/semantics-migration), [interoperability guide](https://bobpritchett.github.io/edtf-ts/guide/interoperability), and [natural parsing policies](https://bobpritchett.github.io/edtf-ts/guide/parsing-policies) when upgrading.

## 0.5.0

- Added reference-date options for natural language parsing and age calculations.
- Updated EDTF compliance documentation and tests, and improved documentation and error messages.

See the [v0.5.0 source snapshot](https://github.com/BobPritchett/edtf-ts/tree/v0.5.0) and [changes since v0.4.0](https://github.com/BobPritchett/edtf-ts/compare/v0.4.0...v0.5.0). This summary includes the intervening 0.4.x work; earlier releases did not maintain a changelog.
