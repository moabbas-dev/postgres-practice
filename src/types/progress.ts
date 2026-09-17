export interface ExerciseProgress {
  exerciseId: string
  status: 'unattempted' | 'attempted' | 'completed'
  attempts: number
  successfulSubmissions: number
  failedSubmissions: number
  lastQuery?: string
  firstCompletedAt?: number
  lastAttemptAt?: number
}

export interface UserProgress {
  version: number
  currentExerciseId: string | null
  exercises: Record<string, ExerciseProgress>
  updatedAt: number
}
