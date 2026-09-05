/**
 * Normalize EDTFDateTime to Member.
 *
 * EDTFDateTime represents a date with time components:
 * - "2024-05-01T10:32Z" → 10:32:00.000 to 10:32:59.999
 * - "2024-05-01T10:32:45Z" → 10:32:45.000 to 10:32:45.999
 *
 * Time precision determines the range width.
 */

import type { EDTFDateTime } from '../types/index.js';
import type { Member, Precision } from '../compare-types/index.js';
import { dateToEpochMs } from './epoch.js';

/**
 * Normalize an EDTFDateTime to a Member.
 *
 * The range spans the full smallest time unit specified:
 * - Hour: HH:00:00.000 to HH:59:59.999
 * - Minute: HH:MM:00.000 to HH:MM:59.999
 * - Second: HH:MM:SS.000 to HH:MM:SS.999
 * - Fraction: .1 spans 100–199 ms; .123 spans exactly 123 ms
 */
export function normalizeDateTime(datetime: EDTFDateTime): Member {
  const { year, month, day, hour, minute, second, fractionalSecond } = datetime;
  const millisecond = Number(fractionalSecond?.padEnd(3, '0') ?? 0);
  const width = 10 ** (3 - (fractionalSecond?.length ?? 0));

  // Determine time precision
  let precision: Precision;
  if (second !== undefined) {
    precision = 'second';
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
    millisecond,
  });

  // Calculate end bound (end of the time unit)
  let eMax: bigint;

  if (second !== undefined) {
    // A written fraction refines the second without changing the precision enum.
    eMax = dateToEpochMs({
      year,
      month,
      day,
      hour,
      minute: minute!,
      second,
      millisecond: millisecond + width - 1,
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
  const offsetMatch = datetime.timezone?.match(/^([+-])(\d{2})(?::(\d{2}))?$/);
  const offset = offsetMatch
    ? (offsetMatch[1] === '-' ? -1 : 1) *
      (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3] ?? 0))
    : 0;
  const shift = BigInt(offset) * 60000n;
  return {
    timeDomain: datetime.timezone ? 'absolute' : 'floating',
    sMin: sMin - shift,
    sMax: sMin - shift, // Start is precise to the millisecond
    eMin: eMax - shift, // End is precise to the millisecond
    eMax: eMax - shift,
    startKind: 'closed',
    endKind: 'closed',
    precision,
  };
}
