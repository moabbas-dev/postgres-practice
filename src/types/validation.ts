export type ValidationFailureReason =
  | 'query-error'
  | 'empty-result'
  | 'wrong-column-count'
  | 'wrong-column-names'
  | 'wrong-row-count'
  | 'missing-rows'
  | 'unexpected-rows'
  | 'wrong-values'
  | 'wrong-order'
  | 'timeout'

/** A per-row classification of the user's OWN result set against the expected one.
 * Deliberately never carries the expected rows' content — only whether each of the
 * user's own rows matches something expected, plus a bare count of what's missing.
 * Showing the actual missing values would let a submission-by-submission fishing
 * expedition reconstruct the answer key, defeating the anti-hardcoding design
 * (see README: validation never reveals the correct SQL or its output). */
export interface RowDiffEntry {
  values: unknown[]
  status: 'match' | 'extra'
}

export interface RowDiff {
  columns: string[]
  rows: RowDiffEntry[]
  /** Count of expected rows with no corresponding row in the user's result. Content withheld. */
  missingCount: number
}

export interface ValidationResult {
  status: 'ok' | 'ko'
  reason?: ValidationFailureReason
  message: string
  detail?: string
  expectedRowCount?: number
  actualRowCount?: number
  durationMs: number
  rowDiff?: RowDiff
}
