import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  generateExamFromFiles,
  fetchClasses,
  getExam,
  createClass,
} from "../api/client";
import { useExamStore } from "../store/examStore";
import type { ClassSummary } from "../types";

const CLASS_COLORS = [
  { name: "Blue", value: "#007bff" },
  { name: "Green", value: "#28a745" },
  { name: "Red", value: "#dc3545" },
  { name: "Yellow", value: "#ffc107" },
  { name: "Purple", value: "#6f42c1" },
  { name: "Orange", value: "#fd7e14" },
  { name: "Teal", value: "#20c997" },
  { name: "Pink", value: "#e83e8c" },
  { name: "Indigo", value: "#6610f2" },
  { name: "Cyan", value: "#17a2b8" },
  { name: "Brown", value: "#795548" },
  { name: "Gray", value: "#6c757d" },
];

export default function SmartExamCreator() {
  const navigate = useNavigate();
  const setExam = useExamStore((s) => s.setExam);
  const { darkMode, theme } = useOutletContext<{
    darkMode: boolean;
    theme: any;
  }>();

  const [files, setFiles] = useState<File[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [questionTypes, setQuestionTypes] = useState<string[]>([
    "mcq",
    "short",
  ]);
  const [focusConcepts, setFocusConcepts] = useState("");
  const [examName, setExamName] = useState("");
  const [examMode, setExamMode] = useState<"exam" | "practice">("exam");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [newClassColor, setNewClassColor] = useState("#007bff");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Get stored API key
  const getStoredApiKey = () => {
    const encrypted = localStorage.getItem("gemini_api_key");
    return encrypted ? atob(encrypted) : null;
  };

  const hasApiKey = !!getStoredApiKey();

  // Load classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await fetchClasses();
        setClasses(data);
      } catch (e) {
        console.error("Failed to load classes:", e);
      }
    };
    loadClasses();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const toggleQuestionType = (type: string) => {
    if (questionTypes.includes(type)) {
      setQuestionTypes(questionTypes.filter((t) => t !== type));
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  const generateExam = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      navigate("/settings");
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least one file");
      return;
    }

    if (questionTypes.length === 0) {
      setError("Please select at least one question type");
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Prepare files
      setProgressMessage("Preparing files...");
      setProgress(10);
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      // Step 2: Upload and process
      setProgressMessage("Uploading and extracting content...");
      setProgress(30);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 3: Generate with AI
      setProgressMessage("Generating exam with AI (this may take a minute)...");
      setProgress(50);

      const response = await generateExamFromFiles({
        files: formData,
        questionCount,
        difficulty,
        questionTypes,
        focusConcepts: focusConcepts
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c.length > 0),
        examName: examName || undefined,
        examMode,
        selectedClassId: selectedClassId || undefined,
        apiKey,
      });

      setProgressMessage("Creating exam in database...");
      setProgress(90);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setProgress(100);
      setProgressMessage("Loading exam data...");

      // Fetch exam data and load into store
      const examData = await getExam(response.exam_id);
      setExam(response.exam_id, examData.questions);

      setProgressMessage("Done! Starting exam...");

      // Navigate directly to exam or practice mode
      setTimeout(() => {
        if (examMode === "practice") {
          navigate(`/practice/${response.exam_id}`);
        } else {
          navigate(`/exam/${response.exam_id}`);
        }
      }, 500);
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ||
          e?.message ||
          "Failed to generate exam. Please try again."
      );
      setProgress(0);
      setProgressMessage("");
    } finally {
      setLoading(false);
    }
  };

  const questionTypeOptions = [
    { value: "mcq", label: "Multiple Choice" },
    { value: "short", label: "Short Answer" },
    { value: "truefalse", label: "True/False" },
    { value: "cloze", label: "Fill in the Blank" },
  ];

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div>
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: 32,
            fontWeight: 700,
            color: theme.crimson,
            letterSpacing: "-0.8px",
          }}
        >
          AI Exam Creator
        </h1>
        <p
          style={{
            margin: "0 0 16px 0",
            color: theme.textSecondary,
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          Fast and streamlined exam generation. Upload files, configure
          settings, and generate—no conversation needed.
        </p>
        <p
          style={{
            margin: 0,
            color: theme.text,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <strong>Prefer a guided experience?</strong> Try the{" "}
          <a
            href="https://gemini.google.com/gem/582bd1e1e16d"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: theme.crimson, textDecoration: "underline" }}
          >
            Gemini Gem
          </a>{" "}
          for a consultative, interactive approach with Q&A to refine your exam.
        </p>
      </div>

      {/* API Key Warning */}
      {!hasApiKey && (
        <div
          style={{
            padding: 20,
            background: darkMode
              ? "rgba(212, 166, 80, 0.1)"
              : "rgba(212, 166, 80, 0.15)",
            backdropFilter: theme.glassBlur,
            WebkitBackdropFilter: theme.glassBlur,
            border: `2px solid ${theme.amber}`,
            borderRadius: 12,
            boxShadow: theme.glassShadow,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: theme.amber,
              marginBottom: 8,
            }}
          >
            API Key Required
          </div>
          <p style={{ margin: "0 0 12px 0", color: theme.text }}>
            You need to set up your free Gemini API key before generating exams.
          </p>
          <button
            onClick={() => navigate("/settings")}
            style={{
              padding: "10px 20px",
              background: theme.amber,
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(212, 166, 80, 0.3)",
            }}
          >
            Go to Settings
          </button>
        </div>
      )}

      {/* File Upload Section */}
      <div
        style={{
          background: theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.glassBorder}`,
          boxShadow: theme.glassShadow,
        }}
      >
        <h2
          style={{
            margin: "0 0 16px 0",
            fontSize: 20,
            fontWeight: 600,
            color: theme.crimson,
            letterSpacing: "-0.3px",
          }}
        >
          Upload Study Materials
        </h2>
        <p
          style={{
            margin: "0 0 16px 0",
            color: theme.textSecondary,
            fontSize: 14,
          }}
        >
          Supported: PDF, PowerPoint, Word, Images, Video, Excel, Text
        </p>

        <input
          type="file"
          multiple
          accept=".pdf,.pptx,.ppt,.docx,.doc,.png,.jpg,.jpeg,.txt,.md,.mp4,.mov,.avi,.xlsx,.xls,.csv"
          onChange={handleFileSelect}
          style={{
            marginBottom: 16,
            color: theme.text,
            padding: 12,
            borderRadius: 8,
            border: `2px dashed ${theme.glassBorder}`,
            width: "100%",
            backgroundColor: theme.cardBgSolid,
          }}
        />

        {files.length > 0 && (
          <div style={{ display: "grid", gap: 8 }}>
            {files.map((file, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 12,
                  background: "rgba(196, 30, 58, 0.05)",
                  borderRadius: 8,
                  border: `1px solid ${theme.glassBorder}`,
                }}
              >
                <div>
                  <div style={{ color: theme.text, fontWeight: 500 }}>
                    {file.name}
                  </div>
                  <div style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  style={{
                    padding: "4px 12px",
                    background: "transparent",
                    color: theme.btnDanger,
                    border: `1px solid ${theme.btnDanger}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration Section */}
      <div
        style={{
          background: theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.glassBorder}`,
          boxShadow: theme.glassShadow,
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            fontSize: 20,
            fontWeight: 600,
            color: theme.crimson,
            letterSpacing: "-0.3px",
          }}
        >
          Exam Configuration
        </h2>

        <div style={{ display: "grid", gap: 20 }}>
          {/* Row 1: Question Count + Difficulty */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            {/* Question Count */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: theme.text,
                  fontWeight: 500,
                }}
              >
                Number of Questions
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                min={5}
                max={100}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSolid,
                  color: theme.text,
                  fontSize: 16,
                }}
              />
            </div>

            {/* Difficulty */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: theme.text,
                  fontWeight: 500,
                }}
              >
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as "easy" | "medium" | "hard")
                }
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSolid,
                  color: theme.text,
                  fontSize: 16,
                }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Question Types */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: theme.text,
                fontWeight: 500,
              }}
            >
              Question Types (select at least one)
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {questionTypeOptions.map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: 12,
                    background: questionTypes.includes(option.value)
                      ? "rgba(196, 30, 58, 0.1)"
                      : "transparent",
                    border: `1px solid ${theme.glassBorder}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={questionTypes.includes(option.value)}
                    onChange={() => toggleQuestionType(option.value)}
                    style={{ marginRight: 12, cursor: "pointer" }}
                  />
                  <span style={{ color: theme.text }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Focus Concepts */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: theme.text,
                fontWeight: 500,
              }}
            >
              Focus Concepts (optional)
            </label>
            <input
              type="text"
              value={focusConcepts}
              onChange={(e) => setFocusConcepts(e.target.value)}
              placeholder="e.g., enterprise architecture, statistics, business systems"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBgSolid,
                color: theme.text,
                fontSize: 14,
              }}
            />
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: 12,
                color: theme.textSecondary,
              }}
            >
              Comma-separated list of topics to emphasize
            </p>
          </div>

          {/* Exam Name */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: theme.text,
                fontWeight: 500,
              }}
            >
              Exam Name (optional)
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g., ITS Final Study Set"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBgSolid,
                color: theme.text,
                fontSize: 14,
              }}
            />
          </div>

          {/* Row: Exam Mode + Class Assignment */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            {/* Exam Mode */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: theme.text,
                  fontWeight: 500,
                }}
              >
                Mode
              </label>
              <select
                value={examMode}
                onChange={(e) =>
                  setExamMode(e.target.value as "exam" | "practice")
                }
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSolid,
                  color: theme.text,
                  fontSize: 14,
                }}
              >
                <option value="exam">
                  Exam Mode (timed, submit for grading)
                </option>
                <option value="practice">
                  Practice Mode (untimed, see answers)
                </option>
              </select>
            </div>

            {/* Class Assignment */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <label
                  style={{
                    color: theme.text,
                    fontWeight: 500,
                  }}
                >
                  Assign to Class (optional)
                </label>
                <button
                  onClick={() => setShowCreateClassModal(true)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    background: darkMode
                      ? "rgba(194, 155, 74, 0.1)"
                      : "rgba(212, 166, 80, 0.15)",
                    cursor: "pointer",
                    color: theme.text,
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                  title="Create new class"
                >
                  +
                </button>
              </div>
              <select
                value={selectedClassId || ""}
                onChange={(e) =>
                  setSelectedClassId(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSolid,
                  color: theme.text,
                  fontSize: 14,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${encodeURIComponent(
                    theme.textSecondary
                  )}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: "35px",
                }}
              >
                <option value="">None</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Creation Modal */}
          {showCreateClassModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2000,
                backdropFilter: "blur(12px)",
              }}
              onClick={() => setShowCreateClassModal(false)}
            >
              <div
                style={{
                  backgroundColor: theme.modalBg,
                  backdropFilter: theme.glassBlur,
                  WebkitBackdropFilter: theme.glassBlur,
                  borderRadius: 12,
                  padding: 24,
                  maxWidth: 500,
                  width: "90%",
                  maxHeight: "80vh",
                  overflow: "auto",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                  border: `1px solid ${theme.glassBorder}`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ margin: "0 0 20px 0", color: theme.text }}>
                  Create New Class
                </h3>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: "bold",
                      fontSize: 14,
                      color: theme.text,
                    }}
                  >
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g., ITS, CPA, AiDD"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1px solid ${theme.border}`,
                      borderRadius: 4,
                      fontSize: 14,
                      boxSizing: "border-box",
                      backgroundColor: theme.cardBg,
                      color: theme.text,
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: "bold",
                      fontSize: 14,
                      color: theme.text,
                    }}
                  >
                    Description (optional)
                  </label>
                  <textarea
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    placeholder="Brief description"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1px solid ${theme.border}`,
                      borderRadius: 4,
                      fontSize: 14,
                      resize: "vertical",
                      boxSizing: "border-box",
                      backgroundColor: theme.cardBg,
                      color: theme.text,
                    }}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: "bold",
                      fontSize: 14,
                      color: theme.text,
                    }}
                  >
                    Color
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: 8,
                    }}
                  >
                    {CLASS_COLORS.map((colorOption) => (
                      <button
                        key={colorOption.value}
                        onClick={() => setNewClassColor(colorOption.value)}
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          borderRadius: 8,
                          backgroundColor: colorOption.value,
                          border:
                            newClassColor === colorOption.value
                              ? "3px solid white"
                              : "1px solid #ccc",
                          cursor: "pointer",
                          boxShadow:
                            newClassColor === colorOption.value
                              ? "0 0 8px rgba(0,0,0,0.3)"
                              : "none",
                        }}
                        title={colorOption.name}
                      />
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => {
                      setShowCreateClassModal(false);
                      setNewClassName("");
                      setNewClassDescription("");
                      setNewClassColor("#007bff");
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                    style={{
                      padding: "8px 16px",
                      border: `1px solid ${theme.border}`,
                      borderRadius: 6,
                      background: "transparent",
                      color: theme.text,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!newClassName.trim()) {
                        alert("Please enter a class name");
                        return;
                      }
                      try {
                        const newClass = await createClass(
                          newClassName,
                          newClassDescription || undefined,
                          newClassColor
                        );
                        setShowCreateClassModal(false);
                        setNewClassName("");
                        setNewClassDescription("");
                        setNewClassColor("#007bff");
                        // Add the new class to the list
                        setClasses([...classes, newClass]);
                        // Auto-select the new class
                        setSelectedClassId(newClass.id);
                      } catch (e: any) {
                        alert(
                          `Failed to create class: ${
                            e?.message || "Unknown error"
                          }`
                        );
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = "brightness(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = "brightness(1)";
                    }}
                    style={{
                      padding: "8px 16px",
                      background: theme.crimson,
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: 16,
            background: darkMode
              ? "rgba(220, 53, 69, 0.1)"
              : "rgba(220, 53, 69, 0.08)",
            backdropFilter: theme.glassBlur,
            WebkitBackdropFilter: theme.glassBlur,
            borderRadius: 10,
            border: `1px solid ${theme.btnDanger}`,
            color: theme.btnDanger,
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      {/* Generate Button */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={generateExam}
          disabled={!hasApiKey || files.length === 0 || loading}
          onMouseEnter={() =>
            !loading &&
            hasApiKey &&
            files.length > 0 &&
            setHoveredButton("generate")
          }
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            padding: "12px 32px",
            background:
              hasApiKey && files.length > 0 && !loading
                ? theme.crimson
                : theme.border,
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor:
              hasApiKey && files.length > 0 && !loading
                ? "pointer"
                : "not-allowed",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.2px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow:
              hasApiKey && files.length > 0 && !loading
                ? "0 2px 8px rgba(196, 30, 58, 0.25)"
                : "none",
            transform:
              hoveredButton === "generate" ? "translateY(-1px)" : "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "0 auto",
          }}
          onMouseEnter={(e) => {
            if (hasApiKey && files.length > 0 && !loading) {
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(196, 30, 58, 0.35)";
              e.currentTarget.style.filter = "brightness(1.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (hasApiKey && files.length > 0 && !loading) {
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(196, 30, 58, 0.25)";
              e.currentTarget.style.filter = "brightness(1)";
            }
          }}
        >
          {loading ? (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2 A10 10 0 0 1 22 12" />
              </svg>
              Generating...
            </>
          ) : (
            "Generate Exam with AI"
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div
          style={{
            background: theme.cardBg,
            backdropFilter: theme.glassBlur,
            WebkitBackdropFilter: theme.glassBlur,
            borderRadius: 12,
            padding: 20,
            border: `1px solid ${theme.glassBorder}`,
            boxShadow: theme.glassShadow,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                height: 8,
                background: theme.border,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${theme.crimson}, ${theme.crimsonLight})`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
          <p
            style={{
              margin: 0,
              textAlign: "center",
              color: theme.text,
              fontSize: 14,
            }}
          >
            {progressMessage}
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
