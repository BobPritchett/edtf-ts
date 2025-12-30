import { describe, it, expect } from 'vitest';
import { parse } from '@edtf-ts/core';
import { normalize } from '../../src/normalization/index.js';
import {
  evaluateRelation,
  evaluate,
  isBefore,
  isAfter,
  overlaps,
  contains,
  intersects,
} from '../../src/relations/evaluator.js';
import { allen } from '../../src/relations/allen.js';

describe('Evaluator - evaluateRelation', () => {
  it('evaluates relation between single-member shapes', () => {
    const a = normalize(parse('1985').value!);
    const b = normalize(parse('1990').value!);

    expect(evaluateRelation(a, b, allen.before, 'ANY', 'ANY')).toBe('YES');
  });

  it('evaluates relation between sets with ANY quantifier', () => {
    const a = normalize(parse('[1985, 1990]').value!);
    const b = normalize(parse('[1987, 1992]').value!);

    // ANY member of A before ANY member of B: 1985 before 1992 = YES
    expect(evaluateRelation(a, b, allen.before, 'ANY', 'ANY')).toBe('YES');
  });

  it('evaluates relation between sets with ALL quantifier', () => {
    const a = normalize(parse('[1985, 1990]').value!);
    const b = normalize(parse('[1987, 1992]').value!);

    // ALL members of A before ALL members of B: 1990 NOT before 1987 = NO
    expect(evaluateRelation(a, b, allen.before, 'ALL', 'ALL')).toBe('NO');
  });

  it('handles mixed quantifiers', () => {
    const a = normalize(parse('[1985, 1990]').value!);
    const b = normalize(parse('[2000, 2005]').value!);

    // ALL members of A before ANY member of B = YES
    expect(evaluateRelation(a, b, allen.before, 'ALL', 'ANY')).toBe('YES');
  });
});

describe('Evaluator - simple API', () => {
  it('isBefore works with simple dates', () => {
    const a = parse('1985').value!;
    const b = parse('1990').value!;

    expect(isBefore(a, b)).toBe('YES');
    expect(isBefore(b, a)).toBe('NO');
  });

  it('isAfter works with simple dates', () => {
    const a = parse('1990').value!;
    const b = parse('1985').value!;

    expect(isAfter(a, b)).toBe('YES');
    expect(isAfter(b, a)).toBe('NO');
  });

  it('overlaps works with intervals', () => {
    const a = parse('1985/1990').value!;
    const b = parse('1987/1992').value!;

    // 1985-1990 starts before 1987-1992 and ends during it
    expect(overlaps(a, b)).toBe('YES');
  });

  it('contains works with intervals', () => {
    const a = parse('1980/2000').value!;
    const b = parse('1985/1990').value!;

    expect(contains(a, b)).toBe('YES');
    expect(contains(b, a)).toBe('NO');
  });

  it('intersects works with any overlap', () => {
    const a = parse('1985/1990').value!;
    const b = parse('1987/1992').value!;

    expect(intersects(a, b)).toBe('YES');
  });

  it('intersects returns NO for disjoint intervals', () => {
    const a = parse('1985/1990').value!;
    const b = parse('2000/2005').value!;

    expect(intersects(a, b)).toBe('NO');
  });
});

describe('Evaluator - complex scenarios', () => {
  it('handles uncertain dates', () => {
    const a = parse('1985?').value!;
    const b = parse('1990').value!;

    // Uncertainty doesn't affect bounds, only metadata
    expect(isBefore(a, b)).toBe('YES');
  });

  it('handles approximate dates', () => {
    const a = parse('1985~').value!;
    const b = parse('1990').value!;

    // Approximation doesn't affect bounds, only metadata
    expect(isBefore(a, b)).toBe('YES');
  });

  it('handles unspecified digits', () => {
    const a = parse('198X').value!; // 1980-1989
    const b = parse('1995').value!;

    expect(isBefore(a, b)).toBe('YES');
  });

  it('handles open-ended intervals', () => {
    const a = parse('1985/..').value!;
    const b = parse('1990').value!;

    // Open end means A could extend forever, so NOT before B
    expect(isBefore(a, b)).toBe('NO');
  });

  it('handles unknown endpoints', () => {
    const a = parse('1985/').value!; // Unknown end
    const b = parse('1990').value!;

    expect(isBefore(a, b)).toBe('UNKNOWN');
  });

  it('handles sets with ANY quantifier (oneOf semantics)', () => {
    const a = parse('[1985, 1995]').value!;
    const b = parse('1990').value!;

    // Is ANY member of A before B? 1985 < 1990 = YES
    expect(isBefore(a, b, 'ANY')).toBe('YES');
  });

  it('handles sets with ALL quantifier (allOf semantics)', () => {
    const a = parse('[1985, 1995]').value!;
    const b = parse('1990').value!;

    // Are ALL members of A before B? 1995 NOT before 1990 = NO
    expect(isBefore(a, b, 'ALL')).toBe('NO');
  });

  it('handles nested set comparisons', () => {
    const a = parse('[1985, 1987]').value!;
    const b = parse('[1990, 1992]').value!;

    // ANY member of A before ANY member of B
    expect(isBefore(a, b, 'ANY')).toBe('YES');

    // ALL members of A before ALL members of B
    expect(isBefore(a, b, 'ALL')).toBe('YES');
  });

  it('handles year-month precision', () => {
    const a = parse('1985-04').value!;
    const b = parse('1985-05').value!;

    expect(isBefore(a, b)).toBe('YES');
  });

  it('handles full date precision', () => {
    const a = parse('1985-04-12').value!;
    const b = parse('1985-04-15').value!;

    expect(isBefore(a, b)).toBe('YES');
  });

  // Datetime with timezone (Level 2) not yet supported by parser
  // it('handles datetime precision', () => {
  //   const a = parse('1985-04-12T10:30Z').value!;
  //   const b = parse('1985-04-12T14:45Z').value!;
  //   expect(isBefore(a, b)).toBe('YES');
  // });

  it('handles seasons', () => {
    const a = parse('1985-21').value!; // Spring 1985
    const b = parse('1985-22').value!; // Summer 1985

    expect(isBefore(a, b)).toBe('YES');
  });

  it('handles mixed precision comparisons', () => {
    const a = parse('1985').value!; // Full year
    const b = parse('1985-04-12').value!; // Specific day

    // Year 1985 contains the day 1985-04-12
    expect(contains(a, b)).toBe('YES');
  });
});
