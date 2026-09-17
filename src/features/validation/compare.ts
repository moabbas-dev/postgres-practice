import type { QueryResult, ValidationOptions, ValidationResult } from '../../types'
import { normalizeRows, sortedKeys } from './normalize'

export function compareResults(userResult: QueryResult, expectedResult: QueryResult, options: ValidationOptions, durationMs: number): ValidationResult {
  const expectedRowCount = expectedResult.rows.length
  const actualRowCount = userResult.rows.length

  if (userResult.columns.length !== expectedResult.columns.length) {
    return {
      status: 'ko',
      reason: 'wrong-column-count',
      message: `Your query returns ${userResult.columns.length} column(s), but ${expectedResult.columns.length} were expected.`,
      durationMs,
      expectedRowCount,
      actualRowCount,
    }
  }

  if (options.requireColumnNames) {
    const userNames = userResult.columns.map((c) => c.name.toLowerCase())
    const expectedNames = expectedResult.columns.map((c) => c.name.toLowerCase())
    const mismatch = userNames.some((n, i) => n !== expectedNames[i])
    if (mismatch) {
      return {
        status: 'ko',
        reason: 'wrong-column-names',
        message: `Column names don't match what's expected: [${expectedNames.join(', ')}].`,
        durationMs,
        expectedRowCount,
        actualRowCount,
      }
    }
  }

  if (actualRowCount === 0 && expectedRowCount > 0) {
    return {
      status: 'ko',
      reason: 'empty-result',
      message: 'Your query returned no rows, but rows were expected.',
      durationMs,
      expectedRowCount,
      actualRowCount,
    }
  }

  const roundDecimals = options.roundDecimals
  const userRows = normalizeRows(userResult, roundDecimals)
  const expectedRows = normalizeRows(expectedResult, roundDecimals)

  if (options.orderMatters) {
    if (actualRowCount !== expectedRowCount) {
      return {
        status: 'ko',
        reason: 'wrong-row-count',
        message: `Your query returned ${actualRowCount} row(s), but ${expectedRowCount} were expected.`,
        durationMs,
        expectedRowCount,
        actualRowCount,
      }
    }
    let mismatchAt = -1
    for (let i = 0; i < userRows.length; i++) {
      if (userRows[i].key !== expectedRows[i].key) {
        mismatchAt = i
        break
      }
    }
    if (mismatchAt >= 0) {
      const userSorted = sortedKeys(userRows)
      const expectedSorted = sortedKeys(expectedRows)
      const sameContentDifferentOrder = userSorted.join('') === expectedSorted.join('')
      if (sameContentDifferentOrder) {
        return {
          status: 'ko',
          reason: 'wrong-order',
          message: `The rows are correct but not in the required order (mismatch starting at row ${mismatchAt + 1}). This exercise requires a specific ORDER BY.`,
          durationMs,
          expectedRowCount,
          actualRowCount,
        }
      }
      return {
        status: 'ko',
        reason: 'wrong-values',
        message: `Row ${mismatchAt + 1} doesn't match the expected value.`,
        durationMs,
        expectedRowCount,
        actualRowCount,
      }
    }
    return { status: 'ok', message: 'All rows match, in the correct order.', durationMs, expectedRowCount, actualRowCount }
  }

  // Order doesn't matter: compare as multisets (duplicates preserved).
  const userSorted = sortedKeys(userRows)
  const expectedSorted = sortedKeys(expectedRows)

  if (userSorted.join('') === expectedSorted.join('')) {
    return { status: 'ok', message: 'Result matches.', durationMs, expectedRowCount, actualRowCount }
  }

  if (actualRowCount !== expectedRowCount) {
    const userSet = new Set(userSorted)
    const expectedSet = new Set(expectedSorted)
    const missing = expectedSorted.filter((k) => !userSet.has(k)).length
    const unexpected = userSorted.filter((k) => !expectedSet.has(k)).length
    if (missing > 0 && unexpected === 0) {
      return {
        status: 'ko',
        reason: 'missing-rows',
        message: `Your result is missing ${missing} row(s) that should be present.`,
        durationMs,
        expectedRowCount,
        actualRowCount,
      }
    }
    if (unexpected > 0 && missing === 0) {
      return {
        status: 'ko',
        reason: 'unexpected-rows',
        message: `Your result has ${unexpected} row(s) that shouldn't be there.`,
        durationMs,
        expectedRowCount,
        actualRowCount,
      }
    }
    return {
      status: 'ko',
      reason: 'wrong-row-count',
      message: `Your query returned ${actualRowCount} row(s), but ${expectedRowCount} were expected.`,
      durationMs,
      expectedRowCount,
      actualRowCount,
    }
  }

  return {
    status: 'ko',
    reason: 'wrong-values',
    message: 'Row count matches, but some values are incorrect.',
    durationMs,
    expectedRowCount,
    actualRowCount,
  }
}
