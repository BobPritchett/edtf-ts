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

  describe('Northern Hemisphere Seasons (Level 2)', () => {
    it('should parse "Spring (Northern Hemisphere) 1985"', () => {
      const results = parseNatural('Spring (Northern Hemisphere) 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-25');
      expect(results[0].type).toBe('season');
    });

    it('should parse "Summer (Northern Hemisphere) 1985"', () => {
      const results = parseNatural('Summer (Northern Hemisphere) 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-26');
    });

    it('should parse "Fall (Northern Hemisphere) 1985"', () => {
      const results = parseNatural('Fall (Northern Hemisphere) 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-27');
    });

    it('should parse "Winter (Northern Hemisphere) 1985"', () => {
      const results = parseNatural('Winter (Northern Hemisphere) 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-28');
    });
  });

  describe('Southern Hemisphere Seasons (Level 2)', () => {
    it('should parse "Spring (Southern Hemisphere) 1985"', () => {
      const results = parseNatural('Spring (Southern Hemisphere) 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-29');
      expect(results[0].type).toBe('season');
    });

    it('should parse "Summer (Southern Hemisphere) 1985"', () => {
      const results = parseNatural('Summer (Southern Hemisphere) 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-30');
    });

    it('should parse "Autumn (Southern Hemisphere) 1985"', () => {
      const results = parseNatural('Autumn (Southern Hemisphere) 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-31');
    });

    it('should parse "Winter (Southern Hemisphere) 1985"', () => {
      const results = parseNatural('Winter (Southern Hemisphere) 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-32');
    });
  });

  describe('Quarters (Level 2)', () => {
    it('should parse "Q1 1985"', () => {
      const results = parseNatural('Q1 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-33');
      expect(results[0].type).toBe('season');
    });

    it('should parse "Q2 1985"', () => {
      const results = parseNatural('Q2 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-34');
    });

    it('should parse "Quarter 1 1985"', () => {
      const results = parseNatural('Quarter 1 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-33');
    });

    it('should parse "1st Quarter 1985"', () => {
      const results = parseNatural('1st Quarter 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-33');
    });

    it('should parse "First Quarter 1985"', () => {
      const results = parseNatural('First Quarter 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-33');
    });

    it('should parse "4th Quarter 1985"', () => {
      const results = parseNatural('4th Quarter 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-36');
    });
  });

  describe('Quadrimesters (Level 2)', () => {
    it('should parse "Quadrimester 1 1985"', () => {
      const results = parseNatural('Quadrimester 1 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-37');
      expect(results[0].type).toBe('season');
    });

    it('should parse "1st Quadrimester 1985"', () => {
      const results = parseNatural('1st Quadrimester 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-37');
    });

    it('should parse "Second Quadrimester 1985"', () => {
      const results = parseNatural('Second Quadrimester 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-38');
    });

    it('should parse "3rd Quadrimester 1985"', () => {
      const results = parseNatural('3rd Quadrimester 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-39');
    });
  });

  describe('Semesters (Level 2)', () => {
    it('should parse "Semester 1 1985"', () => {
      const results = parseNatural('Semester 1 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-40');
      expect(results[0].type).toBe('season');
    });

    it('should parse "1st Semester 1985"', () => {
      const results = parseNatural('1st Semester 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-40');
    });

    it('should parse "Second Semester 1985"', () => {
      const results = parseNatural('Second Semester 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-41');
    });

    it('should parse "2nd Semester 1985"', () => {
      const results = parseNatural('2nd Semester 1985');
      expect(results).toHaveLength(1);
      expect(results[0].edtf).toBe('1985-41');
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
