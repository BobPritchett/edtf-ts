/**
 * Type guards for EDTF types
 */

import type { EDTFDate, EDTFDateTime, EDTFInterval, EDTFSeason, EDTFSet, EDTFList } from './types/index.js';

/**
 * Type guard to check if a value is an EDTFDate.
 */
export function isEDTFDate(value: unknown): value is EDTFDate {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Date';
}

/**
 * Type guard to check if a value is an EDTFDateTime.
 */
export function isEDTFDateTime(value: unknown): value is EDTFDateTime {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'DateTime';
}

/**
 * Type guard to check if a value is an EDTFInterval.
 */
export function isEDTFInterval(value: unknown): value is EDTFInterval {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Interval';
}

/**
 * Type guard to check if a value is an EDTFSeason.
 */
export function isEDTFSeason(value: unknown): value is EDTFSeason {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Season';
}

/**
 * Type guard to check if a value is an EDTFSet.
 */
export function isEDTFSet(value: unknown): value is EDTFSet {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Set';
}

/**
 * Type guard to check if a value is an EDTFList.
 */
export function isEDTFList(value: unknown): value is EDTFList {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'List';
}
