import { useState } from "react";
import { uploadCsv } from "../api/client";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { UploadMetadata } from "../types";

export default function UploadPage() {
  const { darkMode, theme } = useOutletContext<{
    darkMode: boolean;
    theme: any;
  }>();
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const nav = useNavigate();

  const onUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await uploadCsv(file);
      setUploadId(res.uploadId);
      setStats(res.stats);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `#themes: Your Study Topic, Subtopic
#suggested_types: mcq, short
#recommended_count: 10
question,answer,type,options,concepts
What is 2+2?,4,short,,Basic Math
What is the capital of France?,Paris,mcq,Paris|London|Berlin|Madrid,Geography`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hoosier-prep-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const showTutorial = () => {
    // This will be handled by the parent App component
    window.dispatchEvent(new CustomEvent("showTutorial"));
  };

  const metadata = stats?.metadata as UploadMetadata | undefined;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Gemini Workflow Instructions */}
      <div
        style={{
          background: darkMode ? "#1a3a52" : "#f0f7ff",
          padding: 16,
          borderRadius: 8,
          border: `1px solid ${darkMode ? "#2a4a62" : "#b3d9ff"}`,
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            color: darkMode ? "#64b5f6" : "#0066cc",
          }}
        >
          How to use this tool:
        </h3>
        <ol
          style={{
            margin: 0,
            paddingLeft: 20,
            color: darkMode ? "#90caf9" : theme.text,
          }}
        >
          <li>Upload your study materials (PDF/PowerPoint) to Gemini AI</li>
          <li>Ask Gemini to create a study CSV using the format</li>
          <li>Download the CSV and upload it here</li>
        </ol>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            onClick={showTutorial}
            onMouseEnter={() => setHoveredButton("viewGuide")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: "6px 12px",
              border: `1px solid ${darkMode ? "#64b5f6" : "#0066cc"}`,
              borderRadius: 4,
              backgroundColor: theme.cardBg,
              color: darkMode ? "#64b5f6" : "#0066cc",
              cursor: "pointer",
              filter:
                hoveredButton === "viewGuide"
                  ? "brightness(0.85)"
                  : "brightness(1)",
              transition: "all 0.2s ease",
            }}
          >
            View detailed guide
          </button>
          <button
            onClick={downloadTemplate}
            onMouseEnter={() => setHoveredButton("downloadTemplate")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: "6px 12px",
              border: `1px solid ${darkMode ? "#64b5f6" : "#0066cc"}`,
              borderRadius: 4,
              backgroundColor: theme.cardBg,
              color: darkMode ? "#64b5f6" : "#0066cc",
              cursor: "pointer",
              filter:
                hoveredButton === "downloadTemplate"
                  ? "brightness(0.85)"
                  : "brightness(1)",
              transition: "all 0.2s ease",
            }}
          >
            Download CSV template
          </button>
        </div>
      </div>

      {/* CSV Upload Section */}
      <div
        style={{
          border: `2px dashed ${theme.border}`,
          borderRadius: 8,
          padding: 24,
          textAlign: "center",
          backgroundColor: file ? theme.navBg : theme.cardBg,
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", color: theme.text }}>
          Upload Study CSV
        </h3>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{
            marginBottom: 16,
            color: theme.text,
            backgroundColor: theme.cardBg,
            padding: 8,
            borderRadius: 4,
            border: `1px solid ${theme.border}`,
          }}
        />
        <div>
          <button
            onClick={onUpload}
            disabled={!file || loading}
            onMouseEnter={() =>
              !loading && file && setHoveredButton("uploadCsv")
            }
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: "12px 24px",
              backgroundColor: file ? "#007bff" : theme.border,
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: file ? "pointer" : "not-allowed",
              fontSize: 16,
              filter:
                hoveredButton === "uploadCsv"
                  ? "brightness(0.85)"
                  : "brightness(1)",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            color: darkMode ? "#ef5350" : "crimson",
            padding: 12,
            backgroundColor: darkMode ? "#3d1a1a" : "#ffe6e6",
            borderRadius: 6,
            border: `1px solid ${darkMode ? "#4d2a2a" : "#ffcccc"}`,
          }}
        >
          {error}
        </div>
      )}

      {uploadId && (
        <div
          style={{
            borderTop: `1px solid ${theme.border}`,
            paddingTop: 16,
            backgroundColor: theme.navBg,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <h3
            style={{
              margin: "0 0 12px 0",
              color: darkMode ? "#66bb6a" : "#28a745",
            }}
          >
            Upload Successful!
          </h3>
          <div style={{ marginBottom: 12, color: theme.text }}>
            <strong>Upload ID:</strong> {uploadId}
          </div>

          {/* Display Metadata */}
          {metadata && (
            <div style={{ marginBottom: 16, color: theme.text }}>
              <h4 style={{ margin: "0 0 8px 0" }}>Study Configuration:</h4>
              {metadata.themes && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Themes:</strong> {metadata.themes.join(", ")}
                </div>
              )}
              {metadata.suggested_types && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Question Types:</strong>{" "}
                  {metadata.suggested_types.join(", ")}
                </div>
              )}
              {metadata.recommended_count && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Recommended Questions:</strong>{" "}
                  {metadata.recommended_count}
                </div>
              )}
              {metadata.difficulty && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Difficulty:</strong> {metadata.difficulty}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <strong style={{ color: theme.text }}>Upload Stats:</strong>
            <pre
              style={{
                background: darkMode ? "#3d3d3d" : "#f8f8f8",
                color: darkMode ? "#e0e0e0" : "#333",
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
                overflow: "auto",
                border: `1px solid ${theme.border}`,
              }}
            >
              {JSON.stringify(stats, null, 2)}
            </pre>
          </div>

          <button
            onClick={() => nav("/settings", { state: { uploadId, metadata } })}
            onMouseEnter={() => setHoveredButton("continueToSettings")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 16,
              filter:
                hoveredButton === "continueToSettings"
                  ? "brightness(0.85)"
                  : "brightness(1)",
              transition: "all 0.2s ease",
            }}
          >
            Continue to Settings →
          </button>
        </div>
      )}
    </div>
  );
}
