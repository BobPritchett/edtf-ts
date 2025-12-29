import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Bug Fixes', () => {
  it('should parse dates with commas (April 12, 1985)', () => {
    const results = parseNatural('April 12, 1985');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1985-04-12');
  });

  it('should parse "One of: 1985, 1987"', () => {
    const results = parseNatural('One of: 1985, 1987');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('[1985,1987]');
    expect(results[0].type).toBe('set');
  });

  it('should parse "All of: 1985, 1987"', () => {
    const results = parseNatural('All of: 1985, 1987');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('{1985,1987}');
    expect(results[0].type).toBe('list');
  });
});

describe('Qualified Dates', () => {
  it('should parse "1984 (uncertain)"', () => {
    const results = parseNatural('1984 (uncertain)');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1984?');
  });

  it('should parse "1950 (approximate)"', () => {
    const results = parseNatural('1950 (approximate)');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1950~');
  });

  it('should parse "2004 (uncertain/approximate)"', () => {
    const results = parseNatural('2004 (uncertain/approximate)');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2004%');
  });

  it('should parse "June 11, 2004 (year uncertain, day approximate)"', () => {
    const results = parseNatural('June 11, 2004 (year uncertain, day approximate)');
    expect(results.length).toBeGreaterThan(0);
    // Partial qualifications should be properly encoded
    expect(results[0].edtf).toBe('?2004-06-~11');
  });

  it('should parse "2004 (year approximate)"', () => {
    const results = parseNatural('2004 (year approximate)');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('~2004');
  });

  it('should parse "January 2004 (month uncertain)"', () => {
    const results = parseNatural('January 2004 (month uncertain)');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('2004-?01');
  });

  it('should parse "June 2004 (year uncertain, month approximate)"', () => {
    const results = parseNatural('June 2004 (year uncertain, month approximate)');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('?2004-~06');
  });
});

describe('EDTF Pass-through', () => {
  it('should accept valid EDTF: 19X4', () => {
    const results = parseNatural('19X4');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('19X4');
    expect(results[0].confidence).toBe(1.0);
  });

  it('should accept valid EDTF: 2004-06~', () => {
    const results = parseNatural('2004-06~');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2004-06~');
  });

  it('should accept valid EDTF: 18XX', () => {
    const results = parseNatural('18XX');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('18XX');
  });

  it('should accept valid EDTF interval: 1964/2008', () => {
    const results = parseNatural('1964/2008');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1964/2008');
    expect(results[0].type).toBe('interval');
  });

  it('should accept valid EDTF set: [1985,1987]', () => {
    const results = parseNatural('[1985,1987]');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('[1985,1987]');
    expect(results[0].type).toBe('set');
  });
});
