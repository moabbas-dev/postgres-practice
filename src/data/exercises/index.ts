import type { Exercise } from '../../types'
import { level1Exercises } from './level1'
import { level2Exercises } from './level2'
import { level3Exercises } from './level3'
import { level4Exercises } from './level4'
import { level5Exercises } from './level5'
import { level6Exercises } from './level6'
import { level7Exercises } from './level7'
import { level8Exercises } from './level8'
import { level9Exercises } from './level9'
import { level10Exercises } from './level10'

export const ALL_EXERCISES: Exercise[] = [
  ...level1Exercises,
  ...level2Exercises,
  ...level3Exercises,
  ...level4Exercises,
  ...level5Exercises,
  ...level6Exercises,
  ...level7Exercises,
  ...level8Exercises,
  ...level9Exercises,
  ...level10Exercises,
]

export const EXERCISES_BY_LEVEL: Record<number, Exercise[]> = ALL_EXERCISES.reduce(
  (acc, ex) => {
    ;(acc[ex.level] ??= []).push(ex)
    return acc
  },
  {} as Record<number, Exercise[]>,
)

for (const level of Object.keys(EXERCISES_BY_LEVEL)) {
  EXERCISES_BY_LEVEL[Number(level)].sort((a, b) => a.order - b.order)
}

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(ALL_EXERCISES.map((ex) => [ex.id, ex]))

export function getExercise(id: string): Exercise | undefined {
  return EXERCISE_BY_ID[id]
}

export function getNextExercise(id: string): Exercise | undefined {
  const idx = ALL_EXERCISES.findIndex((e) => e.id === id)
  if (idx === -1 || idx === ALL_EXERCISES.length - 1) return undefined
  return ALL_EXERCISES[idx + 1]
}

export function getPrevExercise(id: string): Exercise | undefined {
  const idx = ALL_EXERCISES.findIndex((e) => e.id === id)
  if (idx <= 0) return undefined
  return ALL_EXERCISES[idx - 1]
}
