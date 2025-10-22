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
  const [csvText, setCsvText] = useState<string>("");
  const [uploadedFromPaste, setUploadedFromPaste] = useState(false);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const nav = useNavigate();

  const onUpload = async () => {
    if (!file && !csvText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let fileToUpload = file;
      const wasPasted = !file && csvText.trim();

      // If CSV text is provided instead of file, convert it to a File
      if (!fileToUpload && csvText.trim()) {
        const blob = new Blob([csvText], { type: "text/csv" });
        fileToUpload = new File([blob], "pasted-csv.csv", { type: "text/csv" });
      }

      if (!fileToUpload) return;

      const res = await uploadCsv(fileToUpload);
      setUploadId(res.uploadId);
      setStats(res.stats);
      setUploadedFromPaste(wasPasted);
      // Clear inputs after successful upload
      setFile(null);
      setCsvText("");
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPastedCsv = () => {
    if (!stats) return;
    const csvContent = stats.raw_csv_content || "No CSV content available";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-study-set.csv";
    a.click();
    URL.revokeObjectURL(url);
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
      {/* Gemini Workflow Instructions - Glassmorphism */}
      <div
        style={{
          background: theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          padding: 20,
          borderRadius: 12,
          border: `1px solid ${theme.glassBorder}`,
          boxShadow: theme.glassShadow,
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            color: theme.crimson,
            fontWeight: 600,
            letterSpacing: "-0.3px",
          }}
        >
          Two Ways to Create Exams:
        </h3>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{ fontWeight: 600, color: theme.crimson, marginBottom: 6 }}
          >
            Option 1: AI Exam Creator (Built-in, Fast)
          </div>
          <p
            style={{
              margin: "0 0 12px 0",
              color: theme.text,
              fontSize: 14,
              lineHeight: 1.6,
              paddingLeft: 12,
            }}
          >
            Use our built-in AI generator for quick, streamlined exam creation.
            Upload files, set parameters, and generate instantly.
          </p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, color: theme.amber, marginBottom: 6 }}>
            Option 2: Gemini Gem (Consultative, Interactive)
          </div>
          <p
            style={{
              margin: 0,
              color: theme.text,
              fontSize: 14,
              lineHeight: 1.6,
              paddingLeft: 12,
            }}
          >
            For a guided, conversational experience, use the{" "}
            <a
              href="https://gemini.google.com/gem/582bd1e1e16d"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: theme.amber, textDecoration: "underline" }}
            >
              Gemini Gem
            </a>
            . It walks you through Q&A to refine your exam, then outputs a CSV
            to upload here.
          </p>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            onClick={showTutorial}
            onMouseEnter={() => setHoveredButton("viewGuide")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: "10px 20px",
              border: `1px solid ${theme.glassBorder}`,
              borderRadius: 6,
              background: "transparent",
              color: theme.crimson,
              cursor: "pointer",
              fontWeight: 600,
              letterSpacing: "-0.2px",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(196, 30, 58, 0.05)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            View Guide
          </button>
          <button
            onClick={downloadTemplate}
            onMouseEnter={() => setHoveredButton("downloadTemplate")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: 6,
              background: theme.amber,
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              letterSpacing: "-0.2px",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 2px 8px rgba(212, 166, 80, 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(212, 166, 80, 0.35)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(212, 166, 80, 0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Download Template
          </button>
        </div>
      </div>

      {/* CSV Upload Section - Glassmorphism */}
      <div
        style={{
          border: `2px dashed ${theme.glassBorder}`,
          borderRadius: 12,
          padding: 24,
          textAlign: "center",
          background: file ? theme.navHover : theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          boxShadow: file ? theme.glassShadowHover : theme.glassShadow,
          transition: "all 0.3s ease",
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            color: theme.crimson,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Upload Study CSV
        </h3>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              if (e.target.files?.[0]) setCsvText("");
            }}
            style={{
              color: theme.text,
              backgroundColor: theme.cardBgSolid,
              padding: 16,
              borderRadius: 8,
              border: `2px solid ${theme.glassBorder}`,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              maxWidth: 400,
            }}
          />
        </div>
      </div>

      {/* CSV Text Paste Section - Glassmorphism */}
      <div
        style={{
          border: `2px dashed ${theme.glassBorder}`,
          borderRadius: 12,
          padding: 24,
          background: csvText.trim() ? theme.navHover : theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          boxShadow: csvText.trim()
            ? theme.glassShadowHover
            : theme.glassShadow,
          transition: "all 0.3s ease",
        }}
      >
        <h3
          style={{
            margin: "0 0 8px 0",
            color: theme.crimson,
            fontWeight: 600,
          }}
        >
          Or Paste CSV Text (Gemini format)
        </h3>
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: 14,
            color: theme.textSecondary,
            lineHeight: 1.5,
          }}
        >
          Paste the CSV text code outputted in the format delivered from Gemini
        </p>
        <textarea
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            if (e.target.value.trim()) setFile(null);
          }}
          placeholder="Paste your CSV content here..."
          style={{
            width: "100%",
            minHeight: 200,
            padding: 16,
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: theme.cardBgSolid,
            color: theme.text,
            fontFamily: "monospace",
            fontSize: 13,
            resize: "vertical",
            outline: "none",
          }}
        />
      </div>

      {/* Upload Button - Glassmorphism */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={onUpload}
          disabled={(!file && !csvText.trim()) || loading}
          onMouseEnter={() =>
            !loading &&
            (file || csvText.trim()) &&
            setHoveredButton("uploadCsv")
          }
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            padding: "12px 32px",
            background: file || csvText.trim() ? theme.crimson : theme.border,
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: file || csvText.trim() ? "pointer" : "not-allowed",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.2px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow:
              file || csvText.trim()
                ? "0 2px 8px rgba(196, 30, 58, 0.25)"
                : "none",
            transform:
              hoveredButton === "uploadCsv" ? "translateY(-1px)" : "none",
          }}
          onMouseEnter={(e) => {
            if (file || csvText.trim()) {
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(196, 30, 58, 0.35)";
            }
          }}
          onMouseLeave={(e) => {
            if (file || csvText.trim()) {
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(196, 30, 58, 0.25)";
            }
          }}
        >
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: darkMode ? "#ef5350" : "#c41e3a",
            padding: 16,
            background: darkMode
              ? "rgba(196, 30, 58, 0.1)"
              : "rgba(196, 30, 58, 0.08)",
            backdropFilter: theme.glassBlur,
            WebkitBackdropFilter: theme.glassBlur,
            borderRadius: 10,
            border: `1px solid ${theme.crimson}`,
            boxShadow: theme.glassShadow,
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      {uploadId && (
        <div
          style={{
            background: theme.cardBg,
            backdropFilter: theme.glassBlur,
            WebkitBackdropFilter: theme.glassBlur,
            borderRadius: 12,
            padding: 20,
            border: `1px solid ${theme.glassBorder}`,
            boxShadow: theme.glassShadowHover,
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

          <div style={{ display: "flex", gap: 12 }}>
            {uploadedFromPaste && (
              <button
                onClick={downloadPastedCsv}
                style={{
                  padding: "12px 28px",
                  background: theme.amber,
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "-0.2px",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 8px rgba(212, 166, 80, 0.25)",
                  transform:
                    hoveredButton === "downloadCsv"
                      ? "translateY(-1px)"
                      : "none",
                }}
                onMouseEnter={(e) => {
                  setHoveredButton("downloadCsv");
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(212, 166, 80, 0.35)";
                }}
                onMouseLeave={(e) => {
                  setHoveredButton(null);
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(212, 166, 80, 0.25)";
                }}
              >
                Download CSV File
              </button>
            )}
            <button
              onClick={() =>
                nav("/settings", { state: { uploadId, metadata } })
              }
              style={{
                padding: "12px 28px",
                background: theme.btnSuccess,
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "-0.2px",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 2px 8px rgba(40, 167, 69, 0.25)",
                transform:
                  hoveredButton === "continueToSettings"
                    ? "translateY(-1px)"
                    : "none",
              }}
              onMouseEnter={(e) => {
                setHoveredButton("continueToSettings");
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(40, 167, 69, 0.35)";
              }}
              onMouseLeave={(e) => {
                setHoveredButton(null);
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(40, 167, 69, 0.25)";
              }}
            >
              Continue to Settings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
