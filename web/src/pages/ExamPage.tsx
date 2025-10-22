import { useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useExamStore } from "../store/examStore";
import QuestionCard from "../components/QuestionCard";
import QuestionNavigator from "../components/QuestionNavigator";
import BookmarkButton from "../components/BookmarkButton";
import { gradeExam, previewExamAnswers } from "../api/client";

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const nav = useNavigate();
  const { darkMode, theme } = useOutletContext<{
    darkMode: boolean;
    theme: any;
  }>();
  const { questions, examId: storeExamId, answers } = useExamStore();
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showUnansweredAlert, setShowUnansweredAlert] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [showExamSummary, setShowExamSummary] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, any>>({});

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

    // Navigate to attempt review page with the attemptId from graded response
    if (graded.attemptId) {
      nav(`/history/${graded.attemptId}`);
    } else {
      console.error("No attemptId returned from grading");
      alert("Error: Could not load exam results");
    }
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
    // Scroll to top before navigating
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Small delay to allow scroll to complete
    setTimeout(() => {
      onSubmit();
    }, 300);
  };

  const cancelSubmit = () => {
    setShowSubmitConfirm(false);
  };

  const handleShowSummary = async () => {
    if (!storeExamId) return;
    try {
      const preview = await previewExamAnswers(storeExamId);
      const answersMap: Record<number, any> = {};
      preview.answers.forEach((item) => {
        answersMap[item.questionId] = item.correctAnswer;
      });
      setCorrectAnswers(answersMap);
      setShowExamSummary(true);
    } catch (error) {
      console.error("Failed to load preview:", error);
      alert("Failed to load exam preview. Please try again.");
    }
  };

  // Scrollbar styles for dark mode
  const scrollbarStyles = `
    .exam-scroll::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .exam-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .exam-scroll::-webkit-scrollbar-thumb {
      background: ${darkMode ? "#555" : "#888"};
      border-radius: 4px;
    }
    .exam-scroll::-webkit-scrollbar-thumb:hover {
      background: ${darkMode ? "#666" : "#555"};
    }
  `;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 16,
          minHeight: "calc(100vh - 80px)",
          backgroundColor: theme.bg,
        }}
      >
        <aside
          className="exam-scroll"
          style={{
            padding: "16px",
            backgroundColor: theme.navBg,
            overflow: "auto",
            position: "sticky",
            top: 0,
            height: "fit-content",
            maxHeight: "100vh",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              color: theme.text,
            }}
          >
            Questions
          </h3>
          <QuestionNavigator darkMode={darkMode} theme={theme} />
        </aside>
        <main
          className="exam-scroll"
          style={{ overflow: "auto", padding: "16px" }}
        >
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
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      color: theme.textSecondary,
                    }}
                  >
                    Question {index + 1}
                  </h3>
                  <BookmarkButton questionId={question.id} />
                </div>
                <QuestionCard
                  question={question}
                  darkMode={darkMode}
                  theme={theme}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "32px",
              padding: "16px 0",
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <button
              onClick={handleShowSummary}
              style={{
                padding: "10px 24px",
                background: theme.amber,
                color: "white",
                border: "none",
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.2px",
                cursor: "pointer",
                marginRight: 12,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 2px 8px rgba(212, 166, 80, 0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(212, 166, 80, 0.35)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(212, 166, 80, 0.25)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Exam Answers
            </button>
            <button
              onClick={handleSubmitClick}
              style={{
                padding: "10px 24px",
                background: theme.crimson,
                color: "white",
                border: "none",
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.2px",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 2px 8px rgba(196, 30, 58, 0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(196, 30, 58, 0.35)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(196, 30, 58, 0.25)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Submit Exam
            </button>
          </div>
        </main>

        {/* Exam Answers Modal */}
        {showExamSummary && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setShowExamSummary(false)}
          >
            <div
              style={{
                background: theme.modalBg,
                backdropFilter: theme.glassBlur,
                WebkitBackdropFilter: theme.glassBlur,
                borderRadius: 12,
                maxWidth: 900,
                width: "100%",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${theme.glassBorder}`,
                boxShadow: theme.glassShadowHover,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: "20px",
                  borderBottom: `2px solid ${theme.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ margin: 0, color: theme.text }}>
                  Exam Answers (Preview Only)
                </h2>
                <button
                  onClick={() => setShowExamSummary(false)}
                  style={{
                    padding: "8px 20px",
                    background: theme.textSecondary,
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    letterSpacing: "-0.2px",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
                  }}
                >
                  Close
                </button>
              </div>
              <div style={{ padding: "20px", overflow: "auto", flex: 1 }}>
                <div
                  style={{
                    backgroundColor: darkMode ? "#4d4520" : "#fff3cd",
                    border: `1px solid ${darkMode ? "#5d5530" : "#ffc107"}`,
                    borderRadius: "6px",
                    padding: "12px",
                    marginBottom: "20px",
                    fontSize: "14px",
                    color: darkMode ? "#ffb74d" : "#856404",
                  }}
                >
                  <strong>Note:</strong> This is a preview only. You can see
                  correct answers for all questions, including ones you haven't
                  answered yet. This does NOT count as a completed exam.
                  Continue answering questions and click "Submit Exam" when
                  ready.
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {questions.map((question, index) => {
                    const userAnswer = answers[question.id];
                    const hasAnswer =
                      userAnswer !== undefined &&
                      userAnswer !== null &&
                      userAnswer !== "";
                    const questionType =
                      question.type || (question as any).qtype || "unknown";
                    const options = question.options || [];

                    return (
                      <div
                        key={question.id}
                        style={{
                          border: `1px solid ${theme.border}`,
                          borderRadius: "8px",
                          padding: "16px",
                          backgroundColor: hasAnswer
                            ? theme.navBg
                            : theme.cardBg,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            marginBottom: "8px",
                            fontSize: "16px",
                            color: theme.text,
                          }}
                        >
                          Question {index + 1} {!hasAnswer && "(Not Answered)"}
                        </div>
                        <div
                          style={{
                            marginBottom: "12px",
                            lineHeight: "1.5",
                            color: theme.text,
                          }}
                        >
                          {question.stem}
                        </div>

                        {/* MCQ/Multi Options */}
                        {(questionType === "mcq" || questionType === "multi") &&
                          options.length > 0 && (
                            <div style={{ display: "grid", gap: "8px" }}>
                              {options.map((option, optIdx) => {
                                const isUserAnswer =
                                  String(userAnswer) === String(option) ||
                                  (Array.isArray(userAnswer) &&
                                    userAnswer.includes(option));

                                return (
                                  <div
                                    key={optIdx}
                                    style={{
                                      padding: "8px 12px",
                                      borderRadius: "4px",
                                      border: `2px solid ${theme.border}`,
                                      backgroundColor: isUserAnswer
                                        ? darkMode
                                          ? "#2a4a62"
                                          : "#e3f2fd"
                                        : theme.cardBg,
                                      color: theme.text,
                                    }}
                                  >
                                    {option}
                                    {isUserAnswer && (
                                      <span
                                        style={{
                                          marginLeft: "8px",
                                          fontWeight: "bold",
                                          color: darkMode
                                            ? "#64b5f6"
                                            : "#1976d2",
                                        }}
                                      >
                                        (Your Answer)
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              <div
                                style={{
                                  marginTop: "8px",
                                  padding: "8px 12px",
                                  backgroundColor: "#d4edda",
                                  border: "2px solid #28a745",
                                  borderRadius: "4px",
                                  fontWeight: "bold",
                                  color: "#155724",
                                }}
                              >
                                Correct Answer:{" "}
                                {correctAnswers[question.id] !== undefined
                                  ? String(correctAnswers[question.id])
                                  : "Loading..."}
                              </div>
                            </div>
                          )}

                        {/* True/False */}
                        {questionType === "truefalse" && (
                          <div>
                            <div style={{ marginBottom: "8px" }}>
                              Your answer:{" "}
                              {userAnswer !== undefined && userAnswer !== null
                                ? String(userAnswer)
                                : "Not answered"}
                            </div>
                            <div
                              style={{
                                padding: "8px 12px",
                                backgroundColor: "#d4edda",
                                border: "2px solid #28a745",
                                borderRadius: "4px",
                                fontWeight: "bold",
                                color: "#155724",
                              }}
                            >
                              Correct Answer:{" "}
                              {correctAnswers[question.id] !== undefined
                                ? String(correctAnswers[question.id])
                                : "Loading..."}
                            </div>
                          </div>
                        )}

                        {/* Short/Cloze */}
                        {(questionType === "short" ||
                          questionType === "cloze") && (
                          <div>
                            {userAnswer !== undefined &&
                            userAnswer !== null &&
                            userAnswer !== "" ? (
                              <div style={{ marginBottom: "8px" }}>
                                Your answer:{" "}
                                <strong>{String(userAnswer)}</strong>
                              </div>
                            ) : (
                              <div
                                style={{
                                  marginBottom: "8px",
                                  color: "#6c757d",
                                  fontStyle: "italic",
                                }}
                              >
                                Not answered yet
                              </div>
                            )}
                            <div
                              style={{
                                padding: "8px 12px",
                                backgroundColor: "#d4edda",
                                border: "2px solid #28a745",
                                borderRadius: "4px",
                                fontWeight: "bold",
                                color: "#155724",
                              }}
                            >
                              Correct Answer:{" "}
                              {correctAnswers[question.id] !== undefined
                                ? String(correctAnswers[question.id])
                                : "Loading..."}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unanswered Questions Alert Modal */}
        {showUnansweredAlert && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowUnansweredAlert(false)}
          >
            <div
              style={{
                background: theme.modalBg,
                backdropFilter: theme.glassBlur,
                WebkitBackdropFilter: theme.glassBlur,
                padding: 24,
                borderRadius: 12,
                maxWidth: 400,
                width: "90%",
                border: `1px solid ${theme.glassBorder}`,
                boxShadow: theme.glassShadowHover,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  margin: "0 0 16px 0",
                  color: theme.crimson,
                  fontWeight: 700,
                }}
              >
                Please Answer All Questions
              </h3>
              <p
                style={{
                  margin: "0 0 12px 0",
                  lineHeight: "1.5",
                  fontSize: "15px",
                  color: theme.text,
                }}
              >
                {unansweredCount} question(s) remaining unanswered.
              </p>
              <p
                style={{
                  margin: "0 0 24px 0",
                  lineHeight: "1.5",
                  fontSize: "15px",
                  color: theme.text,
                }}
              >
                Please complete all questions before submitting your exam.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowUnansweredAlert(false)}
                  style={{
                    padding: "10px 28px",
                    background: theme.crimson,
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "-0.2px",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 2px 8px rgba(196, 30, 58, 0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(196, 30, 58, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(196, 30, 58, 0.25)";
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
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={cancelSubmit}
          >
            <div
              style={{
                background: theme.modalBg,
                backdropFilter: theme.glassBlur,
                WebkitBackdropFilter: theme.glassBlur,
                padding: 24,
                borderRadius: 12,
                maxWidth: 400,
                width: "90%",
                border: `1px solid ${theme.glassBorder}`,
                boxShadow: theme.glassShadowHover,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  margin: "0 0 16px 0",
                  color: theme.crimson,
                  fontWeight: 700,
                }}
              >
                Submit Exam
              </h3>
              <p
                style={{
                  margin: "0 0 24px 0",
                  lineHeight: 1.5,
                  color: theme.text,
                }}
              >
                Are you sure you want to submit your exam? This action cannot be
                undone.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={cancelSubmit}
                  style={{
                    padding: "8px 20px",
                    background: "transparent",
                    color: theme.text,
                    border: `1px solid ${theme.glassBorder}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    letterSpacing: "-0.2px",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(196, 30, 58, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  style={{
                    padding: "8px 20px",
                    background: theme.crimson,
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    letterSpacing: "-0.2px",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 2px 8px rgba(196, 30, 58, 0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(196, 30, 58, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(196, 30, 58, 0.25)";
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
