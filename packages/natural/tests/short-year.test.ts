import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Short Year Support (1-3 digits)', () => {
  describe('Standalone years', () => {
    it('should parse "623" as a 1-digit century year', () => {
      const results = parseNatural('623');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0623');
      expect(results[0].type).toBe('date');
    });

    it('should parse "1066"', () => {
      const results = parseNatural('1066');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1066');
      expect(results[0].type).toBe('date');
    });

    it('should parse "768"', () => {
      const results = parseNatural('768');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0768');
      expect(results[0].type).toBe('date');
    });

    it('should parse "79"', () => {
      const results = parseNatural('79');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0079');
      expect(results[0].type).toBe('date');
    });

    it('should parse "5"', () => {
      const results = parseNatural('5');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0005');
      expect(results[0].type).toBe('date');
    });
  });

  describe('Years with era markers', () => {
    it('should parse "623 AD"', () => {
      const results = parseNatural('623 AD');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0623');
      expect(results[0].type).toBe('date');
    });

    it('should parse "79 BC"', () => {
      const results = parseNatural('79 BC');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('-0078');
      expect(results[0].type).toBe('date');
    });

    it('should parse "5 BCE"', () => {
      const results = parseNatural('5 BCE');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('-0004');
      expect(results[0].type).toBe('date');
    });
  });

  describe('Month and year combinations', () => {
    it('should parse "December 768"', () => {
      const results = parseNatural('December 768');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0768-12');
      expect(results[0].type).toBe('date');
    });

    it('should parse "June 623"', () => {
      const results = parseNatural('June 623');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0623-06');
      expect(results[0].type).toBe('date');
    });

    it('should parse "January 79"', () => {
      const results = parseNatural('January 79');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0079-01');
      expect(results[0].type).toBe('date');
    });

    it('should parse "March 5"', () => {
      const results = parseNatural('March 5');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0005-03');
      expect(results[0].type).toBe('date');
    });
  });

  describe('Full dates with short years', () => {
    it('should parse "December 1, 768"', () => {
      const results = parseNatural('December 1, 768');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0768-12-01');
      expect(results[0].type).toBe('date');
    });

    it('should parse "June 25, 623"', () => {
      const results = parseNatural('June 25, 623');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0623-06-25');
      expect(results[0].type).toBe('date');
    });

    it('should parse "1st of January 79"', () => {
      const results = parseNatural('1st of January 79');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0079-01-01');
      expect(results[0].type).toBe('date');
    });

    it('should parse "15th March 5"', () => {
      const results = parseNatural('15th March 5');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0005-03-15');
      expect(results[0].type).toBe('date');
    });
  });

  describe('Seasons with short years', () => {
    it('should parse "Spring 768"', () => {
      const results = parseNatural('Spring 768');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0768-21');
      expect(results[0].type).toBe('season');
    });

    it('should parse "Winter 623"', () => {
      const results = parseNatural('Winter 623');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0623-24');
      expect(results[0].type).toBe('season');
    });

    it('should parse "Summer 79"', () => {
      const results = parseNatural('Summer 79');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0079-22');
      expect(results[0].type).toBe('season');
    });
  });

  describe('Approximate dates with short years', () => {
    it('should parse "768-ish"', () => {
      const results = parseNatural('768-ish');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0768~');
      expect(results[0].type).toBe('date');
    });

    it('should parse "623ish"', () => {
      const results = parseNatural('623ish');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0623~');
      expect(results[0].type).toBe('date');
    });

    it('should parse "79-ish"', () => {
      const results = parseNatural('79-ish');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0079~');
      expect(results[0].type).toBe('date');
    });
  });

  describe('Intervals with short years', () => {
    it('should parse "June to July 768"', () => {
      const results = parseNatural('June to July 768');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0768-06/0768-07');
      expect(results[0].type).toBe('interval');
    });

    it('should parse "January - March 623"', () => {
      const results = parseNatural('January - March 623');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0623-01/0623-03');
      expect(results[0].type).toBe('interval');
    });
  });

  describe('Unspecified dates with short years', () => {
    it('should parse "sometime in 768"', () => {
      const results = parseNatural('sometime in 768');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0768-XX-XX');
      expect(results[0].type).toBe('date');
    });

    it('should parse "sometime in December 623"', () => {
      const results = parseNatural('sometime in December 623');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0623-12-XX');
      expect(results[0].type).toBe('date');
    });

    it('should parse "a month in 79"', () => {
      const results = parseNatural('a month in 79');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('0079-XX');
      expect(results[0].type).toBe('date');
    });
  });
});
