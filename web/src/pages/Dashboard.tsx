import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import CSVLibrary from "../components/CSVLibrary";
import ExamHistory from "../components/ExamHistory";
import PerformanceAnalytics from "../components/PerformanceAnalytics";
import {
  fetchAllUploads,
  fetchRecentAttempts,
  deleteUpload,
  downloadCSV,
  deleteAttempt,
} from "../api/client";
import type { UploadSummary, AttemptSummary } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const { darkMode, theme } = useOutletContext<{
    darkMode: boolean;
    theme: any;
  }>();
  const [uploads, setUploads] = useState<UploadSummary[]>([]);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [uploadsData, attemptsData] = await Promise.all([
        fetchAllUploads(),
        fetchRecentAttempts(10),
      ]);
      setUploads(uploadsData);
      setAttempts(attemptsData);
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = (
    uploadIds: number[],
    uploadData?: UploadSummary
  ) => {
    navigate("/settings", { state: { uploadIds, uploadData } });
  };

  const handleDeleteUpload = async (uploadId: number) => {
    try {
      await deleteUpload(uploadId);
      setUploads(uploads.filter((u) => u.id !== uploadId));
    } catch (e: any) {
      setError(e?.message || "Failed to delete CSV");
    }
  };

  const handleDownloadCSV = async (uploadId: number) => {
    try {
      const blob = await downloadCSV(uploadId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        uploads.find((u) => u.id === uploadId)?.filename || "download.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || "Failed to download CSV");
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

  const handleUploadNew = () => {
    navigate("/upload");
  };

  const handleViewAllHistory = () => {
    navigate("/history");
  };

  const handleShowTutorial = () => {
    window.dispatchEvent(new CustomEvent("showTutorial"));
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: "center",
          background: theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          borderRadius: 12,
          boxShadow: theme.glassShadow,
        }}
      >
        <div style={{ color: theme.text, fontSize: 18, fontWeight: 500 }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 32,
          background: theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          borderRadius: 12,
          boxShadow: theme.glassShadow,
          border: `1px solid ${theme.crimson}`,
        }}
      >
        <div
          style={{
            color: theme.crimson,
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          Error: {error}
        </div>
        <button
          onClick={loadDashboardData}
          onMouseEnter={() => setHoveredButton("retry")}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            padding: "10px 24px",
            background:
              hoveredButton === "retry" ? theme.crimsonDark : theme.crimson,
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.3s ease",
            boxShadow:
              hoveredButton === "retry"
                ? "0 6px 20px rgba(196, 30, 58, 0.4)"
                : "0 3px 12px rgba(196, 30, 58, 0.3)",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Performance Analytics */}
      {attempts.length > 0 && (
        <PerformanceAnalytics
          attempts={attempts}
          darkMode={darkMode}
          theme={theme}
        />
      )}

      {/* Recent Exam History */}
      <section>
        <h2
          style={{
            margin: "0 0 16px 0",
            fontSize: 28,
            fontWeight: 700,
            color: theme.crimson,
            letterSpacing: "-0.5px",
          }}
        >
          Recent Exam History
        </h2>
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
            <h3
              style={{
                margin: "0 0 8px 0",
                color: theme.textSecondary,
                fontSize: 18,
              }}
            >
              No exams taken yet
            </h3>
            <p
              style={{ margin: "0", color: theme.textSecondary, fontSize: 14 }}
            >
              Upload a CSV and take your first exam to see your history here.
            </p>
          </div>
        )}
      </section>

      {/* CSV Library */}
      <section>
        <h2
          style={{
            margin: "0 0 16px 0",
            fontSize: 28,
            fontWeight: 700,
            color: theme.crimson,
            letterSpacing: "-0.5px",
          }}
        >
          CSV Library
        </h2>
        <CSVLibrary
          uploads={uploads}
          onCreateExam={handleCreateExam}
          onDelete={handleDeleteUpload}
          onDownload={handleDownloadCSV}
          onUpdate={loadDashboardData}
          darkMode={darkMode}
          theme={theme}
        />
      </section>
    </div>
  );
}
