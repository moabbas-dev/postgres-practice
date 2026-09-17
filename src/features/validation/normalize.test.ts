import { describe, expect, it } from 'vitest'
import { normalizeRows, sortedKeys } from './normalize'
import type { QueryResult } from '../../types'

function result(columns: string[], rows: Record<string, unknown>[]): QueryResult {
  return {
    columns: columns.map((name) => ({ name, dataTypeId: 0 })),
    rows,
    rowCount: rows.length,
    durationMs: 0,
  }
}

describe('normalizeRows', () => {
  it('treats numeric-looking strings the same as numbers (Postgres numeric columns arrive as strings)', () => {
    const asString = result(['price'], [{ price: '10.50' }])
    const asNumber = result(['price'], [{ price: 10.5 }])
    expect(normalizeRows(asString)[0].key).toBe(normalizeRows(asNumber)[0].key)
  })

  it('preserves null distinctly from 0 or empty string', () => {
    const nullRow = normalizeRows(result(['x'], [{ x: null }]))[0]
    const zeroRow = normalizeRows(result(['x'], [{ x: 0 }]))[0]
    const emptyRow = normalizeRows(result(['x'], [{ x: '' }]))[0]
    expect(nullRow.key).not.toBe(zeroRow.key)
    expect(nullRow.key).not.toBe(emptyRow.key)
  })

  it('rounds numbers to the requested number of decimals', () => {
    const rows = normalizeRows(result(['price'], [{ price: 10.126 }]), 2)
    expect(rows[0].values[0]).toBe(10.13)
  })

  it('rounds numeric-string values the same way as native numbers', () => {
    const fromString = normalizeRows(result(['price'], [{ price: '10.126' }]), 2)[0]
    const fromNumber = normalizeRows(result(['price'], [{ price: 10.126 }]), 2)[0]
    expect(fromString.key).toBe(fromNumber.key)
  })

  it('only compares selected columns, in column order — extra object keys on a row are ignored', () => {
    const columns = ['name']
    const rows = normalizeRows({ columns: columns.map((name) => ({ name, dataTypeId: 0 })), rows: [{ name: 'a', secret: 'x' }] })
    expect(rows[0].values).toEqual(['a'])
  })

  it('produces identical keys for identical rows, enabling multiset comparison', () => {
    const rows = normalizeRows(result(['a', 'b'], [{ a: 1, b: 'x' }, { a: 1, b: 'x' }]))
    expect(rows[0].key).toBe(rows[1].key)
  })
})

describe('sortedKeys', () => {
  it('sorts keys so unordered result sets can be compared as multisets', () => {
    const rows = normalizeRows(result(['n'], [{ n: 3 }, { n: 1 }, { n: 2 }]))
    expect(sortedKeys(rows)).toEqual(['[1]', '[2]', '[3]'])
  })

  it('preserves duplicate entries (does not deduplicate)', () => {
    const rows = normalizeRows(result(['n'], [{ n: 1 }, { n: 1 }, { n: 2 }]))
    expect(sortedKeys(rows)).toEqual(['[1]', '[1]', '[2]'])
  })
})
