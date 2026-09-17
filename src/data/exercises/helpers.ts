import type { Exercise } from '../../types'

type ExerciseInput = Omit<Exercise, 'validation'> & {
  validation?: Partial<Exercise['validation']>
}

export function defineExercise(input: ExerciseInput): Exercise {
  return {
    ...input,
    validation: {
      orderMatters: false,
      requireColumnNames: false,
      ...input.validation,
    },
  }
}
