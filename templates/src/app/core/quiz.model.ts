/** Estructura de un quiz, segun `src/assets/templates/quiz-template.json`. */
export interface QuizOption {
  content: string
  isCorrect: boolean
}

export interface QuizAnswer {
  title: string
  explanation: string
  hint: string
  /** Presente en algunos archivos; no en el template. */
  tags?: string[]
  options: QuizOption[]
}

export interface Quiz {
  title: string
  /** Minutos asignados. */
  time: number
  tags: string[]
  answers: QuizAnswer[]
}
