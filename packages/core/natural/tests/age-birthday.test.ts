import { describe, it, expect } from 'vitest';
import { parseAgeBirthday } from '../src/age-birthday.js';

// Reference date for all tests: 2025-06-01
const REF_DATE = new Date(2025, 5, 1); // June 1, 2025

describe('parseAgeBirthday', () => {
  describe('birth markers (handoff to parseNatural)', () => {
    it('should parse "b. 1902"', () => {
      const result = parseAgeBirthday('b. 1902', { currentDate: REF_DATE });
      expect(result.edtf).toBe('1902');
      expect(result.type).toBe('date');
    });

    it('should parse "born c. 1871"', () => {
      const result = parseAgeBirthday('born c. 1871', { currentDate: REF_DATE });
      expect(result.edtf).toBe('1871~');
    });

    it('should parse "dob: March 15, 2005"', () => {
      const result = parseAgeBirthday('dob: March 15, 2005', { currentDate: REF_DATE });
      expect(result.edtf).toBe('2005-03-15');
    });
  });

  describe('age only (no birthday info)', () => {
    it('should parse "20 yo"', () => {
      const result = parseAgeBirthday('20 yo', { currentDate: REF_DATE });
      expect(result.edtf).toBe('?2004-?06-?02/?2005-?06-?01');
      expect(result.type).toBe('interval');
      expect(result.ageRange).toEqual([20, 20]);
    });

    it('should parse "20 y/o"', () => {
      const result = parseAgeBirthday('20 y/o', { currentDate: REF_DATE });
      expect(result.edtf).toBe('?2004-?06-?02/?2005-?06-?01');
    });

    it('should parse "20 years old"', () => {
      const result = parseAgeBirthday('20 years old', { currentDate: REF_DATE });
      expect(result.edtf).toBe('?2004-?06-?02/?2005-?06-?01');
    });

    it('should parse "age 35"', () => {
      const result = parseAgeBirthday('age 35', { currentDate: REF_DATE });
      expect(result.ageRange).toEqual([35, 35]);
    });
  });

  describe('age with birthday constraint', () => {
    it('should parse "20 y/o, March birthday"', () => {
      const result = parseAgeBirthday('20 y/o, March birthday', { currentDate: REF_DATE });
      expect(result.edtf).toBe('2005-03-?01/2005-03-?31');
      expect(result.type).toBe('interval');
      expect(result.birthdayKnown).toEqual({ month: 3 });
    });

    it('should parse "20 y/o, birthday 3/15"', () => {
      const result = parseAgeBirthday('20 y/o, birthday 3/15', { currentDate: REF_DATE });
      expect(result.edtf).toBe('2005-03-15');
      expect(result.type).toBe('date');
      expect(result.birthdayKnown).toEqual({ month: 3, day: 15 });
    });

    it('should parse "20 years old, March 15th birthday"', () => {
      const result = parseAgeBirthday('20 years old, March 15th birthday', { currentDate: REF_DATE });
      expect(result.edtf).toBe('2005-03-15');
    });

    it('should handle birthday before reference month (birthday passed)', () => {
      // March 15 has passed when ref is June 1
      const result = parseAgeBirthday('20 yo, birthday March 15', { currentDate: REF_DATE });
      expect(result.edtf).toBe('2005-03-15');
    });

    it('should handle birthday after reference month (birthday not passed)', () => {
      // August 15 has not passed when ref is June 1
      const result = parseAgeBirthday('20 yo, birthday August 15', { currentDate: REF_DATE });
      // If birthday hasn't passed, person is 20 but was born in 2004
      expect(result.edtf).toBe('2004-08-15');
    });
  });

  describe('age ranges', () => {
    it('should parse "22-26 yo"', () => {
      const result = parseAgeBirthday('22-26 yo', { currentDate: REF_DATE });
      expect(result.ageRange).toEqual([22, 26]);
      expect(result.type).toBe('interval');
    });

    it('should parse "22 to 26 years old"', () => {
      const result = parseAgeBirthday('22 to 26 years old', { currentDate: REF_DATE });
      expect(result.ageRange).toEqual([22, 26]);
    });
  });

  describe('decade phrases', () => {
    it('should parse "early 20s"', () => {
      const result = parseAgeBirthday('early 20s', { currentDate: REF_DATE });
      expect(result.edtf).toBe('?2001-?06-?02/?2005-?06-?01');
      expect(result.ageRange).toEqual([20, 23]);
    });

    it('should parse "mid-thirties"', () => {
      const result = parseAgeBirthday('mid-thirties', { currentDate: REF_DATE });
      expect(result.ageRange).toEqual([34, 36]);
    });

    it('should parse "late twenties"', () => {
      const result = parseAgeBirthday('late twenties', { currentDate: REF_DATE });
      expect(result.ageRange).toEqual([27, 29]);
    });

    it('should parse "30s"', () => {
      const result = parseAgeBirthday('30s', { currentDate: REF_DATE });
      expect(result.ageRange).toEqual([30, 39]);
    });

    it('should parse "early 20s, birthday 3/15"', () => {
      const result = parseAgeBirthday('early 20s, birthday 3/15', { currentDate: REF_DATE });
      expect(result.edtf).toBe('?2002-03-15/?2005-03-15');
      expect(result.birthdayKnown).toEqual({ month: 3, day: 15 });
    });
  });

  describe('life stages', () => {
    it('should parse "teenager"', () => {
      const result = parseAgeBirthday('teenager', { currentDate: REF_DATE });
      expect(result.edtf).toBe('?2005-?06-?02/?2012-?06-?01');
      expect(result.ageRange).toEqual([13, 19]);
    });

    it('should parse "toddler"', () => {
      const result = parseAgeBirthday('toddler', { currentDate: REF_DATE });
      expect(result.ageRange).toEqual([1, 3]);
    });

    it('should parse "senior"', () => {
      const result = parseAgeBirthday('senior', { currentDate: REF_DATE });
      expect(result.edtf).toBe('../?1960-?06-?01');
      expect(result.ageRange).toEqual([65, null]);
    });

    it('should parse "early teens"', () => {
      const result = parseAgeBirthday('early teens', { currentDate: REF_DATE });
      expect(result.ageRange).toEqual([13, 15]);
    });

    it('should parse "mid teens"', () => {
      const result = parseAgeBirthday('mid teens', { currentDate: REF_DATE });
      expect(result.ageRange).toEqual([16, 17]);
    });

    it('should parse "late teens"', () => {
      const result = parseAgeBirthday('late teens', { currentDate: REF_DATE });
      expect(result.ageRange).toEqual([18, 19]);
    });

    it('should parse "toddler, August birthday"', () => {
      const result = parseAgeBirthday('toddler, August birthday', { currentDate: REF_DATE });
      // Toddler = 1-3 years, August birthday (after June 1, so hasn't passed yet)
      // Should generate interval with known month August
      expect(result.ageRange).toEqual([1, 3]);
      expect(result.birthdayKnown).toEqual({ month: 8 });
      expect(result.edtf).toMatch(/^\?20\d{2}-08-\?01\/\?20\d{2}-08-\?31$/);
    });

    it('should parse "infant, March birthday"', () => {
      const result = parseAgeBirthday('infant, March birthday', { currentDate: REF_DATE });
      // Infant = 0-1 years, March birthday (before June 1, so already passed)
      expect(result.ageRange).toEqual([0, 1]);
      expect(result.birthdayKnown).toEqual({ month: 3 });
    });
  });

  describe('birthday only (no age)', () => {
    it('should parse "March 15th birthday"', () => {
      const result = parseAgeBirthday('March 15th birthday', { currentDate: REF_DATE });
      expect(result.edtf).toBe('XXXX-03-15');
      expect(result.birthdayKnown).toEqual({ month: 3, day: 15 });
    });

    it('should parse "birthday March 15"', () => {
      const result = parseAgeBirthday('birthday March 15', { currentDate: REF_DATE });
      expect(result.edtf).toBe('XXXX-03-15');
    });

    it('should parse "birthday 3/15"', () => {
      const result = parseAgeBirthday('birthday 3/15', { currentDate: REF_DATE });
      expect(result.edtf).toBe('XXXX-03-15');
    });
  });

  describe('infant ages', () => {
    it('should parse "6 months old"', () => {
      const result = parseAgeBirthday('6 months old', { currentDate: REF_DATE });
      expect(result.type).toBe('interval');
      // Should be approximately 6 months ago: Dec 2024 to Jan 2025
      expect(result.edtf).toMatch(/\?202[45]-\?\d{2}-\?\d{2}\/\?202[45]-\?\d{2}-\?\d{2}/);
    });

    it('should parse "2 weeks old"', () => {
      const result = parseAgeBirthday('2 weeks old', { currentDate: REF_DATE });
      expect(result.type).toBe('interval');
    });

    it('should parse "10 days"', () => {
      const result = parseAgeBirthday('10 days', { currentDate: REF_DATE });
      expect(result.type).toBe('interval');
    });
  });

  describe('qualifiers', () => {
    it('should handle "about 30 years old"', () => {
      const result = parseAgeBirthday('about 30 years old', { currentDate: REF_DATE });
      expect(result.ageRange).toEqual([30, 30]);
      // Note: qualifiers are recorded but may not modify EDTF for intervals
    });

    it('should handle "circa 1990"', () => {
      const result = parseAgeBirthday('born circa 1990', { currentDate: REF_DATE });
      expect(result.edtf).toContain('~');
    });
  });

  describe('error handling', () => {
    it('should throw for empty input', () => {
      expect(() => parseAgeBirthday('', { currentDate: REF_DATE })).toThrow();
    });

    it('should throw for unparseable input', () => {
      expect(() => parseAgeBirthday('random text', { currentDate: REF_DATE })).toThrow();
    });
  });

  describe('spec compliance examples', () => {
    // Examples from the spec with currentDate = 2025-06-01
    const testCases = [
      { input: '20 yo', expected: '?2004-?06-?02/?2005-?06-?01' },
      { input: '20 y/o, March birthday', expected: '2005-03-?01/2005-03-?31' },
      { input: '20 y/o, birthday 3/15', expected: '2005-03-15' },
      { input: 'early 20s', expected: '?2001-?06-?02/?2005-?06-?01' },
      { input: 'early 20s, birthday 3/15', expected: '?2002-03-15/?2005-03-15' },
      { input: 'teenager', expected: '?2005-?06-?02/?2012-?06-?01' },
      { input: 'March 15th birthday', expected: 'XXXX-03-15' },
      { input: 'senior', expected: '../?1960-?06-?01' },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should parse "${input}" as "${expected}"`, () => {
        const result = parseAgeBirthday(input, { currentDate: REF_DATE });
        expect(result.edtf).toBe(expected);
      });
    });
  });
});
