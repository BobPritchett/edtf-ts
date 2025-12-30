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

describe('Qualified Dates', () => {
  it('should parse "1984 (uncertain)"', () => {
    const results = parseNatural('1984 (uncertain)');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1984?');
  });

  it('should parse "1950 (approximate)"', () => {
    const results = parseNatural('1950 (approximate)');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1950~');
  });

  it('should parse "2004 (uncertain/approximate)"', () => {
    const results = parseNatural('2004 (uncertain/approximate)');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2004%');
  });

  it('should parse "June 11, 2004 (year uncertain, day approximate)"', () => {
    const results = parseNatural('June 11, 2004 (year uncertain, day approximate)');
    expect(results.length).toBeGreaterThan(0);
    // Partial qualifications should be properly encoded
    expect(results[0].edtf).toBe('?2004-06-~11');
  });

  it('should parse "2004 (year approximate)"', () => {
    const results = parseNatural('2004 (year approximate)');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('~2004');
  });

  it('should parse "January 2004 (month uncertain)"', () => {
    const results = parseNatural('January 2004 (month uncertain)');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('2004-?01');
  });

  it('should parse "June 2004 (year uncertain, month approximate)"', () => {
    const results = parseNatural('June 2004 (year uncertain, month approximate)');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('?2004-~06');
  });
});

describe('EDTF Pass-through', () => {
  it('should accept valid EDTF: 19X4', () => {
    const results = parseNatural('19X4');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('19X4');
    expect(results[0].confidence).toBe(1.0);
  });

  it('should accept valid EDTF: 2004-06~', () => {
    const results = parseNatural('2004-06~');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2004-06~');
  });

  it('should accept valid EDTF: 18XX', () => {
    const results = parseNatural('18XX');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('18XX');
  });

  it('should accept valid EDTF interval: 1964/2008', () => {
    const results = parseNatural('1964/2008');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1964/2008');
    expect(results[0].type).toBe('interval');
  });

  it('should accept valid EDTF set: [1985,1987]', () => {
    const results = parseNatural('[1985,1987]');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('[1985,1987]');
    expect(results[0].type).toBe('set');
  });
});

describe('Ordinal Days', () => {
  it('should parse "January 12th, 1940"', () => {
    const results = parseNatural('January 12th, 1940');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1940-01-12');
  });

  it('should parse "12th January 1940"', () => {
    const results = parseNatural('12th January 1940');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1940-01-12');
  });

  it('should parse "the 12th of January, 1940"', () => {
    const results = parseNatural('the 12th of January, 1940');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1940-01-12');
  });

  it('should parse "April 1st, 1985"', () => {
    const results = parseNatural('April 1st, 1985');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1985-04-01');
  });

  it('should parse "December 2nd, 2004"', () => {
    const results = parseNatural('December 2nd, 2004');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2004-12-02');
  });

  it('should parse "March 3rd, 1999"', () => {
    const results = parseNatural('March 3rd, 1999');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('1999-03-03');
  });
});

describe('Apostrophe Variants for Decades/Centuries', () => {
  it('should parse "the 1800\'s"', () => {
    const results = parseNatural('the 1800\'s');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('18XX');
  });

  it('should parse "1800\'s"', () => {
    const results = parseNatural('1800\'s');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('18XX');
  });

  it('should parse "the 1960\'s"', () => {
    const results = parseNatural('the 1960\'s');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('196X');
  });

  it('should parse "1960\'s"', () => {
    const results = parseNatural('1960\'s');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('196X');
  });

  it('should parse "the \'60s"', () => {
    const results = parseNatural('the \'60s');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('196X');
  });

  it('should parse "\'60s"', () => {
    const results = parseNatural('\'60s');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('196X');
  });
});

