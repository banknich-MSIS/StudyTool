import React, { useState } from "react";
import type { AttemptSummary } from "../types";

interface ExamHistoryProps {
  attempts: AttemptSummary[];
  onReviewAttempt: (attemptId: number) => void;
  onDeleteAttempt: (attemptId: number) => void;
  darkMode: boolean;
  theme: any;
}

export default function ExamHistory({
  attempts,
  onReviewAttempt,
  onDeleteAttempt,
  darkMode,
  theme,
}: ExamHistoryProps) {
  const [sortBy, setSortBy] = useState<"date" | "score" | "source">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#28a745"; // Green
    if (score >= 60) return "#ffc107"; // Yellow
    return "#dc3545"; // Red
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return "#d4edda";
    if (score >= 60) return "#fff3cd";
    return "#f8d7da";
  };

  const sortedAttempts = [...attempts].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case "date":
        aVal = new Date(a.finished_at).getTime();
        bVal = new Date(b.finished_at).getTime();
        break;
      case "score":
        aVal = a.score_pct;
        bVal = b.score_pct;
        break;
      case "source":
        aVal = a.upload_filename.toLowerCase();
        bVal = b.upload_filename.toLowerCase();
        break;
      default:
        return 0;
    }

    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (column: "date" | "score" | "source") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (column: "date" | "score" | "source") => {
    if (sortBy !== column) return "";
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  // Calculate summary stats
  const totalAttempts = attempts.length;
  const averageScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + a.score_pct, 0) / attempts.length
        )
      : 0;
  const bestScore =
    attempts.length > 0 ? Math.max(...attempts.map((a) => a.score_pct)) : 0;
  const recentImprovement =
    attempts.length >= 2 ? attempts[0].score_pct - attempts[1].score_pct : 0;

  return (
    <div>
      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: 20,
            background: theme.cardBg,
            backdropFilter: theme.glassBlur,
            WebkitBackdropFilter: theme.glassBlur,
            borderRadius: 12,
            textAlign: "center",
            border: `1px solid ${theme.glassBorder}`,
            boxShadow: theme.glassShadow,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: theme.crimson,
            }}
          >
            {totalAttempts}
          </div>
          <div
            style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}
          >
            Total Exams
          </div>
        </div>
        <div
          style={{
            padding: 20,
            background: theme.cardBg,
            backdropFilter: theme.glassBlur,
            WebkitBackdropFilter: theme.glassBlur,
            borderRadius: 12,
            textAlign: "center",
            border: `1px solid ${theme.glassBorder}`,
            boxShadow: theme.glassShadow,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: theme.btnSuccess,
            }}
          >
            {averageScore}%
          </div>
          <div
            style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}
          >
            Average Score
          </div>
        </div>
        <div
          style={{
            padding: 20,
            background: theme.cardBg,
            backdropFilter: theme.glassBlur,
            WebkitBackdropFilter: theme.glassBlur,
            borderRadius: 12,
            textAlign: "center",
            border: `1px solid ${theme.glassBorder}`,
            boxShadow: theme.glassShadow,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: theme.amber,
            }}
          >
            {bestScore}%
          </div>
          <div
            style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}
          >
            Best Score
          </div>
        </div>
        {recentImprovement !== 0 && (
          <div
            style={{
              padding: 20,
              background: theme.cardBg,
              backdropFilter: theme.glassBlur,
              WebkitBackdropFilter: theme.glassBlur,
              borderRadius: 12,
              textAlign: "center",
              border: `1px solid ${
                recentImprovement > 0 ? theme.btnSuccess : theme.btnDanger
              }`,
              boxShadow: theme.glassShadow,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color:
                  recentImprovement > 0 ? theme.btnSuccess : theme.btnDanger,
              }}
            >
              {recentImprovement > 0 ? "+" : ""}
              {Math.round(recentImprovement)}%
            </div>
            <div
              style={{
                fontSize: 14,
                color: theme.textSecondary,
                marginTop: 4,
              }}
            >
              Recent Change
            </div>
          </div>
        )}
      </div>

      {/* Attempts Table - Glassmorphism */}
      <div
        style={{
          border: `1px solid ${theme.glassBorder}`,
          borderRadius: 12,
          overflow: "hidden",
          background: theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          boxShadow: theme.glassShadow,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 80px",
            background: theme.navBg,
            padding: 16,
            fontWeight: 700,
            fontSize: 14,
            borderBottom: `1px solid ${theme.glassBorder}`,
            color: theme.crimson,
          }}
        >
          <div
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            onClick={() => handleSort("date")}
          >
            Date {getSortIcon("date")}
          </div>
          <div
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            onClick={() => handleSort("score")}
          >
            Score {getSortIcon("score")}
          </div>
          <div
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            onClick={() => handleSort("source")}
          >
            Source {getSortIcon("source")}
          </div>
          <div>Questions</div>
          <div>Actions</div>
        </div>

        {sortedAttempts.map((attempt) => (
          <div
            key={attempt.id}
            onClick={() => onReviewAttempt(attempt.id)}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr 80px",
              padding: 12,
              borderBottom: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBg,
              transition: "background-color 0.2s ease",
              alignItems: "center",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.navHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.cardBg;
            }}
          >
            <div style={{ fontSize: 14, color: theme.text }}>
              {formatDate(attempt.finished_at)}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: getScoreColor(attempt.score_pct),
                backgroundColor: getScoreBackground(attempt.score_pct),
                padding: "4px 8px",
                borderRadius: 4,
                textAlign: "center",
                display: "inline-block",
                width: "fit-content",
              }}
            >
              {Math.round(attempt.score_pct)}%
            </div>
            <div
              style={{
                fontSize: 14,
                color: theme.textSecondary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={attempt.upload_filename}
            >
              {attempt.upload_filename}
            </div>
            <div
              style={{
                fontSize: 14,
                color: theme.textSecondary,
              }}
            >
              {attempt.correct_count}/{attempt.question_count}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  window.confirm(
                    "Are you sure you want to delete this exam attempt?"
                  )
                ) {
                  onDeleteAttempt(attempt.id);
                }
              }}
              onMouseEnter={() => setHoveredButton(`delete-${attempt.id}`)}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                padding: "6px 12px",
                background:
                  hoveredButton === `delete-${attempt.id}`
                    ? theme.btnDangerHover
                    : theme.btnDanger,
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                transition: "all 0.2s ease",
                boxShadow:
                  hoveredButton === `delete-${attempt.id}`
                    ? "0 4px 12px rgba(220, 53, 69, 0.4)"
                    : "0 2px 8px rgba(220, 53, 69, 0.3)",
              }}
              title="Delete attempt"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {attempts.length === 0 && (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: theme.textSecondary,
          }}
        >
          No exam attempts yet. Take your first exam to see your history here.
        </div>
      )}
    </div>
  );
}
