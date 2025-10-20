import axios from "axios";
import type {
  ExamOut,
  GradeReport,
  QuestionType,
  UploadResponse,
} from "../types";

const api = axios.create({ baseURL: "http://127.0.0.1:8000/api" });

export async function uploadCsv(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<UploadResponse>("/upload/csv", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function uploadText(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<UploadResponse>("/upload/text", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchConcepts(uploadId: number) {
  const { data } = await api.get<{ id: number; name: string; score: number }[]>(
    `/concepts/${uploadId}`
  );
  return data;
}

export async function createExam(params: {
  uploadId: number;
  includeConceptIds: number[];
  questionTypes: QuestionType[];
  count: number;
}) {
  const { data } = await api.post<ExamOut>("/exams", params);
  return data;
}

export async function getExam(examId: number) {
  const { data } = await api.get<ExamOut>(`/exams/${examId}`);
  return data;
}

export async function gradeExam(
  examId: number,
  answers: { questionId: number; response: unknown }[]
) {
  const { data } = await api.post<GradeReport>(
    `/exams/${examId}/grade`,
    answers
  );
  return data;
}
