---
title: Interactive Playground
---

# Interactive Playground

Try parsing EDTF strings in real-time. Select an example or type your own EDTF string to see how it's parsed.

<EDTFPlayground />

## What Can You Try?

### Level 0 (ISO 8601 Profile)

```
1985-04-12                Complete date
1985-04                   Year and month
1985                      Year only
1964/2008                 Interval
1985-04-12T23:20:30Z      DateTime with timezone
```

### Level 1 (Extensions)

```
1984?                     Uncertain year
2004-06~                  Approximate month
2004-06-11%               Uncertain and approximate
201X                      Unspecified digit (decade)
19XX                      Unspecified digits (century)
2004-XX                   Unspecified month
Y170000002                Extended year (5+ digits)
2001-21                   Season (Spring 2001)
../1985-04-12             Open-start interval
1985-04-12/..             Open-end interval
```

### Level 2 (Advanced Features)

```
Y-17E7                    Exponential year
1950S2                    Significant digits
[1667,1668,1670]          Set (one of)
{1667,1668,1670}          List (all of)
?2004-06-~11              Partial qualification
2001-33                   Quarter (Q1)
[..1760-12]               Open set (earlier)
[1760-12..]               Open set (later)
```

## Understanding the Output

### Type

The type of EDTF value:
- **Date**: Simple date (year, month, day)
- **DateTime**: Date with time
- **Interval**: Range between two dates
- **Season**: Seasonal date
- **Set**: One of multiple dates
- **List**: All of multiple dates

### Level

The EDTF conformance level:
- **0**: ISO 8601 profile
- **1**: Basic extensions (uncertainty, approximation)
- **2**: Advanced features (sets, lists, partial qualification)

### Precision

The precision of the date:
- **year**: Only year specified
- **month**: Year and month specified
- **day**: Complete date specified
- **second**: DateTime with seconds

### Date Range (min/max)

Every EDTF value has a minimum and maximum possible date:
- **min**: Earliest possible date this value could represent
- **max**: Latest possible date this value could represent

For example, `199X` (the 1990s):
- min: `1990-01-01T00:00:00.000Z`
- max: `1999-12-31T23:59:59.999Z`

### Qualifications

#### Whole Date Qualifications
- **Uncertain (?)**: The date might not be accurate
- **Approximate (~)**: The date is estimated
- **Uncertain & Approximate (%)**: Both uncertain and approximate

#### Partial Qualifications (Level 2)
Different parts of a date can have different qualifications:
- `?2004-06-~11`: Year is uncertain, day is approximate
- `2004-~06-11`: Only the month is approximate

## Examples by Use Case

### Cultural Heritage

```
156X-12-25                Artifact from 1560s
1887~                     Painting circa 1887
1777-09-XX?               Battle sometime in September 1777 (uncertain)
```

### Historical Research

```
1400/1600                 Renaissance period
1939-09-01/1945-05-08     World War II
Y-17E7                    17 million years ago
```

### Genealogy

```
1850~                     Birth circa 1850
1920/1925                 Death between 1920-1925
1875-21                   Marriage in Spring 1875
```

### Archives

```
19XX-04                   Letter from April, 20th century
2004-XX                   Document from some month in 2004
[1667,1668,1670]          Manuscript from one of these years
```

## Learn More

- [EDTF Specification](https://www.loc.gov/standards/datetime/) - Official standard
- [Getting Started](./guide/getting-started) - Installation and usage
- [API Reference](./api/core) - Full documentation
- [Examples](./examples/basic-usage) - Code examples
