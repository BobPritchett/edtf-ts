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

  describe('Combination Modifiers (Early-to-Mid, Mid-to-Late)', () => {
    describe('Decade Combinations', () => {
      it('should parse "early-to-mid 1950s" as 1950/1956', () => {
        const results = parseNatural('early-to-mid 1950s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1950/1956');
        expect(results[0].type).toBe('interval');
      });

      it('should parse "mid-to-late 1950s" as 1954/1959', () => {
        const results = parseNatural('mid-to-late 1950s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1954/1959');
      });

      it('should parse "mid to late 1950s" (with spaces)', () => {
        const results = parseNatural('mid to late 1950s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1954/1959');
      });

      it('should parse "early to mid 1990s" (with spaces)', () => {
        const results = parseNatural('early to mid 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1990/1996');
      });

      it('should parse "the early-to-mid 1980s"', () => {
        const results = parseNatural('the early-to-mid 1980s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980/1986');
      });

      it('should parse "the mid-to-late 1970s"', () => {
        const results = parseNatural('the mid-to-late 1970s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1974/1979');
      });
    });

    describe('Year Combinations', () => {
      it('should parse "early-to-mid 1995" as Jan-Aug', () => {
        const results = parseNatural('early-to-mid 1995');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1995-01/1995-08');
      });

      it('should parse "mid-to-late 1995" as May-Dec', () => {
        const results = parseNatural('mid-to-late 1995');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1995-05/1995-12');
      });

      it('should parse "mid to late 2020" (with spaces)', () => {
        const results = parseNatural('mid to late 2020');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2020-05/2020-12');
      });
    });

    describe('Month Combinations', () => {
      it('should parse "early-to-mid March 2024" as 1st-20th', () => {
        const results = parseNatural('early-to-mid March 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-03-01/2024-03-20');
      });

      it('should parse "mid-to-late March 2024" as 11th-31st', () => {
        const results = parseNatural('mid-to-late March 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-03-11/2024-03-31');
      });

      it('should parse "mid to late February 2024" (leap year)', () => {
        const results = parseNatural('mid to late February 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-02-11/2024-02-29');
      });

      it('should parse "early-to-mid April, 2020" (with comma)', () => {
        const results = parseNatural('early-to-mid April, 2020');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2020-04-01/2020-04-20');
      });
    });

    describe('Century Combinations', () => {
      it('should parse "early-to-mid 20th century" as 1901-1966', () => {
        const results = parseNatural('early-to-mid 20th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1901/1966');
      });

      it('should parse "mid-to-late 20th century" as 1934-2000', () => {
        const results = parseNatural('mid-to-late 20th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1934/2000');
      });

      it('should parse "the early-to-mid 19th century"', () => {
        const results = parseNatural('the early-to-mid 19th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1801/1866');
      });

      it('should parse "early-to-mid 21st century CE"', () => {
        const results = parseNatural('early-to-mid 21st century CE');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2001/2066');
      });

      it('should parse "mid-to-late 5th century BCE"', () => {
        const results = parseNatural('mid-to-late 5th century BCE');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('-0466/-0400');
      });
    });

    describe('Spelled Decade Combinations', () => {
      it('should parse "early-to-mid sixties"', () => {
        const results = parseNatural('early-to-mid sixties');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1960/1966');
      });

      it('should parse "mid-to-late seventies"', () => {
        const results = parseNatural('mid-to-late seventies');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1974/1979');
      });

      it('should parse "the early-to-mid fifties"', () => {
        const results = parseNatural('the early-to-mid fifties');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1950/1956');
      });
    });

    describe('Alternative Formats', () => {
      it('should parse "early-mid 1990s" (no "to")', () => {
        const results = parseNatural('early-mid 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1990/1996');
      });

      it('should parse "mid-late 1990s" (no "to")', () => {
        const results = parseNatural('mid-late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1994/1999');
      });

      it('should parse "middle to late 1980s" (using "middle")', () => {
        const results = parseNatural('middle to late 1980s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1984/1989');
      });
    });
  });

  describe('Temporal Modifier Intervals (Range Modifiers on Intervals)', () => {
    describe('Decade to Decade with Modifiers', () => {
      it('should parse "early 1980s to late 1990s"', () => {
        const results = parseNatural('early 1980s to late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980/1999');
        expect(results[0].type).toBe('interval');
      });

      it('should parse "early-to-mid 1980s to late 1990s"', () => {
        const results = parseNatural('early-to-mid 1980s to late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980/1999');
        expect(results[0].type).toBe('interval');
      });

      it('should parse "mid-1970s to early-1980s"', () => {
        const results = parseNatural('mid-1970s to early-1980s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1974/1983');
      });

      it('should parse "late 1960s through mid 1970s"', () => {
        const results = parseNatural('late 1960s through mid 1970s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1967/1976');
      });

      it('should parse "from early 1980s to late 1990s"', () => {
        const results = parseNatural('from early 1980s to late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980/1999');
      });

      it('should parse "from the early 1980s to the late 1990s"', () => {
        const results = parseNatural('from the early 1980s to the late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980/1999');
      });

      it('should parse "between early 1980s and late 1990s"', () => {
        const results = parseNatural('between early 1980s and late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980/1999');
      });

      it('should parse "early 1920s - late 1930s" (hyphen separator)', () => {
        const results = parseNatural('early 1920s - late 1930s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1920/1939');
      });
    });

    describe('Year to Year with Modifiers', () => {
      it('should parse "early 1995 to late 2000"', () => {
        const results = parseNatural('early 1995 to late 2000');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1995-01/2000-12');
      });

      it('should parse "mid 1990 through mid 2000"', () => {
        const results = parseNatural('mid 1990 through mid 2000');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1990-05/2000-08');
      });

      it('should parse "from late 2019 to early 2020"', () => {
        const results = parseNatural('from late 2019 to early 2020');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2019-09/2020-04');
      });
    });

    describe('Month to Month with Modifiers', () => {
      it('should parse "early March 2024 to late May 2024"', () => {
        const results = parseNatural('early March 2024 to late May 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-03-01/2024-05-31');
      });

      it('should parse "mid January 2020 through mid March 2020"', () => {
        const results = parseNatural('mid January 2020 through mid March 2020');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2020-01-11/2020-03-20');
      });
    });

    describe('Century with Modifiers', () => {
      it('should parse "late 19th century to early 20th century"', () => {
        const results = parseNatural('late 19th century to early 20th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1867/1933');
      });

      it('should parse "mid 20th century through late 20th century"', () => {
        const results = parseNatural('mid 20th century through late 20th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1934/2000');
      });

      it('should parse "from early twentieth century to mid twentieth century"', () => {
        const results = parseNatural('from early twentieth century to mid twentieth century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1901/1966');
      });
    });

    describe('Spelled Decades with Modifiers', () => {
      it('should parse "early sixties to late seventies"', () => {
        const results = parseNatural('early sixties to late seventies');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1960/1979');
      });

      it('should parse "mid-fifties through late-sixties"', () => {
        const results = parseNatural('mid-fifties through late-sixties');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1954/1969');
      });

      it('should parse "the early sixties to the late seventies"', () => {
        const results = parseNatural('the early sixties to the late seventies');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1960/1979');
      });
    });

    describe('Mixed: Temporal Modifier to Regular Date', () => {
      it('should parse "early 1980s to 1995"', () => {
        const results = parseNatural('early 1980s to 1995');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980/1995');
      });

      it('should parse "late 1990s through 2005"', () => {
        const results = parseNatural('late 1990s through 2005');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1997/2005');
      });

      it('should parse "from mid-1980s to June 2004"', () => {
        const results = parseNatural('from mid-1980s to June 2004');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1984/2004-06');
      });
    });

    describe('Mixed: Regular Date to Temporal Modifier', () => {
      it('should parse "1980 to late 1990s"', () => {
        const results = parseNatural('1980 to late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980/1999');
      });

      it('should parse "June 2004 through early 2010s"', () => {
        const results = parseNatural('June 2004 through early 2010s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2004-06/2013');
      });

      it('should parse "from 1970 to mid-1980s"', () => {
        const results = parseNatural('from 1970 to mid-1980s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1970/1986');
      });
    });

    describe('Combination Modifiers in Intervals', () => {
      it('should parse "early-to-mid 1970s to mid-to-late 1980s"', () => {
        const results = parseNatural('early-to-mid 1970s to mid-to-late 1980s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1970/1989');
      });

      it('should parse "from mid-to-late sixties to early-to-mid seventies"', () => {
        const results = parseNatural('from mid-to-late sixties to early-to-mid seventies');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1964/1976');
      });
    });
  });

  describe('Qualified Temporal Modifiers', () => {
    describe('Circa with temporal modifiers', () => {
      it('should parse "circa early 1980s"', () => {
        const results = parseNatural('circa early 1980s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980~/1983~');
        expect(results[0].type).toBe('interval');
      });

      it('should parse "circa mid-1990s"', () => {
        const results = parseNatural('circa mid-1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1994~/1996~');
      });

      it('should parse "circa late 1970s"', () => {
        const results = parseNatural('circa late 1970s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1977~/1979~');
      });

      it('should parse "c. early 2000s"', () => {
        const results = parseNatural('c. early 2000s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2000~/2003~');
      });
    });

    describe('Approximately with temporal modifiers', () => {
      it('should parse "approximately early 1950s"', () => {
        const results = parseNatural('approximately early 1950s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1950~/1953~');
      });

      it('should parse "approx late 1960s"', () => {
        const results = parseNatural('approx late 1960s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1967~/1969~');
      });
    });

    describe('About with temporal modifiers', () => {
      it('should parse "about early 1920s"', () => {
        const results = parseNatural('about early 1920s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1920~/1923~');
      });

      it('should parse "around mid 1880s"', () => {
        const results = parseNatural('around mid 1880s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1884~/1886~');
      });
    });

    describe('Possibly/Maybe with temporal modifiers', () => {
      it('should parse "possibly early 1990s"', () => {
        const results = parseNatural('possibly early 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1990?/1993?');
      });

      it('should parse "maybe late 1970s"', () => {
        const results = parseNatural('maybe late 1970s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1977?/1979?');
      });
    });

    describe('Qualified year modifiers', () => {
      it('should parse "circa early 1995"', () => {
        const results = parseNatural('circa early 1995');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1995-01~/1995-04~');
      });

      it('should parse "approximately mid-2020"', () => {
        const results = parseNatural('approximately mid-2020');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2020-05~/2020-08~');
      });
    });

    describe('Qualified month modifiers', () => {
      it('should parse "circa early March 2024"', () => {
        const results = parseNatural('circa early March 2024');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('2024-03-01~/2024-03-10~');
      });
    });

    describe('Qualified century modifiers', () => {
      it('should parse "circa early 20th century"', () => {
        const results = parseNatural('circa early 20th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1901~/1933~');
      });

      it('should parse "possibly late 19th century"', () => {
        const results = parseNatural('possibly late 19th century');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1867?/1900?');
      });
    });

    describe('Qualified spelled decade modifiers', () => {
      it('should parse "circa early sixties"', () => {
        const results = parseNatural('circa early sixties');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1960~/1963~');
      });

      it('should parse "about mid-seventies"', () => {
        const results = parseNatural('about mid-seventies');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1974~/1976~');
      });
    });

    describe('Qualified combination modifiers', () => {
      it('should parse "circa early-to-mid 1980s"', () => {
        const results = parseNatural('circa early-to-mid 1980s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980~/1986~');
      });
    });

    describe('Qualified temporal modifier intervals', () => {
      it('should parse "circa early 1980s to late-1990s"', () => {
        const results = parseNatural('circa early 1980s to late-1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980~/1999');
        expect(results[0].type).toBe('interval');
      });

      it('should parse "circa early 1980s to late 1990s" (with space)', () => {
        const results = parseNatural('circa early 1980s to late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980~/1999');
      });

      it('should parse "approximately early 1980s to late 1990s"', () => {
        const results = parseNatural('approximately early 1980s to late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980~/1999');
      });

      it('should parse "about early 1980s through late 1990s"', () => {
        const results = parseNatural('about early 1980s through late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980~/1999');
      });

      it('should parse "from circa early 1980s to late 1990s"', () => {
        const results = parseNatural('from circa early 1980s to late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980~/1999');
      });

      it('should parse "circa early 1980s to circa late 1990s"', () => {
        const results = parseNatural('circa early 1980s to circa late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980~/1999~');
      });

      it('should parse "early 1980s to circa late 1990s"', () => {
        const results = parseNatural('early 1980s to circa late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980/1999~');
      });

      it('should parse "between circa early 1980s and late 1990s"', () => {
        const results = parseNatural('between circa early 1980s and late 1990s');
        expect(results).toHaveLength(1);
        expect(results[0].edtf).toBe('1980~/1999');
      });
    });
  });
});
