import { describe, it, expect } from 'vitest';
import { parse } from '@edtf-ts/core';
import { normalize } from '../../src/normalization/index.js';

describe('date normalization', () => {
  it('normalizes a simple year', () => {
    const result = parse('1985');
    expect(result.success).toBe(true);

    if (result.success) {
      const shape = normalize(result.value);

      expect(shape.members).toHaveLength(1);
      const member = shape.members[0]!;

      expect(member.startKind).toBe('closed');
      expect(member.endKind).toBe('closed');
      expect(member.precision).toBe('year');

      // Should span entire year 1985
      expect(member.sMin).not.toBeNull();
      expect(member.eMax).not.toBeNull();
    }
  });

  it('normalizes a year-month', () => {
    const result = parse('1985-04');
    expect(result.success).toBe(true);

    if (result.success) {
      const shape = normalize(result.value);
      const member = shape.members[0]!;

      expect(member.precision).toBe('month');
      // Should span entire April 1985
    }
  });

  it('normalizes a full date', () => {
    const result = parse('1985-04-12');
    expect(result.success).toBe(true);

    if (result.success) {
      const shape = normalize(result.value);
      const member = shape.members[0]!;

      expect(member.precision).toBe('day');
      // Should span entire day (00:00:00.000 to 23:59:59.999)
    }
  });

  it('handles unspecified year digits', () => {
    const result = parse('198X');
    expect(result.success).toBe(true);

    if (result.success) {
      const shape = normalize(result.value);
      const member = shape.members[0]!;

      expect(member.precision).toBe('year');
      // Should span 1980-1989
    }
  });

  it('handles uncertain qualification', () => {
    const result = parse('1985?');
    expect(result.success).toBe(true);

    if (result.success) {
      const shape = normalize(result.value);
      const member = shape.members[0]!;

      expect(member.qualifiers?.uncertain).toBe(true);
    }
  });

  it('handles approximate qualification', () => {
    const result = parse('1985~');
    expect(result.success).toBe(true);

    if (result.success) {
      const shape = normalize(result.value);
      const member = shape.members[0]!;

      expect(member.qualifiers?.approximate).toBe(true);
    }
  });
});
