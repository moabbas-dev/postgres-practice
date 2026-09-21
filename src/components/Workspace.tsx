import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, NotebookText, PanelLeftClose } from 'lucide-react'
import { ExercisePanel } from './ExercisePanel'
import { EditorToolbar } from './EditorToolbar'
import { ResultPanel } from './ResultPanel'
import { ResizeHandle } from './ResizeHandle'
import { CollapsedRail } from './CollapsedRail'
import { formatSql } from '../features/editor/formatSql'
import { uppercaseKeywords } from '../features/editor/uppercaseKeywords'
import { runUserQuery, toQueryError } from '../database/db'
import { validateSubmission } from '../features/validation/validate'
import { useProgressStore } from '../features/progress/store'
import { useHistoryStore } from '../features/progress/historyStore'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePersistedCollapsed, usePersistedSize } from '../hooks/useResizablePanel'
import type { Exercise, ExplainState, QueryExecution, ValidationResult } from '../types'
import type { Theme } from '../hooks/useTheme'
import type { SqlEditorHandle } from '../features/editor/SqlEditor'

const SqlEditor = lazy(() => import('../features/editor/SqlEditor').then((m) => ({ default: m.SqlEditor })))

const DEFAULT_STARTER = '-- Write your PostgreSQL query here\n\n'

interface WorkspaceProps {
  exercise: Exercise
  theme: Theme
  onPrev?: () => void
  onNext?: () => void
  hasPrev: boolean
  hasNext: boolean
}

