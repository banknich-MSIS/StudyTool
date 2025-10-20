import { useState } from "react";
import { uploadCsv, uploadText } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function UploadPage() {
  const [mode, setMode] = useState<"csv" | "text">("csv");
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
      const res =
        mode === "csv" ? await uploadCsv(file) : await uploadText(file);
      setUploadId(res.uploadId);
      setStats(res.stats);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <label>
          <input
            type="radio"
            checked={mode === "csv"}
            onChange={() => setMode("csv")}
          />{" "}
          CSV
        </label>
        <label>
          <input
            type="radio"
            checked={mode === "text"}
            onChange={() => setMode("text")}
          />{" "}
          Text (.txt)
        </label>
      </div>

      <input
        type="file"
        accept={mode === "csv" ? ".csv" : ".txt"}
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={onUpload}
        disabled={!file || loading}
        style={{ padding: "8px 12px" }}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      {uploadId && (
        <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
          <div>Upload ID: {uploadId}</div>
          <pre style={{ background: "#f8f8f8", padding: 12, borderRadius: 6 }}>
            {JSON.stringify(stats, null, 2)}
          </pre>
          <button
            onClick={() => nav("/settings", { state: { uploadId } })}
            style={{ padding: "8px 12px" }}
          >
            Continue to Settings
          </button>
        </div>
      )}
    </div>
  );
}
