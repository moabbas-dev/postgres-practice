import { PGliteWorker } from '@electric-sql/pglite/worker'
import type { QueryError, QueryResult } from '../types'
import { generateSeedStatements } from './seed'
import { GuardError, guardReadOnly } from './guard'
import schemaSql from './schema.sql?raw'

export type InitPhase = 'starting' | 'connecting' | 'checking' | 'schema' | 'seeding' | 'ready'

export interface InitProgress {
  phase: InitPhase
  completed: number
  total: number
  message: string
}

const STATEMENT_TIMEOUT_MS = 8000

let workerInstance: PGliteWorker | null = null
let readyPromise: Promise<void> | null = null

function getWorker(): PGliteWorker {
  if (!workerInstance) throw new Error('Database not initialized yet')
  return workerInstance
}

export async function initDatabase(onProgress?: (p: InitProgress) => void): Promise<void> {
  if (readyPromise) return readyPromise
  readyPromise = (async () => {
    const report = (p: InitProgress) => onProgress?.(p)
    report({ phase: 'starting', completed: 0, total: 1, message: 'Booting PGlite (WebAssembly Postgres)...' })

    const worker = new Worker(new URL('./pgWorker.ts', import.meta.url), { type: 'module' })
    const pg = await PGliteWorker.create(worker, { id: 'postgres-arena' })
    workerInstance = pg
    report({ phase: 'connecting', completed: 0, total: 1, message: 'Connecting to database engine...' })

    const existing = await pg.query<{ exists: boolean }>(
      `select exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'orders') as exists`,
    )
    const alreadyInitialized = existing.rows[0]?.exists === true

    if (alreadyInitialized) {
      const countRes = await pg.query<{ count: string }>(`select count(*)::text as count from orders`)
      const rowCount = Number(countRes.rows[0]?.count ?? '0')
      if (rowCount > 0) {
        report({ phase: 'ready', completed: 1, total: 1, message: 'Database ready.' })
        return
      }
    }

    report({ phase: 'schema', completed: 0, total: 1, message: 'Creating schema (20 tables, enums, indexes)...' })
    await pg.exec(schemaSql)

    report({ phase: 'seeding', completed: 0, total: 1, message: 'Generating realistic seed dataset...' })
    const statements = generateSeedStatements()
    const total = statements.length
    let completed = 0
    const CHUNK = 6
    for (let i = 0; i < statements.length; i += CHUNK) {
      const chunk = statements.slice(i, i + CHUNK).join('\n')
      await pg.exec(chunk)
      completed = Math.min(i + CHUNK, total)
      report({ phase: 'seeding', completed, total, message: `Seeding data (${completed}/${total} batches)...` })
    }

    await pg.exec('analyze;')
    report({ phase: 'ready', completed: 1, total: 1, message: 'Database ready.' })
  })()
  return readyPromise
}

export function isReady(): boolean {
  return workerInstance !== null
}

/**
 * Executes a user-supplied read-only query inside a transaction that is
 * always rolled back, so the shared practice dataset can never be mutated.
 */
export async function runUserQuery(sql: string): Promise<QueryResult> {
  guardReadOnly(sql)
  const pg = getWorker()
  const start = performance.now()

  const outcome = await pg.transaction(async (tx) => {
    await tx.query(`set local statement_timeout = ${STATEMENT_TIMEOUT_MS}`)
    try {
      const res = await tx.query(sql)
      return { ok: true as const, res }
    } catch (err) {
      return { ok: false as const, err }
    } finally {
      await tx.rollback()
    }
  })

  const durationMs = performance.now() - start

  if (!outcome.ok) {
    throw toQueryError(outcome.err)
  }

  return {
    columns: outcome.res.fields.map((f) => ({ name: f.name, dataTypeId: f.dataTypeID })),
    rows: outcome.res.rows as Record<string, unknown>[],
    rowCount: outcome.res.rows.length,
    durationMs,
  }
}

export function toQueryError(err: unknown): QueryError {
  if (err instanceof GuardError) {
    return { message: err.message }
  }
  const e = err as { message?: string; detail?: string; hint?: string; position?: string; code?: string }
  return {
    message: e?.message ?? 'An unknown error occurred while running the query.',
    detail: e?.detail,
    hint: e?.hint,
    position: e?.position,
    code: e?.code,
  }
}

export async function previewTable(tableName: string, limit = 25): Promise<QueryResult> {
  if (!/^[a-z_][a-z0-9_]*$/.test(tableName)) throw new Error('Invalid table name')
  return runUserQuery(`select * from ${tableName} limit ${limit}`)
}
