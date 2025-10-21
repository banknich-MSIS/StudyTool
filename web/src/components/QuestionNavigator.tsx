import { useExamStore } from "../store/examStore";

interface Props {
  darkMode: boolean;
  theme: any;
}

export default function QuestionNavigator({ darkMode, theme }: Props) {
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
              border: `1px solid ${theme.border}`,
              background: isBookmarked
                ? darkMode
                  ? "#4d4520"
                  : "#fff3cd"
                : answered
                ? darkMode
                  ? "#3d3d3d"
                  : "#e9ecef"
                : theme.cardBg,
              position: "relative",
              cursor: "pointer",
              color: theme.text,
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
