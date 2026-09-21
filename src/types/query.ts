export interface QueryColumn {
  name: string
  dataTypeId: number
}

export interface QueryResult {
  columns: QueryColumn[]
  rows: Record<string, unknown>[]
  rowCount: number
  durationMs: number
}

export interface QueryError {
  message: string
  detail?: string
  hint?: string
  position?: string
  code?: string
}

export type QueryExecution =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'success'; result: QueryResult }
  | { status: 'error'; error: QueryError }
  | { status: 'timeout' }

export interface QueryHistoryEntry {
  id: string
  exerciseId: string
  sql: string
  ranAt: number
  outcome: 'run-success' | 'run-error' | 'submit-ok' | 'submit-ko'
}

export type ExplainState =
  | { status: 'idle' }
  | { status: 'running'; analyzed: boolean }
  | { status: 'success'; lines: string[]; analyzed: boolean }
  | { status: 'error'; error: QueryError; analyzed: boolean }
