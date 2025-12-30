/**
 * Normalize EDTFDateTime to Member.
 *
 * EDTFDateTime represents a date with time components:
 * - "2024-05-01T10:32Z" → 10:32:00.000 to 10:32:59.999
 * - "2024-05-01T10:32:45Z" → 10:32:45.000 to 10:32:45.999
 *
 * Time precision determines the range width.
 */

import type { EDTFDateTime } from '@edtf-ts/core';
import type { Member, Precision } from '../types/index.js';
import { dateToEpochMs } from './epoch.js';

/**
 * Normalize an EDTFDateTime to a Member.
 *
 * The range spans the full smallest time unit specified:
 * - Hour: HH:00:00.000 to HH:59:59.999
 * - Minute: HH:MM:00.000 to HH:MM:59.999
 * - Second: HH:MM:SS.000 to HH:MM:SS.999
 */
export function normalizeDateTime(datetime: EDTFDateTime): Member {
  const { year, month, day, hour, minute, second } = datetime;

  // Determine time precision
  let precision: Precision;
  if (second !== undefined) {
    precision = 'minute'; // We treat seconds as minute precision for simplicity
  } else if (minute !== undefined) {
    precision = 'minute';
  } else {
    precision = 'hour';
  }

  // Calculate start bound (beginning of the time unit)
  const sMin = dateToEpochMs({
    year,
    month,
    day,
    hour,
    minute: minute ?? 0,
    second: second ?? 0,
    millisecond: 0,
  });

  // Calculate end bound (end of the time unit)
  let eMax: bigint;

  if (second !== undefined) {
    // Second precision: HH:MM:SS.000 to HH:MM:SS.999
    eMax = dateToEpochMs({
      year,
      month,
      day,
      hour,
      minute: minute!,
      second,
      millisecond: 999,
    });
  } else if (minute !== undefined) {
    // Minute precision: HH:MM:00.000 to HH:MM:59.999
    eMax = dateToEpochMs({
      year,
      month,
      day,
      hour,
      minute,
      second: 59,
      millisecond: 999,
    });
  } else {
    // Hour precision: HH:00:00.000 to HH:59:59.999
    eMax = dateToEpochMs({
      year,
      month,
      day,
      hour,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
  }

  // For date-times, start and end are very close (same time unit)
  // sMax and eMin are the same as sMin and eMax
  return {
    sMin,
    sMax: sMin, // Start is precise to the millisecond
    eMin: eMax, // End is precise to the millisecond
    eMax,
    startKind: 'closed',
    endKind: 'closed',
    precision,
  };
}
