import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { fetchAttemptDetail } from "../api/client";
import type { AttemptDetail } from "../types";

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

  const handleRetakeExam = () => {
    if (attempt) {
      // Navigate back to settings to create a new exam from the same upload
      // We need to get the upload ID from the exam
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
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

  const correctCount = attempt.questions.filter((q) => q.is_correct).length;
  const totalCount = attempt.questions.length;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          backgroundColor: theme.navBg,
          borderRadius: 8,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 8px 0", fontSize: 24, color: theme.text }}>
            Exam Review
          </h2>
          <div style={{ fontSize: 14, color: theme.textSecondary }}>
            Completed: {formatDate(attempt.finished_at)}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: getScoreColor(attempt.score_pct),
              backgroundColor: getScoreBackground(attempt.score_pct),
              padding: "8px 16px",
              borderRadius: 6,
            }}
          >
            {Math.round(attempt.score_pct)}%
          </div>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            padding: 16,
            backgroundColor: "#e8f5e8",
            borderRadius: 8,
            textAlign: "center",
            border: "1px solid #c8e6c9",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#2e7d32" }}>
            {correctCount}
          </div>
          <div style={{ fontSize: 14, color: "#2e7d32" }}>Correct Answers</div>
        </div>
        <div
          style={{
            padding: 16,
            backgroundColor: "#ffebee",
            borderRadius: 8,
            textAlign: "center",
            border: "1px solid #ffcdd2",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#c62828" }}>
            {totalCount - correctCount}
          </div>
          <div style={{ fontSize: 14, color: "#c62828" }}>
            Incorrect Answers
          </div>
        </div>
        <div
          style={{
            padding: 16,
            backgroundColor: "#e3f2fd",
            borderRadius: 8,
            textAlign: "center",
            border: "1px solid #bbdefb",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#1976d2" }}>
            {totalCount}
          </div>
          <div style={{ fontSize: 14, color: "#1976d2" }}>Total Questions</div>
        </div>
      </div>

      {/* Questions Review */}
      <div>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 20 }}>
          Question-by-Question Review
        </h3>
        <div style={{ display: "grid", gap: 16 }}>
          {attempt.questions.map((questionReview, index) => (
            <div
              key={questionReview.question.id}
              style={{
                border: questionReview.is_correct
                  ? "2px solid #28a745"
                  : `2px solid ${darkMode ? "#4d2a2a" : "#dc3545"}`,
                borderRadius: 8,
                padding: 16,
                backgroundColor: questionReview.is_correct
                  ? darkMode
                    ? "#1a3d1a"
                    : "#f8fff8"
                  : darkMode
                  ? "#3d1a1a"
                  : "#fff8f8",
              }}
            >
              {/* Question Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    color: theme.text,
                  }}
                >
                  Question {index + 1}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: questionReview.is_correct ? "#28a745" : "#dc3545",
                    backgroundColor: questionReview.is_correct
                      ? "#d4edda"
                      : "#f8d7da",
                    padding: "4px 8px",
                    borderRadius: 4,
                  }}
                >
                  {questionReview.is_correct ? "Correct" : "Incorrect"}
                </div>
              </div>

              {/* Question Text */}
              <div
                style={{
                  fontSize: 16,
                  marginBottom: 12,
                  lineHeight: 1.5,
                  color: theme.text,
                }}
              >
                {questionReview.question.stem}
              </div>

              {/* Options (if MCQ) */}
              {questionReview.question.options && (
                <div style={{ marginBottom: 12 }}>
                  {questionReview.question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      style={{
                        padding: "8px 12px",
                        marginBottom: 4,
                        backgroundColor: theme.navBg,
                        borderRadius: 4,
                        fontSize: 14,
                        color: theme.text,
                      }}
                    >
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </div>
                  ))}
                </div>
              )}

              {/* Answers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginTop: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: theme.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    Your Answer:
                  </div>
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: darkMode ? "#3d3d3d" : "#e9ecef",
                      borderRadius: 4,
                      fontSize: 14,
                      minHeight: 20,
                      color: theme.text,
                    }}
                  >
                    {questionReview.user_answer !== null &&
                    questionReview.user_answer !== undefined
                      ? String(questionReview.user_answer)
                      : "No answer provided"}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: theme.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    Correct Answer:
                  </div>
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: darkMode ? "#1a3d1a" : "#d4edda",
                      borderRadius: 4,
                      fontSize: 14,
                      minHeight: 20,
                      color: darkMode ? "#66bb6a" : "#155724",
                    }}
                  >
                    {questionReview.correct_answer !== null &&
                    questionReview.correct_answer !== undefined
                      ? String(questionReview.correct_answer)
                      : "No correct answer"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          padding: 16,
          backgroundColor: theme.navBg,
          borderRadius: 8,
          border: `1px solid ${theme.border}`,
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          Back to Dashboard
        </button>
        <button
          onClick={handleRetakeExam}
          style={{
            padding: "12px 24px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          Retake This Exam
        </button>
      </div>
    </div>
  );
}
