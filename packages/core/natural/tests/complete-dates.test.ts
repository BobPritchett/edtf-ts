import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Complete Dates', () => {
  describe('Standard Formats', () => {
    it('should parse US long format (January 12, 1940)', () => {
      const results = parseNatural('January 12, 1940');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1940-01-12');
      expect(results[0].type).toBe('date');
      expect(results[0].confidence).toBeGreaterThan(0.9);
    });

    it('should parse EU long format (12 January 1940)', () => {
      const results = parseNatural('12 January 1940');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1940-01-12');
      expect(results[0].confidence).toBeGreaterThan(0.9);
    });

    it('should parse US abbreviated format (Jan 12, 1940)', () => {
      const results = parseNatural('Jan 12, 1940');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1940-01-12');
    });

    it('should parse EU abbreviated format (12 Jan 1940)', () => {
      const results = parseNatural('12 Jan 1940');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1940-01-12');
    });

    it('should parse ISO format as pass-through (1940-01-12)', () => {
      const results = parseNatural('1940-01-12');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1940-01-12');
      expect(results[0].confidence).toBe(1.0);
    });
  });

  describe('Numeric Formats (Ambiguous)', () => {
    it('should return multiple interpretations for 01/12/1940', () => {
      const results = parseNatural('01/12/1940', { locale: 'en-US' });
      expect(results.length).toBeGreaterThanOrEqual(1);

      // Should have US interpretation (January 12)
      const usResult = results.find((r) => r.edtf === '1940-01-12');
      expect(usResult).toBeDefined();
      expect(usResult?.ambiguous).toBe(true);

      // May have EU interpretation (December 1) if both are valid
      const euResult = results.find((r) => r.edtf === '1940-12-01');
      if (euResult) {
        expect(euResult.ambiguous).toBe(true);
        // US locale should prefer US format
        expect(usResult!.confidence).toBeGreaterThan(euResult.confidence);
      }
    });

    it('should handle single-digit month (1/12/1940)', () => {
      const results = parseNatural('1/12/1940', { locale: 'en-US' });
      expect(results.length).toBeGreaterThanOrEqual(1);

      const usResult = results.find((r) => r.edtf === '1940-01-12');
      expect(usResult).toBeDefined();
    });

    it('should handle single-digit day (12/1/1940)', () => {
      const results = parseNatural('12/1/1940', { locale: 'en-US' });
      expect(results.length).toBeGreaterThanOrEqual(1);

      const usResult = results.find((r) => r.edtf === '1940-12-01');
      expect(usResult).toBeDefined();
    });
  });

  describe('Two-Digit Years', () => {
    it('should interpret 40 as 1940 (century window)', () => {
      const results = parseNatural('01/12/40');
      expect(results.length).toBeGreaterThanOrEqual(1);

      const result = results.find((r) => r.edtf.startsWith('1940'));
      expect(result).toBeDefined();
    });

    it('should interpret 99 as 1999', () => {
      const results = parseNatural('01/12/99');
      expect(results.length).toBeGreaterThanOrEqual(1);

      const result = results.find((r) => r.edtf.startsWith('1999'));
      expect(result).toBeDefined();
    });

    it('should interpret 25 as 2025', () => {
      const results = parseNatural('01/12/25');
      expect(results.length).toBeGreaterThanOrEqual(1);

      const result = results.find((r) => r.edtf.startsWith('2025'));
      expect(result).toBeDefined();
    });
  });
});
