import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useExamStore } from "../store/examStore";
import QuestionCard from "../components/QuestionCard";
import QuestionNavigator from "../components/QuestionNavigator";
import BookmarkButton from "../components/BookmarkButton";
import { gradeExam } from "../api/client";

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const nav = useNavigate();
  const {
    questions,
    currentIndex,
    next,
    prev,
    examId: storeExamId,
    answers,
  } = useExamStore();

  useEffect(() => {
    if (!storeExamId) return;
    if (examId && Number(examId) !== storeExamId) {
      // If URL and store diverge, let URL win by reloading (simple approach)
      nav(`/exam/${storeExamId}`, { replace: true });
    }
  }, [examId, storeExamId, nav]);

  if (!questions.length) {
    return <div>No questions loaded. Go back to Settings.</div>;
  }

  const q = questions[currentIndex];

  const onSubmit = async () => {
    if (!storeExamId) return;
    const payload = questions.map((it) => ({
      questionId: it.id,
      response: answers[it.id],
    }));
    const graded = await gradeExam(storeExamId, payload);
    nav(`/review/${storeExamId}`, { state: graded });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
      <aside>
        <QuestionNavigator />
      </aside>
      <main>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div>
            <button onClick={prev} style={{ marginRight: 8 }}>
              Prev
            </button>
            <button onClick={next}>Next</button>
          </div>
          <BookmarkButton questionId={q.id} />
        </div>
        <QuestionCard question={q} />
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
        >
          <button onClick={onSubmit} style={{ padding: "8px 12px" }}>
            Submit Exam
          </button>
        </div>
      </main>
    </div>
  );
}
