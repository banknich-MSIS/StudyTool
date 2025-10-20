import { useExamStore } from "../store/examStore";

export default function BookmarkButton({ questionId }: { questionId: number }) {
  const toggle = useExamStore((s) => s.toggleBookmark);
  const isBookmarked = useExamStore((s) => s.bookmarks.has(questionId));
  return (
    <button
      onClick={() => toggle(questionId)}
      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd" }}
    >
      {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
    </button>
  );
}