describe('BC/AD/BCE/CE Era Markers', () => {
  describe('Short forms', () => {
    it('should parse "44 BC"', () => {
      const results = parseNatural('44 BC');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('-0043');
    });

    it('should parse "44BC"', () => {
      const results = parseNatural('44BC');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('-0043');
    });

    it('should parse "44 BCE"', () => {
      const results = parseNatural('44 BCE');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('-0043');
    });

    it('should parse "AD 79"', () => {
      const results = parseNatural('AD 79');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });

    it('should parse "79 AD"', () => {
      const results = parseNatural('79 AD');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });

    it('should parse "AD79"', () => {
      const results = parseNatural('AD79');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });

    it('should parse "79AD"', () => {
      const results = parseNatural('79AD');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });

    it('should parse "CE 79"', () => {
      const results = parseNatural('CE 79');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });

    it('should parse "79 CE"', () => {
      const results = parseNatural('79 CE');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });
  });

  describe('Long forms', () => {
    it('should parse "44 Before Christ"', () => {
      const results = parseNatural('44 Before Christ');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('-0043');
    });

    it('should parse "44 Before Common Era"', () => {
      const results = parseNatural('44 Before Common Era');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('-0043');
    });

    it('should parse "Anno Domini 79"', () => {
      const results = parseNatural('Anno Domini 79');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });

    it('should parse "79 Anno Domini"', () => {
      const results = parseNatural('79 Anno Domini');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });

    it('should parse "Common Era 79"', () => {
      const results = parseNatural('Common Era 79');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });

    it('should parse "79 Common Era"', () => {
      const results = parseNatural('79 Common Era');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });

    it('should parse "Anno Domini 33"', () => {
      const results = parseNatural('Anno Domini 33');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0033');
    });

    it('should parse "33 Anno Domini"', () => {
      const results = parseNatural('33 Anno Domini');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0033');
    });
  });

  describe('Narrow forms', () => {
    it('should parse "100 B"', () => {
      const results = parseNatural('100 B');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('-0099');
    });

    it('should parse "44 B"', () => {
      const results = parseNatural('44 B');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('-0043');
    });

    it('should parse "A 79"', () => {
      const results = parseNatural('A 79');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });

    it('should parse "79 A"', () => {
      const results = parseNatural('79 A');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0079');
    });

    it('should parse "A 100"', () => {
      const results = parseNatural('A 100');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0100');
    });

    it('should parse "100 A"', () => {
      const results = parseNatural('100 A');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].edtf).toBe('0100');
    });
  });
});

describe('Approximation Symbol Variants', () => {
  it('should parse "≈ 1950"', () => {
    const results = parseNatural('≈ 1950');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('1950~');
  });

  it('should parse "≈1950"', () => {
    const results = parseNatural('≈1950');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('1950~');
  });

  it('should parse "~ 1950"', () => {
    const results = parseNatural('~ 1950');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('1950~');
  });

  it('should parse "~1950"', () => {
    const results = parseNatural('~1950');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('1950~');
  });

  it('should parse "1950-ish"', () => {
    const results = parseNatural('1950-ish');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('1950~');
  });

  it('should parse "1950ish"', () => {
    const results = parseNatural('1950ish');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('1950~');
  });

  it('should parse "circa. 1950"', () => {
    const results = parseNatural('circa. 1950');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('1950~');
  });

  it('should parse "c.1950"', () => {
    const results = parseNatural('c.1950');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('1950~');
  });
});

describe('Unspecified Date Components', () => {
  it('should parse "some day in January 1872"', () => {
    const results = parseNatural('some day in January 1872');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('1872-01-XX');
  });

  it('should parse "a day in March 2004"', () => {
    const results = parseNatural('a day in March 2004');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('2004-03-XX');
  });

  it('should parse "sometime in April 1985"', () => {
    const results = parseNatural('sometime in April 1985');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('1985-04-XX');
  });

  it('should parse "some month in 1999"', () => {
    const results = parseNatural('some month in 1999');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('1999-XX');
  });

  it('should parse "sometime in 2020"', () => {
    const results = parseNatural('sometime in 2020');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].edtf).toBe('2020-XX-XX');
  });
});

describe('EDTF Level 2 Group Qualification', () => {
  it('should parse "2004-06-11%" (year, month, and day uncertain and approximate)', () => {
    const results = parseNatural('2004-06-11%');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2004-06-11%');
    expect(results[0].type).toBe('date');
  });

  it('should parse "2004-06~-11" (year and month approximate)', () => {
    const results = parseNatural('2004-06~-11');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2004-06~-11');
    expect(results[0].type).toBe('date');
  });

  it('should parse "2004?-06-11" (year uncertain)', () => {
    const results = parseNatural('2004?-06-11');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2004?-06-11');
    expect(results[0].type).toBe('date');
  });

  it('should parse "?2004-06-~11" (year uncertain; month known; day approximate)', () => {
    const results = parseNatural('?2004-06-~11');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('?2004-06-~11');
    expect(results[0].type).toBe('date');
  });

  it('should parse "2004-%06-11" (month uncertain and approximate; year and day known)', () => {
    const results = parseNatural('2004-%06-11');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2004-%06-11');
    expect(results[0].type).toBe('date');
  });

  it('should parse "2004-06?" (year and month uncertain)', () => {
    const results = parseNatural('2004-06?');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2004-06?');
    expect(results[0].type).toBe('date');
  });

  it('should parse "2004~" (year approximate)', () => {
    const results = parseNatural('2004~');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2004~');
    expect(results[0].type).toBe('date');
  });
});
