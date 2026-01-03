import { describe, it, expect } from 'vitest';
import { calculateAgeRange, renderAgeBirthday, LIFE_STAGES } from '../src/index.js';

// Reference date for all tests: 2025-06-01
const REF_DATE = new Date(2025, 5, 1); // June 1, 2025

describe('calculateAgeRange', () => {
  describe('exact dates', () => {
    it('should calculate age from exact birthdate', () => {
      // Person born March 15, 2005 is 20 on June 1, 2025
      expect(calculateAgeRange('2005-03-15', REF_DATE)).toEqual([20, 20]);
    });

    it('should calculate age when birthday has not passed yet', () => {
      // Person born August 15, 2005 is still 19 on June 1, 2025
      expect(calculateAgeRange('2005-08-15', REF_DATE)).toEqual([19, 19]);
    });

    it('should return [0, 120] for unspecified year (XXXX-MM-DD)', () => {
      expect(calculateAgeRange('XXXX-03-15', REF_DATE)).toEqual([0, 120]);
    });
  });

  describe('intervals', () => {
    it('should calculate age range from interval', () => {
      // Interval ?2002-03-15/?2005-03-15 means ages 20-23
      expect(calculateAgeRange('?2002-03-15/?2005-03-15', REF_DATE)).toEqual([20, 23]);
    });

    it('should handle uncertain component intervals', () => {
      // Age 20 yo without birthday: ?2004-?06-?02/?2005-?06-?01
      // Earliest birth June 2, 2004 = age 20 (turns 21 tomorrow)
      // Latest birth June 1, 2005 = age 20 (turned 20 today)
      const result = calculateAgeRange('?2004-?06-?02/?2005-?06-?01', REF_DATE);
      expect(result).toEqual([20, 20]);
    });

    it('should handle open start interval (senior)', () => {
      // ../1960-06-01 means 65+ years old
      const result = calculateAgeRange('../?1960-?06-?01', REF_DATE);
      expect(result[0]).toBe(65);
      expect(result[1]).toBeNull();
    });
  });
});

