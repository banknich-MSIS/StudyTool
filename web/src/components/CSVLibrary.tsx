import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { UploadSummary, ClassSummary, QuestionType } from "../types";
import ClassTagSelector from "./ClassTagSelector";
import { fetchClasses, updateUploadName } from "../api/client";

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
  const [openClassDropdown, setOpenClassDropdown] = useState<number | null>(
    null
  );
  const [editingUploadId, setEditingUploadId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>("");

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

  // Close class dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the dropdown
      if (
        openClassDropdown !== null &&
        !target.closest(`[data-dropdown="${openClassDropdown}"]`)
      ) {
        setOpenClassDropdown(null);
      }
    };

    if (openClassDropdown !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openClassDropdown]);

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

  const handleStartRename = (uploadId: number) => {
    const upload = uploads.find((u) => u.id === uploadId);
    if (upload) {
      setEditingUploadId(uploadId);
      setEditName(upload.filename);
    }
  };

  const handleSaveRename = async (uploadId: number) => {
    try {
      await updateUploadName(uploadId, editName);
      setEditingUploadId(null);
      setEditName("");
      onUpdate();
    } catch (error) {
      console.error("Failed to rename upload:", error);
      alert("Failed to rename upload");
    }
  };

  const handleCancelRename = () => {
    setEditingUploadId(null);
    setEditName("");
  };

  const formatDate = (date: string) => {
    // Normalize to local time; if timestamp lacks timezone, assume UTC
    const hasTZ = /[zZ]|[+-]\d{2}:?\d{2}$/.test(date);
    const d = new Date(hasTZ ? date : `${date}Z`);
    return d.toLocaleDateString(undefined, {
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
          background: theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          borderRadius: 12,
          border: `2px dashed ${theme.glassBorder}`,
          boxShadow: theme.glassShadow,
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
            padding: "12px 32px",
            background: theme.crimson,
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.2px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 2px 8px rgba(196, 30, 58, 0.25)",
            transform:
              hoveredButton === "uploadFirst" ? "translateY(-1px)" : "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(196, 30, 58, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              "0 2px 8px rgba(196, 30, 58, 0.25)";
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
              padding: "8px 16px",
              background: !selectedClassFilter ? theme.crimson : theme.cardBg,
              backdropFilter: !selectedClassFilter ? "none" : theme.glassBlur,
              WebkitBackdropFilter: !selectedClassFilter
                ? "none"
                : theme.glassBlur,
              color: !selectedClassFilter ? "white" : theme.text,
              border: `1px solid ${
                !selectedClassFilter ? theme.crimson : theme.glassBorder
              }`,
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: !selectedClassFilter ? 600 : 500,
              transition: "all 0.2s ease",
              boxShadow: !selectedClassFilter
                ? "0 2px 8px rgba(196, 30, 58, 0.3)"
                : "none",
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
                  padding: "8px 16px",
                  background: isSelected ? classColor : theme.cardBg,
                  backdropFilter: isSelected ? "none" : theme.glassBlur,
                  WebkitBackdropFilter: isSelected ? "none" : theme.glassBlur,
                  color: isSelected
                    ? getContrastTextColor(classColor)
                    : theme.text,
                  border: `1px solid ${
                    isSelected ? classColor : theme.glassBorder
                  }`,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 500,
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? `0 2px 8px ${classColor}40` : "none",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Multi-select Actions - Glassmorphism */}
      {uploads.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            padding: 16,
            background:
              selectedUploads.size > 0
                ? darkMode
                  ? "rgba(196, 30, 58, 0.15)"
                  : "rgba(196, 30, 58, 0.1)"
                : theme.cardBg,
            backdropFilter: theme.glassBlur,
            WebkitBackdropFilter: theme.glassBlur,
            borderRadius: 12,
            border: `1px solid ${
              selectedUploads.size > 0 ? theme.crimson : theme.glassBorder
            }`,
            boxShadow:
              selectedUploads.size > 0
                ? theme.glassShadowHover
                : theme.glassShadow,
            transition: "all 0.3s ease",
          }}
        >
          <div>
            {selectedUploads.size > 0 ? (
              <span
                style={{
                  color: theme.crimson,
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {selectedUploads.size} CSV{selectedUploads.size > 1 ? "s" : ""}{" "}
                selected
              </span>
            ) : (
              <span style={{ color: theme.textSecondary, fontSize: 14 }}>
                Select CSVs to create a combined exam
              </span>
            )}
          </div>
          {selectedUploads.size > 0 && (
            <button
              onClick={handleCreateExamFromSelected}
              style={{
                padding: "10px 24px",
                background: theme.crimson,
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: "-0.2px",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 2px 8px rgba(196, 30, 58, 0.25)",
                transform:
                  hoveredButton === "createFromSelected"
                    ? "translateY(-1px)"
                    : "none",
              }}
              onMouseEnter={(e) => {
                setHoveredButton("createFromSelected");
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(196, 30, 58, 0.35)";
              }}
              onMouseLeave={(e) => {
                setHoveredButton(null);
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(196, 30, 58, 0.25)";
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
                ? `2px solid ${theme.crimson}`
                : `1px solid ${theme.glassBorder}`,
              borderRadius: 12,
              padding: 18,
              background: selectedUploads.has(upload.id)
                ? darkMode
                  ? "rgba(196, 30, 58, 0.12)"
                  : "rgba(196, 30, 58, 0.08)"
                : theme.cardBg,
              backdropFilter: theme.glassBlur,
              WebkitBackdropFilter: theme.glassBlur,
              cursor: "pointer",
              transition: "all 0.3s ease",
              position: "relative",
              boxShadow: selectedUploads.has(upload.id)
                ? theme.glassShadowHover
                : theme.glassShadow,
            }}
            onClick={() => toggleSelection(upload.id)}
            onMouseEnter={(e) => {
              if (!selectedUploads.has(upload.id)) {
                e.currentTarget.style.boxShadow = theme.glassShadowHover;
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedUploads.has(upload.id)) {
                e.currentTarget.style.boxShadow = theme.glassShadow;
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {/* Action buttons (Assign to class & Rename) in Top Right */}
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                display: "flex",
                gap: 8,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Rename button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartRename(upload.id);
                }}
                title="Rename"
                style={{
                  padding: "6px",
                  background: "rgba(196, 30, 58, 0.08)",
                  border: `1px solid ${theme.glassBorder}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(196, 30, 58, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(196, 30, 58, 0.08)";
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.crimson}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>

              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenClassDropdown(
                      openClassDropdown === upload.id ? null : upload.id
                    );
                  }}
                  title="Assign to class"
                  style={{
                    padding: "6px",
                    background:
                      openClassDropdown === upload.id
                        ? "rgba(196, 30, 58, 0.15)"
                        : "rgba(196, 30, 58, 0.08)",
                    border: `1px solid ${theme.glassBorder}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (openClassDropdown !== upload.id) {
                      e.currentTarget.style.background =
                        "rgba(196, 30, 58, 0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (openClassDropdown !== upload.id) {
                      e.currentTarget.style.background =
                        "rgba(196, 30, 58, 0.08)";
                    }
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={theme.crimson}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </button>

                {/* Dropdown for class assignment */}
                {openClassDropdown === upload.id && (
                  <div
                    data-dropdown={upload.id}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      right: 0,
                      minWidth: 200,
                      background: theme.cardBg,
                      backdropFilter: theme.glassBlur,
                      WebkitBackdropFilter: theme.glassBlur,
                      border: `1px solid ${theme.glassBorder}`,
                      borderRadius: 8,
                      boxShadow: theme.glassShadowHover,
                      padding: 8,
                      zIndex: 100,
                    }}
                  >
                    <ClassTagSelector
                      uploadId={upload.id}
                      currentTags={upload.class_tags || []}
                      onUpdate={() => {
                        onUpdate();
                        setOpenClassDropdown(null);
                      }}
                      darkMode={darkMode}
                      theme={theme}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Selection Checkbox and Filename */}
            <div style={{ marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={selectedUploads.has(upload.id)}
                onChange={() => toggleSelection(upload.id)}
                style={{ marginRight: 8 }}
              />
              {editingUploadId === upload.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename(upload.id);
                    if (e.key === "Escape") handleCancelRename();
                  }}
                  onBlur={() => handleSaveRename(upload.id)}
                  style={{
                    width: "calc(100% - 50px)",
                    padding: "4px 8px",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 4,
                    backgroundColor: theme.cardBgSolid,
                    color: theme.text,
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                  autoFocus
                />
              ) : (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    width: "calc(100% - 50px)",
                  }}
                >
                  <span
                    title={upload.filename}
                    style={{
                      fontWeight: "bold",
                      fontSize: 16,
                      color: theme.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "inline-block",
                      flex: 1,
                    }}
                  >
                    {upload.filename}
                  </span>
                </div>
              )}
            </div>

            {/* Class Tags under header */}
            {upload.class_tags && upload.class_tags.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
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
                        {tag.length > 12 ? `${tag.slice(0, 12)}…` : tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

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
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Create Exam - with + icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateExam([upload.id], upload);
                  }}
                  onMouseEnter={() => setHoveredButton(`create-${upload.id}`)}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    padding: "8px 14px",
                    background:
                      hoveredButton === `create-${upload.id}`
                        ? "rgba(196, 30, 58, 0.15)"
                        : "rgba(196, 30, 58, 0.08)",
                    color: theme.crimson,
                    border: `1px solid ${theme.glassBorder}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Exam
                </button>

                {/* Download - icon only */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(upload.id);
                  }}
                  onMouseEnter={() => setHoveredButton(`download-${upload.id}`)}
                  onMouseLeave={() => setHoveredButton(null)}
                  title="Download CSV"
                  style={{
                    padding: "8px",
                    background: "transparent",
                    color: theme.textSecondary,
                    border: `1px solid ${theme.glassBorder}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    opacity:
                      hoveredButton === `download-${upload.id}` ? 1 : 0.7,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>

                {/* Delete - icon only */}
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
                  title="Delete CSV"
                  style={{
                    padding: "8px",
                    background: "transparent",
                    color: theme.textSecondary,
                    border: `1px solid ${theme.glassBorder}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    opacity: hoveredButton === `delete-${upload.id}` ? 1 : 0.7,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
