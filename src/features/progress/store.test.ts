import { beforeEach, describe, expect, it } from 'vitest'
import { useProgressStore } from './store'

describe('useProgressStore', () => {
  beforeEach(() => {
    useProgressStore.getState().resetAllProgress()
  })

  it('starts an exercise as unattempted', () => {
    const state = useProgressStore.getState()
    expect(state.exercises['l1-01']).toBeUndefined()
  })

  it('marks an exercise attempted on the first recorded attempt', () => {
    useProgressStore.getState().recordAttempt('l1-01', 'SELECT 1')
    const ex = useProgressStore.getState().exercises['l1-01']
    expect(ex.status).toBe('attempted')
    expect(ex.attempts).toBe(1)
    expect(ex.lastQuery).toBe('SELECT 1')
  })

  it('increments attempts across multiple calls without resetting status', () => {
    const { recordAttempt } = useProgressStore.getState()
    recordAttempt('l1-01', 'SELECT 1')
    recordAttempt('l1-01', 'SELECT 2')
    const ex = useProgressStore.getState().exercises['l1-01']
    expect(ex.attempts).toBe(2)
    expect(ex.lastQuery).toBe('SELECT 2')
  })

  it('marks an exercise completed on a successful submission', () => {
    useProgressStore.getState().recordSubmission('l1-01', true, 'SELECT 1')
    const ex = useProgressStore.getState().exercises['l1-01']
    expect(ex.status).toBe('completed')
    expect(ex.successfulSubmissions).toBe(1)
    expect(ex.failedSubmissions).toBe(0)
    expect(ex.firstCompletedAt).toBeTypeOf('number')
  })

  it('keeps status attempted (not completed) after a failed submission', () => {
    useProgressStore.getState().recordSubmission('l1-01', false, 'SELECT wrong')
    const ex = useProgressStore.getState().exercises['l1-01']
    expect(ex.status).toBe('attempted')
    expect(ex.failedSubmissions).toBe(1)
  })

  it('does not downgrade a completed exercise back to attempted after a later failed submission', () => {
    const { recordSubmission } = useProgressStore.getState()
    recordSubmission('l1-01', true, 'SELECT correct')
    recordSubmission('l1-01', false, 'SELECT oops')
    const ex = useProgressStore.getState().exercises['l1-01']
    expect(ex.status).toBe('completed')
    expect(ex.successfulSubmissions).toBe(1)
    expect(ex.failedSubmissions).toBe(1)
  })

  it('preserves firstCompletedAt across repeated successful submissions', () => {
    const { recordSubmission } = useProgressStore.getState()
    recordSubmission('l1-01', true, 'SELECT 1')
    const firstTime = useProgressStore.getState().exercises['l1-01'].firstCompletedAt
    recordSubmission('l1-01', true, 'SELECT 1 -- again')
    const secondTime = useProgressStore.getState().exercises['l1-01'].firstCompletedAt
    expect(secondTime).toBe(firstTime)
  })

  it('tracks exercises independently by id', () => {
    const { recordAttempt } = useProgressStore.getState()
    recordAttempt('l1-01', 'a')
    recordAttempt('l2-01', 'b')
    const state = useProgressStore.getState()
    expect(state.exercises['l1-01'].attempts).toBe(1)
    expect(state.exercises['l2-01'].attempts).toBe(1)
  })

  it('resetExercise clears a single exercise without affecting others', () => {
    const { recordAttempt, resetExercise } = useProgressStore.getState()
    recordAttempt('l1-01', 'a')
    recordAttempt('l2-01', 'b')
    resetExercise('l1-01')
    const state = useProgressStore.getState()
    expect(state.exercises['l1-01']).toBeUndefined()
    expect(state.exercises['l2-01']).toBeDefined()
  })

  it('resetAllProgress clears every exercise and the current exercise pointer', () => {
    const { recordAttempt, setCurrentExercise, resetAllProgress } = useProgressStore.getState()
    recordAttempt('l1-01', 'a')
    setCurrentExercise('l1-01')
    resetAllProgress()
    const state = useProgressStore.getState()
    expect(state.exercises).toEqual({})
    expect(state.currentExerciseId).toBeNull()
  })
})
