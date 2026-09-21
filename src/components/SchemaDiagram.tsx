import { ArrowLeft, Info, Key, Link2, Minus, Plus, RotateCcw, Table as TableIcon, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { DATABASE_RELATIONSHIPS, DATABASE_TABLES } from '../data/schemaExplorer'
import type { DatabaseRelationship, DatabaseTable } from '../types'

interface SchemaDiagramProps {
  onBack: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  support: 'Support',
  people: 'People',
  commerce: 'Commerce',
  catalog: 'Catalog',
  reference: 'Reference',
  engagement: 'Engagement',
}

/** Left-to-right column order, chosen to keep the busiest relationships (commerce <-> people,
 * commerce <-> catalog, catalog <-> reference) between adjacent columns. */
const COLUMN_ORDER: DatabaseTable['category'][] = ['support', 'people', 'commerce', 'catalog', 'reference', 'engagement']

const BOX_WIDTH = 208
const HEADER_HEIGHT = 28
const ROW_HEIGHT = 17
const BOX_PADDING_Y = 8
const COLUMN_GAP = 120
const ROW_GAP = 26
const MARGIN_X = 48
const MARGIN_TOP = 56
const MARGIN_BOTTOM = 48

interface Box {
  table: DatabaseTable
  x: number
  y: number
  width: number
  height: number
  col: number
  keyColumns: DatabaseTable['columns']
}

function buildLayout() {
  const boxesByTable: Record<string, Box> = {}
  const columnTops: number[] = COLUMN_ORDER.map(() => MARGIN_TOP)

  for (const table of DATABASE_TABLES) {
    const col = COLUMN_ORDER.indexOf(table.category)
    const keyColumns = table.columns.filter((c) => c.isPrimaryKey || c.isForeignKey)
    const height = HEADER_HEIGHT + keyColumns.length * ROW_HEIGHT + BOX_PADDING_Y
    const x = MARGIN_X + col * (BOX_WIDTH + COLUMN_GAP)
    const y = columnTops[col]
    boxesByTable[table.name] = { table, x, y, width: BOX_WIDTH, height, col, keyColumns }
    columnTops[col] = y + height + ROW_GAP
  }

  const width = MARGIN_X * 2 + COLUMN_ORDER.length * BOX_WIDTH + (COLUMN_ORDER.length - 1) * COLUMN_GAP
  const height = Math.max(...columnTops) - ROW_GAP + MARGIN_BOTTOM
  return { boxesByTable, width, height }
}

interface EdgeInfo {
  key: string
  d: string
  labelPos: { x: number; y: number }
  fromTable: string
  toTable: string
  fromColumn: string
  toColumn: string
  kind: DatabaseRelationship['kind']
  isSelf: boolean
}

function buildEdges(boxesByTable: Record<string, Box>) {
  const bulgeCounts = new Map<string, number>()
  const edges: EdgeInfo[] = []

  DATABASE_RELATIONSHIPS.forEach((rel, i) => {
    const a = boxesByTable[rel.fromTable]
    const b = boxesByTable[rel.toTable]
    if (!a || !b) return

    if (rel.fromTable === rel.toTable) {
      const yTop = a.y + a.height * 0.32
      const yBot = a.y + a.height * 0.68
      const loopX = a.x - 30
      edges.push({
        key: `${rel.fromTable}-${rel.fromColumn}-${i}`,
        d: `M ${a.x} ${yTop} C ${loopX} ${yTop}, ${loopX} ${yBot}, ${a.x} ${yBot}`,
        labelPos: { x: loopX - 6, y: (yTop + yBot) / 2 },
        fromTable: rel.fromTable,
        toTable: rel.toTable,
        fromColumn: rel.fromColumn,
        toColumn: rel.toColumn,
        kind: rel.kind,
        isSelf: true,
      })
      return
    }

    if (a.col === b.col) {
      const bulgeKey = `${a.col}:${rel.toTable}`
      const n = bulgeCounts.get(bulgeKey) ?? 0
      bulgeCounts.set(bulgeKey, n + 1)
      const bulge = 44 + n * 20
      const x = a.x + a.width
      const ya = a.y + a.height / 2
      const yb = b.y + b.height / 2
      edges.push({
        key: `${rel.fromTable}-${rel.fromColumn}-${i}`,
        d: `M ${x} ${ya} C ${x + bulge} ${ya}, ${x + bulge} ${yb}, ${x} ${yb}`,
        labelPos: { x: x + bulge + 6, y: (ya + yb) / 2 },
        fromTable: rel.fromTable,
        toTable: rel.toTable,
        fromColumn: rel.fromColumn,
        toColumn: rel.toColumn,
        kind: rel.kind,
        isSelf: false,
      })
      return
    }

    const forward = b.col > a.col
    const startX = forward ? a.x + a.width : a.x
    const endX = forward ? b.x : b.x + b.width
    const startY = a.y + a.height / 2
    const endY = b.y + b.height / 2
    const midX = (startX + endX) / 2
    edges.push({
      key: `${rel.fromTable}-${rel.fromColumn}-${i}`,
      d: `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`,
      labelPos: { x: midX, y: (startY + endY) / 2 },
      fromTable: rel.fromTable,
      toTable: rel.toTable,
      fromColumn: rel.fromColumn,
      toColumn: rel.toColumn,
      kind: rel.kind,
      isSelf: false,
    })
  })

  return edges
}

interface PanState {
  startX: number
  startY: number
  scrollLeft: number
  scrollTop: number
  dragged: boolean
}

export function SchemaDiagram({ onBack }: SchemaDiagramProps) {
  const [scale, setScale] = useState(1)
  const [hoveredTable, setHoveredTable] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [mobileLegendOpen, setMobileLegendOpen] = useState(false)
  const [isPanning, setIsPanning] = useState(false)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const panStateRef = useRef<PanState | null>(null)

  function handlePanStart(e: React.MouseEvent) {
    if (e.button !== 0) return
    const el = scrollRef.current
    if (!el) return

    const state: PanState = { startX: e.clientX, startY: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop, dragged: false }
    panStateRef.current = state
    setIsPanning(true)
    const prevUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - state.startX
      const dy = ev.clientY - state.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) state.dragged = true
      el!.scrollLeft = state.scrollLeft - dx
      el!.scrollTop = state.scrollTop - dy
    }
    function onUp() {
      setIsPanning(false)
      document.body.style.userSelect = prevUserSelect
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      // Cleared on a delay so the click handler that fires right after mouseup can
      // still see `dragged` and skip select/deselect if this was actually a pan.
      setTimeout(() => {
        if (panStateRef.current === state) panStateRef.current = null
      }, 0)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function wasDrag(): boolean {
    return panStateRef.current?.dragged ?? false
  }

  const { boxesByTable, width, height } = useMemo(() => buildLayout(), [])
  const edges = useMemo(() => buildEdges(boxesByTable), [boxesByTable])

  const columnLabelPositions = useMemo(
    () =>
      COLUMN_ORDER.map((category, col) => ({
        category,
        x: MARGIN_X + col * (BOX_WIDTH + COLUMN_GAP) + BOX_WIDTH / 2,
      })),
    [],
  )

  const selected = selectedTable ? DATABASE_TABLES.find((t) => t.name === selectedTable) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border-subtle bg-surface px-2 sm:gap-3 sm:px-3">
        <button
          onClick={onBack}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <div className="hidden h-4 w-px shrink-0 bg-border-subtle sm:block" />
        <div className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary sm:flex-none">Entity-relationship diagram</div>
        <span className="hidden shrink-0 text-[11px] text-text-muted md:inline">
          {DATABASE_TABLES.length} tables · {DATABASE_RELATIONSHIPS.length} relationships
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.5, Math.round((s - 0.1) * 10) / 10))}
            className="cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-hover"
            title="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="hidden w-10 text-center text-[11px] tabular-nums text-text-muted sm:inline">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(1.6, Math.round((s + 0.1) * 10) / 10))}
            className="cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-hover"
            title="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScale(1)}
            className="hidden cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-hover sm:block"
            title="Reset zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMobileLegendOpen(true)}
            className="cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-hover lg:hidden"
            title="Show legend and table details"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1">
        <div
          ref={scrollRef}
          onMouseDown={handlePanStart}
          className={`min-h-0 min-w-0 flex-1 overflow-auto p-4 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          <svg
            width={width * scale}
            height={height * scale}
            viewBox={`0 0 ${width} ${height}`}
            className="block"
            onClick={() => {
              if (wasDrag()) return
              setSelectedTable(null)
            }}
          >
            <defs>
              <marker id="arrow-many" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-accent)" />
              </marker>
              <marker id="arrow-mtm" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-success)" />
              </marker>
              <marker id="arrow-self" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-muted)" />
              </marker>
            </defs>

            {columnLabelPositions.map(({ category, x }) => (
              <text
                key={category}
                x={x}
                y={28}
                textAnchor="middle"
                style={{ fill: 'var(--color-text-muted)' }}
                className="text-[11px] font-semibold uppercase tracking-wide"
              >
                {CATEGORY_LABELS[category] ?? category}
              </text>
            ))}

            {edges.map((edge) => {
              const isHighlighted = hoveredTable !== null && (edge.fromTable === hoveredTable || edge.toTable === hoveredTable)
              const dimmed = hoveredTable !== null && !isHighlighted
              const color = edge.isSelf ? 'var(--color-text-muted)' : edge.kind === 'many-to-many' ? 'var(--color-success)' : 'var(--color-accent)'
              const marker = edge.isSelf ? 'url(#arrow-self)' : edge.kind === 'many-to-many' ? 'url(#arrow-mtm)' : 'url(#arrow-many)'
              const dash = edge.isSelf ? '3 3' : edge.kind === 'many-to-many' ? '5 3' : undefined
              return (
                <path
                  key={edge.key}
                  d={edge.d}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHighlighted ? 2.25 : 1.25}
                  strokeDasharray={dash}
                  opacity={dimmed ? 0.15 : 0.85}
                  markerEnd={marker}
                >
                  <title>
                    {edge.fromTable}.{edge.fromColumn} → {edge.toTable}.{edge.toColumn} ({edge.kind})
                  </title>
                </path>
              )
            })}

            {Object.values(boxesByTable).map((box) => {
              const isHovered = hoveredTable === box.table.name
              const dimmed = hoveredTable !== null && !isHovered
              return (
                <foreignObject key={box.table.name} x={box.x} y={box.y} width={box.width} height={box.height} style={{ overflow: 'visible' }}>
                  <div
                    onMouseEnter={() => setHoveredTable(box.table.name)}
                    onMouseLeave={() => setHoveredTable(null)}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (wasDrag()) return
                      setSelectedTable(box.table.name)
                      setMobileLegendOpen(true)
                    }}
                    className={`h-full w-full cursor-pointer overflow-hidden rounded-lg border bg-surface-raised shadow-sm transition-all ${
                      isHovered || selectedTable === box.table.name ? 'border-accent shadow-md' : 'border-border'
                    }`}
                    style={{ opacity: dimmed ? 0.35 : 1 }}
                  >
                    <div className="flex items-center gap-1.5 border-b border-border-subtle bg-surface px-2 py-1">
                      <TableIcon className="h-3 w-3 shrink-0 text-accent" />
                      <span className="truncate font-mono text-[11px] font-semibold text-text-primary">{box.table.name}</span>
                      <span className="ml-auto shrink-0 text-[9px] text-text-muted">{box.table.columns.length} cols</span>
                    </div>
                    <div>
                      {box.keyColumns.map((col) => (
                        <div key={col.name} className="flex items-center gap-1 px-2" style={{ height: ROW_HEIGHT }}>
                          {col.isPrimaryKey ? (
                            <Key className="h-2.5 w-2.5 shrink-0 text-warning" />
                          ) : (
                            <Link2 className="h-2.5 w-2.5 shrink-0 text-accent" />
                          )}
                          <span className="truncate font-mono text-[10px] text-text-secondary">{col.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </foreignObject>
              )
            })}
          </svg>
        </div>

        {mobileLegendOpen && (
          <div className="fixed inset-0 z-10 cursor-pointer bg-black/40 lg:hidden" onClick={() => setMobileLegendOpen(false)} />
        )}

        <div
          className={`absolute inset-y-0 right-0 z-20 w-72 max-w-[85vw] overflow-y-auto border-l border-border-subtle bg-surface p-3 shadow-xl transition-transform lg:static lg:z-auto lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-none ${
            mobileLegendOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Legend</div>
            <button
              onClick={() => setMobileLegendOpen(false)}
              className="cursor-pointer rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary lg:hidden"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <LegendRow color="var(--color-accent)" dash={undefined} label="One-to-many" />
          <LegendRow color="var(--color-success)" dash="5 3" label="Many-to-many (via join table)" />
          <LegendRow color="var(--color-text-muted)" dash="3 3" label="Self-referencing hierarchy" />

          <div className="mt-4 text-[11px] text-text-secondary">Hover a table to highlight its relationships. Click a table for its full column list.</div>

          {selected && (
            <div className="mt-4 border-t border-border-subtle pt-3">
              <div className="flex items-center gap-1.5">
                <TableIcon className="h-3.5 w-3.5 text-accent" />
                <h3 className="font-mono text-xs font-semibold text-text-primary">{selected.name}</h3>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary">{selected.description}</p>
              <p className="mt-1 text-[10px] text-text-muted">~{selected.rowCountApprox.toLocaleString()} rows</p>
              <div className="mt-3 space-y-1">
                {selected.columns.map((col) => (
                  <div key={col.name} className="rounded-md border border-border-subtle bg-surface-raised px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      {col.isPrimaryKey && <Key className="h-3 w-3 shrink-0 text-warning" />}
                      {col.isForeignKey && !col.isPrimaryKey && <Link2 className="h-3 w-3 shrink-0 text-accent" />}
                      <span className="truncate font-mono text-[11px] text-text-primary">{col.name}</span>
                      <span className="ml-auto shrink-0 font-mono text-[9px] text-text-muted">{col.type}</span>
                    </div>
                    {col.references && (
                      <div className="pl-[1.125rem] text-[9px] text-text-muted">
                        → {col.references.table}.{col.references.column}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LegendRow({ color, dash, label }: { color: string; dash?: string; label: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <svg width="24" height="8" className="shrink-0">
        <line x1="0" y1="4" x2="24" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dash} />
      </svg>
      <span className="text-[11px] text-text-secondary">{label}</span>
    </div>
  )
}
