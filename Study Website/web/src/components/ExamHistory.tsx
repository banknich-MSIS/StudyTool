import React, { useState } from "react";
import type { AttemptSummary } from "../types";

interface ExamHistoryProps {
  attempts: AttemptSummary[];
  onReviewAttempt: (attemptId: number) => void;
  onDeleteAttempt: (attemptId: number) => void;
}

export default function ExamHistory({
  attempts,
  onReviewAttempt,
  onDeleteAttempt,
}: ExamHistoryProps) {
  const [sortBy, setSortBy] = useState<"date" | "score" | "source">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
    if (sortBy !== column) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
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
            padding: 16,
            backgroundColor: "#e3f2fd",
            borderRadius: 8,
            textAlign: "center",
            border: "1px solid #bbdefb",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#1976d2" }}>
            {totalAttempts}
          </div>
          <div style={{ fontSize: 14, color: "#1976d2" }}>Total Exams</div>
        </div>
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
            {averageScore}%
          </div>
          <div style={{ fontSize: 14, color: "#2e7d32" }}>Average Score</div>
        </div>
        <div
          style={{
            padding: 16,
            backgroundColor: "#fff3e0",
            borderRadius: 8,
            textAlign: "center",
            border: "1px solid #ffcc02",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#f57c00" }}>
            {bestScore}%
          </div>
          <div style={{ fontSize: 14, color: "#f57c00" }}>Best Score</div>
        </div>
        {recentImprovement !== 0 && (
          <div
            style={{
              padding: 16,
              backgroundColor: recentImprovement > 0 ? "#e8f5e8" : "#ffebee",
              borderRadius: 8,
              textAlign: "center",
              border: `1px solid ${
                recentImprovement > 0 ? "#c8e6c9" : "#ffcdd2"
              }`,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: recentImprovement > 0 ? "#2e7d32" : "#c62828",
              }}
            >
              {recentImprovement > 0 ? "+" : ""}
              {Math.round(recentImprovement)}%
            </div>
            <div
              style={{
                fontSize: 14,
                color: recentImprovement > 0 ? "#2e7d32" : "#c62828",
              }}
            >
              Recent Change
            </div>
          </div>
        )}
      </div>

      {/* Attempts Table */}
      <div
        style={{
          border: "1px solid #dee2e6",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 80px",
            backgroundColor: "#f8f9fa",
            padding: 12,
            fontWeight: "bold",
            fontSize: 14,
            borderBottom: "1px solid #dee2e6",
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
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr 80px",
              padding: 12,
              borderBottom: "1px solid #f1f3f4",
              transition: "background-color 0.2s ease",
              alignItems: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
            }}
          >
            <div
              style={{ fontSize: 14, cursor: "pointer" }}
              onClick={() => onReviewAttempt(attempt.id)}
            >
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
                cursor: "pointer",
              }}
              onClick={() => onReviewAttempt(attempt.id)}
            >
              {Math.round(attempt.score_pct)}%
            </div>
            <div
              style={{ fontSize: 14, color: "#6c757d", cursor: "pointer" }}
              onClick={() => onReviewAttempt(attempt.id)}
            >
              {attempt.upload_filename}
            </div>
            <div
              style={{ fontSize: 14, color: "#6c757d", cursor: "pointer" }}
              onClick={() => onReviewAttempt(attempt.id)}
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
              style={{
                padding: "6px 12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "13px",
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
            color: "#6c757d",
          }}
        >
          No exam attempts yet. Take your first exam to see your history here.
        </div>
      )}
    </div>
  );
}
