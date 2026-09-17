import { Database, ListTree, Moon, RotateCcw, Sun, Table2 } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'

interface HeaderProps {
  theme: Theme
  onToggleTheme: () => void
  onToggleLeftPanel: () => void
  onToggleRightPanel: () => void
  onResetProgress: () => void
  completedCount: number
  totalCount: number
}

export function Header({ theme, onToggleTheme, onToggleLeftPanel, onToggleRightPanel, onResetProgress, completedCount, totalCount }: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface px-3">
      <button onClick={onToggleLeftPanel} className="cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-hover lg:hidden" title="Toggle exercises">
        <ListTree className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold tracking-tight text-text-primary">Postgres Arena</span>
      </div>

      <div className="ml-2 hidden items-center gap-2 text-[11px] text-text-muted sm:flex">
        <div className="h-1 w-28 overflow-hidden rounded-full bg-surface-raised">
          <div className="h-full rounded-full bg-success" style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }} />
        </div>
        <span className="tabular-nums">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button onClick={onResetProgress} title="Reset all progress" className="cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-danger">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button onClick={onToggleTheme} title="Toggle theme" className="cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-hover">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button onClick={onToggleRightPanel} className="cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-hover xl:hidden" title="Toggle schema explorer">
          <Table2 className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
