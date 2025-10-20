import React, { useState } from "react";
import type { UploadSummary } from "../types";

interface CSVLibraryProps {
  uploads: UploadSummary[];
  onCreateExam: (uploadIds: number[]) => void;
  onDelete: (uploadId: number) => void;
  onDownload: (uploadId: number) => void;
}

export default function CSVLibrary({
  uploads,
  onCreateExam,
  onDelete,
  onDownload,
}: CSVLibraryProps) {
  const [selectedUploads, setSelectedUploads] = useState<Set<number>>(
    new Set()
  );

  const toggleSelection = (uploadId: number) => {
    const newSelection = new Set(selectedUploads);
    if (newSelection.has(uploadId)) {
      newSelection.delete(uploadId);
    } else {
      newSelection.add(uploadId);
    }
    setSelectedUploads(newSelection);
  };

  const handleCreateExamFromSelected = () => {
    if (selectedUploads.size > 0) {
      onCreateExam(Array.from(selectedUploads));
      setSelectedUploads(new Set());
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (uploads.length === 0) {
    return (
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
          No CSVs uploaded yet
        </h3>
        <p style={{ margin: "0 0 16px 0", color: "#6c757d" }}>
          Upload your first CSV file to start creating practice exams.
        </p>
        <button
          onClick={() => onCreateExam([])}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          Upload Your First CSV
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Multi-select Actions */}
      {uploads.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            padding: 12,
            backgroundColor: selectedUploads.size > 0 ? "#e3f2fd" : "#f8f9fa",
            borderRadius: 6,
            border: `1px solid ${
              selectedUploads.size > 0 ? "#2196f3" : "#dee2e6"
            }`,
          }}
        >
          <div>
            {selectedUploads.size > 0 ? (
              <span style={{ color: "#1976d2", fontWeight: "bold" }}>
                {selectedUploads.size} CSV{selectedUploads.size > 1 ? "s" : ""}{" "}
                selected
              </span>
            ) : (
              <span style={{ color: "#6c757d" }}>
                Select CSVs to create a combined exam
              </span>
            )}
          </div>
          {selectedUploads.size > 0 && (
            <button
              onClick={handleCreateExamFromSelected}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Create Exam from Selected
            </button>
          )}
        </div>
      )}

      {/* CSV Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {uploads.map((upload) => (
          <div
            key={upload.id}
            style={{
              border: selectedUploads.has(upload.id)
                ? "2px solid #2196f3"
                : "1px solid #dee2e6",
              borderRadius: 8,
              padding: 16,
              backgroundColor: selectedUploads.has(upload.id)
                ? "#f3f9ff"
                : "white",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onClick={() => toggleSelection(upload.id)}
          >
            {/* Selection Checkbox */}
            <div style={{ marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={selectedUploads.has(upload.id)}
                onChange={() => toggleSelection(upload.id)}
                style={{ marginRight: 8 }}
              />
              <span style={{ fontWeight: "bold", fontSize: 16 }}>
                {upload.filename}
              </span>
            </div>

            {/* Upload Info */}
            <div style={{ marginBottom: 12, fontSize: 14, color: "#6c757d" }}>
              <div>Uploaded: {formatDate(upload.created_at)}</div>
              <div>Questions: {upload.question_count}</div>
              <div>Exams Created: {upload.exam_count}</div>
            </div>

            {/* Themes */}
            {upload.themes && upload.themes.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{ fontSize: 12, color: "#6c757d", marginBottom: 4 }}
                >
                  Themes:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {upload.themes.slice(0, 3).map((theme, index) => (
                    <span
                      key={index}
                      style={{
                        padding: "2px 6px",
                        backgroundColor: "#e9ecef",
                        borderRadius: 4,
                        fontSize: 11,
                        color: "#495057",
                      }}
                    >
                      {theme}
                    </span>
                  ))}
                  {upload.themes.length > 3 && (
                    <span style={{ fontSize: 11, color: "#6c757d" }}>
                      +{upload.themes.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid #f1f3f4",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateExam([upload.id]);
                }}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Create Exam
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(upload.id);
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Download
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    confirm(
                      `Are you sure you want to delete "${upload.filename}"? This will also delete all associated exams and attempts.`
                    )
                  ) {
                    onDelete(upload.id);
                  }
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
