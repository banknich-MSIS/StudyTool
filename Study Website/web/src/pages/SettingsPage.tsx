import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createExam, fetchConcepts } from "../api/client";
import type { QuestionType } from "../types";
import { useExamStore } from "../store/examStore";

export default function SettingsPage() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const uploadId: number | undefined = loc?.state?.uploadId;
  const setExam = useExamStore((s) => s.setExam);

  const [concepts, setConcepts] = useState<
    { id: number; name: string; score: number }[]
  >([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [types, setTypes] = useState<QuestionType[]>(["mcq", "short"]);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadId) return;
    fetchConcepts(uploadId)
      .then(setConcepts)
      .catch((e) => setError(e?.message || "Failed to load concepts"));
  }, [uploadId]);

  const sortedConcepts = useMemo(
    () => [...concepts].sort((a, b) => b.score - a.score),
    [concepts]
  );

  const toggleConcept = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

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
        includeConceptIds: Array.from(selected),
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

      <section>
        <h3>Concepts</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 8,
          }}
        >
          {sortedConcepts.map((c) => (
            <label
              key={c.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggleConcept(c.id)}
              />
              <div style={{ display: "grid" }}>
                <span>{c.name}</span>
                <small style={{ color: "#666" }}>
                  score {c.score.toFixed(2)}
                </small>
              </div>
            </label>
          ))}
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