describe('renderAgeBirthday', () => {
  describe('exact dates', () => {
    it('should render exact birthdate with age and birthday', () => {
      const result = renderAgeBirthday('2005-03-15', { currentDate: REF_DATE });
      expect(result.age).toBe('20 years old');
      expect(result.birthday).toBe('March 15th');
      expect(result.formatted).toBe('20 years old, birthday March 15th');
      expect(result.ageRange).toEqual([20, 20]);
      expect(result.birthdayKnown).toEqual({ month: true, day: true });
    });

    it('should render unspecified year (birthday only)', () => {
      const result = renderAgeBirthday('XXXX-03-15', { currentDate: REF_DATE });
      expect(result.birthday).toBe('March 15th');
      expect(result.birthdayKnown).toEqual({ month: true, day: true });
      expect(result.ageRange).toEqual([0, 120]);
    });
  });

  describe('intervals with known birthday', () => {
    it('should render age range with known birthday (month + day)', () => {
      // early 20s with birthday March 15: ?2002-03-15/?2005-03-15
      const result = renderAgeBirthday('?2002-03-15/?2005-03-15', { currentDate: REF_DATE });
      expect(result.age).toBe('early 20s');
      expect(result.birthday).toBe('March 15th');
      expect(result.formatted).toBe('early 20s, birthday March 15th');
      expect(result.ageRange).toEqual([20, 23]);
      expect(result.birthdayKnown).toEqual({ month: true, day: true });
    });

    it('should render age range with known month only', () => {
      // 20 yo with March birthday: 2005-03-?01/2005-03-?31
      const result = renderAgeBirthday('2005-03-?01/2005-03-?31', { currentDate: REF_DATE });
      expect(result.age).toBe('20 years old');
      expect(result.birthday).toBe('March');
      expect(result.formatted).toBe('20 years old, March birthday');
      expect(result.birthdayKnown).toEqual({ month: true, day: false });
    });
  });

  describe('intervals without known birthday', () => {
    it('should render age only when birthday is unknown', () => {
      // 20 yo: ?2004-?06-?02/?2005-?06-?01
      const result = renderAgeBirthday('?2004-?06-?02/?2005-?06-?01', { currentDate: REF_DATE });
      expect(result.age).toBe('20 years old');
      expect(result.birthday).toBeNull();
      expect(result.formatted).toBe('20 years old');
      expect(result.birthdayKnown).toEqual({ month: false, day: false });
    });

    it('should render teenager when age range matches', () => {
      // teenager: ?2005-?06-?02/?2012-?06-?01 = ages 13-19
      const result = renderAgeBirthday('?2005-?06-?02/?2012-?06-?01', { currentDate: REF_DATE });
      expect(result.age).toBe('teenager');
      expect(result.formatted).toBe('teenager');
    });
  });

  describe('open-ended intervals', () => {
    it('should render senior with vocabulary style (default)', () => {
      // senior: ../?1960-?06-?01
      const result = renderAgeBirthday('../?1960-?06-?01', { currentDate: REF_DATE });
      expect(result.age).toBe('senior');  // Vocabulary style (default)
      expect(result.birthday).toBeNull();
      expect(result.ageRange[0]).toBe(65);
      expect(result.ageRange[1]).toBeNull();
    });

    it('should render 65+ with numeric style', () => {
      const result = renderAgeBirthday('../?1960-?06-?01', {
        currentDate: REF_DATE,
        ageStyle: 'numeric',
      });
      expect(result.age).toBe('65+ years old');
    });
  });

  describe('format options', () => {
    it('should render age-only format', () => {
      const result = renderAgeBirthday('2005-03-15', {
        currentDate: REF_DATE,
        format: 'age-only',
      });
      expect(result.formatted).toBe('20 years old');
    });

    it('should render birthday-only format', () => {
      const result = renderAgeBirthday('2005-03-15', {
        currentDate: REF_DATE,
        format: 'birthday-only',
      });
      expect(result.formatted).toBe('March 15th birthday');
    });

    it('should use numeric age style', () => {
      const result = renderAgeBirthday('?2005-?06-?02/?2012-?06-?01', {
        currentDate: REF_DATE,
        ageStyle: 'numeric',
      });
      expect(result.age).toBe('13–19 years old');
    });

    it('should use short age length', () => {
      const result = renderAgeBirthday('2005-03-15', {
        currentDate: REF_DATE,
        ageLength: 'short',
      });
      expect(result.age).toBe('20yo');
    });

    it('should use medium age length', () => {
      const result = renderAgeBirthday('2005-03-15', {
        currentDate: REF_DATE,
        ageLength: 'medium',
      });
      expect(result.age).toBe('20 y/o');
    });
  });

  describe('decade matching', () => {
    it('should match early 20s (20-23)', () => {
      const result = renderAgeBirthday('?2001-?06-?02/?2005-?06-?01', {
        currentDate: REF_DATE,
        ageStyle: 'vocabulary',
      });
      expect(result.age).toBe('early 20s');
    });

    it('should match mid 30s (34-36)', () => {
      // Create interval for ages 34-36
      const result = renderAgeBirthday('?1988-?06-?02/?1991-?06-?01', {
        currentDate: REF_DATE,
        ageStyle: 'vocabulary',
      });
      expect(result.age).toBe('mid 30s');
    });

    it('should match late 40s (47-49)', () => {
      // Create interval for ages 47-49
      const result = renderAgeBirthday('?1975-?06-?02/?1978-?06-?01', {
        currentDate: REF_DATE,
        ageStyle: 'vocabulary',
      });
      expect(result.age).toBe('late 40s');
    });
  });
});

describe('LIFE_STAGES', () => {
  it('should have all expected life stages', () => {
    const stageNames = LIFE_STAGES.map(s => s.name);
    expect(stageNames).toContain('newborn');
    expect(stageNames).toContain('toddler');
    expect(stageNames).toContain('teenager');
    expect(stageNames).toContain('senior');
  });

  it('should have senior as open-ended', () => {
    const senior = LIFE_STAGES.find(s => s.name === 'senior');
    expect(senior?.minYears).toBe(65);
    expect(senior?.maxYears).toBeNull();
  });
});
