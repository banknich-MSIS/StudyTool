export type QuestionType = "mcq" | "multi" | "short" | "truefalse" | "cloze";

export interface QuestionDTO {
  id: number;
  stem: string;
  type: QuestionType;
  options?: string[] | null;
  concepts: number[];
}

export interface ExamOut {
  examId: number;
  questions: QuestionDTO[];
}

export interface UploadResponse {
  uploadId: number;
  stats: Record<string, unknown>;
}

export interface GradeItem {
  questionId: number;
  correct: boolean;
  correctAnswer?: unknown;
  userAnswer?: unknown;
}

export interface GradeReport {
  scorePct: number;
  perQuestion: GradeItem[];
}
