import { ChevronLeft, ChevronRight, Lightbulb, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { Exercise } from '../types'

interface ExercisePanelProps {
  exercise: Exercise
  isCompleted: boolean
  onPrev?: () => void
  onNext?: () => void
  hasPrev: boolean
  hasNext: boolean
}

export function ExercisePanel({ exercise, isCompleted, onPrev, onNext, hasPrev, hasNext }: ExercisePanelProps) {
  const [revealedHints, setRevealedHints] = useState(0)
  const [showSolution, setShowSolution] = useState(false)

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
          <span>Level {exercise.level}</span>
          <span>·</span>
          <span>Difficulty {exercise.difficultyScore}/10</span>
          {isCompleted && <span className="rounded-full bg-success/15 px-2 py-0.5 text-success">Completed</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary disabled:pointer-events-none disabled:opacity-30"
            title="Previous exercise"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary disabled:pointer-events-none disabled:opacity-30"
            title="Next exercise"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-text-primary">{exercise.title}</h2>

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">{exercise.description}</p>

      {exercise.requirements && exercise.requirements.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Requirements</div>
          <ul className="mt-1.5 space-y-1">
            {exercise.requirements.map((r, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-text-secondary">
                <span className="text-accent">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {exercise.conceptTags.map((tag) => (
          <span key={tag} className="rounded-full border border-border-subtle bg-surface-raised px-2 py-0.5 text-[10px] text-text-secondary">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-text-muted">
        Tables: <span className="font-mono">{exercise.tablesInvolved.join(', ')}</span>
      </div>

      {exercise.hints.length > 0 && (
        <div className="mt-5 border-t border-border-subtle pt-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            <Lightbulb className="h-3.5 w-3.5" />
            Hints
          </div>
          <div className="mt-2 space-y-2">
            {exercise.hints.slice(0, revealedHints).map((hint) => (
              <div key={hint.order} className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs text-text-secondary">
                {hint.text}
              </div>
            ))}
          </div>
          {revealedHints < exercise.hints.length && (
            <button
              onClick={() => setRevealedHints((n) => n + 1)}
              className="mt-2 rounded-md border border-border-subtle px-2.5 py-1 text-[11px] text-text-secondary hover:border-accent hover:text-accent"
            >
              Reveal hint {revealedHints + 1} of {exercise.hints.length}
            </button>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="mt-5 border-t border-border-subtle pt-4">
          {!showSolution ? (
            <button
              onClick={() => setShowSolution(true)}
              className="flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1.5 text-[11px] text-text-secondary hover:border-accent hover:text-accent"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Show official solution
            </button>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                <Sparkles className="h-3.5 w-3.5" />
                Official solution
              </div>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-border-subtle bg-surface-raised p-3 font-mono text-[11px] text-text-primary">
                {exercise.solution.sql}
              </pre>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">{exercise.solution.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
