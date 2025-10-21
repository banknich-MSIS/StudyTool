import { create } from "zustand";
import type { QuestionDTO } from "../types";

type Answer = unknown;

interface ExamState {
  examId?: number;
  questions: QuestionDTO[];
  currentIndex: number;
  answers: Record<number, Answer>;
  bookmarks: Set<number>;
  setExam: (examId: number, questions: QuestionDTO[]) => void;
  setAnswer: (questionId: number, answer: Answer) => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  toggleBookmark: (questionId: number) => void;
  reset: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: {},
  bookmarks: new Set<number>(),
  setExam: (examId, questions) =>
    set({
      examId,
      questions,
      currentIndex: 0,
      answers: {},
      bookmarks: new Set(),
    }),
  setAnswer: (questionId, answer) =>
    set((s) => ({ answers: { ...s.answers, [questionId]: answer } })),
  next: () =>
    set((s) => ({
      currentIndex: Math.min(
        s.currentIndex + 1,
        Math.max(0, s.questions.length - 1)
      ),
    })),
  prev: () => set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),
  goTo: (index) =>
    set((s) => ({
      currentIndex: Math.max(
        0,
        Math.min(index, Math.max(0, s.questions.length - 1))
      ),
    })),
  toggleBookmark: (questionId) =>
    set((s) => {
      const next = new Set(s.bookmarks);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return { bookmarks: next };
    }),
  reset: () =>
    set({
      examId: undefined,
      questions: [],
      currentIndex: 0,
      answers: {},
      bookmarks: new Set(),
    }),
}));