export function Workspace({ exercise, theme, onPrev, onNext, hasPrev, hasNext }: WorkspaceProps) {
  const progress = useProgressStore((s) => s.exercises[exercise.id])
  const recordAttempt = useProgressStore((s) => s.recordAttempt)
  const recordSubmission = useProgressStore((s) => s.recordSubmission)
  const allHistoryEntries = useHistoryStore((s) => s.entries)
  const historyEntries = useMemo(
    () => allHistoryEntries.filter((e) => e.exerciseId === exercise.id).sort((a, b) => b.ranAt - a.ranAt),
    [allHistoryEntries, exercise.id],
  )
  const addHistoryEntry = useHistoryStore((s) => s.addEntry)
  const deleteHistoryEntry = useHistoryStore((s) => s.deleteEntry)

  const [sql, setSql] = useState(() => progress?.lastQuery ?? exercise.starterQuery ?? DEFAULT_STARTER)
  const [execution, setExecution] = useState<QueryExecution>({ status: 'idle' })
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [explainState, setExplainState] = useState<ExplainState>({ status: 'idle' })
  const sqlEditorRef = useRef<SqlEditorHandle>(null)

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [descriptionWidth, setDescriptionWidth] = usePersistedSize('pg-arena:description-width', 380)
  const [descriptionCollapsed, setDescriptionCollapsed] = usePersistedCollapsed('pg-arena:description-collapsed', false)
  const [resultHeight, setResultHeight] = usePersistedSize('pg-arena:result-height', 320)
  const [resultCollapsed, setResultCollapsed] = usePersistedCollapsed('pg-arena:result-collapsed', false)

  const isCompleted = progress?.status === 'completed'

  async function runQuery(queryText: string) {
    if (execution.status === 'running') return
    setExecution({ status: 'running' })
    setValidation(null)
    try {
      const result = await runUserQuery(queryText)
      setExecution({ status: 'success', result })
      recordAttempt(exercise.id, sql)
      addHistoryEntry(exercise.id, queryText, 'run-success')
    } catch (err) {
      const error = toQueryError(err)
      setExecution({ status: 'error', error })
      recordAttempt(exercise.id, sql)
      addHistoryEntry(exercise.id, queryText, 'run-error')
    }
  }

  function handleRun() {
    return runQuery(sql)
  }

  function handleRunSelected() {
    const selected = sqlEditorRef.current?.getSelectedText().trim()
    return runQuery(selected || sql)
  }

  async function handleExplain(analyze: boolean) {
    if (explainState.status === 'running') return
    setExplainState({ status: 'running', analyzed: analyze })
    try {
      const result = await runUserQuery(`EXPLAIN ${analyze ? 'ANALYZE ' : ''}${sql}`)
      const planColumn = result.columns[0]?.name ?? 'QUERY PLAN'
      const lines = result.rows.map((row) => String(row[planColumn]))
      setExplainState({ status: 'success', lines, analyzed: analyze })
    } catch (err) {
      setExplainState({ status: 'error', error: toQueryError(err), analyzed: analyze })
    }
  }

  async function handleSubmit() {
    if (execution.status === 'running') return
    setExecution({ status: 'running' })
    setValidation(null)
    const { validation: result, userResult } = await validateSubmission(exercise, sql)
    setValidation(result)
    if (userResult) {
      setExecution({ status: 'success', result: userResult })
    } else {
      setExecution({ status: 'error', error: { message: result.message, detail: result.detail } })
    }
    const ok = result.status === 'ok'
    recordSubmission(exercise.id, ok, sql)
    addHistoryEntry(exercise.id, sql, ok ? 'submit-ok' : 'submit-ko')
  }

  function handleFormat() {
    setSql((prev) => formatSql(prev))
  }

  function handleUppercaseKeywords() {
    setSql((prev) => uppercaseKeywords(prev))
  }

  function handleReset() {
    setSql(exercise.starterQuery ?? DEFAULT_STARTER)
    setExecution({ status: 'idle' })
    setValidation(null)
    setExplainState({ status: 'idle' })
  }

  function handleRestoreHistory(restoredSql: string) {
    setSql(restoredSql)
  }

  const descChrome = isDesktop && !descriptionCollapsed

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
      <div
        className={`relative shrink-0 overflow-hidden border-b border-border-subtle lg:border-b-0 lg:border-r ${
          isDesktop ? '' : descriptionCollapsed ? 'h-9' : 'h-64'
        }`}
        style={isDesktop ? { width: descriptionCollapsed ? 40 : descriptionWidth } : undefined}
      >
        {isDesktop && descriptionCollapsed ? (
          <CollapsedRail label="Description" icon={<NotebookText className="h-4 w-4" />} onExpand={() => setDescriptionCollapsed(false)} />
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex h-8 shrink-0 items-center justify-between border-b border-border-subtle px-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                <NotebookText className="h-3.5 w-3.5" />
                Description
              </span>
              <button
                onClick={() => setDescriptionCollapsed(!descriptionCollapsed)}
                className="cursor-pointer rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
                title={descriptionCollapsed ? 'Expand description panel' : 'Collapse description panel'}
              >
                {isDesktop ? (
                  <PanelLeftClose className="h-3.5 w-3.5" />
                ) : descriptionCollapsed ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            {!descriptionCollapsed && (
              <div className="min-h-0 flex-1">
                <ExercisePanel exercise={exercise} isCompleted={isCompleted} onPrev={onPrev} onNext={onNext} hasPrev={hasPrev} hasNext={hasNext} />
              </div>
            )}
          </div>
        )}
        {descChrome && (
          <ResizeHandle axis="x" size={descriptionWidth} onResize={setDescriptionWidth} min={280} max={680} className="absolute right-0 top-0 h-full -mr-[3px]" />
        )}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <EditorToolbar
          onRun={handleRun}
          onRunSelected={handleRunSelected}
          onSubmit={handleSubmit}
          onFormat={handleFormat}
          onUppercaseKeywords={handleUppercaseKeywords}
          onReset={handleReset}
          isRunning={execution.status === 'running' && !validation}
          isSubmitting={execution.status === 'running'}
        />
        <div className="min-h-[120px] flex-1">
          <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-text-muted">Loading editor...</div>}>
            <SqlEditor ref={sqlEditorRef} value={sql} onChange={setSql} onRun={handleRun} onSubmit={handleSubmit} onRunSelected={handleRunSelected} theme={theme} />
          </Suspense>
        </div>
        {!resultCollapsed && (
          <ResizeHandle axis="y" size={resultHeight} onResize={setResultHeight} min={140} max={720} invert className="border-t border-border-subtle" />
        )}
        <div className={`shrink-0 ${resultCollapsed ? 'h-9' : ''}`} style={resultCollapsed ? undefined : { height: resultHeight }}>
          <ResultPanel
            execution={execution}
            validation={validation}
            history={historyEntries}
            onRestoreHistory={handleRestoreHistory}
            onDeleteHistory={deleteHistoryEntry}
            collapsed={resultCollapsed}
            onToggleCollapsed={() => setResultCollapsed(!resultCollapsed)}
            explainState={explainState}
            onExplain={handleExplain}
          />
        </div>
      </div>
    </div>
  )
}
