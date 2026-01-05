import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Smoke Tests', () => {
  it('should parse a simple date', () => {
    const results = parseNatural('2020');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2020');
  });

  it('should parse month and year', () => {
    const results = parseNatural('January 2020');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2020-01');
  });

  it('should parse complete date', () => {
    const results = parseNatural('January 12, 1940');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1940-01-12');
  });

  it('should parse uncertain date', () => {
    const results = parseNatural('possibly 1984');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1984?');
  });

  it('should parse approximate date', () => {
    const results = parseNatural('circa 1950');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1950~');
  });

  it('should parse interval', () => {
    const results = parseNatural('from 1964 to 2008');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1964/2008');
    expect(results[0].type).toBe('interval');
  });

  it('should parse season', () => {
    const results = parseNatural('Spring 2001');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2001-21');
    expect(results[0].type).toBe('season');
  });

  it('should parse decade', () => {
    const results = parseNatural('the 1960s');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('196X');
  });
});
