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

  // Handle both 'type' and 'qtype' fields from backend
  const questionType = question.type || (question as any).qtype || "unknown";

  // Debug logging
  console.log("QuestionCard Debug:", {
    questionId: question.id,
    questionType: question.type,
    qtype: (question as any).qtype,
    resolvedType: questionType,
    questionStem: question.stem,
    options: question.options,
    optionsLength: options.length,
    rawQuestion: question,
  });

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
      <div
        style={{
          fontSize: "12px",
          color: "#666",
          marginBottom: "8px",
          fontStyle: "italic",
        }}
      >
        Question Type: {questionType.toUpperCase()} | Options: {options.length}
      </div>
      <div
        style={{
          marginBottom: 12,
          whiteSpace: "pre-wrap",
          fontSize: "16px",
          lineHeight: "1.5",
        }}
      >
        {question.stem}
      </div>
      {questionType === "mcq" && (
        <div style={{ display: "grid", gap: 8 }}>
          {options.length === 0 ? (
            <div
              style={{
                color: "#dc3545",
                fontSize: "14px",
                fontStyle: "italic",
              }}
            >
              No options available for this question
            </div>
          ) : (
            options.map((opt, idx) => (
              <label
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px",
                  border: "1px solid #e9ecef",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor: value === opt ? "#e3f2fd" : "#fff",
                }}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={value === opt}
                  onChange={() => setAnswer(question.id, opt)}
                  style={{ transform: "scale(1.2)" }}
                />
                <span style={{ fontSize: "15px" }}>{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
      {questionType === "multi" && (
        <div style={{ display: "grid", gap: 8 }}>
          {options.length === 0 ? (
            <div
              style={{
                color: "#dc3545",
                fontSize: "14px",
                fontStyle: "italic",
              }}
            >
              No options available for this question
            </div>
          ) : (
            options.map((opt, idx) => {
              const selected: string[] = Array.isArray(value) ? value : [];
              const checked = selected.includes(opt);
              return (
                <label
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px",
                    border: "1px solid #e9ecef",
                    borderRadius: "4px",
                    cursor: "pointer",
                    backgroundColor: checked ? "#e3f2fd" : "#fff",
                  }}
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
                    style={{ transform: "scale(1.2)" }}
                  />
                  <span style={{ fontSize: "15px" }}>{opt}</span>
                </label>
              );
            })
          )}
        </div>
      )}
      {(questionType === "short" || questionType === "cloze") && (
        <div>
          <input
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "15px",
            }}
            placeholder="Type your answer"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(question.id, e.target.value)}
          />
        </div>
      )}
      {questionType === "truefalse" && (
        <div style={{ display: "flex", gap: 12 }}>
          {["true", "false"].map((opt) => (
            <label
              key={opt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                border: "1px solid #e9ecef",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor:
                  String(value).toLowerCase() === opt ? "#e3f2fd" : "#fff",
              }}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={String(value).toLowerCase() === opt}
                onChange={() => setAnswer(question.id, opt)}
                style={{ transform: "scale(1.2)" }}
              />
              <span style={{ textTransform: "capitalize", fontSize: "15px" }}>
                {opt}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
