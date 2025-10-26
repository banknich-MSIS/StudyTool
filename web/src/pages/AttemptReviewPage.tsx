import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { fetchAttemptDetail } from "../api/client";
import type { AttemptDetail } from "../types";
import axios from "axios";
import { parseSimpleMarkdown } from "../utils/markdown";

export default function AttemptReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { darkMode, theme } = useOutletContext<{
    darkMode: boolean;
    theme: any;
  }>();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [overriddenAnswers, setOverriddenAnswers] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (attemptId) {
      loadAttemptDetail(parseInt(attemptId));
    }
  }, [attemptId]);

  const loadAttemptDetail = async (id: number) => {
    try {
      setLoading(true);
      const data = await fetchAttemptDetail(id);
      setAttempt(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load attempt details");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeOverride = async (
    questionId: number,
    currentStatus: boolean
  ) => {
    if (!attempt || !attemptId) return;

    try {
      // Call backend to override grade
      await axios.post(
        `http://localhost:8000/api/attempts/${attemptId}/questions/${questionId}/override`
      );

      // Update local state
      setAttempt({
        ...attempt,
        questions: attempt.questions.map((q) =>
          q.question.id === questionId
            ? { ...q, is_correct: !currentStatus }
            : q
        ),
        score_pct: calculateNewScore(
          attempt.questions,
          questionId,
          !currentStatus
        ),
      });

      setOverriddenAnswers(new Set([...overriddenAnswers, questionId]));
    } catch (e: any) {
      alert(`Failed to override grade: ${e?.message || "Unknown error"}`);
    }
  };

  const calculateNewScore = (
    questions: any[],
    overriddenQuestionId: number,
    newStatus: boolean
  ): number => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (q.question.id === overriddenQuestionId) {
        if (newStatus) correctCount++;
      } else if (q.is_correct) {
        correctCount++;
      }
    });
    return (correctCount / questions.length) * 100;
  };

  const scrollToQuestion = (index: number) => {
    const element = document.getElementById(`review-question-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#28a745";
    if (score >= 60) return "#ffc107";
    return "#dc3545";
  };

  const getScoreBackground = (score: number) => {
    if (darkMode) {
      if (score >= 80) return "#1a3d1a";
      if (score >= 60) return "#3d3d1a";
      return "#3d1a1a";
    }
    if (score >= 80) return "#d4edda";
    if (score >= 60) return "#fff3cd";
    return "#f8d7da";
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: theme.text }}>
        <div>Loading attempt review...</div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div style={{ padding: 24, color: "crimson" }}>
        <div>Error: {error || "Attempt not found"}</div>
        <button onClick={() => navigate("/")} style={{ marginTop: 12 }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const allQuestions = attempt.questions;
  const displayedQuestions = showWrongOnly
    ? allQuestions.filter((q) => !q.is_correct)
    : allQuestions;
  const correctCount = allQuestions.filter((q) => q.is_correct).length;
  const totalCount = allQuestions.length;

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
      {/* Sticky Sidebar Navigator */}
      <aside
        style={{
          padding: "16px",
          backgroundColor: theme.navBg,
          position: "sticky",
          top: 80,
          height: "fit-content",
          maxHeight: "100vh",
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
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: getScoreColor(attempt.score_pct),
            }}
          >
            {Math.round(attempt.score_pct)}%
          </div>
          <div style={{ fontSize: "14px", color: theme.textSecondary }}>
            {correctCount} / {totalCount} correct
          </div>
        </div>

        {/* Question Navigator Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
            gap: 8,
          }}
        >
          {allQuestions.map((q, idx) => (
            <button
              key={q.question.id}
              onClick={() => scrollToQuestion(idx)}
              style={{
                padding: 8,
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                background: q.is_correct
                  ? darkMode
                    ? "#1a3d1a"
                    : "#d4edda"
                  : darkMode
                  ? "#3d1a1a"
                  : "#f8d7da",
                cursor: "pointer",
                fontWeight: "bold",
                color: q.is_correct
                  ? darkMode
                    ? "#66bb6a"
                    : "#155724"
                  : darkMode
                  ? "#ef5350"
                  : "#721c24",
                opacity: showWrongOnly && q.is_correct ? 0.3 : 1,
              }}
              title={`Question ${idx + 1} - ${
                q.is_correct ? "Correct" : "Incorrect"
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
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => navigate("/settings")}
            style={{
              padding: "10px 24px",
              background: theme.crimson,
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              letterSpacing: "-0.2px",
              fontSize: 15,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 2px 8px rgba(196, 30, 58, 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(196, 30, 58, 0.35)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(196, 30, 58, 0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Start Over
          </button>
          <button
            onClick={() => navigate("/")}
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
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(212, 166, 80, 0.35)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(212, 166, 80, 0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Home
          </button>
          <button
            onClick={() => setShowWrongOnly(!showWrongOnly)}
            style={{
              padding: "10px 24px",
              background: showWrongOnly ? theme.btnWarning : theme.crimson,
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              letterSpacing: "-0.2px",
              fontSize: 15,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: showWrongOnly
                ? "0 2px 8px rgba(255, 193, 7, 0.25)"
                : "0 2px 8px rgba(196, 30, 58, 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = showWrongOnly
                ? "0 4px 12px rgba(255, 193, 7, 0.35)"
                : "0 4px 12px rgba(196, 30, 58, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = showWrongOnly
                ? "0 2px 8px rgba(255, 193, 7, 0.25)"
                : "0 2px 8px rgba(196, 30, 58, 0.25)";
            }}
          >
            {showWrongOnly ? "Show All Questions" : "Show Wrong Answers Only"}
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
          {displayedQuestions.map((questionReview, displayIdx) => {
            const actualIndex = allQuestions.indexOf(questionReview);
            const question = questionReview.question;
            const isShortAnswer =
              question.type === "short" || question.type === "cloze";
            const isCorrect = questionReview.is_correct;

            // Determine border color
            let borderColor = "#28a745"; // green
            if (isShortAnswer) {
              borderColor = "#ffc107"; // yellow/amber for short answer
            } else if (!isCorrect) {
              borderColor = "#dc3545"; // red
            }

            return (
              <div
                key={question.id}
                id={`review-question-${actualIndex}`}
                style={{
                  border: `2px solid ${borderColor}`,
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: isShortAnswer
                    ? darkMode
                      ? "#3d3d1a"
                      : "#fffbf0"
                    : isCorrect
                    ? darkMode
                      ? "#1e2e1e"
                      : "#f8fff9"
                    : darkMode
                    ? "#2e1e1e"
                    : "#fff8f8",
                }}
              >
                {/* Question Header */}
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
                    Question {actualIndex + 1}
                  </h3>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        padding: "4px 12px",
                        borderRadius: 4,
                        fontWeight: "bold",
                        fontSize: "14px",
                        backgroundColor: isShortAnswer
                          ? "#ffc107"
                          : isCorrect
                          ? "#28a745"
                          : "#dc3545",
                        color: isShortAnswer ? "#000" : "white",
                      }}
                    >
                      {isShortAnswer
                        ? "Manual Review"
                        : isCorrect
                        ? "Correct"
                        : "Incorrect"}
                    </div>
                    {/* Grade Override Button - only for non-short answer */}
                    {!isShortAnswer && (
                      <button
                        onClick={() =>
                          handleGradeOverride(question.id, isCorrect)
                        }
                        title="Override grade (toggle correct/incorrect)"
                        style={{
                          padding: "4px 10px",
                          backgroundColor: darkMode ? "#4d4d4d" : "#e0e0e0",
                          border: `1px solid ${theme.border}`,
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: "11px",
                          color: theme.text,
                          fontWeight: "bold",
                        }}
                      >
                        ⚙ Override
                      </button>
                    )}
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
                  dangerouslySetInnerHTML={{
                    __html: parseSimpleMarkdown(question.stem),
                  }}
                />

                {/* Options for MCQ/Multi/TrueFalse - Highlighted */}
                {question.type === "mcq" ||
                question.type === "multi" ||
                question.type === "truefalse" ? (
                  <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                    {question.type === "truefalse" ? (
                      ["True", "False"].map((option) => {
                        const isUserAnswer =
                          String(questionReview.user_answer).toLowerCase() ===
                          option.toLowerCase();
                        const isCorrectAnswer =
                          String(
                            questionReview.correct_answer
                          ).toLowerCase() === option.toLowerCase();

                        let backgroundColor = darkMode ? "#4d4d4d" : "#e9ecef";
                        let borderColor = theme.border;
                        let label = "";

                        if (isCorrectAnswer) {
                          backgroundColor = darkMode ? "#1a3d1a" : "#d4edda";
                          borderColor = "#28a745";
                          label = "✓ Correct Answer";
                        }
                        if (isUserAnswer && !isCorrectAnswer) {
                          backgroundColor = darkMode ? "#3d1a1a" : "#f8d7da";
                          borderColor = "#dc3545";
                          label = "✗ Your Answer";
                        }

                        return (
                          <div
                            key={option}
                            style={{
                              padding: "12px",
                              border: `2px solid ${borderColor}`,
                              borderRadius: 4,
                              backgroundColor,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "15px",
                                color: theme.text,
                                textTransform: "capitalize",
                              }}
                            >
                              {option}
                            </span>
                            {label && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontWeight: "bold",
                                  color: isCorrectAnswer
                                    ? darkMode
                                      ? "#66bb6a"
                                      : "#28a745"
                                    : darkMode
                                    ? "#ef5350"
                                    : "#dc3545",
                                }}
                              >
                                {label}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : question.options && question.options.length > 0 ? (
                      question.options.map((option, optIdx) => {
                        const isUserAnswer =
                          String(questionReview.user_answer) ===
                            String(option) ||
                          (Array.isArray(questionReview.user_answer) &&
                            questionReview.user_answer.includes(option));
                        const isCorrectAnswer =
                          String(questionReview.correct_answer) ===
                            String(option) ||
                          (Array.isArray(questionReview.correct_answer) &&
                            questionReview.correct_answer.includes(option));

                        let backgroundColor = darkMode ? "#4d4d4d" : "#e9ecef";
                        let borderColor = theme.border;
                        let label = "";

                        if (isCorrectAnswer) {
                          backgroundColor = darkMode ? "#1a3d1a" : "#d4edda";
                          borderColor = "#28a745";
                          label = "✓ Correct Answer";
                        }
                        if (isUserAnswer && !isCorrectAnswer) {
                          backgroundColor = darkMode ? "#3d1a1a" : "#f8d7da";
                          borderColor = "#dc3545";
                          label = "✗ Your Answer";
                        }

                        return (
                          <div
                            key={optIdx}
                            style={{
                              padding: "12px",
                              border: `2px solid ${borderColor}`,
                              borderRadius: 4,
                              backgroundColor,
                            }}
                          >
                            <span
                              style={{ fontSize: "15px", color: theme.text }}
                            >
                              {option}
                            </span>
                            {label && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontWeight: "bold",
                                  color: isCorrectAnswer
                                    ? darkMode
                                      ? "#66bb6a"
                                      : "#28a745"
                                    : darkMode
                                    ? "#ef5350"
                                    : "#dc3545",
                                }}
                              >
                                {label}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: darkMode ? "#3d1a1a" : "#fff3cd",
                          border: `2px solid ${
                            darkMode ? "#4d2a2a" : "#ffc107"
                          }`,
                          borderRadius: 4,
                          color: theme.text,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            marginBottom: 8,
                            color: darkMode ? "#ffb74d" : "#856404",
                          }}
                        >
                          ⚠️ Options data missing for this question
                        </div>
                        <div style={{ fontSize: "14px" }}>
                          <strong>Your answer:</strong>{" "}
                          {String(questionReview.user_answer || "No answer")}
                          <br />
                          <strong>Correct answer:</strong>{" "}
                          {String(questionReview.correct_answer || "N/A")}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Short Answer / Cloze - Side by Side Comparison */}
                {isShortAnswer && (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: "bold",
                            marginBottom: 4,
                            fontSize: "14px",
                            color: theme.text,
                          }}
                        >
                          Your Answer:
                        </div>
                        <div
                          style={{
                            padding: "12px",
                            border: `2px solid ${darkMode ? "#555" : "#ccc"}`,
                            borderRadius: 4,
                            backgroundColor: darkMode ? "#3d3d3d" : "#f5f5f5",
                            minHeight: 40,
                            color: theme.text,
                          }}
                        >
                          {String(questionReview.user_answer)}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: "bold",
                            marginBottom: 4,
                            fontSize: "14px",
                            color: theme.text,
                          }}
                        >
                          Correct Answer:
                        </div>
                        <div
                          style={{
                            padding: "12px",
                            border: "2px solid #ffc107",
                            borderRadius: 4,
                            backgroundColor: darkMode ? "#3d3d1a" : "#fffbf0",
                            minHeight: 40,
                            color: theme.text,
                          }}
                        >
                          {String(questionReview.correct_answer)}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: theme.textSecondary,
                        fontStyle: "italic",
                        padding: "8px",
                        backgroundColor: darkMode ? "#2a2a1a" : "#fff8dc",
                        borderRadius: 4,
                      }}
                    >
                      ℹ️ Please manually review if your answer matches the
                      expected answer.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {displayedQuestions.length === 0 && showWrongOnly && (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              backgroundColor: darkMode ? "#1a3d1a" : "#d4edda",
              borderRadius: 8,
              border: `2px solid #28a745`,
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", color: "#28a745" }}>
              Perfect Score! 🎉
            </h3>
            <p style={{ margin: 0, color: theme.text }}>
              You answered all questions correctly. Great job!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
