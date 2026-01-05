import { describe, it, expect } from 'vitest';
import type { Member } from '../../src/compare-types/member.js';
import { allen } from '../../src/relations/allen.js';

/**
 * Helper: Create a simple closed Member with precise bounds.
 */
function member(sMin: bigint, sMax: bigint, eMin: bigint, eMax: bigint): Member {
  return {
    sMin,
    sMax,
    eMin,
    eMax,
    startKind: 'closed',
    endKind: 'closed',
    precision: 'day',
  };
}

/**
 * Helper: Create a Member with open start.
 */
function openStart(eMin: bigint, eMax: bigint): Member {
  return {
    sMin: null,
    sMax: null,
    eMin,
    eMax,
    startKind: 'open',
    endKind: 'closed',
    precision: 'unknown',
  };
}

/**
 * Helper: Create a Member with open end.
 */
function openEnd(sMin: bigint, sMax: bigint): Member {
  return {
    sMin,
    sMax,
    eMin: null,
    eMax: null,
    startKind: 'closed',
    endKind: 'open',
    precision: 'unknown',
  };
}

/**
 * Helper: Create a Member with unknown start.
 */
function unknownStart(eMin: bigint, eMax: bigint): Member {
  return {
    sMin: null,
    sMax: null,
    eMin,
    eMax,
    startKind: 'unknown',
    endKind: 'closed',
    precision: 'unknown',
  };
}

/**
 * Helper: Create a Member with unknown end.
 */
function unknownEnd(sMin: bigint, sMax: bigint): Member {
  return {
    sMin,
    sMax,
    eMin: null,
    eMax: null,
    startKind: 'closed',
    endKind: 'unknown',
    precision: 'unknown',
  };
}

describe('Allen Relations - before', () => {
  it('returns YES when A definitely ends before B starts (gap)', () => {
    const a = member(0n, 0n, 10n, 10n); // [0-10]
    const b = member(20n, 20n, 30n, 30n); // [20-30]
    expect(allen.before(a, b)).toBe('YES');
  });

  it('returns NO when A definitely overlaps or is after B', () => {
    const a = member(20n, 20n, 30n, 30n); // [20-30]
    const b = member(0n, 0n, 10n, 10n); // [0-10]
    expect(allen.before(a, b)).toBe('NO');
  });

  it('returns MAYBE when ranges could allow before relationship', () => {
    const a = member(0n, 10n, 20n, 30n); // [0..10 - 20..30]
    const b = member(15n, 25n, 35n, 45n); // [15..25 - 35..45]
    expect(allen.before(a, b)).toBe('MAYBE');
  });

  it('returns UNKNOWN when A end is unknown', () => {
    const a = unknownEnd(0n, 0n);
    const b = member(20n, 20n, 30n, 30n);
    expect(allen.before(a, b)).toBe('UNKNOWN');
  });

  it('returns UNKNOWN when B start is unknown', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = unknownStart(20n, 30n);
    expect(allen.before(a, b)).toBe('UNKNOWN');
  });

  it('returns NO when A has open end', () => {
    const a = openEnd(0n, 0n);
    const b = member(20n, 20n, 30n, 30n);
    expect(allen.before(a, b)).toBe('NO');
  });

  it('returns YES when B has open start', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = openStart(20n, 30n);
    expect(allen.before(a, b)).toBe('YES');
  });
});

describe('Allen Relations - after', () => {
  it('is symmetric to before', () => {
    const a = member(20n, 20n, 30n, 30n);
    const b = member(0n, 0n, 10n, 10n);
    expect(allen.after(a, b)).toBe(allen.before(b, a));
  });
});

