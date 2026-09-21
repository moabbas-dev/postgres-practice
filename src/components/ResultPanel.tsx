import { AlertTriangle, Blocks, CheckCircle2, ChevronDown, ChevronUp, Clock, History, Loader2, RotateCcw, Table2, Trash2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { ResultsTable } from './ResultsTable'
import { MAX_RENDERED_ROWS, formatCell } from './resultFormatting'
import type { ExplainState, QueryExecution, QueryHistoryEntry, ValidationResult } from '../types'

interface ResultPanelProps {
  execution: QueryExecution
  validation: ValidationResult | null
  history: QueryHistoryEntry[]
  onRestoreHistory: (sql: string) => void
  onDeleteHistory: (id: string) => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
  explainState: ExplainState
  onExplain: (analyze: boolean) => void
}

type Tab = 'results' | 'diff' | 'plan' | 'history'

export function ResultPanel({
  execution,
  validation,
  history,
  onRestoreHistory,
  onDeleteHistory,
  collapsed,
  onToggleCollapsed,
  explainState,
  onExplain,
}: ResultPanelProps) {
  const [tab, setTab] = useState<Tab>('results')

  // Surface the relevant tab automatically so a failed submission or a freshly requested
  // plan doesn't get missed behind whichever tab happened to be open. Adjusted during
  // render (React's documented pattern for "derive state from a prop change", using
  // state rather than a ref to track the previous value) instead of an effect, so it
  // takes effect in the same commit instead of an extra one.
  const [prevValidation, setPrevValidation] = useState(validation)
  const [prevExplainStatus, setPrevExplainStatus] = useState(explainState.status)
  if (validation !== prevValidation) {
    setPrevValidation(validation)
    if (validation && validation.status === 'ko' && validation.rowDiff) setTab('diff')
  }
  if (explainState.status !== prevExplainStatus) {
    setPrevExplainStatus(explainState.status)
    if (explainState.status === 'running') setTab('plan')
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">
      {!collapsed && validation && <ValidationBanner validation={validation} />}

      <div className="flex items-center gap-1 overflow-x-auto border-b border-border-subtle px-2 pt-1.5">
        <TabButton active={tab === 'results'} onClick={() => setTab('results')} icon={<Table2 className="h-3.5 w-3.5" />} label="Results" />
        {validation?.rowDiff && (
          <TabButton active={tab === 'diff'} onClick={() => setTab('diff')} icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Diff" />
        )}
        <TabButton active={tab === 'plan'} onClick={() => setTab('plan')} icon={<Blocks className="h-3.5 w-3.5" />} label="Plan" />
        <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={<History className="h-3.5 w-3.5" />} label={`History (${history.length})`} />
        <div className="ml-auto flex shrink-0 items-center gap-2 pr-1 text-[11px] text-text-muted">
          {execution.status === 'success' && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {execution.result.durationMs.toFixed(0)}ms · {execution.result.rowCount.toLocaleString()} rows
            </span>
          )}
          {onToggleCollapsed && (
            <button
              onClick={onToggleCollapsed}
              className="cursor-pointer rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
              title={collapsed ? 'Expand results panel' : 'Collapse results panel'}
            >
              {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-hidden">
          {tab === 'results' && <ResultsTab execution={execution} />}
          {tab === 'diff' && validation?.rowDiff && <DiffTab rowDiff={validation.rowDiff} />}
          {tab === 'plan' && <PlanTab explainState={explainState} onExplain={onExplain} />}
          {tab === 'history' && <HistoryTab history={history} onRestore={onRestoreHistory} onDelete={onDeleteHistory} />}
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-surface-raised text-text-primary' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ValidationBanner({ validation }: { validation: ValidationResult }) {
  const ok = validation.status === 'ok'
  return (
    <div className={`flex items-start gap-2 border-b px-4 py-3 ${ok ? 'border-success/30 bg-success/10' : 'border-danger/30 bg-danger/10'}`}>
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />}
      <div className="min-w-0">
        <div className={`text-sm font-semibold ${ok ? 'text-success' : 'text-danger'}`}>{ok ? 'OK — Correct!' : 'KO — Not quite'}</div>
        <div className="mt-0.5 text-xs text-text-secondary">{validation.message}</div>
        {validation.detail && <div className="mt-1 font-mono text-[11px] text-text-muted">{validation.detail}</div>}
        {validation.rowDiff && <div className="mt-1 text-[11px] text-text-muted">See the Diff tab for a row-by-row breakdown of your result.</div>}
      </div>
    </div>
  )
}

function ResultsTab({ execution }: { execution: QueryExecution }) {
  if (execution.status === 'idle') {
    return <div className="p-4 text-sm text-text-secondary">Run a query to see results here. (Ctrl/Cmd + Enter)</div>
  }
  if (execution.status === 'running') {
    return <div className="p-4 text-sm text-text-secondary">Running query...</div>
  }
  if (execution.status === 'timeout') {
    return (
      <div className="flex items-start gap-2 p-4 text-sm text-warning">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Query timed out. Try adding filters or a LIMIT clause.</span>
      </div>
    )
  }
  if (execution.status === 'error') {
    return (
      <div className="flex items-start gap-2 p-4 text-sm text-danger">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-mono text-xs">{execution.error.message}</div>
          {execution.error.hint && <div className="mt-1 text-xs text-text-muted">Hint: {execution.error.hint}</div>}
          {execution.error.position && <div className="mt-1 text-xs text-text-muted">Position: {execution.error.position}</div>}
        </div>
      </div>
    )
  }
  return <ResultsTable result={execution.result} />
}

/** Shows the user's own result rows classified against the expected ones — never the
 * expected rows' actual content, only whether each of your rows matches (see RowDiff). */
function DiffTab({ rowDiff }: { rowDiff: NonNullable<ValidationResult['rowDiff']> }) {
  const rows = rowDiff.rows.slice(0, MAX_RENDERED_ROWS)
  const truncated = rowDiff.rows.length > MAX_RENDERED_ROWS

  if (rowDiff.rows.length === 0 && rowDiff.missingCount === 0) {
    return <div className="p-4 text-sm text-text-secondary">No rows to compare.</div>
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-surface-raised">
            <tr>
              <th className="w-7 border-b border-border px-2 py-2" />
              {rowDiff.columns.map((col) => (
                <th key={col} className="whitespace-nowrap border-b border-border px-3 py-2 font-medium text-text-secondary">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.status === 'extra' ? 'bg-danger/10' : 'bg-success/5'}>
                <td className="border-b border-border-subtle px-2 py-1.5 text-center">
                  {row.status === 'match' ? (
                    <CheckCircle2 className="inline h-3.5 w-3.5 text-success" />
                  ) : (
                    <XCircle className="inline h-3.5 w-3.5 text-danger" />
                  )}
                </td>
                {row.values.map((v, j) => (
                  <td key={j} className="whitespace-nowrap border-b border-border-subtle px-3 py-1.5 font-mono text-text-primary">
                    {formatCell(v)}
                  </td>
                ))}
              </tr>
            ))}
            {rowDiff.missingCount > 0 && (
              <tr>
                <td
                  colSpan={rowDiff.columns.length + 1}
                  className="border-b border-dashed border-border-subtle px-3 py-2 text-center text-[11px] italic text-text-muted"
                >
                  + {rowDiff.missingCount} more row{rowDiff.missingCount === 1 ? '' : 's'} expected but missing from your result
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {truncated && (
        <div className="shrink-0 border-t border-border-subtle bg-surface px-3 py-1.5 text-[11px] text-text-muted">
          Showing first {MAX_RENDERED_ROWS.toLocaleString()} of {rowDiff.rows.length.toLocaleString()} of your rows.
        </div>
      )}
      <div className="flex shrink-0 items-center gap-4 border-t border-border-subtle px-3 py-1.5 text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-success" /> matches an expected row
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="h-3 w-3 text-danger" /> not expected in the result
        </span>
      </div>
    </div>
  )
}

function PlanTab({ explainState, onExplain }: { explainState: ExplainState; onExplain: (analyze: boolean) => void }) {
  const busy = explainState.status === 'running'
  const runningAnalyzed = explainState.status === 'running' && explainState.analyzed
  const runningPlain = explainState.status === 'running' && !explainState.analyzed
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-3 py-2">
        <button
          onClick={() => onExplain(false)}
          disabled={busy}
          title="Show the query plan Postgres would use, without running it"
          className="flex cursor-pointer items-center gap-1.5 rounded-md bg-surface-raised px-2.5 py-1 text-[11px] font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
        >
          {runningPlain ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Blocks className="h-3.5 w-3.5 text-accent" />}
          Explain
        </button>
        <button
          onClick={() => onExplain(true)}
          disabled={busy}
          title="Actually run the query (read-only, always rolled back) and show real timings per step"
          className="flex cursor-pointer items-center gap-1.5 rounded-md bg-surface-raised px-2.5 py-1 text-[11px] font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
        >
          {runningAnalyzed ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Blocks className="h-3.5 w-3.5 text-warning" />}
          Explain Analyze
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {explainState.status === 'idle' && (
          <p className="text-sm text-text-secondary">
            <strong>Explain</strong> shows the plan Postgres would use for the current query, without running it. <strong>Explain Analyze</strong>{' '}
            actually runs it (safely, inside the same rolled-back transaction as Run) and adds real row counts and timings per step.
          </p>
        )}
        {explainState.status === 'running' && <p className="text-sm text-text-secondary">Generating plan...</p>}
        {explainState.status === 'error' && (
          <div className="flex items-start gap-2 text-sm text-danger">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="font-mono text-xs">{explainState.error.message}</span>
          </div>
        )}
        {explainState.status === 'success' && <pre className="whitespace-pre font-mono text-[12px] leading-relaxed text-text-primary">{explainState.lines.join('\n')}</pre>}
      </div>
    </div>
  )
}

function HistoryTab({ history, onRestore, onDelete }: { history: QueryHistoryEntry[]; onRestore: (sql: string) => void; onDelete: (id: string) => void }) {
  if (history.length === 0) {
    return <div className="p-4 text-sm text-text-secondary">No queries run yet for this exercise.</div>
  }
  return (
    <div className="h-full overflow-y-auto">
      {history.map((entry) => (
        <div key={entry.id} className="group flex items-start gap-2 border-b border-border-subtle px-3 py-2 hover:bg-surface-hover">
          <OutcomeDot outcome={entry.outcome} />
          <button onClick={() => onRestore(entry.sql)} className="min-w-0 flex-1 cursor-pointer text-left">
            <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-text-secondary group-hover:text-text-primary">{entry.sql}</pre>
            <div className="mt-0.5 text-[10px] text-text-muted">{new Date(entry.ranAt).toLocaleTimeString()}</div>
          </button>
          <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
            <button onClick={() => onRestore(entry.sql)} title="Restore" className="cursor-pointer rounded p-1 text-text-muted hover:bg-surface-hover hover:text-accent">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(entry.id)} title="Delete" className="cursor-pointer rounded p-1 text-text-muted hover:bg-surface-hover hover:text-danger">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function OutcomeDot({ outcome }: { outcome: QueryHistoryEntry['outcome'] }) {
  const color =
    outcome === 'submit-ok' ? 'bg-success' : outcome === 'submit-ko' ? 'bg-danger' : outcome === 'run-error' ? 'bg-warning' : 'bg-text-muted'
  return <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} title={outcome} />
}
