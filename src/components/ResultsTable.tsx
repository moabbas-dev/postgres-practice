import type { QueryResult } from '../types'

const MAX_RENDERED_ROWS = 300

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function ResultsTable({ result }: { result: QueryResult }) {
  if (result.columns.length === 0) {
    return <div className="p-4 text-sm text-text-secondary">Query executed successfully — no columns returned.</div>
  }
  if (result.rows.length === 0) {
    return <div className="p-4 text-sm text-text-secondary">Query executed successfully — 0 rows returned.</div>
  }

  const rows = result.rows.slice(0, MAX_RENDERED_ROWS)
  const truncated = result.rows.length > MAX_RENDERED_ROWS

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-surface-raised">
            <tr>
              {result.columns.map((col) => (
                <th key={col.name} className="whitespace-nowrap border-b border-border px-3 py-2 font-medium text-text-secondary">
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="odd:bg-transparent even:bg-surface-hover/30 hover:bg-surface-hover">
                {result.columns.map((col) => {
                  const raw = row[col.name]
                  const isNull = raw === null || raw === undefined
                  return (
                    <td key={col.name} className={`whitespace-nowrap border-b border-border-subtle px-3 py-1.5 font-mono ${isNull ? 'italic text-text-muted' : 'text-text-primary'}`}>
                      {formatCell(raw)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truncated && (
        <div className="border-t border-border-subtle bg-surface px-3 py-1.5 text-[11px] text-text-muted">
          Showing first {MAX_RENDERED_ROWS.toLocaleString()} of {result.rowCount.toLocaleString()} rows.
        </div>
      )}
    </div>
  )
}
