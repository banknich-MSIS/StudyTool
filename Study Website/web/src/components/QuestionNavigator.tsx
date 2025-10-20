import { useExamStore } from "../store/examStore";

export default function QuestionNavigator() {
  const { questions, currentIndex, goTo, bookmarks, answers } = useExamStore();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
        gap: 8,
      }}
    >
      {questions.map((q, idx) => {
        const isCurrent = idx === currentIndex;
        const isBookmarked = bookmarks.has(q.id);
        const answered =
          answers[q.id] !== undefined &&
          answers[q.id] !== null &&
          String(answers[q.id]) !== "";
        return (
          <button
            key={q.id}
            onClick={() => goTo(idx)}
            style={{
              padding: 8,
              borderRadius: 6,
              border: isCurrent ? "2px solid #1565c0" : "1px solid #ddd",
              background: answered ? "#e8f5e9" : "#fff",
              position: "relative",
            }}
            title={`Question ${idx + 1}`}
          >
            {idx + 1}
            {isBookmarked && (
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  right: 4,
                  color: "#f57c00",
                }}
              >
                ★
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
