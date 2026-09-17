import { lazy, Suspense, useMemo, useState } from 'react'
import { ExercisePanel } from './ExercisePanel'
import { EditorToolbar } from './EditorToolbar'
import { ResultPanel } from './ResultPanel'
import { formatSql } from '../features/editor/formatSql'
import { runUserQuery, toQueryError } from '../database/db'
import { validateSubmission } from '../features/validation/validate'
import { useProgressStore } from '../features/progress/store'
import { useHistoryStore } from '../features/progress/historyStore'
import type { Exercise, QueryExecution, ValidationResult } from '../types'
import type { Theme } from '../hooks/useTheme'

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

  const isCompleted = progress?.status === 'completed'

  async function handleRun() {
    if (execution.status === 'running') return
    setExecution({ status: 'running' })
    setValidation(null)
    try {
      const result = await runUserQuery(sql)
      setExecution({ status: 'success', result })
      recordAttempt(exercise.id, sql)
      addHistoryEntry(exercise.id, sql, 'run-success')
    } catch (err) {
      const error = toQueryError(err)
      setExecution({ status: 'error', error })
      recordAttempt(exercise.id, sql)
      addHistoryEntry(exercise.id, sql, 'run-error')
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

  function handleReset() {
    setSql(exercise.starterQuery ?? DEFAULT_STARTER)
    setExecution({ status: 'idle' })
    setValidation(null)
  }

  function handleRestoreHistory(restoredSql: string) {
    setSql(restoredSql)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="h-64 shrink-0 overflow-hidden border-b border-border-subtle lg:h-auto lg:w-[380px] lg:border-b-0 lg:border-r">
        <ExercisePanel exercise={exercise} isCompleted={isCompleted} onPrev={onPrev} onNext={onNext} hasPrev={hasPrev} hasNext={hasNext} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <EditorToolbar
          onRun={handleRun}
          onSubmit={handleSubmit}
          onFormat={handleFormat}
          onReset={handleReset}
          isRunning={execution.status === 'running' && !validation}
          isSubmitting={execution.status === 'running'}
        />
        <div className="h-64 min-h-[160px] shrink-0 border-b border-border-subtle lg:h-2/5">
          <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-text-muted">Loading editor...</div>}>
            <SqlEditor value={sql} onChange={setSql} onRun={handleRun} theme={theme} />
          </Suspense>
        </div>
        <div className="min-h-0 flex-1">
          <ResultPanel execution={execution} validation={validation} history={historyEntries} onRestoreHistory={handleRestoreHistory} onDeleteHistory={deleteHistoryEntry} />
        </div>
      </div>
    </div>
  )
}
