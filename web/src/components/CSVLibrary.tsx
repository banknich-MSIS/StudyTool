import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { UploadSummary, ClassSummary, QuestionType } from "../types";
import ClassTagSelector from "./ClassTagSelector";
import { fetchClasses } from "../api/client";

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple Choice",
  multi: "Multiple Select",
  short: "Short Answer",
  truefalse: "True/False",
  cloze: "Fill in the Blank",
};

interface CSVLibraryProps {
  uploads: UploadSummary[];
  onCreateExam: (uploadIds: number[], uploadData?: UploadSummary) => void;
  onDelete: (uploadId: number) => void;
  onDownload: (uploadId: number) => void;
  onUpdate: () => void;
  darkMode: boolean;
  theme: any;
}

export default function CSVLibrary({
  uploads,
  onCreateExam,
  onDelete,
  onDownload,
  onUpdate,
  darkMode,
  theme,
}: CSVLibraryProps) {
  const navigate = useNavigate();
  const [selectedUploads, setSelectedUploads] = useState<Set<number>>(
    new Set()
  );
  const [allClasses, setAllClasses] = useState<ClassSummary[]>([]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(
    null
  );

  // Load classes to get actual colors
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await fetchClasses();
        setAllClasses(data);
      } catch (e) {
        console.error("Failed to load classes:", e);
      }
    };
    loadClasses();
  }, []);

  // Helper function to calculate contrast text color
  const getContrastTextColor = (hexColor: string): string => {
    // Remove # if present
    const hex = hexColor.replace("#", "");

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black or white based on luminance
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  // Get class color by name
  const getClassColor = (className: string) => {
    const classData = allClasses.find((cls) => cls.name === className);
    return classData?.color || "#007bff";
  };

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
      const uploadIds = Array.from(selectedUploads);
      const firstUpload = uploads.find((u) => u.id === uploadIds[0]);
      onCreateExam(uploadIds, firstUpload);
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

  // Get unique class tags from all uploads
  const allClassTags = Array.from(
    new Set(uploads.flatMap((u) => u.class_tags || []))
  ).sort();

  // Filter uploads based on selected class
  const filteredUploads = selectedClassFilter
    ? uploads.filter((u) => u.class_tags?.includes(selectedClassFilter))
    : uploads;

  // Debug logging
  useEffect(() => {
    console.log("=== CSV LIBRARY ===");
    console.log("All uploads:", uploads);
    if (uploads.length > 0) {
      console.log(
        "First upload question_type_counts:",
        uploads[0]?.question_type_counts
      );
    }
  }, [uploads]);

  if (uploads.length === 0) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: "center",
          backgroundColor: theme.navBg,
          borderRadius: 8,
          border: `2px dashed ${theme.border}`,
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", color: theme.textSecondary }}>
          No CSVs uploaded yet
        </h3>
        <p style={{ margin: "0 0 16px 0", color: theme.textSecondary }}>
          Upload your first CSV file to start creating practice exams.
        </p>
        <button
          onClick={() => navigate("/upload")}
          onMouseEnter={() => setHoveredButton("uploadFirst")}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
            filter:
              hoveredButton === "uploadFirst"
                ? "brightness(0.85)"
                : "brightness(1)",
            transition: "all 0.2s ease",
          }}
        >
          Upload Your First CSV
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Class Filter */}
      {allClassTags.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>
            Filter by class:
          </span>
          <button
            onClick={() => setSelectedClassFilter(null)}
            onMouseEnter={() => setHoveredButton("filterAll")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: "6px 12px",
              backgroundColor: !selectedClassFilter
                ? darkMode
                  ? "#2a4a62"
                  : "#007bff"
                : theme.cardBg,
              color: !selectedClassFilter ? "white" : theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
              transition: "all 0.2s ease",
              filter:
                hoveredButton === "filterAll"
                  ? "brightness(0.85)"
                  : "brightness(1)",
            }}
          >
            All
          </button>
          {allClassTags.map((tag) => {
            const classColor = getClassColor(tag);
            const isSelected = selectedClassFilter === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedClassFilter(tag)}
                onMouseEnter={() => setHoveredButton(`filter-${tag}`)}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: isSelected ? classColor : theme.cardBg,
                  color: isSelected
                    ? getContrastTextColor(classColor)
                    : theme.text,
                  border: `1px solid ${isSelected ? classColor : theme.border}`,
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  transition: "all 0.2s ease",
                  filter:
                    hoveredButton === `filter-${tag}`
                      ? "brightness(0.85)"
                      : "brightness(1)",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Multi-select Actions */}
      {uploads.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            padding: 12,
            backgroundColor:
              selectedUploads.size > 0
                ? darkMode
                  ? "rgba(25, 118, 210, 0.1)"
                  : "#e3f2fd"
                : theme.navBg,
            borderRadius: 6,
            border: `1px solid ${
              selectedUploads.size > 0
                ? darkMode
                  ? "#1565c0"
                  : "#2196f3"
                : theme.border
            }`,
          }}
        >
          <div>
            {selectedUploads.size > 0 ? (
              <span
                style={{
                  color: darkMode ? "#90caf9" : "#1976d2",
                  fontWeight: "bold",
                }}
              >
                {selectedUploads.size} CSV{selectedUploads.size > 1 ? "s" : ""}{" "}
                selected
              </span>
            ) : (
              <span style={{ color: theme.textSecondary }}>
                Select CSVs to create a combined exam
              </span>
            )}
          </div>
          {selectedUploads.size > 0 && (
            <button
              onClick={handleCreateExamFromSelected}
              onMouseEnter={() => setHoveredButton("createFromSelected")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                filter:
                  hoveredButton === "createFromSelected"
                    ? "brightness(0.85)"
                    : "brightness(1)",
                transition: "all 0.2s ease",
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
        {filteredUploads.map((upload) => (
          <div
            key={upload.id}
            style={{
              border: selectedUploads.has(upload.id)
                ? darkMode
                  ? "2px solid #1565c0"
                  : "2px solid #2196f3"
                : `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: 16,
              backgroundColor: selectedUploads.has(upload.id)
                ? darkMode
                  ? theme.cardBg
                  : "#f3f9ff"
                : theme.cardBg,
              cursor: "pointer",
              transition: "all 0.2s ease",
              position: "relative",
            }}
            onClick={() => toggleSelection(upload.id)}
          >
            {/* Class Tags in Top Right */}
            {upload.class_tags && upload.class_tags.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  maxWidth: "60%",
                  justifyContent: "flex-end",
                }}
              >
                {upload.class_tags.map((tag, index) => {
                  const classColor = getClassColor(tag);
                  const textColor = getContrastTextColor(classColor);
                  return (
                    <span
                      key={index}
                      style={{
                        padding: "3px 8px",
                        backgroundColor: classColor,
                        color: textColor,
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Selection Checkbox */}
            <div style={{ marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={selectedUploads.has(upload.id)}
                onChange={() => toggleSelection(upload.id)}
                style={{ marginRight: 8 }}
              />
              <span
                style={{ fontWeight: "bold", fontSize: 16, color: theme.text }}
              >
                {upload.filename}
              </span>
            </div>

            {/* Upload Info */}
            <div
              style={{
                marginBottom: 12,
                fontSize: 14,
                color: theme.textSecondary,
              }}
            >
              <div>Uploaded: {formatDate(upload.created_at)}</div>
              <div>Questions: {upload.question_count}</div>
              <div>Exams Created: {upload.exam_count}</div>
            </div>

            {/* Themes */}
            {upload.themes && upload.themes.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: theme.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  Themes:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {upload.themes.slice(0, 5).map((themeItem, index) => (
                    <span
                      key={index}
                      style={{
                        padding: "2px 6px",
                        backgroundColor: darkMode ? "#3d3d3d" : "#e9ecef",
                        borderRadius: 4,
                        fontSize: 11,
                        color: darkMode ? "#a0a0a0" : "#495057",
                      }}
                    >
                      {themeItem}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Question Types */}
            {upload.question_type_counts &&
              Object.keys(upload.question_type_counts).length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    Question Types:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {Object.entries(upload.question_type_counts).map(
                      ([type, count]) => (
                        <span
                          key={type}
                          style={{
                            padding: "2px 6px",
                            backgroundColor: darkMode ? "#2a4a62" : "#e3f2fd",
                            borderRadius: 4,
                            fontSize: 11,
                            color: darkMode ? "#90caf9" : "#1976d2",
                          }}
                        >
                          {QUESTION_TYPE_LABELS[type as QuestionType]} ({count})
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateExam([upload.id], upload);
                  }}
                  onMouseEnter={() => setHoveredButton(`create-${upload.id}`)}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    filter:
                      hoveredButton === `create-${upload.id}`
                        ? "brightness(0.85)"
                        : "brightness(1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  Create Exam
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(upload.id);
                  }}
                  onMouseEnter={() => setHoveredButton(`download-${upload.id}`)}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    filter:
                      hoveredButton === `download-${upload.id}`
                        ? "brightness(0.85)"
                        : "brightness(1)",
                    transition: "all 0.2s ease",
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
                  onMouseEnter={() => setHoveredButton(`delete-${upload.id}`)}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    filter:
                      hoveredButton === `delete-${upload.id}`
                        ? "brightness(0.85)"
                        : "brightness(1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  Delete
                </button>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ClassTagSelector
                  uploadId={upload.id}
                  currentTags={upload.class_tags || []}
                  onUpdate={onUpdate}
                  darkMode={darkMode}
                  theme={theme}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
