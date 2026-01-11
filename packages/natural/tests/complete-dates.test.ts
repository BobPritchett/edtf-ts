import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Complete Dates', () => {
  describe('Standard Formats', () => {
    it('should parse US long format (January 12, 1940)', () => {
      const results = parseNatural('January 12, 1940');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('1940-01-12');
      expect(results[0]!.type).toBe('date');
      expect(results[0]!.confidence).toBeGreaterThan(0.9);
    });

    it('should parse EU long format (12 January 1940)', () => {
      const results = parseNatural('12 January 1940');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('1940-01-12');
      expect(results[0]!.confidence).toBeGreaterThan(0.9);
    });

    it('should parse US abbreviated format (Jan 12, 1940)', () => {
      const results = parseNatural('Jan 12, 1940');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('1940-01-12');
    });

    it('should parse EU abbreviated format (12 Jan 1940)', () => {
      const results = parseNatural('12 Jan 1940');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('1940-01-12');
    });

    it('should parse ISO format as pass-through (1940-01-12)', () => {
      const results = parseNatural('1940-01-12');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('1940-01-12');
      expect(results[0]!.confidence).toBe(1.0);
    });
  });

  describe('Numeric Formats (Ambiguous)', () => {
    it('should return multiple interpretations for 01/12/1940', () => {
      const usLocaleResults = parseNatural('01/12/1940', { locale: 'en-US' });
      expect(usLocaleResults.length).toBe(2);

      // Should have US interpretation (January 12) first
      let usResult = usLocaleResults[0];
      expect(usResult).toBeDefined();
      expect(usResult!.edtf).toBe('1940-01-12');
      expect(usResult!.ambiguous).toBe(true);

      // Will have EU interpretation (December 1)
      let euResult = usLocaleResults[1];
      expect(euResult).toBeDefined();
      expect(euResult!.edtf).toBe('1940-12-01');
      expect(euResult!.ambiguous).toBe(true);

      // US locale should prefer US format
      expect(usResult!.confidence).toBeGreaterThan(euResult!.confidence);

      // Now test a DD/MM/YYYY locale
      const euLocaleResults = parseNatural('01/12/1940', { locale: 'en-GB' });
      expect(euLocaleResults.length).toBe(2);

      // Will have EU interpretation (December 1) first
      euResult = euLocaleResults[0];
      expect(euResult).toBeDefined();
      expect(euResult!.edtf).toBe('1940-12-01');
      expect(euResult!.ambiguous).toBe(true);

      // Should have US interpretation (January 12) second
      usResult = euLocaleResults[1];
      expect(usResult).toBeDefined();
      expect(usResult!.edtf).toBe('1940-01-12');
      expect(usResult!.ambiguous).toBe(true);

      // GB locale should prefer GB format
      expect(euResult!.confidence).toBeGreaterThan(usResult!.confidence);
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

  describe('Two-Digit Years (Sliding Window: -80/+20)', () => {
    // The sliding window convention uses current year +20 as the pivot.
    // Years within the +20 future window use the current century.
    // Years beyond +20 fall back to the previous century.
    //
    // Example with current year 2026:
    //   Window: 1946 - 2046
    //   25 → 2025 (within +20)
    //   40 → 2040 (within +20)
    //   50 → 1950 (beyond +20)
    //   99 → 1999 (beyond +20)

    it('should interpret 25 as 2025 (within +20 future window)', () => {
      const results = parseNatural('01/12/25');
      expect(results.length).toBeGreaterThanOrEqual(1);

      const result = results.find((r) => r.edtf.startsWith('2025'));
      expect(result).toBeDefined();
    });

    it('should interpret 40 as 2040 (within +20 future window)', () => {
      const results = parseNatural('01/12/40');
      expect(results.length).toBeGreaterThanOrEqual(1);

      // With sliding window (current year + 20), 40 is within the future window
      const result = results.find((r) => r.edtf.startsWith('2040'));
      expect(result).toBeDefined();
    });

    it('should interpret 50 as 1950 (beyond +20, previous century)', () => {
      const results = parseNatural('01/12/50');
      expect(results.length).toBeGreaterThanOrEqual(1);

      // 50 is beyond the +20 window, falls to previous century
      const result = results.find((r) => r.edtf.startsWith('1950'));
      expect(result).toBeDefined();
    });

    it('should interpret 99 as 1999 (beyond +20, previous century)', () => {
      const results = parseNatural('01/12/99');
      expect(results.length).toBeGreaterThanOrEqual(1);

      const result = results.find((r) => r.edtf.startsWith('1999'));
      expect(result).toBeDefined();
    });
  });
});
