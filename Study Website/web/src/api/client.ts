import axios from "axios";
import type {
  AttemptDetail,
  AttemptSummary,
  ExamOut,
  GradeReport,
  QuestionType,
  UploadResponse,
  UploadSummary,
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

// Dashboard API methods
export async function fetchAllUploads(): Promise<UploadSummary[]> {
  const { data } = await api.get<UploadSummary[]>("/uploads");
  return data;
}

export async function fetchRecentAttempts(
  limit: number = 10
): Promise<AttemptSummary[]> {
  const { data } = await api.get<AttemptSummary[]>(
    `/attempts/recent?limit=${limit}`
  );
  return data;
}

export async function fetchAttemptDetail(
  attemptId: number
): Promise<AttemptDetail> {
  const { data } = await api.get<AttemptDetail>(`/attempts/${attemptId}`);
  return data;
}

export async function deleteUpload(uploadId: number): Promise<void> {
  await api.delete(`/uploads/${uploadId}`);
}

export async function downloadCSV(uploadId: number): Promise<Blob> {
  const { data } = await api.get(`/uploads/${uploadId}/download`, {
    responseType: "blob",
  });
  return data;
}

export async function deleteAttempt(attemptId: number): Promise<void> {
  await api.delete(`/attempts/delete/${attemptId}`);
}

export async function previewExamAnswers(
  examId: number
): Promise<{ answers: Array<{ questionId: number; correctAnswer: any }> }> {
  const { data } = await api.get(`/exams/${examId}/preview`);
  return data;
}

// Class management API methods
export async function createClass(
  name: string,
  description?: string
): Promise<import("../types").Class> {
  const { data } = await api.post("/classes", { name, description });
  return data;
}

export async function fetchClasses(): Promise<
  import("../types").ClassSummary[]
> {
  const { data } = await api.get("/classes");
  return data;
}

export async function updateClass(
  id: number,
  name?: string,
  description?: string
): Promise<import("../types").Class> {
  const { data } = await api.put(`/classes/${id}`, { name, description });
  return data;
}

export async function deleteClass(id: number): Promise<void> {
  await api.delete(`/classes/${id}`);
}

export async function assignUploadToClass(
  uploadId: number,
  classId: number
): Promise<void> {
  await api.post(`/uploads/${uploadId}/classes/${classId}`);
}

export async function removeUploadFromClass(
  uploadId: number,
  classId: number
): Promise<void> {
  await api.delete(`/uploads/${uploadId}/classes/${classId}`);
}
