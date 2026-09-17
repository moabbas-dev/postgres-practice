import { get, set, del } from 'idb-keyval'
import { create } from 'zustand'
import { persist, type StateStorage } from 'zustand/middleware'
import type { ExerciseProgress } from '../../types'

const idbStorage: StateStorage = {
  getItem: async (name) => (await get(name)) ?? null,
  setItem: async (name, value) => {
    await set(name, value)
  },
  removeItem: async (name) => {
    await del(name)
  },
}

interface ProgressState {
  currentExerciseId: string | null
  exercises: Record<string, ExerciseProgress>
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  setCurrentExercise: (exerciseId: string) => void
  recordAttempt: (exerciseId: string, query: string) => void
  recordSubmission: (exerciseId: string, ok: boolean, query: string) => void
  resetExercise: (exerciseId: string) => void
  resetAllProgress: () => void
}

function getOrCreate(state: ProgressState, exerciseId: string): ExerciseProgress {
  return (
    state.exercises[exerciseId] ?? {
      exerciseId,
      status: 'unattempted',
      attempts: 0,
      successfulSubmissions: 0,
      failedSubmissions: 0,
    }
  )
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      currentExerciseId: null,
      exercises: {},
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      setCurrentExercise: (exerciseId) => set({ currentExerciseId: exerciseId }),
      recordAttempt: (exerciseId, query) =>
        set((state) => {
          const prev = getOrCreate(state, exerciseId)
          const updated: ExerciseProgress = {
            ...prev,
            attempts: prev.attempts + 1,
            lastQuery: query,
            lastAttemptAt: Date.now(),
            status: prev.status === 'unattempted' ? 'attempted' : prev.status,
          }
          return { exercises: { ...state.exercises, [exerciseId]: updated } }
        }),
      recordSubmission: (exerciseId, ok, query) =>
        set((state) => {
          const prev = getOrCreate(state, exerciseId)
          const updated: ExerciseProgress = {
            ...prev,
            lastQuery: query,
            lastAttemptAt: Date.now(),
            successfulSubmissions: prev.successfulSubmissions + (ok ? 1 : 0),
            failedSubmissions: prev.failedSubmissions + (ok ? 0 : 1),
            status: ok ? 'completed' : prev.status === 'unattempted' ? 'attempted' : prev.status,
            firstCompletedAt: ok ? (prev.firstCompletedAt ?? Date.now()) : prev.firstCompletedAt,
          }
          return { exercises: { ...state.exercises, [exerciseId]: updated } }
        }),
      resetExercise: (exerciseId) =>
        set((state) => {
          const next = { ...state.exercises }
          delete next[exerciseId]
          return { exercises: next }
        }),
      resetAllProgress: () => set({ exercises: {}, currentExerciseId: null }),
    }),
    {
      name: 'postgres-arena-progress',
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
