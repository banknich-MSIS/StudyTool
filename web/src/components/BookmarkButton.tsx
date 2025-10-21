import { useExamStore } from "../store/examStore";

export default function BookmarkButton({ questionId }: { questionId: number }) {
  const toggle = useExamStore((s) => s.toggleBookmark);
  const isBookmarked = useExamStore((s) => s.bookmarks.has(questionId));

  return (
    <button
      onClick={() => toggle(questionId)}
      style={{
        padding: "8px",
        border: "none",
        backgroundColor: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "32px",
        minHeight: "32px",
      }}
      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {isBookmarked ? (
        // Solid bookmark
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="#ffc107"
          stroke="#ffc107"
          strokeWidth="1"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ) : (
        // Hollow bookmark
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6c757d"
          strokeWidth="2"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  );
}
