import type { QueryResult, RowDiff, ValidationOptions, ValidationResult } from '../../types'
import { normalizeRows, sortedKeys, type NormalizedRow } from './normalize'

/** Classifies each of the user's own rows as matching an expected row or not, and counts
 * (without revealing) how many expected rows the user's result is missing. See the
 * RowDiff type for why expected row content is never included. */
function buildRowDiff(userRows: NormalizedRow[], expectedRows: NormalizedRow[], columns: string[], orderMatters: boolean): RowDiff {
  const rows: RowDiff['rows'] = []

  if (orderMatters) {
    for (let i = 0; i < userRows.length; i++) {
      const status = i < expectedRows.length && userRows[i].key === expectedRows[i].key ? 'match' : 'extra'
      rows.push({ values: userRows[i].values, status })
    }
    return { columns, rows, missingCount: Math.max(0, expectedRows.length - userRows.length) }
  }

  // Multiset mode: consume one matching expected row per user row so duplicates are
  // handled correctly (a user row only "matches" if an unclaimed expected copy remains).
  const remaining = new Map<string, number>()
  for (const r of expectedRows) remaining.set(r.key, (remaining.get(r.key) ?? 0) + 1)

  for (const r of userRows) {
    const available = remaining.get(r.key) ?? 0
    if (available > 0) {
      remaining.set(r.key, available - 1)
      rows.push({ values: r.values, status: 'match' })
    } else {
      rows.push({ values: r.values, status: 'extra' })
    }
  }
  const missingCount = [...remaining.values()].reduce((a, b) => a + b, 0)
  return { columns, rows, missingCount }
}

export function compareResults(userResult: QueryResult, expectedResult: QueryResult, options: ValidationOptions, durationMs: number): ValidationResult {
  const expectedRowCount = expectedResult.rows.length
  const actualRowCount = userResult.rows.length
  const columnNames = userResult.columns.map((c) => c.name)

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
        rowDiff: buildRowDiff(userRows, expectedRows, columnNames, true),
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
      const sameContentDifferentOrder = userSorted.join('') === expectedSorted.join('')
      if (sameContentDifferentOrder) {
        return {
          status: 'ko',
          reason: 'wrong-order',
          message: `The rows are correct but not in the required order (mismatch starting at row ${mismatchAt + 1}). This exercise requires a specific ORDER BY.`,
          durationMs,
          expectedRowCount,
          actualRowCount,
          rowDiff: { columns: columnNames, rows: userRows.map((r) => ({ values: r.values, status: 'match' as const })), missingCount: 0 },
        }
      }
      return {
        status: 'ko',
        reason: 'wrong-values',
        message: `Row ${mismatchAt + 1} doesn't match the expected value.`,
        durationMs,
        expectedRowCount,
        actualRowCount,
        rowDiff: buildRowDiff(userRows, expectedRows, columnNames, true),
      }
    }
    return { status: 'ok', message: 'All rows match, in the correct order.', durationMs, expectedRowCount, actualRowCount }
  }

  // Order doesn't matter: compare as multisets (duplicates preserved).
  const userSorted = sortedKeys(userRows)
  const expectedSorted = sortedKeys(expectedRows)

  if (userSorted.join('') === expectedSorted.join('')) {
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
        rowDiff: buildRowDiff(userRows, expectedRows, columnNames, false),
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
        rowDiff: buildRowDiff(userRows, expectedRows, columnNames, false),
      }
    }
    return {
      status: 'ko',
      reason: 'wrong-row-count',
      message: `Your query returned ${actualRowCount} row(s), but ${expectedRowCount} were expected.`,
      durationMs,
      expectedRowCount,
      actualRowCount,
      rowDiff: buildRowDiff(userRows, expectedRows, columnNames, false),
    }
  }

  return {
    status: 'ko',
    reason: 'wrong-values',
    message: 'Row count matches, but some values are incorrect.',
    durationMs,
    expectedRowCount,
    actualRowCount,
    rowDiff: buildRowDiff(userRows, expectedRows, columnNames, false),
  }
}
