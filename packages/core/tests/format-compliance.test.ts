/**
 * EDTF Formatting Compliance Tests
 * Verify that all valid EDTF inputs produce sensible human-readable output
 */

import { describe, it, expect } from 'vitest';
import { parse as parseEDTF } from '../src/index.js';
import { formatHuman } from '../src/index.js';

function parse(input: string) {
  const result = parseEDTF(input);
  if (!result.success) throw new Error(input + ': ' + JSON.stringify(result.errors));
  return result;
}

describe('EDTF Human Formatting', () => {
  describe('Level 0 - ISO 8601 Profile', () => {
    it('should format complete date', () => {
      const result = parse('1985-04-12');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('1985');
      expect(formatted).toContain('April');
      expect(formatted).toContain('12');
    });

    it('should format year-month', () => {
      const result = parse('1985-04');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('1985');
      expect(formatted).toContain('April');
    });

    it('should format year only', () => {
      const result = parse('1985');
      const formatted = formatHuman(result.value);
      expect(formatted).toBe('1985');
    });

    it('should format year interval', () => {
      const result = parse('1964/2008');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('1964');
      expect(formatted).toContain('2008');
      expect(formatted).toContain('to');
    });
  });

  describe('Level 1 - Extended Features', () => {
    it('should format uncertain year', () => {
      const result = parse('1984?');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('1984');
      expect(formatted).toContain('uncertain');
    });

    it('should format approximate year-month', () => {
      const result = parse('2004-06~');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('2004');
      expect(formatted).toContain('approximate');
    });

    it('should format uncertain and approximate', () => {
      const result = parse('2004-06-11%');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('2004');
      expect(formatted).toContain('uncertain/approximate');
    });

    it('should format unspecified decade', () => {
      const result = parse('201X');
      const formatted = formatHuman(result.value);
      expect(formatted).toMatch(/2010s|2010/);
    });

    it('should format unspecified month', () => {
      const result = parse('2004-XX');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('2004');
      expect(formatted).toMatch(/some|month/i);
    });

    it('should format unspecified day', () => {
      const result = parse('1985-04-XX');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('1985');
      expect(formatted).toBe('some day in April 1985');
    });

    it('should format open end interval', () => {
      const result = parse('1985/..');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('1985');
      expect(formatted).toMatch(/open|onward|later/i);
    });

    it('should format open start interval', () => {
      const result = parse('../1985');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('1985');
      expect(formatted).toMatch(/open|before|earlier/i);
    });

    it('should format unknown end interval', () => {
      const result = parse('1985/');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('1985');
      expect(formatted).toMatch(/unknown/i);
    });

    it('should format negative year', () => {
      const result = parse('-1985');
      const formatted = formatHuman(result.value);
      expect(formatted).toBe('1986 BC');
      expect(formatHuman(result.value, { eraNotation: 'bce-ce' })).toBe('1986 BCE');
      expect(formatted).toMatch(/BC|BCE/);
    });

    it('should format season', () => {
      const result = parse('2001-21');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('2001');
      expect(formatted).toMatch(/Spring|spring/);
    });
  });

  describe('Level 2 - Extended Extended Features', () => {
    it('should format set with range', () => {
      const result = parse('[1667,1668,1670..1672]');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('One of');
      expect(formatted).toContain('1667');
      expect(formatted).toContain('1668');
      expect(formatted).toContain('1670');
      expect(formatted).toContain('1670 through 1672');
      expect(formatted).toContain('1672');
    });

    it('should format set with month range', () => {
      const result = parse('[2025-01..2025-03]');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('One of');
      expect(formatted).toMatch(/January|Jan/);
      expect(formatted).toBe('One of: January 2025 through March 2025');
      expect(formatted).toMatch(/March|Mar/);
      expect(formatted).toContain('2025');
    });

    it('should format set with day range', () => {
      const result = parse('[2025-01-15..2025-01-17]');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('One of');
      expect(formatted).toContain('15');
      expect(formatted).toBe('One of: January 15, 2025 through January 17, 2025');
      expect(formatted).toContain('17');
    });

    it('should format set with earlier', () => {
      const result = parse('[..1984]');
      const formatted = formatHuman(result.value);
      expect(formatted).toMatch(/Earlier|earlier/);
      expect(formatted).toContain('1984');
    });

    it('should format set with later', () => {
      const result = parse('[1760-12..]');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('1760');
      expect(formatted).toMatch(/later|or later/);
    });

    it('should format list', () => {
      const result = parse('{1960,1961-12}');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('All of');
      expect(formatted).toContain('1960');
      expect(formatted).toContain('1961');
    });

    it('should format partial qualification', () => {
      const result = parse('2004-06-~11');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('2004');
      expect(formatted).toMatch(/approximate|day approximate/i);
    });

    it('should format exponential year', () => {
      const result = parse('Y-17E7');
      const formatted = formatHuman(result.value);
      expect(formatted).toBe('170.0 million BC');
      expect(result.value).toMatchObject({ year: -170000000 });
    });

    it('should format significant digits', () => {
      const result = parse('1950S2');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('1950');
      expect(formatted).toBe('1950 (century precision: 1900s)');
      expect(result.value).toMatchObject({ year: 1950, significantDigitsYear: 2 });
    });
  });

  describe('Real-world examples', () => {
    it('should format multi-month set range sensibly', () => {
      const result = parse('[2025-01..2026-11]');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('One of');
      expect(formatted).toContain('2025');
      expect(formatted).toContain('2026');
      expect(formatted).toBe('One of: January 2025 through November 2026');
    });

    it('should format complex interval', () => {
      const result = parse('2004-02-01/2005-02');
      const formatted = formatHuman(result.value);
      expect(formatted).toContain('2004');
      expect(formatted).toContain('2005');
      expect(formatted).toContain('to');
    });

    it('should format historical date', () => {
      const result = parse('-0100'); // 101 BC
      const formatted = formatHuman(result.value);
      expect(formatted).toMatch(/BC|BCE/);
    });
  });
});
