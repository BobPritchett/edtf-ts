import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Temporal Modifiers (Early/Mid/Late)', () => {
  describe('Month Modifiers', () => {
    describe('Early Month', () => {
      it('should parse "early March 2024"', () => {
        const results = parseNatural('early March 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-03-01/2024-03-10');
        expect(results[0].type).toBe('interval');
      });

      it('should parse "early-March 2024" (hyphenated)', () => {
        const results = parseNatural('early-March 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-03-01/2024-03-10');
      });

      it('should parse "Early January 1995" (case insensitive)', () => {
        const results = parseNatural('Early January 1995');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1995-01-01/1995-01-10');
      });

      it('should parse "early Feb, 2020" (with comma)', () => {
        const results = parseNatural('early Feb, 2020');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2020-02-01/2020-02-10');
      });
    });

    describe('Mid Month', () => {
      it('should parse "mid March 2024"', () => {
        const results = parseNatural('mid March 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-03-11/2024-03-20');
      });

      it('should parse "mid-July 1999"', () => {
        const results = parseNatural('mid-July 1999');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1999-07-11/1999-07-20');
      });

      it('should parse "middle December 2000"', () => {
        const results = parseNatural('middle December 2000');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2000-12-11/2000-12-20');
      });
    });

    describe('Late Month', () => {
      it('should parse "late March 2024" (31 days)', () => {
        const results = parseNatural('late March 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-03-21/2024-03-31');
      });

      it('should parse "late April 2024" (30 days)', () => {
        const results = parseNatural('late April 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-04-21/2024-04-30');
      });

      it('should parse "late February 2024" (leap year, 29 days)', () => {
        const results = parseNatural('late February 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-02-21/2024-02-29');
      });

      it('should parse "late February 2023" (non-leap year, 28 days)', () => {
        const results = parseNatural('late February 2023');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2023-02-21/2023-02-28');
      });
    });
  });

  describe('Year Modifiers', () => {
    describe('Early Year', () => {
      it('should parse "early 1995"', () => {
        const results = parseNatural('early 1995');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1995-01/1995-04');
        expect(results[0].type).toBe('interval');
      });

      it('should parse "early-2020" (hyphenated)', () => {
        const results = parseNatural('early-2020');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2020-01/2020-04');
      });
    });

    describe('Mid Year', () => {
      it('should parse "mid 1995"', () => {
        const results = parseNatural('mid 1995');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1995-05/1995-08');
      });

      it('should parse "mid 2024"', () => {
        const results = parseNatural('mid 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-05/2024-08');
      });
    });

    describe('Late Year', () => {
      it('should parse "late 1995"', () => {
        const results = parseNatural('late 1995');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1995-09/1995-12');
      });

      it('should parse "late 2024"', () => {
        const results = parseNatural('late 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-09/2024-12');
      });
    });
  });

  describe('Decade Modifiers', () => {
    describe('Early Decade (4-3-3 rule: 0-3)', () => {
      it('should parse "early 1990s"', () => {
        const results = parseNatural('early 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1990/1993');
        expect(results[0].type).toBe('interval');
      });

      it('should parse "early 1920s"', () => {
        const results = parseNatural('early 1920s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1920/1923');
      });

      it('should parse "the early 1990s"', () => {
        const results = parseNatural('the early 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1990/1993');
      });

      it('should parse "early 1880s"', () => {
        const results = parseNatural('early 1880s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1880/1883');
      });
    });

    describe('Mid Decade (4-3-3 rule: 4-6)', () => {
      it('should parse "mid 1990s"', () => {
        const results = parseNatural('mid 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1994/1996');
      });

      it('should parse "mid-1920s" (hyphenated)', () => {
        const results = parseNatural('mid-1920s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1924/1926');
      });

      it('should parse "the mid 1990s"', () => {
        const results = parseNatural('the mid 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1994/1996');
      });
    });

    describe('Late Decade (4-3-3 rule: 7-9)', () => {
      it('should parse "late 1990s"', () => {
        const results = parseNatural('late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1997/1999');
      });

      it('should parse "late 1920s"', () => {
        const results = parseNatural('late 1920s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1927/1929');
      });

      it('should parse "the late 1990s"', () => {
        const results = parseNatural('the late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1997/1999');
      });
    });

    describe('Spelled Decades', () => {
      it('should parse "early sixties"', () => {
        const results = parseNatural('early sixties');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1960/1963');
      });

      it('should parse "the mid seventies"', () => {
        const results = parseNatural('the mid seventies');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1974/1976');
      });

      it('should parse "late nineties"', () => {
        const results = parseNatural('late nineties');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1997/1999');
      });
    });
  });

  describe('Century Modifiers', () => {
    describe('Early Century (01-33)', () => {
      it('should parse "early 20th century"', () => {
        const results = parseNatural('early 20th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1901/1933');
        expect(results[0].type).toBe('interval');
      });

      it('should parse "the early 20th century"', () => {
        const results = parseNatural('the early 20th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1901/1933');
      });

      it('should parse "early 19th century"', () => {
        const results = parseNatural('early 19th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1801/1833');
      });

      it('should parse "early twentieth century" (spelled)', () => {
        const results = parseNatural('early twentieth century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1901/1933');
      });
    });

    describe('Mid Century (34-66)', () => {
      it('should parse "mid 20th century"', () => {
        const results = parseNatural('mid 20th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1934/1966');
      });

      it('should parse "mid-19th century" (hyphenated)', () => {
        const results = parseNatural('mid-19th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1834/1866');
      });

      it('should parse "the mid 20th century"', () => {
        const results = parseNatural('the mid 20th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1934/1966');
      });
    });

    describe('Late Century (67-00)', () => {
      it('should parse "late 20th century"', () => {
        const results = parseNatural('late 20th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1967/2000');
      });

      it('should parse "late 19th century"', () => {
        const results = parseNatural('late 19th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1867/1900');
      });

      it('should parse "the late 20th century"', () => {
        const results = parseNatural('the late 20th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1967/2000');
      });
    });

    describe('Century with Era Suffix', () => {
      it('should parse "early 20th century CE"', () => {
        const results = parseNatural('early 20th century CE');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1901/1933');
      });

      it('should parse "late 19th century AD"', () => {
        const results = parseNatural('late 19th century AD');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1867/1900');
      });
    });

    describe('BCE/BC Century Modifiers', () => {
      it('should parse "early 5th century BCE"', () => {
        const results = parseNatural('early 5th century BCE');
        expect(results).toHaveLength(1);
        // 5th century BCE = 500-401 BCE, early = 499-467 (further from 0)
        expect(results[0].edtf).toBe('-0499/-0467');
        expect(results[0].type).toBe('interval');
      });

      it('should parse "the late 5th century BCE"', () => {
        const results = parseNatural('the late 5th century BCE');
        expect(results).toHaveLength(1);
        // Late 5th century BCE = closer to year 0
        expect(results[0].edtf).toBe('-0433/-0400');
      });

      it('should parse "mid 1st century BC"', () => {
        const results = parseNatural('mid 1st century BC');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('-0066/-0034');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle lowercase modifiers', () => {
      const results = parseNatural('early january 2024');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2024-01-01/2024-01-10');
    });

    it('should handle uppercase modifiers', () => {
      const results = parseNatural('EARLY JANUARY 2024');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2024-01-01/2024-01-10');
    });

    it('should handle mixed case', () => {
      const results = parseNatural('EaRLy JaNuArY 2024');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2024-01-01/2024-01-10');
    });

    it('should handle abbreviated month names', () => {
      const results = parseNatural('early Jan 2024');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2024-01-01/2024-01-10');
    });

    it('should handle September abbreviations', () => {
      const results = parseNatural('late Sept 2024');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2024-09-21/2024-09-30');
    });
  });

  describe('Confidence Scores', () => {
    it('should have high confidence for standard patterns', () => {
      const results = parseNatural('early March 2024');
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should have slightly lower confidence for spelled decades', () => {
      const results = parseNatural('early sixties');
      expect(results[0].confidence).toBe(0.9);
    });
  });
});
