import type { QueryResult } from '../../types'

/** Converts a single cell value into a canonical, comparable primitive. */
function normalizeCell(value: unknown, roundDecimals?: number): unknown {
  if (value === null || value === undefined) return null

  if (typeof value === 'number') {
    if (roundDecimals !== undefined && Number.isFinite(value)) {
      const f = Math.pow(10, roundDecimals)
      return Math.round(value * f) / f
    }
    return value
  }

  // PGlite returns numeric/decimal columns as strings to preserve precision.
  if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
    const n = Number(value)
    if (roundDecimals !== undefined) {
      const f = Math.pow(10, roundDecimals)
      return Math.round(n * f) / f
    }
    // Normalize trailing zeros (e.g. "10.50" vs "10.5") without a requested rounding.
    return n
  }

  if (Array.isArray(value)) {
    return value.map((v) => normalizeCell(v, roundDecimals))
  }

  if (typeof value === 'object') {
    return value
  }

  return value
}

export interface NormalizedRow {
  values: unknown[]
  key: string
}

export function normalizeRows(result: Pick<QueryResult, 'rows' | 'columns'>, roundDecimals?: number): NormalizedRow[] {
  const columnNames = result.columns.map((c) => c.name)
  return result.rows.map((row) => {
    const values = columnNames.map((name) => normalizeCell(row[name], roundDecimals))
    return { values, key: JSON.stringify(values) }
  })
}

export function sortedKeys(rows: NormalizedRow[]): string[] {
  return rows.map((r) => r.key).sort()
}
