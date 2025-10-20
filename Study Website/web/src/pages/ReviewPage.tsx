import { useLocation, useNavigate } from "react-router-dom";
import type { GradeReport } from "../types";

export default function ReviewPage() {
  const nav = useNavigate();
  const state = useLocation().state as GradeReport | undefined;

  if (!state) {
    return <div>No results to show. Take an exam first.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h3>Score: {state.scorePct.toFixed(2)}%</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {state.perQuestion.map((p) => (
          <div
            key={p.questionId}
            style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
          >
            <div>
              <strong>Q{p.questionId}</strong>
            </div>
            <div>Result: {p.correct ? "Correct" : "Incorrect"}</div>
            {!p.correct && (
              <div style={{ color: "#444" }}>
                <div>
                  Correct answer: <code>{String(p.correctAnswer)}</code>
                </div>
                <div>
                  Your answer: <code>{String(p.userAnswer)}</code>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div>
        <button onClick={() => nav("/")}>Start Over</button>
      </div>
    </div>
  );
}
