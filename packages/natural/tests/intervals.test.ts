import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Intervals', () => {
  describe('Basic Intervals', () => {
    it('should parse "1964/2008" (pass-through)', () => {
      const results = parseNatural('1964/2008');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964/2008');
      expect(results[0].type).toBe('interval');
    });

    it('should parse "1964 to 2008"', () => {
      const results = parseNatural('1964 to 2008');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964/2008');
      expect(results[0].type).toBe('interval');
    });

    it('should parse "1964 - 2008"', () => {
      const results = parseNatural('1964 - 2008');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964/2008');
    });

    it('should parse "from 1964 to 2008"', () => {
      const results = parseNatural('from 1964 to 2008');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964/2008');
    });

    it('should parse "between 1964 and 2008"', () => {
      const results = parseNatural('between 1964 and 2008');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964/2008');
    });

    it('should parse "1964 through 2008"', () => {
      const results = parseNatural('1964 through 2008');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964/2008');
    });

    it('should parse "1964 until 2008"', () => {
      const results = parseNatural('1964 until 2008');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1964/2008');
    });
  });

  describe('Mixed Precision Intervals', () => {
    it('should parse "June 2004 to August 2006"', () => {
      const results = parseNatural('June 2004 to August 2006');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2004-06/2006-08');
    });

    it('should parse "June 2004 - August 2006"', () => {
      const results = parseNatural('June 2004 - August 2006');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2004-06/2006-08');
    });

    it('should parse "February 1, 2004 to 2005"', () => {
      const results = parseNatural('February 1, 2004 to 2005');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2004-02-01/2005');
    });

    it('should parse "2005 to June 2006"', () => {
      const results = parseNatural('2005 to June 2006');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2005/2006-06');
    });
  });

  describe('Qualified Intervals', () => {
    it('should parse "circa 1984 to June 2004"', () => {
      const results = parseNatural('circa 1984 to June 2004');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984~/2004-06');
    });

    it('should parse "from around 1984 to June 2004"', () => {
      const results = parseNatural('from around 1984 to June 2004');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984~/2004-06');
    });

    it('should parse "1984 to circa June 2004"', () => {
      const results = parseNatural('1984 to circa June 2004');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984/2004-06~');
    });

    it('should parse "circa 1984 to circa 2004"', () => {
      const results = parseNatural('circa 1984 to circa 2004');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984~/2004~');
    });

    it('should parse "1984? to 2004?"', () => {
      const results = parseNatural('1984? to 2004?');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984?/2004?');
    });

    it('should parse "August 1979 (approximate) to unknown"', () => {
      const results = parseNatural('August 1979 (approximate) to unknown');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1979-08~/');
    });

    it('should parse "June 2, 1984 (uncertain) to August 8, 2004 (approximate)"', () => {
      const results = parseNatural('June 2, 1984 (uncertain) to August 8, 2004 (approximate)');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984-06-02?/2004-08-08~');
    });
  });

  describe('Open Intervals', () => {
    it('should parse "before 1930"', () => {
      const results = parseNatural('before 1930');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('../1930');
      expect(results[0].type).toBe('interval');
    });

    it('should parse "earlier than 1930"', () => {
      const results = parseNatural('earlier than 1930');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('../1930');
    });

    it('should parse "prior to 1930"', () => {
      const results = parseNatural('prior to 1930');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('../1930');
    });

    it('should parse "until 1930"', () => {
      const results = parseNatural('until 1930');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('../1930');
    });

    it('should parse "after 1930"', () => {
      const results = parseNatural('after 1930');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1930/..');
    });

    it('should parse "later than 1930"', () => {
      const results = parseNatural('later than 1930');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1930/..');
    });

    it('should parse "since 1930"', () => {
      const results = parseNatural('since 1930');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1930/..');
    });

    it('should parse "from 1930 onwards"', () => {
      const results = parseNatural('from 1930 onwards');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1930/..');
    });

    it('should parse "1930 or later"', () => {
      const results = parseNatural('1930 or later');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1930/..');
    });

    it('should parse "1930 and after"', () => {
      const results = parseNatural('1930 and after');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1930/..');
    });
  });

  describe('Unknown Endpoint Intervals', () => {
    it('should parse "from June 1, 2004 to unknown"', () => {
      const results = parseNatural('from June 1, 2004 to unknown');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2004-06-01/');
    });

    it('should parse "1984 to unknown"', () => {
      const results = parseNatural('1984 to unknown');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1984/');
    });

    it('should parse "unknown to 1984"', () => {
      const results = parseNatural('unknown to 1984');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('/1984');
    });

    it('should parse "? to 1984"', () => {
      const results = parseNatural('? to 1984');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('/1984');
    });
  });
});
