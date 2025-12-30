import { describe, it, expect } from 'vitest';
import { parse } from '../src/index.js';

describe('Level 2 - Intervals with Partial Qualifications', () => {
  it('should parse interval with qualified day components', () => {
    const result = parse('2004-06-~01/2004-06-~20');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.level).toBe(2);
      expect(result.value.type).toBe('Interval');
      expect(result.value.start?.type).toBe('Date');
      expect(result.value.start?.year).toBe(2004);
      expect(result.value.start?.month).toBe(6);
      expect(result.value.start?.day).toBe(1);
      expect(result.value.start?.dayQualification).toEqual({ approximate: true });
      expect(result.value.end?.type).toBe('Date');
      expect(result.value.end?.year).toBe(2004);
      expect(result.value.end?.month).toBe(6);
      expect(result.value.end?.day).toBe(20);
      expect(result.value.end?.dayQualification).toEqual({ approximate: true });
    }
  });

  it('should parse interval with qualified month components', () => {
    const result = parse('2004-~06/2004-~08');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.level).toBe(2);
      expect(result.value.type).toBe('Interval');
      expect(result.value.start?.monthQualification).toEqual({ approximate: true });
      expect(result.value.end?.monthQualification).toEqual({ approximate: true });
    }
  });

  it('should parse interval with qualifier before year', () => {
    const result = parse('?2004-06/2004-08');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.level).toBe(2);
      expect(result.value.type).toBe('Interval');
      expect(result.value.start?.yearQualification).toEqual({ uncertain: true });
    }
  });

  it('should parse interval with qualifier after year before month', () => {
    const result = parse('2004?-06/2004-08');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.level).toBe(2);
      expect(result.value.type).toBe('Interval');
      expect(result.value.start?.yearQualification).toEqual({ uncertain: true });
    }
  });

  it('should parse mixed qualified and unqualified interval', () => {
    const result = parse('2004-06-~01/2004-07');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.level).toBe(2);
      expect(result.value.start?.dayQualification).toEqual({ approximate: true });
      expect(result.value.end?.dayQualification).toBeUndefined();
    }
  });

  it('should NOT parse Level 1 whole-date qualifications as Level 2', () => {
    // These should be handled by Level 1 parser
    const result = parse('1984?/2004');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.level).toBe(1);
      expect(result.value.type).toBe('Interval');
    }
  });

  it('should NOT parse terminal qualifications as Level 2', () => {
    // These should be handled by Level 1 parser
    const result = parse('1984/2004~');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.level).toBe(1);
      expect(result.value.type).toBe('Interval');
    }
  });
});
