import { get, set, del } from 'idb-keyval'
import { create } from 'zustand'
import { persist, type StateStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { QueryHistoryEntry } from '../../types'

const idbStorage: StateStorage = {
  getItem: async (name) => (await get(name)) ?? null,
  setItem: async (name, value) => {
    await set(name, value)
  },
  removeItem: async (name) => {
    await del(name)
  },
}

const MAX_ENTRIES_PER_EXERCISE = 20

interface HistoryState {
  entries: QueryHistoryEntry[]
  addEntry: (exerciseId: string, sql: string, outcome: QueryHistoryEntry['outcome']) => void
  getForExercise: (exerciseId: string) => QueryHistoryEntry[]
  deleteEntry: (id: string) => void
  clearForExercise: (exerciseId: string) => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (exerciseId, sql, outcome) =>
        set((state) => {
          const trimmedSql = sql.trim()
          if (!trimmedSql) return state
          const withoutDup = state.entries.filter((e) => !(e.exerciseId === exerciseId && e.sql === trimmedSql))
          const entry: QueryHistoryEntry = { id: uuidv4(), exerciseId, sql: trimmedSql, ranAt: Date.now(), outcome }
          const forExercise = withoutDup.filter((e) => e.exerciseId === exerciseId)
          const others = withoutDup.filter((e) => e.exerciseId !== exerciseId)
          const trimmed = [entry, ...forExercise].slice(0, MAX_ENTRIES_PER_EXERCISE)
          return { entries: [...others, ...trimmed] }
        }),
      getForExercise: (exerciseId) =>
        get()
          .entries.filter((e) => e.exerciseId === exerciseId)
          .sort((a, b) => b.ranAt - a.ranAt),
      deleteEntry: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      clearForExercise: (exerciseId) => set((state) => ({ entries: state.entries.filter((e) => e.exerciseId !== exerciseId) })),
    }),
    {
      name: 'postgres-arena-history',
      storage: {
        getItem: async (name) => {
          const value = await idbStorage.getItem(name)
          return value ? JSON.parse(value as unknown as string) : null
        },
        setItem: async (name, value) => {
          await idbStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: idbStorage.removeItem,
      },
    },
  ),
)
