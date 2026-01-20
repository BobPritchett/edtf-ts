/**
 * Database columns for storing EDTF temporal values.
 *
 * This structure enables efficient querying while preserving EDTF semantics.
 * The four-bound model (start_min_ms, start_max_ms, end_min_ms, end_max_ms)
 * allows databases to perform fast range queries using standard indexes.
 *
 * Recommended SQL schema:
 * ```sql
 * CREATE TABLE events (
 *   edtf_text          TEXT NOT NULL,
 *   start_min_ms       BIGINT NULL,
 *   start_max_ms       BIGINT NULL,
 *   end_min_ms         BIGINT NULL,
 *   end_max_ms         BIGINT NULL,
 *   has_open_start     BOOLEAN NOT NULL,
 *   has_open_end       BOOLEAN NOT NULL,
 *   has_unknown_start  BOOLEAN NOT NULL,
 *   has_unknown_end    BOOLEAN NOT NULL,
 *   precision_rank     SMALLINT NOT NULL,
 *   is_set             BOOLEAN NOT NULL,
 *   set_mode           SMALLINT NULL,
 *   out_of_range       BOOLEAN NOT NULL
 * );
 *
 * CREATE INDEX ON events (start_min_ms);
 * CREATE INDEX ON events (end_max_ms);
 * ```
 */
export interface DbColumns {
  /** Original EDTF string */
  edtf_text: string;

  /** Earliest possible start time (epoch milliseconds, null for open/unknown) */
  start_min_ms: number | null;

  /** Latest possible start time (epoch milliseconds, null for open/unknown) */
  start_max_ms: number | null;

  /** Earliest possible end time (epoch milliseconds, null for open/unknown) */
  end_min_ms: number | null;

  /** Latest possible end time (epoch milliseconds, null for open/unknown) */
  end_max_ms: number | null;

  /** Start bound is open (unbounded, EDTF "..") */
  has_open_start: boolean;

  /** End bound is open (unbounded, EDTF "..") */
  has_open_end: boolean;

  /** Start bound is unknown (EDTF empty endpoint) */
  has_unknown_start: boolean;

  /** End bound is unknown (EDTF empty endpoint) */
  has_unknown_end: boolean;

  /**
   * Precision rank for sorting (higher = more precise).
   * second=7, minute=6, hour=5, day=4, month=3, year=2, subyear=1, mixed=0, unknown=0
   */
  precision_rank: number;

  /** Value is a set or list (multiple members) */
  is_set: boolean;

  /** Set mode: 0=oneOf ([...]), 1=allOf ({...}), null if not a set */
  set_mode: number | null;

  /**
   * Value exceeded safe millisecond range and was clamped.
   * Ordering is preserved but precision may be lost.
   */
  out_of_range: boolean;
}

/**
 * Options for preparing EDTF values for database storage.
 */
export interface PrepareOptions {
  /**
   * Clamp out-of-range millisecond values to database limits.
   * Default: true
   *
   * When true, extreme years beyond JavaScript Date range are clamped
   * to MIN_DB_MS/MAX_DB_MS and out_of_range is set to true.
   * Ordering is preserved but precision is lost.
   */
  clampOutOfRange?: boolean;

  /**
   * Flatten sets/lists to convex hull (single bounding range).
   * Default: true
   *
   * When true, sets/lists are stored as a single range spanning all members.
   * Database queries may return false positives (gaps are not represented).
   * Application must re-evaluate EDTF precisely after database retrieval.
   */
  flattenSets?: boolean;

  /**
   * Minimum safe millisecond value for database storage.
   * Default: -8_640_000_000_000_000 (JavaScript Date.MIN)
   */
  minDbMs?: bigint;

  /**
   * Maximum safe millisecond value for database storage.
   * Default: 8_640_000_000_000_000 (JavaScript Date.MAX)
   */
  maxDbMs?: bigint;
}

/**
 * Query fragment for database overlap queries.
 *
 * Contains SQL conditions and parameters for finding overlapping ranges.
 * Database-agnostic (use with any SQL database that supports BIGINT and NULL).
 */
export interface OverlapQuery {
  /**
   * SQL WHERE conditions (use with AND).
   * Example: ["(end_max_ms IS NULL OR end_max_ms >= :qStartMs)", ...]
   */
  conditions: string[];

  /**
   * Parameter values for the query.
   * Example: { qStartMs: 123456789, qEndMs: 987654321 }
   */
  parameters: Record<string, number | null>;
}

/**
 * Options for building overlap queries.
 */
export interface QueryOptions {
  /**
   * Column name prefix for the table.
   * Default: "" (no prefix)
   *
   * Example: "events." produces "events.start_min_ms"
   */
  tablePrefix?: string;

  /**
   * Include conditions for open/unknown bounds.
   * Default: true
   */
  includeSpecialBounds?: boolean;
}
