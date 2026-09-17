import { CheckCircle2, ChevronDown, Circle, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import { LEVELS } from '../data/levels'
import { EXERCISES_BY_LEVEL } from '../data/exercises'
import { useProgressStore } from '../features/progress/store'

interface ExerciseSidebarProps {
  currentExerciseId: string
  onSelect: (id: string) => void
}

export function ExerciseSidebar({ currentExerciseId, onSelect }: ExerciseSidebarProps) {
  const exercises = useProgressStore((s) => s.exercises)
  const activeLevelFromCurrent = Object.values(EXERCISES_BY_LEVEL)
    .flat()
    .find((e) => e.id === currentExerciseId)?.level
  const [openLevel, setOpenLevel] = useState<number>(activeLevelFromCurrent ?? 1)

  return (
    <nav className="flex h-full flex-col overflow-y-auto bg-surface">
      {LEVELS.map((level) => {
        const levelExercises = EXERCISES_BY_LEVEL[level.id] ?? []
        const completedCount = levelExercises.filter((e) => exercises[e.id]?.status === 'completed').length
        const isOpen = openLevel === level.id

        return (
          <div key={level.id} className="border-b border-border-subtle">
            <button
              onClick={() => setOpenLevel(isOpen ? -1 : level.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-surface-hover"
            >
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-text-muted transition-transform ${isOpen ? '' : '-rotate-90'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary">
                    L{level.id} · {level.title}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] text-text-muted">{level.subtitle}</div>
              </div>
              <span className="shrink-0 rounded-full bg-surface-raised px-1.5 py-0.5 text-[10px] tabular-nums text-text-secondary">
                {completedCount}/{levelExercises.length}
              </span>
            </button>

            {isOpen && (
              <ul className="pb-1">
                {levelExercises.map((ex) => {
                  const progress = exercises[ex.id]
                  const isActive = ex.id === currentExerciseId
                  return (
                    <li key={ex.id}>
                      <button
                        onClick={() => onSelect(ex.id)}
                        className={`flex w-full items-center gap-2 px-3 py-1.5 pl-8 text-left text-xs transition-colors ${
                          isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                        }`}
                      >
                        <StatusIcon status={progress?.status ?? 'unattempted'} active={isActive} />
                        <span className="min-w-0 flex-1 truncate">{ex.title}</span>
                        <DifficultyDots score={ex.difficultyScore} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function StatusIcon({ status, active }: { status: 'unattempted' | 'attempted' | 'completed'; active: boolean }) {
  if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
  if (status === 'attempted') return <PlayCircle className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-accent' : 'text-warning'}`} />
  return <Circle className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-accent' : 'text-text-muted'}`} />
}

function DifficultyDots({ score }: { score: number }) {
  const filled = Math.max(1, Math.round(score / 2))
  return (
    <span className="flex shrink-0 items-center gap-0.5" title={`Difficulty ${score}/10`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-1 w-1 rounded-full ${i < filled ? 'bg-text-secondary' : 'bg-border'}`} />
      ))}
    </span>
  )
}
