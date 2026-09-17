export function str(value: string | null | undefined): string {
  if (value === null || value === undefined) return 'NULL'
  return `'${value.replace(/'/g, "''")}'`
}

export function num(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'NULL'
  return String(value)
}

export function bool(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return 'NULL'
  return value ? 'true' : 'false'
}

export function textArray(values: string[] | null | undefined): string {
  if (values === null || values === undefined) return 'NULL'
  return `ARRAY[${values.map(str).join(',')}]::text[]`
}

export function intArray(values: number[] | null | undefined): string {
  if (values === null || values === undefined) return 'NULL'
  return `ARRAY[${values.join(',')}]::integer[]`
}

export function json(value: unknown): string {
  if (value === null || value === undefined) return "'{}'::jsonb"
  return `${str(JSON.stringify(value))}::jsonb`
}

export function ts(value: Date | null | undefined): string {
  if (value === null || value === undefined) return 'NULL'
  return str(value.toISOString())
}

export function dateOnly(value: Date | null | undefined): string {
  if (value === null || value === undefined) return 'NULL'
  return str(value.toISOString().slice(0, 10))
}

/** Builds a batched multi-row INSERT statement. */
export function insertStatement(table: string, columns: string[], rows: string[][]): string {
  const values = rows.map((r) => `(${r.join(',')})`).join(',\n')
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${values};`
}

/** Splits rows into chunks and yields full INSERT statements per chunk. */
export function* batchedInserts(
  table: string,
  columns: string[],
  rows: string[][],
  chunkSize = 400,
): Generator<string> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    yield insertStatement(table, columns, rows.slice(i, i + chunkSize))
  }
}
