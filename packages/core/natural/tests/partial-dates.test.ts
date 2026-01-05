import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Partial Dates', () => {
  describe('Month and Year', () => {
    it('should parse long month name (January 2020)', () => {
      const results = parseNatural('January 2020');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2020-01');
      expect(results[0].type).toBe('date');
    });

    it('should parse abbreviated month (Jan 2020)', () => {
      const results = parseNatural('Jan 2020');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2020-01');
    });

    it('should parse numeric format (01/2020)', () => {
      const results = parseNatural('01/2020');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2020-01');
    });

    it('should parse ISO format (2020-01)', () => {
      const results = parseNatural('2020-01');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2020-01');
      expect(results[0].confidence).toBe(1.0);
    });
  });

  describe('Year Only', () => {
    it('should parse plain year (2020)', () => {
      const results = parseNatural('2020');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2020');
    });

    it('should parse "the year 2020"', () => {
      const results = parseNatural('the year 2020');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2020');
    });

    it('should parse "in 2020"', () => {
      const results = parseNatural('in 2020');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2020');
    });
  });
});
