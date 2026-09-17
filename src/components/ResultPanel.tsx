import { AlertTriangle, CheckCircle2, Clock, History, RotateCcw, Table2, Trash2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { ResultsTable } from './ResultsTable'
import type { QueryExecution, QueryHistoryEntry, ValidationResult } from '../types'

interface ResultPanelProps {
  execution: QueryExecution
  validation: ValidationResult | null
  history: QueryHistoryEntry[]
  onRestoreHistory: (sql: string) => void
  onDeleteHistory: (id: string) => void
}

type Tab = 'results' | 'history'

export function ResultPanel({ execution, validation, history, onRestoreHistory, onDeleteHistory }: ResultPanelProps) {
  const [tab, setTab] = useState<Tab>('results')

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">
      {validation && <ValidationBanner validation={validation} />}

      <div className="flex items-center gap-1 border-b border-border-subtle px-2 pt-1.5">
        <TabButton active={tab === 'results'} onClick={() => setTab('results')} icon={<Table2 className="h-3.5 w-3.5" />} label="Results" />
        <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={<History className="h-3.5 w-3.5" />} label={`History (${history.length})`} />
        <div className="ml-auto pr-2 text-[11px] text-text-muted">
          {execution.status === 'success' && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {execution.result.durationMs.toFixed(0)}ms · {execution.result.rowCount.toLocaleString()} rows
            </span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === 'results' && <ResultsTab execution={execution} />}
        {tab === 'history' && <HistoryTab history={history} onRestore={onRestoreHistory} onDelete={onDeleteHistory} />}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors ${
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

function HistoryTab({ history, onRestore, onDelete }: { history: QueryHistoryEntry[]; onRestore: (sql: string) => void; onDelete: (id: string) => void }) {
  if (history.length === 0) {
    return <div className="p-4 text-sm text-text-secondary">No queries run yet for this exercise.</div>
  }
  return (
    <div className="h-full overflow-y-auto">
      {history.map((entry) => (
        <div key={entry.id} className="group flex items-start gap-2 border-b border-border-subtle px-3 py-2 hover:bg-surface-hover">
          <OutcomeDot outcome={entry.outcome} />
          <button onClick={() => onRestore(entry.sql)} className="min-w-0 flex-1 text-left">
            <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-text-secondary group-hover:text-text-primary">{entry.sql}</pre>
            <div className="mt-0.5 text-[10px] text-text-muted">{new Date(entry.ranAt).toLocaleTimeString()}</div>
          </button>
          <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
            <button onClick={() => onRestore(entry.sql)} title="Restore" className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-accent">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(entry.id)} title="Delete" className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-danger">
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
