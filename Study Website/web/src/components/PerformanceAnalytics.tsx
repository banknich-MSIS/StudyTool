import React from "react";
import type { AttemptSummary } from "../types";

interface PerformanceAnalyticsProps {
  attempts: AttemptSummary[];
}

export default function PerformanceAnalytics({
  attempts,
}: PerformanceAnalyticsProps) {
  if (attempts.length === 0) {
    return null;
  }

  // Calculate analytics
  const totalAttempts = attempts.length;
  const averageScore =
    attempts.reduce((sum, a) => sum + a.score_pct, 0) / totalAttempts;
  const bestScore = Math.max(...attempts.map((a) => a.score_pct));
  const worstScore = Math.min(...attempts.map((a) => a.score_pct));

  // Score trend (last 5 attempts)
  const recentAttempts = attempts.slice(0, 5).reverse();
  const scoreTrend = recentAttempts.map((a) => a.score_pct);

  // Performance by source
  const sourceStats = attempts.reduce((acc, attempt) => {
    const source = attempt.upload_filename;
    if (!acc[source]) {
      acc[source] = { count: 0, totalScore: 0, scores: [] };
    }
    acc[source].count++;
    acc[source].totalScore += attempt.score_pct;
    acc[source].scores.push(attempt.score_pct);
    return acc;
  }, {} as Record<string, { count: number; totalScore: number; scores: number[] }>);

  // Improvement suggestions
  const getImprovementSuggestions = () => {
    const suggestions = [];

    if (averageScore < 70) {
      suggestions.push(
        "Focus on reviewing incorrect answers and understanding concepts"
      );
    }

    if (worstScore < 50) {
      suggestions.push(
        "Consider taking more practice exams to build confidence"
      );
    }

    if (scoreTrend.length >= 3) {
      const recentTrend = scoreTrend.slice(-3);
      const isDeclining =
        recentTrend[0] < recentTrend[1] && recentTrend[1] < recentTrend[2];
      if (isDeclining) {
        suggestions.push(
          "Your scores are declining - consider reviewing study materials"
        );
      }
    }

    const lowPerformingSources = Object.entries(sourceStats)
      .filter(([_, stats]) => stats.totalScore / stats.count < 60)
      .map(([source, _]) => source);

    if (lowPerformingSources.length > 0) {
      suggestions.push(
        `Focus on improving performance in: ${lowPerformingSources.join(", ")}`
      );
    }

    return suggestions.length > 0
      ? suggestions
      : ["Keep up the great work! Continue practicing regularly."];
  };

  const suggestions = getImprovementSuggestions();

  // Simple trend visualization
  const maxScore = Math.max(...scoreTrend);
  const minScore = Math.min(...scoreTrend);
  const range = maxScore - minScore || 1;

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        border: "1px solid #dee2e6",
      }}
    >
      <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: "#495057" }}>
        📊 Performance Analytics
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Key Metrics */}
        <div
          style={{
            padding: 16,
            backgroundColor: "white",
            borderRadius: 6,
            border: "1px solid #e9ecef",
          }}
        >
          <div style={{ fontSize: 12, color: "#6c757d", marginBottom: 4 }}>
            Average Score
          </div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#28a745" }}>
            {Math.round(averageScore)}%
          </div>
        </div>

        <div
          style={{
            padding: 16,
            backgroundColor: "white",
            borderRadius: 6,
            border: "1px solid #e9ecef",
          }}
        >
          <div style={{ fontSize: 12, color: "#6c757d", marginBottom: 4 }}>
            Best Score
          </div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#007bff" }}>
            {Math.round(bestScore)}%
          </div>
        </div>

        <div
          style={{
            padding: 16,
            backgroundColor: "white",
            borderRadius: 6,
            border: "1px solid #e9ecef",
          }}
        >
          <div style={{ fontSize: 12, color: "#6c757d", marginBottom: 4 }}>
            Total Exams
          </div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#6c757d" }}>
            {totalAttempts}
          </div>
        </div>
      </div>

      {/* Score Trend Chart */}
      {scoreTrend.length > 1 && (
        <div
          style={{
            marginBottom: 20,
            padding: 16,
            backgroundColor: "white",
            borderRadius: 6,
            border: "1px solid #e9ecef",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: "bold",
              marginBottom: 12,
              color: "#495057",
            }}
          >
            Recent Score Trend (Last {scoreTrend.length} Exams)
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              height: 60,
              gap: 8,
              padding: "0 8px",
            }}
          >
            {scoreTrend.map((score, index) => {
              const height = ((score - minScore) / range) * 40 + 10;
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${height}px`,
                      backgroundColor:
                        score >= 80
                          ? "#28a745"
                          : score >= 60
                          ? "#ffc107"
                          : "#dc3545",
                      borderRadius: "2px 2px 0 0",
                      marginBottom: 4,
                    }}
                  />
                  <div style={{ fontSize: 10, color: "#6c757d" }}>
                    {Math.round(score)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance by Source */}
      {Object.keys(sourceStats).length > 1 && (
        <div
          style={{
            marginBottom: 20,
            padding: 16,
            backgroundColor: "white",
            borderRadius: 6,
            border: "1px solid #e9ecef",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: "bold",
              marginBottom: 12,
              color: "#495057",
            }}
          >
            Performance by Study Material
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {Object.entries(sourceStats).map(([source, stats]) => {
              const avgScore = stats.totalScore / stats.count;
              return (
                <div
                  key={source}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 8,
                    backgroundColor: "#f8f9fa",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#495057", flex: 1 }}>
                    {source}
                  </div>
                  <div
                    style={{ fontSize: 12, color: "#6c757d", marginRight: 8 }}
                  >
                    {stats.count} exam{stats.count > 1 ? "s" : ""}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color:
                        avgScore >= 80
                          ? "#28a745"
                          : avgScore >= 60
                          ? "#ffc107"
                          : "#dc3545",
                      backgroundColor:
                        avgScore >= 80
                          ? "#d4edda"
                          : avgScore >= 60
                          ? "#fff3cd"
                          : "#f8d7da",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {Math.round(avgScore)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      <div
        style={{
          padding: 16,
          backgroundColor: "#e3f2fd",
          borderRadius: 6,
          border: "1px solid #bbdefb",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: "bold",
            marginBottom: 8,
            color: "#1976d2",
          }}
        >
          💡 Improvement Suggestions
        </div>
        <ul
          style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#1976d2" }}
        >
          {suggestions.map((suggestion, index) => (
            <li key={index} style={{ marginBottom: 4 }}>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
