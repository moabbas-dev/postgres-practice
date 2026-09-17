export type DifficultyScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface Hint {
  order: number
  text: string
}

export interface Solution {
  sql: string
  explanation: string
  conceptsUsed: string[]
}

/** Controls how a user's result set is normalized/compared against the
 * reference result produced by the exercise's solution query. */
export interface ValidationOptions {
  /** Row order must match exactly (e.g. exercise requires ORDER BY). */
  orderMatters: boolean
  /** Column names must match exactly (case-insensitive). Usually true. */
  requireColumnNames?: boolean
  /** Decimal places to round numeric values to before comparing. */
  roundDecimals?: number
  /** Cap on returned rows considered for comparison (safety net). */
  maxRows?: number
}

export interface Exercise {
  id: string
  level: number
  order: number
  title: string
  difficultyScore: DifficultyScore
  description: string
  requirements?: string[]
  tablesInvolved: string[]
  conceptTags: string[]
  hints: Hint[]
  solution: Solution
  validation: ValidationOptions
  /** Starter text shown in the editor when the exercise is first opened. */
  starterQuery?: string
}

export interface Level {
  id: number
  title: string
  subtitle: string
  description: string
  concepts: string[]
}
