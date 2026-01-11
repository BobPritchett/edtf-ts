import { describe, it, expect } from 'vitest';
import { parseNatural } from '../src';

describe('Unspecified Digits', () => {
  describe('Decades', () => {
    it('should parse "the 1960s"', () => {
      const results = parseNatural('the 1960s');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('196X');
    });

    it('should parse "1960s"', () => {
      const results = parseNatural('1960s');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('196X');
    });

    it('should parse "the sixties" (20th century default)', () => {
      const results = parseNatural('the sixties');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('196X');
    });

    it('should parse "60s" with century assumption', () => {
      const results = parseNatural('60s');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('196X');
    });

    it('should parse "the \'60s"', () => {
      const results = parseNatural("the '60s");
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('196X');
    });

    it('should parse "\'60s"', () => {
      const results = parseNatural("'60s");
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('196X');
    });
  });

  describe('Centuries', () => {
    it('should parse "the 1800s"', () => {
      const results = parseNatural('the 1800s'); // ambiguous century/decade
      expect(results).toHaveLength(2);
      expect(results[0]!.edtf).toBe('18XX');
      expect(results[1]!.edtf).toBe('180X');
    });

    it('should parse "1800s"', () => {
      const results = parseNatural('1800s'); // ambiguous century/decade
      expect(results).toHaveLength(2);
      expect(results[0]!.edtf).toBe('18XX');
      expect(results[1]!.edtf).toBe('180X');
    });

    it('should parse "the nineteenth century"', () => {
      const results = parseNatural('the nineteenth century');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('18XX');
    });

    it('should parse "19th century"', () => {
      const results = parseNatural('19th century');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('18XX');
    });

    it('should parse "the 19th century"', () => {
      const results = parseNatural('the 19th century');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('18XX');
    });

    it('should parse "19th c."', () => {
      const results = parseNatural('19th c.');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('18XX');
    });
  });

  describe('Partial Unspecified', () => {
    it('should parse "sometime in 1999"', () => {
      const results = parseNatural('sometime in 1999');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('1999-XX-XX');
    });

    it('should parse "a month in 1999"', () => {
      const results = parseNatural('a month in 1999');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('1999-XX');
    });

    it('should parse "some month in 1999"', () => {
      const results = parseNatural('some month in 1999');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('1999-XX');
    });

    it('should parse "a day in January 1872"', () => {
      const results = parseNatural('a day in January 1872');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('1872-01-XX');
    });

    it('should parse "some day in January 1872"', () => {
      const results = parseNatural('some day in January 1872');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('1872-01-XX');
    });

    it('should parse "sometime in January 1872"', () => {
      const results = parseNatural('sometime in January 1872');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('1872-01-XX');
    });
  });

  describe('Qualified Decades', () => {
    it('should parse "circa 1960s"', () => {
      const results = parseNatural('circa 1960s');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('196X~');
    });

    it('should parse "possibly 1960s"', () => {
      const results = parseNatural('possibly 1960s');
      expect(results).toHaveLength(1);
      expect(results[0]!.edtf).toBe('196X?');
    });
  });
});
