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

export interface ValidationResult {
  status: 'ok' | 'ko'
  reason?: ValidationFailureReason
  message: string
  detail?: string
  expectedRowCount?: number
  actualRowCount?: number
  durationMs: number
}
