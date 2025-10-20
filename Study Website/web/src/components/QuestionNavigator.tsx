import { useExamStore } from "../store/examStore";

export default function QuestionNavigator() {
  const { questions, bookmarks, answers } = useExamStore();

  const scrollToQuestion = (index: number) => {
    const element = document.getElementById(`question-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
        gap: 8,
      }}
    >
      {questions.map((q, idx) => {
        const isBookmarked = bookmarks.has(q.id);
        const answered =
          answers[q.id] !== undefined &&
          answers[q.id] !== null &&
          String(answers[q.id]) !== "";
        return (
          <button
            key={q.id}
            onClick={() => scrollToQuestion(idx)}
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ddd",
              background: isBookmarked
                ? "#fff3cd"
                : answered
                ? "#e9ecef"
                : "#fff",
              position: "relative",
              cursor: "pointer",
            }}
            title={`Question ${idx + 1}${isBookmarked ? " (Bookmarked)" : ""}${
              answered ? " (Answered)" : ""
            }`}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
}
