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
