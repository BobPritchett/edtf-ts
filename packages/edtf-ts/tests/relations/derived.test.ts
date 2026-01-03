import { describe, it, expect } from 'vitest';
import type { Member } from '../../src/compare-types/member.js';
import { derived } from '../../src/relations/derived.js';

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

describe('Derived Relations - intersects', () => {
  it('returns YES when intervals meet', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(10n, 10n, 20n, 20n);
    expect(derived.intersects(a, b)).toBe('YES');
  });

  it('returns YES when intervals overlap', () => {
    const a = member(0n, 0n, 15n, 15n);
    const b = member(10n, 10n, 25n, 25n);
    expect(derived.intersects(a, b)).toBe('YES');
  });

  it('returns YES when one contains the other', () => {
    const a = member(0n, 0n, 30n, 30n);
    const b = member(10n, 10n, 20n, 20n);
    expect(derived.intersects(a, b)).toBe('YES');
  });

  it('returns YES when intervals are equal', () => {
    const a = member(0n, 0n, 20n, 20n);
    const b = member(0n, 0n, 20n, 20n);
    expect(derived.intersects(a, b)).toBe('YES');
  });

  it('returns NO when intervals are disjoint with gap', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(20n, 20n, 30n, 30n);
    expect(derived.intersects(a, b)).toBe('NO');
  });

  it('returns YES when ranges allow intersection', () => {
    const a = member(0n, 10n, 20n, 30n);
    const b = member(15n, 25n, 35n, 45n);
    // These ranges could overlap in multiple ways, so at least one Allen relation is possible
    expect(derived.intersects(a, b)).toBe('YES');
  });
});

describe('Derived Relations - disjoint', () => {
  it('returns YES when A is before B with gap', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(20n, 20n, 30n, 30n);
    expect(derived.disjoint(a, b)).toBe('YES');
  });

  it('returns YES when A is after B with gap', () => {
    const a = member(20n, 20n, 30n, 30n);
    const b = member(0n, 0n, 10n, 10n);
    expect(derived.disjoint(a, b)).toBe('YES');
  });

  it('returns NO when intervals overlap', () => {
    const a = member(0n, 0n, 15n, 15n);
    const b = member(10n, 10n, 25n, 25n);
    expect(derived.disjoint(a, b)).toBe('NO');
  });

  it('returns NO when intervals meet', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(10n, 10n, 20n, 20n);
    expect(derived.disjoint(a, b)).toBe('NO');
  });

  it('returns MAYBE when relationship is uncertain', () => {
    const a = member(0n, 10n, 20n, 30n);
    const b = member(15n, 25n, 35n, 45n);
    expect(derived.disjoint(a, b)).toBe('MAYBE');
  });
});

describe('Derived Relations - touches', () => {
  it('returns YES when A meets B', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(10n, 10n, 20n, 20n);
    expect(derived.touches(a, b)).toBe('YES');
  });

  it('returns YES when A is met by B', () => {
    const a = member(10n, 10n, 20n, 20n);
    const b = member(0n, 0n, 10n, 10n);
    expect(derived.touches(a, b)).toBe('YES');
  });

  it('returns NO when there is a gap', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(15n, 15n, 25n, 25n);
    expect(derived.touches(a, b)).toBe('NO');
  });

  it('returns NO when they overlap', () => {
    const a = member(0n, 0n, 15n, 15n);
    const b = member(10n, 10n, 25n, 25n);
    expect(derived.touches(a, b)).toBe('NO');
  });

  it('returns MAYBE when relationship is uncertain', () => {
    const a = member(0n, 0n, 8n, 12n);
    const b = member(8n, 12n, 20n, 20n);
    expect(derived.touches(a, b)).toBe('MAYBE');
  });
});

describe('Derived Relations - duringOrEqual', () => {
  it('returns YES when A is during B', () => {
    const a = member(10n, 10n, 15n, 15n);
    const b = member(0n, 0n, 30n, 30n);
    expect(derived.duringOrEqual(a, b)).toBe('YES');
  });

  it('returns YES when A starts B', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(0n, 0n, 20n, 20n);
    expect(derived.duringOrEqual(a, b)).toBe('YES');
  });

  it('returns YES when A finishes B', () => {
    const a = member(10n, 10n, 20n, 20n);
    const b = member(0n, 0n, 20n, 20n);
    expect(derived.duringOrEqual(a, b)).toBe('YES');
  });

  it('returns YES when A equals B', () => {
    const a = member(0n, 0n, 20n, 20n);
    const b = member(0n, 0n, 20n, 20n);
    expect(derived.duringOrEqual(a, b)).toBe('YES');
  });

  it('returns NO when A contains B', () => {
    const a = member(0n, 0n, 30n, 30n);
    const b = member(10n, 10n, 15n, 15n);
    expect(derived.duringOrEqual(a, b)).toBe('NO');
  });

  it('returns NO when A is before B', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(20n, 20n, 30n, 30n);
    expect(derived.duringOrEqual(a, b)).toBe('NO');
  });

  it('returns MAYBE when relationship is uncertain', () => {
    const a = member(8n, 12n, 18n, 22n);
    const b = member(0n, 10n, 20n, 30n);
    expect(derived.duringOrEqual(a, b)).toBe('MAYBE');
  });
});

describe('Derived Relations - containsOrEqual', () => {
  it('returns YES when A contains B', () => {
    const a = member(0n, 0n, 30n, 30n);
    const b = member(10n, 10n, 15n, 15n);
    expect(derived.containsOrEqual(a, b)).toBe('YES');
  });

  it('returns YES when A is started by B', () => {
    const a = member(0n, 0n, 20n, 20n);
    const b = member(0n, 0n, 10n, 10n);
    expect(derived.containsOrEqual(a, b)).toBe('YES');
  });

  it('returns YES when A is finished by B', () => {
    const a = member(0n, 0n, 20n, 20n);
    const b = member(10n, 10n, 20n, 20n);
    expect(derived.containsOrEqual(a, b)).toBe('YES');
  });

  it('returns YES when A equals B', () => {
    const a = member(0n, 0n, 20n, 20n);
    const b = member(0n, 0n, 20n, 20n);
    expect(derived.containsOrEqual(a, b)).toBe('YES');
  });

  it('returns NO when A is during B', () => {
    const a = member(10n, 10n, 15n, 15n);
    const b = member(0n, 0n, 30n, 30n);
    expect(derived.containsOrEqual(a, b)).toBe('NO');
  });

  it('returns NO when A is before B', () => {
    const a = member(0n, 0n, 10n, 10n);
    const b = member(20n, 20n, 30n, 30n);
    expect(derived.containsOrEqual(a, b)).toBe('NO');
  });

  it('returns MAYBE when relationship is uncertain', () => {
    const a = member(0n, 10n, 20n, 30n);
    const b = member(8n, 12n, 18n, 22n);
    expect(derived.containsOrEqual(a, b)).toBe('MAYBE');
  });
});
