import { Database } from 'lucide-react'
import type { InitProgress } from '../database/db'

const PHASE_LABELS: Record<InitProgress['phase'], string> = {
  starting: 'Booting engine',
  connecting: 'Connecting',
  checking: 'Checking database',
  schema: 'Creating schema',
  seeding: 'Generating seed data',
  ready: 'Ready',
}

export function InitScreen({ progress }: { progress: InitProgress }) {
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-6 bg-canvas px-6 text-text-primary">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-raised">
          <Database className="h-7 w-7 text-accent" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Postgres Arena</h1>
        <p className="text-sm text-text-secondary">Booting a real PostgreSQL engine, in your browser.</p>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-2 flex items-center justify-between text-xs text-text-secondary">
          <span>{PHASE_LABELS[progress.phase]}</span>
          {progress.phase === 'seeding' && <span>{pct}%</span>}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
            style={{ width: progress.phase === 'seeding' ? `${pct}%` : '100%', opacity: progress.phase === 'seeding' ? 1 : 0.5 }}
          />
        </div>
        <p className="mt-3 text-center text-xs text-text-muted">{progress.message}</p>
      </div>

      <p className="max-w-sm text-center text-xs text-text-muted">
        First load generates ~75,000 rows of realistic e-commerce data and persists them to IndexedDB — subsequent visits load instantly.
      </p>
    </div>
  )
}
