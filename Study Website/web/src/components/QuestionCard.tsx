import { useMemo } from "react";
import type { QuestionDTO } from "../types";
import { useExamStore } from "../store/examStore";

interface Props {
  question: QuestionDTO;
}

export default function QuestionCard({ question }: Props) {
  const setAnswer = useExamStore((s) => s.setAnswer);
  const answers = useExamStore((s) => s.answers);
  const value = answers[question.id];

  const options = useMemo(() => question.options ?? [], [question.options]);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
      <div style={{ marginBottom: 12, whiteSpace: "pre-wrap" }}>
        {question.stem}
      </div>
      {question.type === "mcq" && (
        <div style={{ display: "grid", gap: 8 }}>
          {options.map((opt, idx) => (
            <label
              key={idx}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={value === opt}
                onChange={() => setAnswer(question.id, opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}
      {question.type === "multi" && (
        <div style={{ display: "grid", gap: 8 }}>
          {options.map((opt, idx) => {
            const selected: string[] = Array.isArray(value) ? value : [];
            const checked = selected.includes(opt);
            return (
              <label
                key={idx}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(opt);
                    else next.delete(opt);
                    setAnswer(question.id, Array.from(next));
                  }}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      )}
      {(question.type === "short" || question.type === "cloze") && (
        <div>
          <input
            style={{ width: "100%", padding: 8 }}
            placeholder="Type your answer"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(question.id, e.target.value)}
          />
        </div>
      )}
      {question.type === "truefalse" && (
        <div style={{ display: "flex", gap: 12 }}>
          {["true", "false"].map((opt) => (
            <label
              key={opt}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={String(value).toLowerCase() === opt}
                onChange={() => setAnswer(question.id, opt)}
              />
              <span style={{ textTransform: "capitalize" }}>{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
