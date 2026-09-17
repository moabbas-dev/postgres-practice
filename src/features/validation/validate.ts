import { runUserQuery, toQueryError } from '../../database/db'
import type { Exercise, QueryResult, ValidationResult } from '../../types'
import { compareResults } from './compare'

export interface SubmissionOutcome {
  validation: ValidationResult
  userResult?: QueryResult
}

export async function validateSubmission(exercise: Exercise, userSql: string): Promise<SubmissionOutcome> {
  const start = performance.now()

  let userResult: QueryResult
  try {
    userResult = await runUserQuery(userSql)
  } catch (err) {
    const qe = toQueryError(err)
    return {
      validation: {
        status: 'ko',
        reason: 'query-error',
        message: qe.message,
        detail: qe.detail ?? qe.hint,
        durationMs: performance.now() - start,
      },
    }
  }

  let expectedResult: QueryResult
  try {
    expectedResult = await runUserQuery(exercise.solution.sql)
  } catch (err) {
    const qe = toQueryError(err)
    // This indicates a bug in the exercise itself, not the user's query.
    console.error(`Exercise ${exercise.id} solution query failed:`, qe)
    return {
      userResult,
      validation: {
        status: 'ko',
        reason: 'query-error',
        message: 'This exercise could not be validated right now. Please report this issue.',
        durationMs: performance.now() - start,
      },
    }
  }

  return {
    userResult,
    validation: compareResults(userResult, expectedResult, exercise.validation, performance.now() - start),
  }
}
