import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Seasons', () => {
  it('should parse "Spring 2001"', () => {
    const results = parseNatural('Spring 2001');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2001-21');
    expect(results[0].type).toBe('season');
  });

  it('should parse "spring 2001" (lowercase)', () => {
    const results = parseNatural('spring 2001');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2001-21');
  });

  it('should parse "Summer 2001"', () => {
    const results = parseNatural('Summer 2001');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2001-22');
  });

  it('should parse "Autumn 2001"', () => {
    const results = parseNatural('Autumn 2001');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2001-23');
  });

  it('should parse "Fall 2001"', () => {
    const results = parseNatural('Fall 2001');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2001-23');
  });

  it('should parse "Winter 2001"', () => {
    const results = parseNatural('Winter 2001');
    expect(results).toHaveLength(1);
    expect(results[0].edtf).toBe('2001-24');
  });

  describe('Qualified Seasons', () => {
    it('should parse "circa Spring 2001"', () => {
      const results = parseNatural('circa Spring 2001');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2001-21~');
    });

    it('should parse "possibly Spring 2001"', () => {
      const results = parseNatural('possibly Spring 2001');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2001-21?');
    });

    it('should parse "about Fall 2020"', () => {
      const results = parseNatural('about Fall 2020');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('2020-23~');
    });
  });
});

describe('Sets (Level 2)', () => {
  describe('One of a Set', () => {
    it('should parse "1667 or 1668 or 1670"', () => {
      const results = parseNatural('1667 or 1668 or 1670');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('[1667,1668,1670]');
      expect(results[0].type).toBe('set');
    });

    it('should parse "either 1667 or 1668"', () => {
      const results = parseNatural('either 1667 or 1668');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('[1667,1668]');
    });

    it('should parse "1667 or 1668" (without either)', () => {
      const results = parseNatural('1667 or 1668');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('[1667,1668]');
    });
  });

  describe('Open-Ended Sets', () => {
    it('should parse "1984 or earlier"', () => {
      const results = parseNatural('1984 or earlier');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('[..1984]');
    });

    it('should parse "1984 or before"', () => {
      const results = parseNatural('1984 or before');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('[..1984]');
    });

    it('should parse "December 1760 or later"', () => {
      const results = parseNatural('December 1760 or later');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1760-12/..');
      expect(results[0].type).toBe('interval');
    });

    it('should parse "December 1760 or after"', () => {
      const results = parseNatural('December 1760 or after');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1760-12/..');
      expect(results[0].type).toBe('interval');
    });
  });
});

describe('Lists (Level 2)', () => {
  describe('All of a Set', () => {
    it('should parse "1667 and 1668 and 1670"', () => {
      const results = parseNatural('1667 and 1668 and 1670');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('{1667,1668,1670}');
      expect(results[0].type).toBe('list');
    });

    it('should parse "both 1667 and 1668"', () => {
      const results = parseNatural('both 1667 and 1668');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('{1667,1668}');
    });

    it('should parse "1667 and 1668" (without both)', () => {
      const results = parseNatural('1667 and 1668');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('{1667,1668}');
    });
  });
});
