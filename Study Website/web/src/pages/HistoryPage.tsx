import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRecentAttempts, deleteAttempt } from "../api/client";
import type { AttemptSummary } from "../types";
import ExamHistory from "../components/ExamHistory";

export default function HistoryPage() {
  const navigate = useNavigate();
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
        <h2 style={{ margin: 0, fontSize: 28 }}>Exam History</h2>
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

      {attempts.length > 0 ? (
        <ExamHistory
          attempts={attempts}
          onReviewAttempt={handleReviewAttempt}
          onDeleteAttempt={handleDeleteAttempt}
        />
      ) : (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            borderRadius: 8,
            border: "2px dashed #dee2e6",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", color: "#6c757d" }}>
            No exam history yet
          </h3>
          <p style={{ margin: "0 0 16px 0", color: "#6c757d" }}>
            Take your first exam to see your history here.
          </p>
          <button
            onClick={() => navigate("/upload")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Upload CSV
          </button>
        </div>
      )}
    </div>
  );
}
