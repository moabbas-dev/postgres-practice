import { Eye, Key, Link2, Network, Table } from 'lucide-react'
import { useState } from 'react'
import { DATABASE_TABLES } from '../data/schemaExplorer'
import { previewTable } from '../database/db'
import type { QueryResult } from '../types'
import { ResultsTable } from './ResultsTable'

const CATEGORY_LABELS: Record<string, string> = {
  people: 'People',
  catalog: 'Catalog',
  commerce: 'Commerce',
  engagement: 'Engagement',
  support: 'Support',
  reference: 'Reference',
}

interface SchemaExplorerProps {
  onOpenDiagram: () => void
}

export function SchemaExplorer({ onOpenDiagram }: SchemaExplorerProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [preview, setPreview] = useState<QueryResult | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const table = DATABASE_TABLES.find((t) => t.name === selected)

  const grouped = DATABASE_TABLES.reduce<Record<string, typeof DATABASE_TABLES>>((acc, t) => {
    ;(acc[t.category] ??= []).push(t)
    return acc
  }, {})

  async function handleSelect(name: string) {
    setSelected(name)
    setPreview(null)
  }

  async function handlePreview() {
    if (!table) return
    setLoadingPreview(true)
    try {
      const result = await previewTable(table.name, 15)
      setPreview(result)
    } catch {
      setPreview(null)
    } finally {
      setLoadingPreview(false)
    }
  }

  if (table) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-surface">
        <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2.5">
          <button onClick={() => setSelected(null)} className="cursor-pointer text-xs text-text-secondary hover:text-accent">
            ← Tables
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <div className="flex items-center gap-2">
            <Table className="h-4 w-4 text-accent" />
            <h3 className="font-mono text-sm font-semibold text-text-primary">{table.name}</h3>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{table.description}</p>
          <p className="mt-1 text-[10px] text-text-muted">~{table.rowCountApprox.toLocaleString()} rows</p>

          <button
            onClick={handlePreview}
            disabled={loadingPreview}
            className="mt-3 flex cursor-pointer items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1.5 text-[11px] text-text-secondary hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            {loadingPreview ? 'Loading...' : 'Preview 15 rows'}
          </button>

          <div className="mt-4 space-y-1">
            {table.columns.map((col) => (
              <div key={col.name} className="rounded-md border border-border-subtle bg-surface-raised px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  {col.isPrimaryKey && <Key className="h-3 w-3 shrink-0 text-warning" />}
                  {col.isForeignKey && !col.isPrimaryKey && <Link2 className="h-3 w-3 shrink-0 text-accent" />}
                  <span className="font-mono text-xs text-text-primary">{col.name}</span>
                  <span className="ml-auto font-mono text-[10px] text-text-muted">{col.type}</span>
                </div>
                {(col.references || col.description) && (
                  <div className="mt-0.5 pl-[1.125rem] text-[10px] text-text-muted">
                    {col.references && (
                      <span>
                        → {col.references.table}.{col.references.column}
                      </span>
                    )}
                    {col.description && <span>{col.references ? ' · ' : ''}{col.description}</span>}
                  </div>
                )}
                {!col.nullable && <span className="ml-[1.125rem] text-[9px] uppercase text-text-muted">not null</span>}
              </div>
            ))}
          </div>
        </div>
        {preview && (
          <div className="h-56 shrink-0 border-t border-border-subtle">
            <ResultsTable result={preview} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-border-subtle px-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          <Table className="h-3.5 w-3.5" />
          Tables
        </span>
        <button
          onClick={onOpenDiagram}
          className="flex cursor-pointer items-center gap-1 rounded-md border border-border-subtle px-2 py-0.5 text-[11px] text-text-secondary hover:border-accent hover:text-accent"
          title="Open the full entity-relationship diagram"
        >
          <Network className="h-3.5 w-3.5" />
          See chart
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
      {Object.entries(grouped).map(([category, tables]) => (
        <div key={category} className="border-b border-border-subtle">
          <div className="px-3 pt-2.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">{CATEGORY_LABELS[category] ?? category}</div>
          <ul className="pb-1.5">
            {tables.map((t) => (
              <li key={t.name}>
                <button
                  onClick={() => handleSelect(t.name)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                >
                  <Table className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                  <span className="min-w-0 flex-1 truncate font-mono">{t.name}</span>
                  <span className="shrink-0 text-[10px] text-text-muted">{t.columns.length} cols</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      </div>
    </div>
  )
}
