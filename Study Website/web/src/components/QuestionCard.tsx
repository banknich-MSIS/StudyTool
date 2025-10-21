import { useMemo } from "react";
import type { QuestionDTO, QuestionType } from "../types";
import { useExamStore } from "../store/examStore";

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple Choice",
  multi: "Multiple Select",
  short: "Short Answer",
  truefalse: "True/False",
  cloze: "Fill in the Blank",
};

interface Props {
  question: QuestionDTO;
  darkMode: boolean;
  theme: any;
}

export default function QuestionCard({ question, darkMode, theme }: Props) {
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
    <div
      style={{
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        padding: 16,
        backgroundColor: theme.cardBg,
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: theme.textSecondary,
          marginBottom: "8px",
          fontStyle: "italic",
        }}
      >
        Type:{" "}
        {QUESTION_TYPE_LABELS[questionType as QuestionType] || questionType} |
        Options: {options.length}
      </div>
      <div
        style={{
          marginBottom: 12,
          whiteSpace: "pre-wrap",
          fontSize: "16px",
          lineHeight: "1.5",
          color: theme.text,
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
                  border: `1px solid ${theme.border}`,
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor:
                    value === opt
                      ? darkMode
                        ? "#2a4a62"
                        : "#e3f2fd"
                      : theme.cardBg,
                }}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={value === opt}
                  onChange={() => setAnswer(question.id, opt)}
                  style={{ transform: "scale(1.2)" }}
                />
                <span
                  style={{
                    fontSize: "15px",
                    color: value === opt && darkMode ? "#90caf9" : theme.text,
                  }}
                >
                  {opt}
                </span>
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
                    border: `1px solid ${theme.border}`,
                    borderRadius: "4px",
                    cursor: "pointer",
                    backgroundColor: checked
                      ? darkMode
                        ? "#2a4a62"
                        : "#e3f2fd"
                      : theme.cardBg,
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
                  <span
                    style={{
                      fontSize: "15px",
                      color: checked && darkMode ? "#90caf9" : theme.text,
                    }}
                  >
                    {opt}
                  </span>
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
              border: `1px solid ${theme.border}`,
              borderRadius: "4px",
              fontSize: "15px",
              boxSizing: "border-box",
              backgroundColor: theme.cardBg,
              color: theme.text,
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
                border: `1px solid ${theme.border}`,
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor:
                  String(value).toLowerCase() === opt
                    ? darkMode
                      ? "#2a4a62"
                      : "#e3f2fd"
                    : theme.cardBg,
              }}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={String(value).toLowerCase() === opt}
                onChange={() => setAnswer(question.id, opt)}
                style={{ transform: "scale(1.2)" }}
              />
              <span
                style={{
                  textTransform: "capitalize",
                  fontSize: "15px",
                  color:
                    String(value).toLowerCase() === opt && darkMode
                      ? "#90caf9"
                      : theme.text,
                }}
              >
                {opt}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
