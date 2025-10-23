import React from "react";
import type { AttemptSummary } from "../types";

interface PerformanceAnalyticsProps {
  attempts: AttemptSummary[];
  darkMode: boolean;
  theme: any;
}

export default function PerformanceAnalytics({
  attempts,
  darkMode,
  theme,
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

  // Performance by class analysis
  const getPerformanceByClass = () => {
    // Group attempts by class tags
    const classPerformance = attempts.reduce((acc, attempt) => {
      const classTags = attempt.class_tags || ["Unassigned"];
      classTags.forEach((tag) => {
        if (!acc[tag]) {
          acc[tag] = { scores: [], count: 0, totalScore: 0 };
        }
        acc[tag].scores.push(attempt.score_pct);
        acc[tag].count++;
        acc[tag].totalScore += attempt.score_pct;
      });
      return acc;
    }, {} as Record<string, { scores: number[]; count: number; totalScore: number }>);

    return Object.entries(classPerformance)
      .map(([className, stats]) => ({
        className,
        averageScore: stats.totalScore / stats.count,
        count: stats.count,
        bestScore: Math.max(...stats.scores),
        worstScore: Math.min(...stats.scores),
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
  };

  const performanceByClass = getPerformanceByClass();

  // Simple trend visualization
  const maxScore = Math.max(...scoreTrend);
  const minScore = Math.min(...scoreTrend);
  const range = maxScore - minScore || 1;

  return (
    <div
      style={{
        padding: 24,
        background: theme.cardBg,
        backdropFilter: theme.glassBlur,
        WebkitBackdropFilter: theme.glassBlur,
        borderRadius: 12,
        border: `1px solid ${theme.glassBorder}`,
        boxShadow: theme.glassShadow,
      }}
    >
      <h3
        style={{
          margin: "0 0 20px 0",
          fontSize: 24,
          fontWeight: 700,
          color: theme.crimson,
        }}
      >
        Performance Analytics
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Key Metrics - Glassmorphism */}
        <div
          style={{
            padding: 18,
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 10,
            border: `1px solid ${theme.glassBorder}`,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Average Score
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: theme.btnSuccess,
            }}
          >
            {Math.round(averageScore)}%
          </div>
        </div>

        <div
          style={{
            padding: 18,
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 10,
            border: `1px solid ${theme.glassBorder}`,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Best Score
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: theme.crimson,
            }}
          >
            {Math.round(bestScore)}%
          </div>
        </div>

        <div
          style={{
            padding: 18,
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 10,
            border: `1px solid ${theme.glassBorder}`,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Total Exams
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: theme.amber,
            }}
          >
            {totalAttempts}
          </div>
        </div>
      </div>

      {/* Score Trend Chart - Glassmorphism */}
      {scoreTrend.length > 1 && (
        <div
          style={{
            marginBottom: 20,
            padding: 18,
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 10,
            border: `1px solid ${theme.glassBorder}`,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: "bold",
              marginBottom: 12,
              color: theme.text,
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
                  <div style={{ fontSize: 10, color: theme.textSecondary }}>
                    {Math.round(score)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance by Source - Glassmorphism */}
      {Object.keys(sourceStats).length > 1 && (
        <div
          style={{
            marginBottom: 20,
            padding: 18,
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 10,
            border: `1px solid ${theme.glassBorder}`,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: "bold",
              marginBottom: 12,
              color: theme.text,
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
                    backgroundColor: darkMode ? "#3d3d3d" : "#f8f9fa",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ fontSize: 12, color: theme.text, flex: 1 }}>
                    {source}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.textSecondary,
                      marginRight: 8,
                    }}
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

      {/* Performance by Class - Glassmorphism */}
      {performanceByClass.length > 0 && (
        <div
          style={{
            padding: 18,
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 10,
            border: `1px solid ${theme.glassBorder}`,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 12,
              color: theme.crimson,
            }}
          >
            Performance by Class
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {performanceByClass.map((classData) => {
              const scoreColor =
                classData.averageScore >= 80
                  ? theme.btnSuccess
                  : classData.averageScore >= 60
                  ? theme.amber
                  : theme.btnDanger;
              
              return (
                <div
                  key={classData.className}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: darkMode
                      ? "rgba(255, 255, 255, 0.03)"
                      : "rgba(0, 0, 0, 0.02)",
                    borderRadius: 8,
                    border: `1px solid ${theme.glassBorder}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: theme.text,
                        marginBottom: 4,
                      }}
                    >
                      {classData.className}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.textSecondary,
                      }}
                    >
                      {classData.count} exam{classData.count > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: scoreColor,
                    }}
                  >
                    {Math.round(classData.averageScore)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: darkMode
                ? "rgba(212, 166, 80, 0.05)"
                : "rgba(196, 30, 58, 0.05)",
              borderRadius: 6,
              fontSize: 12,
              color: theme.textSecondary,
            }}
          >
            💡 Focus on classes with lower averages to improve overall performance
          </div>
        </div>
      )}
    </div>
  );
}
