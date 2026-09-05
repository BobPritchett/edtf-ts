import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Qualified Dates', () => {
  describe('Uncertain (?)', () => {
    it('should parse "1984?"', () => {
      const results = parseNatural('1984?');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984?');
    });

    it('should parse "possibly 1984"', () => {
      const results = parseNatural('possibly 1984');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984?');
    });

    it('should parse "maybe 1984"', () => {
      const results = parseNatural('maybe 1984');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984?');
    });

    it('should parse "perhaps 1984"', () => {
      const results = parseNatural('perhaps 1984');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984?');
    });

    it('should parse "probably 1984"', () => {
      const results = parseNatural('probably 1984');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984?');
    });

    it('should parse "1984 (uncertain)"', () => {
      const results = parseNatural('1984 (uncertain)');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984?');
    });

    it('should parse "June 2004?"', () => {
      const results = parseNatural('June 2004?');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2004-06?');
    });

    it('should parse "possibly June 2004"', () => {
      const results = parseNatural('possibly June 2004');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2004-06?');
    });
  });

  describe('Approximate (~)', () => {
    it('should parse "circa 1950"', () => {
      const results = parseNatural('circa 1950');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1950~');
    });

    it('should parse "c. 1950"', () => {
      const results = parseNatural('c. 1950');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1950~');
    });

    it('should parse "c 1950"', () => {
      const results = parseNatural('c 1950');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1950~');
    });

    it('should parse "ca. 1950"', () => {
      const results = parseNatural('ca. 1950');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1950~');
    });

    it('should parse "about 1950"', () => {
      const results = parseNatural('about 1950');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1950~');
    });

    it('should parse "around 1950"', () => {
      const results = parseNatural('around 1950');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1950~');
    });

    it('should parse "approximately 1950"', () => {
      const results = parseNatural('approximately 1950');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1950~');
    });

    it('should parse "~1950"', () => {
      const results = parseNatural('~1950');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1950~');
    });

    it('should parse "circa June 1950"', () => {
      const results = parseNatural('circa June 1950');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1950-06~');
    });
  });

  describe('Uncertain AND Approximate (%)', () => {
    it('should parse "circa 1984?"', () => {
      const results = parseNatural('circa 1984?');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984%');
    });

    it('should parse "about 1984?"', () => {
      const results = parseNatural('about 1984?');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984%');
    });

    it('should parse "possibly around 1984"', () => {
      const results = parseNatural('possibly around 1984');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984%');
    });

    it('should parse "maybe circa 1984"', () => {
      const results = parseNatural('maybe circa 1984');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984%');
    });

    it('should parse "~1984?"', () => {
      const results = parseNatural('~1984?');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984%');
    });
  });
});