describe('Allen Relations - meets', () => {
  it('returns YES when A ends exactly where B starts (point match)', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(10n, 10n, 20n, 20n);
    expect(allen.meets(a, b)).toBe('YES');
  });

  it('returns NO when there is a gap', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(15n, 15n, 25n, 25n);
    expect(allen.meets(a, b)).toBe('NO');
  });

  it('returns NO when they overlap', () => {
    const a = member(0n, 0n, 15n, 15n);
    const b = member(10n, 10n, 20n, 20n);
    expect(allen.meets(a, b)).toBe('NO');
  });

  it('returns MAYBE when ranges could allow meeting', () => {
    const a = member(0n, 0n, 8n, 12n);
    const b = member(8n, 12n, 20n, 20n);
    expect(allen.meets(a, b)).toBe('MAYBE');
  });

  it('returns NO when A has open end', () => {
    const a = openEnd(0n, 0n);
    const b = member(10n, 10n, 20n, 20n);
    expect(allen.meets(a, b)).toBe('NO');
  });

  it('returns NO when B has open start', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = openStart(10n, 20n);
    expect(allen.meets(a, b)).toBe('NO');
  });

  it('returns UNKNOWN when required bounds are unknown', () => {
    const a = unknownEnd(0n, 0n);
    const b = member(10n, 10n, 20n, 20n);
    expect(allen.meets(a, b)).toBe('UNKNOWN');
  });
});

describe('Allen Relations - metBy', () => {
  it('is symmetric to meets', () => {
    const a = member(10n, 10n, 20n, 20n);
    const b = member(0n, 0n, 10n, 10n);
    expect(allen.metBy(a, b)).toBe(allen.meets(b, a));
  });
});

describe('Allen Relations - overlaps', () => {
  it('returns YES when A starts before B and ends during B', () => {
    const a = member(0n, 0n, 15n, 15n);
    const b = member(10n, 10n, 30n, 30n);
    expect(allen.overlaps(a, b)).toBe('YES');
  });

  it('returns NO when A starts after B starts', () => {
    const a = member(15n, 15n, 25n, 25n);
    const b = member(0n, 0n, 30n, 30n);
    expect(allen.overlaps(a, b)).toBe('NO');
  });

  it('returns NO when A ends before B starts', () => {
    const a = member(0n, 0n, 5n, 5n);
    const b = member(10n, 10n, 20n, 20n);
    expect(allen.overlaps(a, b)).toBe('NO');
  });

  it('returns NO when A ends after B ends', () => {
    const a = member(0n, 0n, 25n, 25n);
    const b = member(10n, 10n, 20n, 20n);
    expect(allen.overlaps(a, b)).toBe('NO');
  });

  it('returns YES when ranges definitely allow overlap', () => {
    const a = member(0n, 5n, 10n, 20n);
    const b = member(8n, 15n, 25n, 30n);
    // a.sMax=5 < b.sMin=8 (starts before) AND a.eMin=10 > b.sMin=8 AND a.eMax=20 < b.eMax=30 (ends during)
    expect(allen.overlaps(a, b)).toBe('YES');
  });

  it('returns NO when A has open start', () => {
    const a = openStart(15n, 15n);
    const b = member(10n, 10n, 30n, 30n);
    expect(allen.overlaps(a, b)).toBe('NO');
  });

  it('returns UNKNOWN when required bounds are unknown', () => {
    const a = unknownStart(15n, 15n);
    const b = member(10n, 10n, 30n, 30n);
    expect(allen.overlaps(a, b)).toBe('UNKNOWN');
  });
});

describe('Allen Relations - overlappedBy', () => {
  it('is symmetric to overlaps', () => {
    const a = member(10n, 10n, 30n, 30n);
    const b = member(0n, 0n, 15n, 15n);
    expect(allen.overlappedBy(a, b)).toBe(allen.overlaps(b, a));
  });
});

