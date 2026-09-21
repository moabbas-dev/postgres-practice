import { describe, expect, it } from 'vitest'
import { compareResults } from './compare'
import type { QueryResult, ValidationOptions } from '../../types'

function result(columns: string[], rows: Record<string, unknown>[]): QueryResult {
  return {
    columns: columns.map((name) => ({ name, dataTypeId: 0 })),
    rows,
    rowCount: rows.length,
    durationMs: 0,
  }
}

const unordered: ValidationOptions = { orderMatters: false }
const ordered: ValidationOptions = { orderMatters: true }

describe('compareResults — unordered (default) comparison', () => {
  it('accepts identical row order', () => {
    const a = result(['name'], [{ name: 'Alice' }, { name: 'Bob' }])
    const b = result(['name'], [{ name: 'Alice' }, { name: 'Bob' }])
    expect(compareResults(a, b, unordered, 0).status).toBe('ok')
  })

  it('accepts the same rows in a different order when orderMatters is false', () => {
    const user = result(['name'], [{ name: 'Bob' }, { name: 'Alice' }])
    const expected = result(['name'], [{ name: 'Alice' }, { name: 'Bob' }])
    expect(compareResults(user, expected, unordered, 0).status).toBe('ok')
  })

  it('rejects when a row is missing', () => {
    const user = result(['name'], [{ name: 'Alice' }])
    const expected = result(['name'], [{ name: 'Alice' }, { name: 'Bob' }])
    const r = compareResults(user, expected, unordered, 0)
    expect(r.status).toBe('ko')
    expect(r.reason).toBe('missing-rows')
  })

  it('rejects when there is an extra, unexpected row', () => {
    const user = result(['name'], [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Carol' }])
    const expected = result(['name'], [{ name: 'Alice' }, { name: 'Bob' }])
    const r = compareResults(user, expected, unordered, 0)
    expect(r.status).toBe('ko')
    expect(r.reason).toBe('unexpected-rows')
  })

  it('treats duplicate rows as significant (multiset semantics)', () => {
    const user = result(['name'], [{ name: 'Alice' }])
    const expected = result(['name'], [{ name: 'Alice' }, { name: 'Alice' }])
    const r = compareResults(user, expected, unordered, 0)
    expect(r.status).toBe('ko')
    expect(r.reason).toBe('wrong-row-count')
  })

  it('accepts matching duplicate rows', () => {
    const a = result(['name'], [{ name: 'Alice' }, { name: 'Alice' }])
    const b = result(['name'], [{ name: 'Alice' }, { name: 'Alice' }])
    expect(compareResults(a, b, unordered, 0).status).toBe('ok')
  })

  it('rejects when column count differs', () => {
    const user = result(['name'], [{ name: 'Alice' }])
    const expected = result(['name', 'age'], [{ name: 'Alice', age: 30 }])
    const r = compareResults(user, expected, unordered, 0)
    expect(r.status).toBe('ko')
    expect(r.reason).toBe('wrong-column-count')
  })

  it('rejects when a value differs but row/column counts match', () => {
    const user = result(['name'], [{ name: 'Alice' }])
    const expected = result(['name'], [{ name: 'Bob' }])
    const r = compareResults(user, expected, unordered, 0)
    expect(r.status).toBe('ko')
    expect(r.reason).toBe('wrong-values')
  })

  it('reports empty-result when the user returns nothing but rows were expected', () => {
    const user = result(['name'], [])
    const expected = result(['name'], [{ name: 'Alice' }])
    const r = compareResults(user, expected, unordered, 0)
    expect(r.status).toBe('ko')
    expect(r.reason).toBe('empty-result')
  })

  it('accepts two empty result sets', () => {
    const a = result(['name'], [])
    const b = result(['name'], [])
    expect(compareResults(a, b, unordered, 0).status).toBe('ok')
  })

  it('is column-name agnostic by default (only positional values matter)', () => {
    const user = result(['n'], [{ n: 'Alice' }])
    const expected = result(['name'], [{ name: 'Alice' }])
    expect(compareResults(user, expected, unordered, 0).status).toBe('ok')
  })

  it('respects roundDecimals when comparing numeric values', () => {
    const user = result(['avg'], [{ avg: '10.1' }])
    const expected = result(['avg'], [{ avg: 10.104 }])
    const r = compareResults(user, expected, { orderMatters: false, roundDecimals: 1 }, 0)
    expect(r.status).toBe('ok')
  })

  it('treats NULL as distinct from any concrete value', () => {
    const user = result(['x'], [{ x: null }])
    const expected = result(['x'], [{ x: 0 }])
    expect(compareResults(user, expected, unordered, 0).status).toBe('ko')
  })
})

describe('compareResults — ordered comparison', () => {
  it('accepts an exact match', () => {
    const a = result(['n'], [{ n: 1 }, { n: 2 }, { n: 3 }])
    const b = result(['n'], [{ n: 1 }, { n: 2 }, { n: 3 }])
    expect(compareResults(a, b, ordered, 0).status).toBe('ok')
  })

  it('rejects correct rows in the wrong order and reports wrong-order', () => {
    const user = result(['n'], [{ n: 2 }, { n: 1 }, { n: 3 }])
    const expected = result(['n'], [{ n: 1 }, { n: 2 }, { n: 3 }])
    const r = compareResults(user, expected, ordered, 0)
    expect(r.status).toBe('ko')
    expect(r.reason).toBe('wrong-order')
  })

  it('rejects a differing row count even when the prefix matches', () => {
    const user = result(['n'], [{ n: 1 }, { n: 2 }])
    const expected = result(['n'], [{ n: 1 }, { n: 2 }, { n: 3 }])
    const r = compareResults(user, expected, ordered, 0)
    expect(r.status).toBe('ko')
    expect(r.reason).toBe('wrong-row-count')
  })
})

describe('compareResults — row diff', () => {
  it('marks the extra row and never leaks the missing row\'s content', () => {
    const user = result(['name'], [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Carol' }])
    const expected = result(['name'], [{ name: 'Alice' }, { name: 'Dave' }, { name: 'Carol' }])
    const r = compareResults(user, expected, unordered, 0)
    expect(r.reason).toBe('wrong-values')
    expect(r.rowDiff).toBeDefined()
    expect(r.rowDiff!.columns).toEqual(['name'])
    expect(r.rowDiff!.rows).toEqual([
      { values: ['Alice'], status: 'match' },
      { values: ['Bob'], status: 'extra' },
      { values: ['Carol'], status: 'match' },
    ])
    expect(r.rowDiff!.missingCount).toBe(1)
    // 'Dave' (the expected-but-missing value) must not appear anywhere in the diff.
    expect(JSON.stringify(r.rowDiff)).not.toContain('Dave')
  })

  it('marks every user row as extra when nothing matches', () => {
    const user = result(['name'], [{ name: 'Alice' }, { name: 'Bob' }])
    const expected = result(['name'], [{ name: 'Carol' }, { name: 'Dave' }])
    const r = compareResults(user, expected, unordered, 0)
    expect(r.rowDiff!.rows.every((row) => row.status === 'extra')).toBe(true)
    expect(r.rowDiff!.missingCount).toBe(2)
  })

  it('only consumes one expected copy per duplicate user row (multiset matching)', () => {
    const user = result(['name'], [{ name: 'Alice' }, { name: 'Alice' }, { name: 'Alice' }])
    const expected = result(['name'], [{ name: 'Alice' }])
    const r = compareResults(user, expected, unordered, 0)
    expect(r.rowDiff!.rows.filter((row) => row.status === 'match')).toHaveLength(1)
    expect(r.rowDiff!.rows.filter((row) => row.status === 'extra')).toHaveLength(2)
    expect(r.rowDiff!.missingCount).toBe(0)
  })

  it('shows all rows as matching when only the order is wrong', () => {
    const user = result(['n'], [{ n: 2 }, { n: 1 }, { n: 3 }])
    const expected = result(['n'], [{ n: 1 }, { n: 2 }, { n: 3 }])
    const r = compareResults(user, expected, ordered, 0)
    expect(r.reason).toBe('wrong-order')
    expect(r.rowDiff!.rows.every((row) => row.status === 'match')).toBe(true)
    expect(r.rowDiff!.missingCount).toBe(0)
  })

  it('diffs positionally when order matters and a specific row is wrong', () => {
    const user = result(['n'], [{ n: 1 }, { n: 9 }, { n: 3 }])
    const expected = result(['n'], [{ n: 1 }, { n: 2 }, { n: 3 }])
    const r = compareResults(user, expected, ordered, 0)
    expect(r.reason).toBe('wrong-values')
    expect(r.rowDiff!.rows).toEqual([
      { values: [1], status: 'match' },
      { values: [9], status: 'extra' },
      { values: [3], status: 'match' },
    ])
  })

  it('does not attach a row diff for structural mismatches (nothing meaningful to diff)', () => {
    const user = result(['name'], [{ name: 'Alice' }])
    const expected = result(['name', 'age'], [{ name: 'Alice', age: 30 }])
    const r = compareResults(user, expected, unordered, 0)
    expect(r.reason).toBe('wrong-column-count')
    expect(r.rowDiff).toBeUndefined()
  })

  it('does not attach a row diff on success', () => {
    const a = result(['name'], [{ name: 'Alice' }])
    const b = result(['name'], [{ name: 'Alice' }])
    expect(compareResults(a, b, unordered, 0).rowDiff).toBeUndefined()
  })
})

describe('compareResults — column name enforcement', () => {
  it('rejects mismatched column names when requireColumnNames is set', () => {
    const user = result(['first'], [{ first: 'Alice' }])
    const expected = result(['first_name'], [{ first_name: 'Alice' }])
    const r = compareResults(user, expected, { orderMatters: false, requireColumnNames: true }, 0)
    expect(r.status).toBe('ko')
    expect(r.reason).toBe('wrong-column-names')
  })

  it('accepts case-insensitive column name matches', () => {
    const user = result(['Name'], [{ Name: 'Alice' }])
    const expected = result(['name'], [{ name: 'Alice' }])
    const r = compareResults(user, expected, { orderMatters: false, requireColumnNames: true }, 0)
    expect(r.status).toBe('ok')
  })
})
