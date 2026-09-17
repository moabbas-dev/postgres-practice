import { describe, expect, it } from 'vitest'
import { ALL_EXERCISES, EXERCISES_BY_LEVEL, getNextExercise, getPrevExercise } from './index'
import { LEVELS } from '../levels'

describe('exercise dataset integrity', () => {
  it('has a substantial curriculum', () => {
    expect(ALL_EXERCISES.length).toBeGreaterThanOrEqual(120)
  })

  it('has every exercise id unique', () => {
    const ids = ALL_EXERCISES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('assigns every exercise to one of the 10 defined levels', () => {
    const levelIds = new Set(LEVELS.map((l) => l.id))
    for (const ex of ALL_EXERCISES) {
      expect(levelIds.has(ex.level)).toBe(true)
    }
  })

  it('gives every level at least 10 exercises', () => {
    for (const level of LEVELS) {
      expect(EXERCISES_BY_LEVEL[level.id]?.length ?? 0).toBeGreaterThanOrEqual(10)
    }
  })

  it('orders exercises within a level starting at 1 with no gaps or duplicates', () => {
    for (const level of LEVELS) {
      const orders = (EXERCISES_BY_LEVEL[level.id] ?? []).map((e) => e.order).sort((a, b) => a - b)
      expect(orders).toEqual(Array.from({ length: orders.length }, (_, i) => i + 1))
    }
  })

  it('gives every exercise a non-empty solution query and explanation', () => {
    for (const ex of ALL_EXERCISES) {
      expect(ex.solution.sql.trim().length, `${ex.id} solution.sql`).toBeGreaterThan(0)
      expect(ex.solution.explanation.trim().length, `${ex.id} solution.explanation`).toBeGreaterThan(0)
    }
  })

  it('gives every exercise at least one hint', () => {
    for (const ex of ALL_EXERCISES) {
      expect(ex.hints.length, `${ex.id} hints`).toBeGreaterThan(0)
    }
  })

  it('gives every exercise at least one concept tag and one involved table', () => {
    for (const ex of ALL_EXERCISES) {
      expect(ex.conceptTags.length, `${ex.id} conceptTags`).toBeGreaterThan(0)
      expect(ex.tablesInvolved.length, `${ex.id} tablesInvolved`).toBeGreaterThan(0)
    }
  })

  it('keeps difficultyScore within 1-10', () => {
    for (const ex of ALL_EXERCISES) {
      expect(ex.difficultyScore).toBeGreaterThanOrEqual(1)
      expect(ex.difficultyScore).toBeLessThanOrEqual(10)
    }
  })

  it('numbers hints sequentially starting at 1', () => {
    for (const ex of ALL_EXERCISES) {
      const orders = ex.hints.map((h) => h.order)
      expect(orders, ex.id).toEqual(Array.from({ length: orders.length }, (_, i) => i + 1))
    }
  })
})

describe('exercise navigation', () => {
  it('walks forward from the first to the second exercise', () => {
    const next = getNextExercise(ALL_EXERCISES[0].id)
    expect(next?.id).toBe(ALL_EXERCISES[1].id)
  })

  it('returns undefined past the last exercise', () => {
    const last = ALL_EXERCISES[ALL_EXERCISES.length - 1]
    expect(getNextExercise(last.id)).toBeUndefined()
  })

  it('returns undefined before the first exercise', () => {
    expect(getPrevExercise(ALL_EXERCISES[0].id)).toBeUndefined()
  })

  it('walks backward correctly', () => {
    const prev = getPrevExercise(ALL_EXERCISES[2].id)
    expect(prev?.id).toBe(ALL_EXERCISES[1].id)
  })
})
