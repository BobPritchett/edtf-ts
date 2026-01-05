import { describe, it, expect } from 'vitest';
import { parse, isEDTFSet } from '../../src/index.js';

describe('Level 2 - Set Range Expansion', () => {
  it('should expand year ranges', () => {
    const result = parse('[1667..1669]');
    expect(result.success).toBe(true);

    if (result.success && isEDTFSet(result.value)) {
      expect(result.value.values).toHaveLength(3);
      expect(result.value.values[0]!.year).toBe(1667);
      expect(result.value.values[1]!.year).toBe(1668);
      expect(result.value.values[2]!.year).toBe(1669);
      // All should have year precision
      expect(result.value.values[0]!.precision).toBe('year');
      expect(result.value.values[1]!.precision).toBe('year');
      expect(result.value.values[2]!.precision).toBe('year');
    }
  });

  it('should expand month ranges within same year', () => {
    const result = parse('[2025-01..2025-03]');
    expect(result.success).toBe(true);

    if (result.success && isEDTFSet(result.value)) {
      expect(result.value.values).toHaveLength(3);
      expect(result.value.values[0]!.edtf).toBe('2025-01');
      expect(result.value.values[1]!.edtf).toBe('2025-02');
      expect(result.value.values[2]!.edtf).toBe('2025-03');
      // All should have month precision
      expect(result.value.values[0]!.precision).toBe('month');
      expect(result.value.values[1]!.precision).toBe('month');
      expect(result.value.values[2]!.precision).toBe('month');
    }
  });

  it('should expand month ranges across years', () => {
    const result = parse('[2025-11..2026-02]');
    expect(result.success).toBe(true);

    if (result.success && isEDTFSet(result.value)) {
      expect(result.value.values).toHaveLength(4);
      expect(result.value.values[0]!.edtf).toBe('2025-11');
      expect(result.value.values[1]!.edtf).toBe('2025-12');
      expect(result.value.values[2]!.edtf).toBe('2026-01');
      expect(result.value.values[3]!.edtf).toBe('2026-02');
      // All should have month precision
      result.value.values.forEach(v => {
        expect(v.precision).toBe('month');
      });
    }
  });

  it('should expand large month ranges', () => {
    const result = parse('[2025-01..2026-11]');
    expect(result.success).toBe(true);

    if (result.success && isEDTFSet(result.value)) {
      expect(result.value.values).toHaveLength(23); // Jan 2025 through Nov 2026
      expect(result.value.values[0]!.edtf).toBe('2025-01');
      expect(result.value.values[22]!.edtf).toBe('2026-11');
      // All should have month precision
      result.value.values.forEach(v => {
        expect(v.precision).toBe('month');
      });
    }
  });

  it('should expand day ranges within same month', () => {
    const result = parse('[2025-01-15..2025-01-20]');
    expect(result.success).toBe(true);

    if (result.success && isEDTFSet(result.value)) {
      expect(result.value.values).toHaveLength(6);
      expect(result.value.values[0]!.edtf).toBe('2025-01-15');
      expect(result.value.values[1]!.edtf).toBe('2025-01-16');
      expect(result.value.values[2]!.edtf).toBe('2025-01-17');
      expect(result.value.values[3]!.edtf).toBe('2025-01-18');
      expect(result.value.values[4]!.edtf).toBe('2025-01-19');
      expect(result.value.values[5]!.edtf).toBe('2025-01-20');
      // All should have day precision
      result.value.values.forEach(v => {
        expect(v.precision).toBe('day');
      });
    }
  });

  it('should expand day ranges across months', () => {
    const result = parse('[2025-01-30..2025-02-02]');
    expect(result.success).toBe(true);

    if (result.success && isEDTFSet(result.value)) {
      expect(result.value.values).toHaveLength(4);
      expect(result.value.values[0]!.edtf).toBe('2025-01-30');
      expect(result.value.values[1]!.edtf).toBe('2025-01-31');
      expect(result.value.values[2]!.edtf).toBe('2025-02-01');
      expect(result.value.values[3]!.edtf).toBe('2025-02-02');
      // All should have day precision
      result.value.values.forEach(v => {
        expect(v.precision).toBe('day');
      });
    }
  });

  it('should reject ranges with mismatched precision', () => {
    // Mismatched precision causes parse failure
    const result = parse('[2025-01..2026]');
    expect(result.success).toBe(false);
    // Error comes from general parsing, not from range expansion
    expect(result.errors?.[0]?.code).toBe('INVALID_FORMAT');
  });

  it('should handle mixed set values and ranges', () => {
    const result = parse('[1667,1668,1670..1672]');
    expect(result.success).toBe(true);

    if (result.success && isEDTFSet(result.value)) {
      expect(result.value.values).toHaveLength(5);
      expect(result.value.values[0]!.year).toBe(1667);
      expect(result.value.values[1]!.year).toBe(1668);
      expect(result.value.values[2]!.year).toBe(1670);
      expect(result.value.values[3]!.year).toBe(1671);
      expect(result.value.values[4]!.year).toBe(1672);
    }
  });
});
