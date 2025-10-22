import { useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { useExamStore } from "../store/examStore";
import type { GradeReport, QuestionDTO } from "../types";

interface ReviewQuestion extends QuestionDTO {
  userAnswer: unknown;
  correctAnswer: unknown;
  isCorrect: boolean;
}

export default function ReviewPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { darkMode, theme } = useOutletContext<{
    darkMode: boolean;
    theme: any;
  }>();
  const gradeReport = location.state as GradeReport | undefined;
  const { questions: storeQuestions } = useExamStore();
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);

  useEffect(() => {
    if (!gradeReport || !storeQuestions.length) return;

    // Combine grade results with question data
    const combined = gradeReport.perQuestion
      .map((gradeItem) => {
        const question = storeQuestions.find(
          (q) => q.id === gradeItem.questionId
        );
        if (!question) return null;

        return {
          ...question,
          userAnswer: gradeItem.userAnswer,
          correctAnswer: gradeItem.correctAnswer,
          isCorrect: gradeItem.correct,
        };
      })
      .filter(Boolean) as ReviewQuestion[];

    setReviewQuestions(combined);
  }, [gradeReport, storeQuestions]);

  const scrollToQuestion = (index: number) => {
    const element = document.getElementById(`review-question-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!gradeReport) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div>No results to show. Take an exam first.</div>
        <button
          onClick={() => nav("/")}
          style={{ marginTop: 16, padding: "8px 16px" }}
        >
          Go Home
        </button>
      </div>
    );
  }

  if (reviewQuestions.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div>Loading results...</div>
      </div>
    );
  }

  const correctCount = reviewQuestions.filter((q) => q.isCorrect).length;
  const totalCount = reviewQuestions.length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: 16,
        minHeight: "calc(100vh - 80px)",
        backgroundColor: theme.bg,
      }}
    >
      {/* Sidebar Navigator */}
      <aside
        style={{
          padding: "16px",
          backgroundColor: theme.navBg,
          overflow: "auto",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "18px", color: theme.text }}
          >
            Results
          </h3>
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}
          >
            {gradeReport.scorePct.toFixed(1)}%
          </div>
          <div style={{ fontSize: "14px", color: theme.textSecondary }}>
            {correctCount} / {totalCount} correct
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
            gap: 8,
          }}
        >
          {reviewQuestions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => scrollToQuestion(idx)}
              style={{
                padding: 8,
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                background: q.isCorrect
                  ? darkMode
                    ? "#1a3d1a"
                    : "#d4edda"
                  : darkMode
                  ? "#3d1a1a"
                  : "#f8d7da",
                cursor: "pointer",
                fontWeight: "bold",
                color: q.isCorrect
                  ? darkMode
                    ? "#66bb6a"
                    : "#155724"
                  : darkMode
                  ? "#ef5350"
                  : "#721c24",
              }}
              title={`Question ${idx + 1} - ${
                q.isCorrect ? "Correct" : "Incorrect"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ overflow: "auto", padding: "16px" }}>
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            padding: "12px 0",
            borderBottom: `2px solid ${theme.border}`,
          }}
        >
          <button
            onClick={() => nav("/settings")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "15px",
            }}
          >
            Start Over
          </button>
          <button
            onClick={() => nav("/")}
            style={{
              padding: "10px 24px",
              background: theme.amber,
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              letterSpacing: "-0.2px",
              fontSize: 15,
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
            Home
          </button>
        </div>

        {/* Questions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "800px",
          }}
        >
          {reviewQuestions.map((question, index) => (
            <div
              key={question.id}
              id={`review-question-${index}`}
              style={{
                border: `2px solid ${
                  question.isCorrect ? "#28a745" : "#dc3545"
                }`,
                borderRadius: 8,
                padding: 16,
                backgroundColor: question.isCorrect
                  ? darkMode
                    ? "#1e2e1e"
                    : "#f8fff9"
                  : darkMode
                  ? "#2e1e1e"
                  : "#fff8f8",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
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
                <div
                  style={{
                    padding: "4px 12px",
                    borderRadius: 4,
                    fontWeight: "bold",
                    fontSize: "14px",
                    backgroundColor: question.isCorrect ? "#28a745" : "#dc3545",
                    color: "white",
                  }}
                >
                  {question.isCorrect ? "Correct" : "Incorrect"}
                </div>
              </div>

              {/* Question Text */}
              <div
                style={{
                  fontSize: "16px",
                  lineHeight: "1.5",
                  marginBottom: 16,
                  whiteSpace: "pre-wrap",
                  color: theme.text,
                }}
              >
                {question.stem}
              </div>

              {/* Options for MCQ/Multi */}
              {(question.type === "mcq" || question.type === "multi") &&
                question.options && (
                  <div style={{ display: "grid", gap: 8 }}>
                    {question.options.map((option, optIdx) => {
                      const isUserAnswer =
                        String(question.userAnswer) === String(option) ||
                        (Array.isArray(question.userAnswer) &&
                          question.userAnswer.includes(option));
                      const isCorrectAnswer =
                        String(question.correctAnswer) === String(option) ||
                        (Array.isArray(question.correctAnswer) &&
                          question.correctAnswer.includes(option));

                      let backgroundColor = darkMode ? "#4d4d4d" : "#d8dce0";
                      let borderColor = theme.border;

                      if (isCorrectAnswer) {
                        backgroundColor = darkMode ? "#1a3d1a" : "#d4edda";
                        borderColor = "#28a745";
                      } else if (isUserAnswer && !isCorrectAnswer) {
                        backgroundColor = darkMode ? "#3d1a1a" : "#f8d7da";
                        borderColor = "#dc3545";
                      }

                      return (
                        <div
                          key={optIdx}
                          style={{
                            padding: "12px",
                            border: `2px solid ${borderColor}`,
                            borderRadius: 4,
                            backgroundColor,
                            position: "relative",
                          }}
                        >
                          <span style={{ fontSize: "15px", color: theme.text }}>
                            {option}
                          </span>
                          {isCorrectAnswer && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontWeight: "bold",
                                color: darkMode ? "#66bb6a" : "#28a745",
                              }}
                            >
                              Correct Answer
                            </span>
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontWeight: "bold",
                                color: darkMode ? "#ef5350" : "#dc3545",
                              }}
                            >
                              Your Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* True/False */}
              {question.type === "truefalse" && (
                <div style={{ display: "grid", gap: 8 }}>
                  {["true", "false"].map((option) => {
                    const isUserAnswer =
                      String(question.userAnswer).toLowerCase() === option;
                    const isCorrectAnswer =
                      String(question.correctAnswer).toLowerCase() === option;

                    let backgroundColor = darkMode ? "#4d4d4d" : "#d8dce0";
                    let borderColor = theme.border;

                    if (isCorrectAnswer) {
                      backgroundColor = darkMode ? "#1a3d1a" : "#d4edda";
                      borderColor = "#28a745";
                    } else if (isUserAnswer && !isCorrectAnswer) {
                      backgroundColor = darkMode ? "#3d1a1a" : "#f8d7da";
                      borderColor = "#dc3545";
                    }

                    return (
                      <div
                        key={option}
                        style={{
                          padding: "12px",
                          border: `2px solid ${borderColor}`,
                          borderRadius: 4,
                          backgroundColor,
                          textTransform: "capitalize",
                        }}
                      >
                        <span style={{ fontSize: "15px", color: theme.text }}>
                          {option}
                        </span>
                        {isCorrectAnswer && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontWeight: "bold",
                              color: darkMode ? "#66bb6a" : "#28a745",
                            }}
                          >
                            ✓ Correct Answer
                          </span>
                        )}
                        {isUserAnswer && !isCorrectAnswer && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontWeight: "bold",
                              color: darkMode ? "#ef5350" : "#dc3545",
                            }}
                          >
                            Your Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Short Answer / Cloze */}
              {(question.type === "short" || question.type === "cloze") && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      padding: "12px",
                      border: `2px solid ${
                        question.isCorrect ? "#28a745" : "#dc3545"
                      }`,
                      borderRadius: 4,
                      backgroundColor: question.isCorrect
                        ? darkMode
                          ? "#1a3d1a"
                          : "#d4edda"
                        : darkMode
                        ? "#3d1a1a"
                        : "#f8d7da",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: 4,
                        color: theme.text,
                      }}
                    >
                      Your Answer:
                    </div>
                    <div style={{ color: theme.text }}>
                      {String(question.userAnswer)}
                    </div>
                  </div>
                  {!question.isCorrect && (
                    <div
                      style={{
                        padding: "12px",
                        border: "2px solid #28a745",
                        borderRadius: 4,
                        backgroundColor: darkMode ? "#1a3d1a" : "#d4edda",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          marginBottom: 4,
                          color: theme.text,
                        }}
                      >
                        Correct Answer:
                      </div>
                      <div style={{ color: theme.text }}>
                        {String(question.correctAnswer)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
