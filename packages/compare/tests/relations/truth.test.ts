import { describe, it, expect } from 'vitest';
import { combineWithAny, combineWithAll, negate, and, or } from '../../src/relations/truth.js';
import type { Truth } from '../../src/types/truth.js';

describe('Truth combinators - combineWithAny', () => {
  it('returns YES if any value is YES', () => {
    expect(combineWithAny(['YES', 'NO', 'MAYBE'])).toBe('YES');
    expect(combineWithAny(['NO', 'MAYBE', 'YES'])).toBe('YES');
    expect(combineWithAny(['YES'])).toBe('YES');
  });

  it('returns UNKNOWN if no YES but has UNKNOWN', () => {
    expect(combineWithAny(['NO', 'UNKNOWN', 'MAYBE'])).toBe('UNKNOWN');
    expect(combineWithAny(['UNKNOWN', 'NO'])).toBe('UNKNOWN');
    expect(combineWithAny(['UNKNOWN'])).toBe('UNKNOWN');
  });

  it('returns MAYBE if no YES/UNKNOWN but has MAYBE', () => {
    expect(combineWithAny(['NO', 'MAYBE', 'NO'])).toBe('MAYBE');
    expect(combineWithAny(['MAYBE'])).toBe('MAYBE');
  });

  it('returns NO if all values are NO', () => {
    expect(combineWithAny(['NO', 'NO', 'NO'])).toBe('NO');
    expect(combineWithAny(['NO'])).toBe('NO');
  });

  it('handles empty array', () => {
    expect(combineWithAny([])).toBe('NO');
  });
});

describe('Truth combinators - combineWithAll', () => {
  it('returns NO if any value is NO', () => {
    expect(combineWithAll(['YES', 'NO', 'MAYBE'])).toBe('NO');
    expect(combineWithAll(['NO', 'YES', 'MAYBE'])).toBe('NO');
    expect(combineWithAll(['NO'])).toBe('NO');
  });

  it('returns UNKNOWN if no NO but has UNKNOWN', () => {
    expect(combineWithAll(['YES', 'UNKNOWN', 'MAYBE'])).toBe('UNKNOWN');
    expect(combineWithAll(['UNKNOWN', 'YES'])).toBe('UNKNOWN');
    expect(combineWithAll(['UNKNOWN'])).toBe('UNKNOWN');
  });

  it('returns MAYBE if no NO/UNKNOWN but has MAYBE', () => {
    expect(combineWithAll(['YES', 'MAYBE', 'YES'])).toBe('MAYBE');
    expect(combineWithAll(['MAYBE'])).toBe('MAYBE');
  });

  it('returns YES if all values are YES', () => {
    expect(combineWithAll(['YES', 'YES', 'YES'])).toBe('YES');
    expect(combineWithAll(['YES'])).toBe('YES');
  });

  it('handles empty array', () => {
    expect(combineWithAll([])).toBe('YES');
  });
});

describe('Truth combinators - negate', () => {
  it('negates YES to NO', () => {
    expect(negate('YES')).toBe('NO');
  });

  it('negates NO to YES', () => {
    expect(negate('NO')).toBe('YES');
  });

  it('preserves MAYBE', () => {
    expect(negate('MAYBE')).toBe('MAYBE');
  });

  it('preserves UNKNOWN', () => {
    expect(negate('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('Truth combinators - and', () => {
  it('returns YES only if both are YES', () => {
    expect(and('YES', 'YES')).toBe('YES');
  });

  it('returns NO if either is NO', () => {
    expect(and('YES', 'NO')).toBe('NO');
    expect(and('NO', 'YES')).toBe('NO');
    expect(and('NO', 'NO')).toBe('NO');
  });

  it('returns UNKNOWN if either is UNKNOWN (and neither is NO)', () => {
    expect(and('YES', 'UNKNOWN')).toBe('UNKNOWN');
    expect(and('UNKNOWN', 'YES')).toBe('UNKNOWN');
    expect(and('MAYBE', 'UNKNOWN')).toBe('UNKNOWN');
  });

  it('returns MAYBE if either is MAYBE (and neither is NO/UNKNOWN)', () => {
    expect(and('YES', 'MAYBE')).toBe('MAYBE');
    expect(and('MAYBE', 'YES')).toBe('MAYBE');
    expect(and('MAYBE', 'MAYBE')).toBe('MAYBE');
  });
});

describe('Truth combinators - or', () => {
  it('returns YES if either is YES', () => {
    expect(or('YES', 'NO')).toBe('YES');
    expect(or('NO', 'YES')).toBe('YES');
    expect(or('YES', 'YES')).toBe('YES');
  });

  it('returns NO only if both are NO', () => {
    expect(or('NO', 'NO')).toBe('NO');
  });

  it('returns UNKNOWN if either is UNKNOWN (and neither is YES)', () => {
    expect(or('NO', 'UNKNOWN')).toBe('UNKNOWN');
    expect(or('UNKNOWN', 'NO')).toBe('UNKNOWN');
    expect(or('MAYBE', 'UNKNOWN')).toBe('UNKNOWN');
  });

  it('returns MAYBE if either is MAYBE (and neither is YES/UNKNOWN)', () => {
    expect(or('NO', 'MAYBE')).toBe('MAYBE');
    expect(or('MAYBE', 'NO')).toBe('MAYBE');
    expect(or('MAYBE', 'MAYBE')).toBe('MAYBE');
  });
});

describe('Truth combinators - complex combinations', () => {
  it('handles nested ANY/ALL combinations', () => {
    // ANY([ALL([YES, YES]), ALL([YES, NO])]) = ANY([YES, NO]) = YES
    const inner1 = combineWithAll(['YES', 'YES']);
    const inner2 = combineWithAll(['YES', 'NO']);
    expect(combineWithAny([inner1, inner2])).toBe('YES');
  });

  it('handles UNKNOWN propagation in nested combinations', () => {
    // ALL([ANY([YES, NO]), ANY([UNKNOWN, NO])]) = ALL([YES, UNKNOWN]) = UNKNOWN
    const inner1 = combineWithAny(['YES', 'NO']);
    const inner2 = combineWithAny(['UNKNOWN', 'NO']);
    expect(combineWithAll([inner1, inner2])).toBe('UNKNOWN');
  });

  it('handles MAYBE propagation in nested combinations', () => {
    // ANY([ALL([YES, MAYBE]), ALL([NO, MAYBE])]) = ANY([MAYBE, NO]) = MAYBE
    const inner1 = combineWithAll(['YES', 'MAYBE']);
    const inner2 = combineWithAll(['NO', 'MAYBE']);
    expect(combineWithAny([inner1, inner2])).toBe('MAYBE');
  });
});
