import { useEffect, useMemo, useState } from 'react'
import { ListTree, PanelLeftClose } from 'lucide-react'
import { Header } from './components/Header'
import { ExerciseSidebar } from './components/ExerciseSidebar'
import { SchemaExplorer } from './components/SchemaExplorer'
import { SchemaDiagram } from './components/SchemaDiagram'
import { Workspace } from './components/Workspace'
import { InitScreen } from './components/InitScreen'
import { CollapsedRail } from './components/CollapsedRail'
import { ResizeHandle } from './components/ResizeHandle'
import { useDatabase } from './hooks/useDatabase'
import { useTheme } from './hooks/useTheme'
import { useMediaQuery } from './hooks/useMediaQuery'
import { usePersistedCollapsed, usePersistedSize } from './hooks/useResizablePanel'
import { useProgressStore } from './features/progress/store'
import { ALL_EXERCISES, EXERCISE_BY_ID, getNextExercise, getPrevExercise } from './data/exercises'

function App() {
  const dbState = useDatabase()
  const [theme, toggleTheme] = useTheme()

  const hasHydrated = useProgressStore((s) => s.hasHydrated)
  const storedCurrentId = useProgressStore((s) => s.currentExerciseId)
  const setCurrentExercise = useProgressStore((s) => s.setCurrentExercise)
  const exercisesProgress = useProgressStore((s) => s.exercises)
  const resetAllProgress = useProgressStore((s) => s.resetAllProgress)

  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [page, setPage] = useState<'workspace' | 'diagram'>('workspace')

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarWidth, setSidebarWidth] = usePersistedSize('pg-arena:sidebar-width', 256)
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistedCollapsed('pg-arena:sidebar-collapsed', false)

  const currentExerciseId = storedCurrentId && EXERCISE_BY_ID[storedCurrentId] ? storedCurrentId : ALL_EXERCISES[0].id
  const exercise = EXERCISE_BY_ID[currentExerciseId]

  useEffect(() => {
    if (hasHydrated && !storedCurrentId) {
      setCurrentExercise(ALL_EXERCISES[0].id)
    }
  }, [hasHydrated, storedCurrentId, setCurrentExercise])

  const completedCount = useMemo(() => Object.values(exercisesProgress).filter((e) => e.status === 'completed').length, [exercisesProgress])

  function selectExercise(id: string) {
    setCurrentExercise(id)
    setLeftOpen(false)
  }

  const prev = getPrevExercise(exercise.id)
  const next = getNextExercise(exercise.id)

  function handleResetProgress() {
    if (window.confirm('Reset all progress? This clears completion status and attempt counts for every exercise. Query history is kept.')) {
      resetAllProgress()
    }
  }

  if (dbState.status === 'error') {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-canvas px-6 text-center text-text-primary">
        <h1 className="text-lg font-semibold text-danger">Database failed to start</h1>
        <p className="max-w-md text-sm text-text-secondary">{dbState.message}</p>
        <button onClick={() => window.location.reload()} className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas cursor-pointer">
          Reload
        </button>
      </div>
    )
  }

  if (dbState.status === 'initializing' || !hasHydrated) {
    return <InitScreen progress={dbState.status === 'initializing' ? dbState.progress : { phase: 'ready', completed: 1, total: 1, message: 'Loading progress...' }} />
  }

  const sidebarChrome = isDesktop && !sidebarCollapsed

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-canvas text-text-primary">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleLeftPanel={() => setLeftOpen((v) => !v)}
        onToggleRightPanel={() => setRightOpen((v) => !v)}
        onResetProgress={handleResetProgress}
        completedCount={completedCount}
        totalCount={ALL_EXERCISES.length}
      />

      {page === 'diagram' ? (
        <SchemaDiagram onBack={() => setPage('workspace')} />
      ) : (
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <aside
            className={`absolute inset-y-0 left-0 z-20 border-r border-border-subtle bg-canvas shadow-xl transition-transform lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
              leftOpen ? 'translate-x-0' : '-translate-x-full'
            } ${isDesktop ? '' : 'w-72'}`}
            style={isDesktop ? { width: sidebarCollapsed ? 40 : sidebarWidth } : undefined}
          >
            {isDesktop && sidebarCollapsed ? (
              <CollapsedRail label="Questions" icon={<ListTree className="h-4 w-4" />} onExpand={() => setSidebarCollapsed(false)} />
            ) : (
              <div className="flex h-full flex-col">
                <div className="flex h-8 shrink-0 items-center justify-between border-b border-border-subtle px-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    <ListTree className="h-3.5 w-3.5" />
                    Questions
                  </span>
                  {isDesktop && (
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="cursor-pointer rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
                      title="Collapse questions panel"
                    >
                      <PanelLeftClose className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="min-h-0 flex-1">
                  <ExerciseSidebar currentExerciseId={exercise.id} onSelect={selectExercise} />
                </div>
              </div>
            )}
            {sidebarChrome && (
              <ResizeHandle axis="x" size={sidebarWidth} onResize={setSidebarWidth} min={220} max={480} className="absolute right-0 top-0 h-full -mr-[3px]" />
            )}
          </aside>
          {leftOpen && <div className="fixed inset-0 z-10 cursor-pointer bg-black/40 lg:hidden" onClick={() => setLeftOpen(false)} />}

          <Workspace
            key={exercise.id}
            exercise={exercise}
            theme={theme}
            onPrev={prev ? () => selectExercise(prev.id) : undefined}
            onNext={next ? () => selectExercise(next.id) : undefined}
            hasPrev={!!prev}
            hasNext={!!next}
          />

          <aside
            className={`absolute inset-y-0 right-0 z-20 w-80 border-l border-border-subtle bg-canvas shadow-xl transition-transform xl:static xl:z-auto xl:w-80 xl:translate-x-0 xl:shadow-none ${
              rightOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <SchemaExplorer onOpenDiagram={() => setPage('diagram')} />
          </aside>
          {rightOpen && <div className="fixed inset-0 z-10 cursor-pointer bg-black/40 xl:hidden" onClick={() => setRightOpen(false)} />}
        </div>
      )}
    </div>
  )
}

export default App
