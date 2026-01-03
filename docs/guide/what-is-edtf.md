# What is EDTF?

Extended Date/Time Format (EDTF) is a standardized format for representing dates and times that are uncertain, approximate, or otherwise complex. It was developed by the Library of Congress and is based on ISO 8601-2.

## The Problem

Traditional date formats like ISO 8601 work well for precise, known dates:

```
1985-04-12  (April 12, 1985)
```

But what about dates that are:
- **Uncertain**: "This artifact is possibly from 1984"
- **Approximate**: "This event happened around 1950"
- **Partially unknown**: "This occurred sometime in the 1990s"
- **Ranges**: "Active between 1940 and 1945"

These scenarios are common in:
- Museums and cultural heritage institutions
- Historical research and archives
- Genealogy and family history
- Academic databases
- Digital humanities projects

## The Solution

EDTF extends ISO 8601 to handle these complex date scenarios:

```typescript
'1984?'           // Uncertain: possibly 1984
'1950~'           // Approximate: circa 1950
'199X'            // Unspecified: sometime in the 1990s
'1940/1945'       // Interval: from 1940 to 1945
'2001-21'         // Season: Spring 2001
'[1667,1668]'     // Set: one of these years
```

## Conformance Levels

EDTF defines three conformance levels:

### Level 0: ISO 8601 Profile

Basic date and time representations:

```
1985-04-12                Complete date
1985-04                   Year and month
1985                      Year only
1964/2008                 Interval
1985-04-12T23:20:30Z      Date and time with timezone
```

### Level 1: Extensions

Adds uncertainty, approximation, and basic extensions:

```
1984?                     Uncertain
2004-06~                  Approximate
2004-06-11%               Uncertain and approximate
201X                      Unspecified digit
Y170000002                Extended year
2001-21                   Season (Spring)
../1985-04-12             Open-ended interval
```

### Level 2: Advanced Features

Complex expressions for specialized use:

```
Y-17E7                    Exponential year
1950S2                    Significant digits
[1667,1668,1670]          Set (one of)
{1667,1668,1670}          List (all of)
?2004-06-~11              Partial qualification
2001-33                   Quarter (Q1)
```

## Real-World Examples

### Museum Cataloging

```typescript
import { parse } from '@edtf-ts';

// Artifact with uncertain date
const pottery = parse('156X-12-25');
// "December 25, sometime in the 1560s"

// Painting from approximate period
const painting = parse('1887~');
// "circa 1887"
```

### Historical Research

```typescript
// Battle with known month but uncertain day
const battle = parse('1777-09-XX?');
// "Some day in September 1777 (uncertain)"

// Historical period
const renaissance = parse('1400/1600');
// Interval from 1400 to 1600
```

### Genealogy

```typescript
// Birth year approximation
const birth = parse('1850~');

// Death somewhere in a range
const death = parse('1920/1925');

// Marriage season
const marriage = parse('1875-21');
// Spring 1875
```

## Why Use EDTF?

1. **Standardization**: International standard maintained by Library of Congress
2. **Precision**: Express exactly what you know (and don't know) about a date
3. **Interoperability**: Share data consistently across systems and institutions
4. **Expressiveness**: Handle complex date scenarios that traditional formats can't
5. **Machine-readable**: Easy to parse and process programmatically
6. **Human-friendly**: Clear syntax that conveys meaning

## Specification

The full EDTF specification is maintained by the Library of Congress:

- [Official Specification (2019)](https://www.loc.gov/standards/datetime/)
- Based on [ISO 8601-2:2019](https://www.iso.org/standard/70908.html)

## Next Steps

- [Getting Started](./getting-started) - Install and use EDTF-TS
- [EDTF Levels](./edtf-levels) - Detailed breakdown of each conformance level
- [Examples](../examples/basic-usage) - See EDTF in action
