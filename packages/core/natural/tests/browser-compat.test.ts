import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Browser Compatibility', () => {
  it('should work without Node.js-specific APIs', () => {
    const results = parseNatural('2020');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2020');
  });

  it('should parse circa 1950', () => {
    const results = parseNatural('circa 1950');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1950~');
  });

  it('should parse January 2020', () => {
    const results = parseNatural('January 2020');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2020-01');
  });

  it('should parse from 1964 to 2008', () => {
    const results = parseNatural('from 1964 to 2008');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1964/2008');
    expect(results[0].type).toBe('interval');
  });

  it('should parse Spring 2001', () => {
    const results = parseNatural('Spring 2001');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2001-21');
    expect(results[0].type).toBe('season');
  });
});