describe('Allen Relations - starts', () => {
  it('returns YES when both start together and A ends first', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(0n, 0n, 20n, 20n);
    expect(allen.starts(a, b)).toBe('YES');
  });

  it('returns NO when they don\'t start together', () => {
    const a = member(5n, 5n, 10n, 10n);
    const b = member(0n, 0n, 20n, 20n);
    expect(allen.starts(a, b)).toBe('NO');
  });

  it('returns NO when A ends after or with B', () => {
    const a = member(0n, 0n, 25n, 25n);
    const b = member(0n, 0n, 20n, 20n);
    expect(allen.starts(a, b)).toBe('NO');
  });

  it('returns YES when ranges definitely allow starts relationship', () => {
    const a = member(0n, 5n, 8n, 12n);
    const b = member(0n, 5n, 15n, 20n);
    // Starts overlap: !(sMax < sMin || sMin > sMax) = !(5 < 0 || 0 > 5) = true
    // A ends first: a.eMax=12 < b.eMin=15 = true
    expect(allen.starts(a, b)).toBe('YES');
  });

  it('returns YES when both have open start and A has closed end while B has open end', () => {
    const a = {
      sMin: null,
      sMax: null,
      eMin: 10n,
      eMax: 10n,
      startKind: 'open' as const,
      endKind: 'closed' as const,
      precision: 'unknown' as const,
    };
    const b = {
      sMin: null,
      sMax: null,
      eMin: null,
      eMax: null,
      startKind: 'open' as const,
      endKind: 'open' as const,
      precision: 'unknown' as const,
    };
    expect(allen.starts(a, b)).toBe('YES');
  });

  it('returns UNKNOWN when required bounds are unknown', () => {
    const a = unknownStart(10n, 10n);
    const b = member(0n, 0n, 20n, 20n);
    expect(allen.starts(a, b)).toBe('UNKNOWN');
  });
});

describe('Allen Relations - startedBy', () => {
  it('is symmetric to starts', () => {
    const a = member(0n, 0n, 20n, 20n);
    const b = member(0n, 0n, 10n, 10n);
    expect(allen.startedBy(a, b)).toBe(allen.starts(b, a));
  });
});

describe('Allen Relations - during', () => {
  it('returns YES when A is completely within B', () => {
    const a = member(10n, 10n, 15n, 15n);
    const b = member(0n, 0n, 30n, 30n);
    expect(allen.during(a, b)).toBe('YES');
  });

  it('returns NO when A starts before B', () => {
    const a = member(0n, 0n, 15n, 15n);
    const b = member(5n, 5n, 30n, 30n);
    expect(allen.during(a, b)).toBe('NO');
  });

  it('returns NO when A ends after B', () => {
    const a = member(10n, 10n, 35n, 35n);
    const b = member(0n, 0n, 30n, 30n);
    expect(allen.during(a, b)).toBe('NO');
  });

  it('returns NO when A has open bounds', () => {
    const a = openEnd(10n, 10n);
    const b = member(0n, 0n, 30n, 30n);
    expect(allen.during(a, b)).toBe('NO');
  });

  it('returns YES when B is fully unbounded', () => {
    const a = member(10n, 10n, 15n, 15n);
    const b = {
      sMin: null,
      sMax: null,
      eMin: null,
      eMax: null,
      startKind: 'open' as const,
      endKind: 'open' as const,
      precision: 'unknown' as const,
    };
    expect(allen.during(a, b)).toBe('YES');
  });

  it('returns MAYBE when ranges could allow during relationship', () => {
    const a = member(8n, 12n, 18n, 22n);
    const b = member(0n, 10n, 20n, 30n);
    expect(allen.during(a, b)).toBe('MAYBE');
  });

  it('returns UNKNOWN when required bounds are unknown', () => {
    const a = unknownStart(15n, 15n);
    const b = member(0n, 0n, 30n, 30n);
    expect(allen.during(a, b)).toBe('UNKNOWN');
  });
});

describe('Allen Relations - contains', () => {
  it('is symmetric to during', () => {
    const a = member(0n, 0n, 30n, 30n);
    const b = member(10n, 10n, 15n, 15n);
    expect(allen.contains(a, b)).toBe(allen.during(b, a));
  });
});

