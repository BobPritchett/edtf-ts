import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Interval Improvements', () => {
  describe('Month-to-month intervals with shared year', () => {
    it('should parse "from June to July 1964"', () => {
      const results = parseNatural('from June to July 1964');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964-06/1964-07');
      expect(results[0].type).toBe('interval');
    });

    it('should parse "June to July 1964"', () => {
      const results = parseNatural('June to July 1964');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964-06/1964-07');
      expect(results[0].type).toBe('interval');
    });

    it('should parse "June - July 1964"', () => {
      const results = parseNatural('June - July 1964');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964-06/1964-07');
      expect(results[0].type).toBe('interval');
    });

    it('should parse "from January to March 2020"', () => {
      const results = parseNatural('from January to March 2020');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2020-01/2020-03');
      expect(results[0].type).toBe('interval');
    });

    it('should parse "December - January 2024" (cross-year)', () => {
      const results = parseNatural('December - January 2024');
      expect(results).toHaveLength(1);
      // Both months get the same year (2024)
      expect(results[0].edtf).toBe('2024-12/2024-01');
      expect(results[0].type).toBe('interval');
    });
  });

  describe('Year intervals with shared era marker', () => {
    it('should parse "50 - 40 BC"', () => {
      const results = parseNatural('50 - 40 BC');
      console.log('Results for "50 - 40 BC":', results.map(r => ({ edtf: r.edtf, type: r.type, confidence: r.confidence })));
      expect(results.length).toBeGreaterThan(0);
      // The first result should be the correct one (highest confidence)
      expect(results[0]!.edtf).toBe('-0049/-0039');
      expect(results[0]!.type).toBe('interval');
      expect(results[0]!.confidence).toBe(0.98);
    });

    it('should parse "50 to 40 BC"', () => {
      const results = parseNatural('50 to 40 BC');
      console.log('Results for "50 to 40 BC":', results.map(r => ({ edtf: r.edtf, type: r.type, confidence: r.confidence })));
      expect(results.length).toBeGreaterThan(0);
      const match = results.find(r => r.edtf === '-0049/-0039' && r.type === 'interval');
      expect(match).toBeDefined();
    });

    it('should parse "100 - 50 BCE"', () => {
      const results = parseNatural('100 - 50 BCE');
      console.log('Results for "100 - 50 BCE":', results.map(r => ({ edtf: r.edtf, type: r.type, confidence: r.confidence })));
      expect(results.length).toBeGreaterThan(0);
      const match = results.find(r => r.edtf === '-0099/-0049' && r.type === 'interval');
      expect(match).toBeDefined();
    });

    it('should parse "50 to 40 BCE"', () => {
      const results = parseNatural('50 to 40 BCE');
      expect(results.length).toBeGreaterThan(0);
      const match = results.find(r => r.edtf === '-0049/-0039' && r.type === 'interval');
      expect(match).toBeDefined();
    });

    it('should parse "100 - 200 AD"', () => {
      const results = parseNatural('100 - 200 AD');
      expect(results.length).toBeGreaterThan(0);
      const match = results.find(r => r.edtf === '0100/0200' && r.type === 'interval');
      expect(match).toBeDefined();
    });

    it('should parse "100 to 200 AD"', () => {
      const results = parseNatural('100 to 200 AD');
      expect(results.length).toBeGreaterThan(0);
      const match = results.find(r => r.edtf === '0100/0200' && r.type === 'interval');
      expect(match).toBeDefined();
    });

    it('should parse "100 - 200 CE"', () => {
      const results = parseNatural('100 - 200 CE');
      expect(results.length).toBeGreaterThan(0);
      const match = results.find(r => r.edtf === '0100/0200' && r.type === 'interval');
      expect(match).toBeDefined();
    });

    it('should parse "100 to 200 CE"', () => {
      const results = parseNatural('100 to 200 CE');
      expect(results.length).toBeGreaterThan(0);
      const match = results.find(r => r.edtf === '0100/0200' && r.type === 'interval');
      expect(match).toBeDefined();
    });
  });

  describe('Verify existing interval patterns still work', () => {
    it('should parse "from June 1964 to July 1964"', () => {
      const results = parseNatural('from June 1964 to July 1964');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964-06/1964-07');
      expect(results[0].type).toBe('interval');
    });

    it('should parse "1964 to 1968"', () => {
      const results = parseNatural('1964 to 1968');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964/1968');
      expect(results[0].type).toBe('interval');
    });

    it('should parse "1964 - 1968"', () => {
      const results = parseNatural('1964 - 1968');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964/1968');
      expect(results[0].type).toBe('interval');
    });
  });
});
