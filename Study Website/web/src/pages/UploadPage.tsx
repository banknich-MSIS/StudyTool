import { useState } from "react";
import { uploadCsv } from "../api/client";
import { useNavigate } from "react-router-dom";
import type { UploadMetadata } from "../types";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          background: "#f0f7ff",
          padding: 16,
          borderRadius: 8,
          border: "1px solid #b3d9ff",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", color: "#0066cc" }}>
          How to use this tool:
        </h3>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li>Upload your study materials (PDF/PowerPoint) to Gemini AI</li>
          <li>Ask Gemini to create a study CSV using our format</li>
          <li>Download the CSV and upload it here</li>
        </ol>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            onClick={showTutorial}
            style={{
              padding: "6px 12px",
              border: "1px solid #0066cc",
              borderRadius: 4,
              backgroundColor: "white",
              color: "#0066cc",
              cursor: "pointer",
            }}
          >
            View detailed guide
          </button>
          <button
            onClick={downloadTemplate}
            style={{
              padding: "6px 12px",
              border: "1px solid #0066cc",
              borderRadius: 4,
              backgroundColor: "white",
              color: "#0066cc",
              cursor: "pointer",
            }}
          >
            Download CSV template
          </button>
        </div>
      </div>

      {/* CSV Upload Section */}
      <div
        style={{
          border: "2px dashed #ddd",
          borderRadius: 8,
          padding: 24,
          textAlign: "center",
          backgroundColor: file ? "#f8f9fa" : "white",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0" }}>Upload Study CSV</h3>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginBottom: 16 }}
        />
        <div>
          <button
            onClick={onUpload}
            disabled={!file || loading}
            style={{
              padding: "12px 24px",
              backgroundColor: file ? "#007bff" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: file ? "pointer" : "not-allowed",
              fontSize: 16,
            }}
          >
            {loading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            color: "crimson",
            padding: 12,
            backgroundColor: "#ffe6e6",
            borderRadius: 6,
            border: "1px solid #ffcccc",
          }}
        >
          {error}
        </div>
      )}

      {uploadId && (
        <div
          style={{
            borderTop: "1px solid #eee",
            paddingTop: 16,
            backgroundColor: "#f8f9fa",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", color: "#28a745" }}>
            Upload Successful!
          </h3>
          <div style={{ marginBottom: 12 }}>
            <strong>Upload ID:</strong> {uploadId}
          </div>

          {/* Display Metadata */}
          {metadata && (
            <div style={{ marginBottom: 16 }}>
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
            <strong>Upload Stats:</strong>
            <pre
              style={{
                background: "#f8f8f8",
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
                overflow: "auto",
              }}
            >
              {JSON.stringify(stats, null, 2)}
            </pre>
          </div>

          <button
            onClick={() => nav("/settings", { state: { uploadId, metadata } })}
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
            Continue to Settings →
          </button>
        </div>
      )}
    </div>
  );
}
