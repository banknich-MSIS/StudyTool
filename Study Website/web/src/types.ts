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

export interface UploadMetadata {
  themes?: string[];
  suggested_types?: string[];
  difficulty?: string;
  recommended_count?: number;
}

export interface UploadResponse {
  uploadId: number;
  stats: Record<string, unknown> & {
    metadata?: UploadMetadata;
  };
}

export interface UploadSummary {
  id: number;
  filename: string;
  created_at: string;
  question_count: number;
  themes: string[];
  exam_count: number;
  file_type: string;
  class_tags?: string[];
  question_type_counts?: Record<string, number> | null;
}

export interface AttemptSummary {
  id: number;
  exam_id: number;
  upload_filename: string;
  score_pct: number;
  finished_at: string;
  question_count: number;
  correct_count: number;
}

export interface QuestionReview {
  question: QuestionDTO;
  user_answer: unknown;
  correct_answer: unknown;
  is_correct: boolean;
}

export interface AttemptDetail {
  id: number;
  exam_id: number;
  score_pct: number;
  finished_at: string;
  questions: QuestionReview[];
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
  attemptId?: number;
}

export interface Class {
  id: number;
  name: string;
  description?: string | null;
  color?: string | null;
  created_at: string;
}

export interface ClassSummary extends Class {
  upload_count: number;
}