describe('Allen Relations - finishes', () => {
  it('returns YES when both end together and A starts later', () => {
    const a = member(10n, 10n, 20n, 20n);
    const b = member(0n, 0n, 20n, 20n);
    expect(allen.finishes(a, b)).toBe('YES');
  });

  it('returns NO when they don\'t end together', () => {
    const a = member(10n, 10n, 15n, 15n);
    const b = member(0n, 0n, 20n, 20n);
    expect(allen.finishes(a, b)).toBe('NO');
  });

  it('returns NO when A starts before or with B', () => {
    const a = member(0n, 0n, 20n, 20n);
    const b = member(5n, 5n, 20n, 20n);
    expect(allen.finishes(a, b)).toBe('NO');
  });

  it('returns YES when ranges definitely allow finishes relationship', () => {
    const a = member(8n, 12n, 18n, 22n);
    const b = member(0n, 5n, 18n, 22n);
    // Ends overlap: !(eMax < eMin || eMin > eMax) = !(22 < 18 || 18 > 22) = true
    // A starts later: a.sMin=8 > b.sMax=5 = true
    expect(allen.finishes(a, b)).toBe('YES');
  });

  it('returns YES when both have open end and A has closed start', () => {
    const a = {
      sMin: 10n,
      sMax: 10n,
      eMin: null,
      eMax: null,
      startKind: 'closed' as const,
      endKind: 'open' as const,
      precision: 'unknown' as const,
    };
    const b = openEnd(null as any, null as any);
    b.sMin = null;
    b.sMax = null;
    b.startKind = 'open';
    expect(allen.finishes(a, b)).toBe('YES');
  });

  it('returns UNKNOWN when required bounds are unknown', () => {
    const a = unknownEnd(10n, 10n);
    const b = member(0n, 0n, 20n, 20n);
    expect(allen.finishes(a, b)).toBe('UNKNOWN');
  });
});

describe('Allen Relations - finishedBy', () => {
  it('is symmetric to finishes', () => {
    const a = member(0n, 0n, 20n, 20n);
    const b = member(10n, 10n, 20n, 20n);
    expect(allen.finishedBy(a, b)).toBe(allen.finishes(b, a));
  });
});

describe('Allen Relations - equals', () => {
  it('returns YES when all bounds match exactly', () => {
    const a = member(0n, 0n, 20n, 20n);
    const b = member(0n, 0n, 20n, 20n);
    expect(allen.equals(a, b)).toBe('YES');
  });

  it('returns NO when bound kinds don\'t match', () => {
    const a = member(0n, 0n, 20n, 20n);
    const b = openEnd(0n, 0n);
    expect(allen.equals(a, b)).toBe('NO');
  });

  it('returns YES when both fully unbounded', () => {
    const a = {
      sMin: null,
      sMax: null,
      eMin: null,
      eMax: null,
      startKind: 'open' as const,
      endKind: 'open' as const,
      precision: 'unknown' as const,
    };
    const b = {
      sMin: null,
      sMax: null,
      eMin: null,
      eMax: null,
      startKind: 'open' as const,
      endKind: 'open' as const,
      precision: 'unknown' as const,
    };
    expect(allen.equals(a, b)).toBe('YES');
  });

  it('returns NO when bounds don\'t overlap', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(20n, 20n, 30n, 30n);
    expect(allen.equals(a, b)).toBe('NO');
  });

  it('returns YES when ranges are identical', () => {
    const a = member(0n, 5n, 18n, 22n);
    const b = member(0n, 5n, 18n, 22n);
    // All bounds match exactly - the ranges are equal
    expect(allen.equals(a, b)).toBe('YES');
  });

  it('returns UNKNOWN when required bounds are unknown', () => {
    const a = unknownStart(20n, 20n);
    const b = member(0n, 0n, 20n, 20n);
    expect(allen.equals(a, b)).toBe('UNKNOWN');
  });
});
