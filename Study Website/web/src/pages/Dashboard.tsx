import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [uploads, setUploads] = useState<UploadSummary[]>([]);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleCreateExam = (uploadIds: number[]) => {
    navigate("/settings", { state: { uploadIds } });
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
      <div style={{ padding: 24, textAlign: "center" }}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: "crimson" }}>
        <div>Error: {error}</div>
        <button onClick={loadDashboardData} style={{ marginTop: 12 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Quick Actions Bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 16,
          backgroundColor: "#f8f9fa",
          borderRadius: 8,
          border: "1px solid #dee2e6",
        }}
      >
        <button
          onClick={handleUploadNew}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Upload New CSV
        </button>
        <button
          onClick={handleViewAllHistory}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          View All History
        </button>
        <button
          onClick={handleShowTutorial}
          style={{
            padding: "8px 16px",
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Help & Tutorial
        </button>
      </div>

      {/* Performance Analytics */}
      {attempts.length > 0 && <PerformanceAnalytics attempts={attempts} />}

      {/* Recent Exam History */}
      <section>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 24 }}>
          Recent Exam History
        </h2>
        {attempts.length > 0 ? (
          <ExamHistory
            attempts={attempts}
            onReviewAttempt={handleReviewAttempt}
            onDeleteAttempt={handleDeleteAttempt}
          />
        ) : (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              backgroundColor: "#f8f9fa",
              borderRadius: 8,
              border: "2px dashed #dee2e6",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", color: "#6c757d" }}>
              No exams taken yet
            </h3>
            <p style={{ margin: "0 0 16px 0", color: "#6c757d" }}>
              Upload a CSV and take your first exam to see your history here.
            </p>
            <button
              onClick={handleUploadNew}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Upload Your First CSV
            </button>
          </div>
        )}
      </section>

      {/* CSV Library */}
      <section>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 24 }}>CSV Library</h2>
        <CSVLibrary
          uploads={uploads}
          onCreateExam={handleCreateExam}
          onDelete={handleDeleteUpload}
          onDownload={handleDownloadCSV}
        />
      </section>
    </div>
  );
}
