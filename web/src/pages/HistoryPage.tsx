import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { fetchRecentAttempts, deleteAttempt } from "../api/client";
import type { AttemptSummary } from "../types";
import ExamHistory from "../components/ExamHistory";

export default function HistoryPage() {
  const navigate = useNavigate();
  const { darkMode, theme } = useOutletContext<{
    darkMode: boolean;
    theme: any;
  }>();
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllAttempts();
  }, []);

  const loadAllAttempts = async () => {
    try {
      setLoading(true);
      // Fetch more attempts for the full history page
      const data = await fetchRecentAttempts(100);
      setAttempts(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAttempt = (attemptId: number) => {
    navigate(`/history/${attemptId}`);
  };

  const handleDeleteAttempt = async (attemptId: number) => {
    try {
      await deleteAttempt(attemptId);
      setAttempts(attempts.filter((a) => a.id !== attemptId));
    } catch (e: any) {
      setError(e?.message || "Failed to delete attempt");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div>Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: "crimson" }}>
        <div>Error: {error}</div>
        <button onClick={loadAllAttempts} style={{ marginTop: 12 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: theme.crimson,
            letterSpacing: "-0.5px",
          }}
        >
          Exam History
        </h2>
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
          Back to Dashboard
        </button>
      </div>

      {attempts.length > 0 ? (
        <ExamHistory
          attempts={attempts}
          onReviewAttempt={handleReviewAttempt}
          onDeleteAttempt={handleDeleteAttempt}
          darkMode={darkMode}
          theme={theme}
        />
      ) : (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            background: theme.cardBg,
            backdropFilter: theme.glassBlur,
            WebkitBackdropFilter: theme.glassBlur,
            borderRadius: 12,
            border: `2px dashed ${theme.glassBorder}`,
            boxShadow: theme.glassShadow,
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", color: theme.textSecondary }}>
            No exam history yet
          </h3>
          <p style={{ margin: "0 0 16px 0", color: theme.textSecondary }}>
            Take your first exam to see your history here.
          </p>
          <button
            onClick={() => navigate("/upload")}
            style={{
              padding: "10px 24px",
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
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(196, 30, 58, 0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Upload CSV
          </button>
        </div>
      )}
    </div>
  );
}
