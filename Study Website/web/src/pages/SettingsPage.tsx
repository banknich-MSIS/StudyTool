import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createExam } from "../api/client";
import type { QuestionType, UploadMetadata } from "../types";
import { useExamStore } from "../store/examStore";

export default function SettingsPage() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const uploadId: number | undefined =
    loc?.state?.uploadId || loc?.state?.uploadIds?.[0];
  const metadata: UploadMetadata | undefined = loc?.state?.metadata;
  const setExam = useExamStore((s) => s.setExam);

  const [types, setTypes] = useState<QuestionType[]>(["mcq", "short"]);
  const [count, setCount] = useState(10);
  const [examName, setExamName] = useState("");
  const [examTheme, setExamTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-configure from metadata
  useEffect(() => {
    if (metadata) {
      if (metadata.suggested_types) {
        setTypes(metadata.suggested_types as QuestionType[]);
      }
      if (metadata.recommended_count) {
        setCount(metadata.recommended_count);
      }
      if (metadata.themes && metadata.themes.length > 0) {
        setExamTheme(metadata.themes[0]);
      }
    }
  }, [metadata]);

  const toggleType = (t: QuestionType) => {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const onStart = async () => {
    if (!uploadId) return;
    setLoading(true);
    setError(null);
    try {
      const exam = await createExam({
        uploadId,
        includeConceptIds: [], // No concepts needed
        questionTypes: types,
        count,
      });
      setExam(exam.examId, exam.questions);
      nav(`/exam/${exam.examId}`);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {!uploadId && (
        <div style={{ color: "crimson" }}>
          No upload selected. Go back to Upload.
        </div>
      )}
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      {/* Show metadata recommendations */}
      {metadata && (
        <div
          style={{
            background: "#e8f5e8",
            padding: 16,
            borderRadius: 8,
            border: "1px solid #c3e6c3",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", color: "#2d5a2d" }}>
            📋 Recommended Settings (from your CSV)
          </h3>
          {metadata.themes && (
            <div style={{ marginBottom: 8 }}>
              <strong>Themes:</strong> {metadata.themes.join(", ")}
            </div>
          )}
          {metadata.suggested_types && (
            <div style={{ marginBottom: 8 }}>
              <strong>Question Types:</strong>{" "}
              {metadata.suggested_types.join(", ")}
            </div>
          )}
          {metadata.recommended_count && (
            <div style={{ marginBottom: 8 }}>
              <strong>Question Count:</strong> {metadata.recommended_count}
            </div>
          )}
          {metadata.difficulty && (
            <div style={{ marginBottom: 8 }}>
              <strong>Difficulty:</strong> {metadata.difficulty}
            </div>
          )}
          <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
            These settings have been pre-filled below. You can modify them as
            needed.
          </div>
        </div>
      )}

      <section>
        <h3>Exam Details</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}
            >
              Exam Name
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="Enter exam name (optional)"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: 4,
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}
            >
              Theme/Subject
            </label>
            <input
              type="text"
              value={examTheme}
              onChange={(e) => setExamTheme(e.target.value)}
              placeholder="Enter theme or subject (optional)"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: 4,
                fontSize: 14,
              }}
            />
          </div>
        </div>
      </section>

      <section>
        <h3>Question types</h3>
        {(
          ["mcq", "multi", "short", "truefalse", "cloze"] as QuestionType[]
        ).map((t) => (
          <label key={t} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={types.includes(t)}
              onChange={() => toggleType(t)}
            />{" "}
            {t}
          </label>
        ))}
      </section>

      <section>
        <h3>Count</h3>
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value || "1"))}
        />
      </section>

      <button
        onClick={onStart}
        disabled={!uploadId || loading}
        style={{ padding: "8px 12px" }}
      >
        {loading ? "Starting…" : "Start Exam"}
      </button>
    </div>
  );
}
