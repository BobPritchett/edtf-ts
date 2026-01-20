/**
 * Bound kind indicates whether a temporal bound is closed, open, or unknown.
 *
 * - `closed`: A concrete bound exists (normal dates)
 * - `open`: Unbounded, infinite (EDTF ".." notation)
 * - `unknown`: Bound exists but is unknown (EDTF empty endpoint like "1985/")
 */
export type BoundKind = 'closed' | 'open' | 'unknown';

/**
 * Precision level of a temporal value.
 *
 * - `second`, `minute`, `hour`, `day`, `month`, `year`: Standard precision levels
 * - `subyear`: Seasons and other sub-year groupings
 * - `mixed`: Different precisions for start and end (intervals)
 * - `unknown`: Precision cannot be determined
 */
export type Precision =
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'month'
  | 'year'
  | 'subyear'
  | 'mixed'
  | 'unknown';

/**
 * Qualifiers for temporal uncertainty and approximation.
 *
 * - `uncertain`: Marked with `?` in EDTF
 * - `approximate`: Marked with `~` in EDTF
 * - Both can be true (marked with `%` in EDTF)
 */
export interface Qualifiers {
  uncertain?: boolean;
  approximate?: boolean;
}

/**
 * Member represents one possible time range implied by an EDTF expression.
 *
 * All EDTF values are modeled as ranges with four bounds:
 * - sMin/sMax: Earliest and latest possible start times
 * - eMin/eMax: Earliest and latest possible end times
 *
 * This four-bound model allows representing uncertainty:
 * - "1985" → sMin=1985-01-01 00:00, sMax=1985-01-01 00:00, eMin=1985-12-31 23:59:59.999, eMax=1985-12-31 23:59:59.999
 * - "198X" → sMin=1980-01-01 00:00, sMax=1989-01-01 00:00, eMin=1980-12-31 23:59:59.999, eMax=1989-12-31 23:59:59.999
 *
 * Bounds are stored as BigInt milliseconds since Unix epoch for precision with extreme years.
 */
export interface Member {
  /** Earliest possible start time (epoch milliseconds) */
  sMin: bigint | null;

  /** Latest possible start time (epoch milliseconds) */
  sMax: bigint | null;

  /** Earliest possible end time (epoch milliseconds) */
  eMin: bigint | null;

  /** Latest possible end time (epoch milliseconds) */
  eMax: bigint | null;

  /** Kind of start bound */
  startKind: BoundKind;

  /** Kind of end bound */
  endKind: BoundKind;

  /** Precision of the temporal value */
  precision: Precision;

  /** Optional qualifiers for uncertainty and approximation */
  qualifiers?: Qualifiers;
}

/**
 * Shape represents a collection of Members with set semantics.
 *
 * - For simple values (Date, DateTime, Interval, Season): one Member
 * - For Sets/Lists: multiple Members
 *
 * `listMode` determines how to combine multiple Members:
 * - `oneOf`: One member applies (EDTF `[...]` sets) - use ANY quantifier
 * - `allOf`: All members apply (EDTF `{...}` lists) - use ALL quantifier
 */
export interface Shape {
  members: Member[];
  listMode?: 'oneOf' | 'allOf';
}
