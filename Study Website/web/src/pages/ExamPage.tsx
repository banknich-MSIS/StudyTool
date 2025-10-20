import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useExamStore } from "../store/examStore";
import QuestionCard from "../components/QuestionCard";
import QuestionNavigator from "../components/QuestionNavigator";
import BookmarkButton from "../components/BookmarkButton";
import { gradeExam } from "../api/client";

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const nav = useNavigate();
  const { questions, examId: storeExamId, answers } = useExamStore();
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showUnansweredAlert, setShowUnansweredAlert] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);

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

  const onSubmit = async () => {
    if (!storeExamId) return;
    const payload = questions.map((it) => ({
      questionId: it.id,
      response: answers[it.id],
    }));
    const graded = await gradeExam(storeExamId, payload);
    nav(`/review/${storeExamId}`, { state: graded });
  };

  const handleSubmitClick = () => {
    // Check for unanswered questions
    const unansweredQuestions = questions.filter((q) => {
      const answer = answers[q.id];
      return (
        answer === undefined ||
        answer === null ||
        answer === "" ||
        (Array.isArray(answer) && answer.length === 0)
      );
    });

    if (unansweredQuestions.length > 0) {
      setUnansweredCount(unansweredQuestions.length);
      setShowUnansweredAlert(true);
      // Scroll to first unanswered question
      const firstUnansweredIndex = questions.findIndex(
        (q) => q.id === unansweredQuestions[0].id
      );
      if (firstUnansweredIndex !== -1) {
        const element = document.getElementById(
          `question-${firstUnansweredIndex}`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    setShowSubmitConfirm(true);
  };

  const confirmSubmit = () => {
    setShowSubmitConfirm(false);
    onSubmit();
  };

  const cancelSubmit = () => {
    setShowSubmitConfirm(false);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: 16,
        height: "100vh",
      }}
    >
      <aside
        style={{
          padding: "16px",
          backgroundColor: "#f8f9fa",
          overflow: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Questions</h3>
        <QuestionNavigator />
      </aside>
      <main style={{ overflow: "auto", padding: "16px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "800px",
          }}
        >
          {questions.map((question, index) => (
            <div
              key={question.id}
              id={`question-${index}`}
              style={{ position: "relative" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", color: "#666" }}>
                  Question {index + 1}
                </h3>
                <BookmarkButton questionId={question.id} />
              </div>
              <QuestionCard question={question} />
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "32px",
            padding: "16px 0",
            borderTop: "1px solid #ddd",
          }}
        >
          <button
            onClick={handleSubmitClick}
            style={{
              padding: "12px 24px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Submit Exam
          </button>
        </div>
      </main>

      {/* Unanswered Questions Alert Modal */}
      {showUnansweredAlert && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "400px",
              width: "90%",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", color: "#dc3545" }}>
              Please Answer All Questions
            </h3>
            <p
              style={{
                margin: "0 0 12px 0",
                lineHeight: "1.5",
                fontSize: "15px",
              }}
            >
              {unansweredCount} question(s) remaining unanswered.
            </p>
            <p
              style={{
                margin: "0 0 24px 0",
                lineHeight: "1.5",
                fontSize: "15px",
              }}
            >
              Please complete all questions before submitting your exam.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowUnansweredAlert(false)}
                style={{
                  padding: "8px 24px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "400px",
              width: "90%",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0" }}>Submit Exam</h3>
            <p style={{ margin: "0 0 24px 0", lineHeight: "1.5" }}>
              Are you sure you want to submit your exam? This action cannot be
              undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={cancelSubmit}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
