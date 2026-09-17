import { useEffect, useRef, useState } from 'react'
import { initDatabase, type InitProgress } from '../database/db'

export type DbInitState =
  | { status: 'initializing'; progress: InitProgress }
  | { status: 'ready' }
  | { status: 'error'; message: string }

export function useDatabase(): DbInitState {
  const [state, setState] = useState<DbInitState>({
    status: 'initializing',
    progress: { phase: 'starting', completed: 0, total: 1, message: 'Starting up...' },
  })
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    initDatabase((progress) => setState({ status: 'initializing', progress }))
      .then(() => setState({ status: 'ready' }))
      .catch((err) => setState({ status: 'error', message: err instanceof Error ? err.message : String(err) }))
  }, [])

  return state
}
