import { useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import {
  createExam,
  fetchAllUploads,
  fetchClasses,
  createClass,
} from "../api/client";
import type {
  QuestionType,
  UploadMetadata,
  UploadSummary,
  ClassSummary,
} from "../types";
import { useExamStore } from "../store/examStore";

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple Choice",
  multi: "Multiple Select",
  short: "Short Answer",
  truefalse: "True/False",
  cloze: "Fill in the Blank",
};

export default function SettingsPage() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const { darkMode, theme } = useOutletContext<{
    darkMode: boolean;
    theme: any;
  }>();
  const uploadId: number | undefined =
    loc?.state?.uploadId || loc?.state?.uploadIds?.[0];
  const metadata: UploadMetadata | undefined = loc?.state?.metadata;
  const uploadDataFromState = loc?.state?.uploadData as
    | UploadSummary
    | undefined;
  const setExam = useExamStore((s) => s.setExam);

  const [count, setCount] = useState(10);
  const [examName, setExamName] = useState("");
  const [examMode, setExamMode] = useState<"exam" | "practice">("exam");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<UploadSummary | null>(null);
  const [classes, setClasses] = useState<ClassSummary[]>([]);

  // Load classes
  useEffect(() => {
    fetchClasses()
      .then((data) => setClasses(data))
      .catch((e) => console.error("Failed to load classes:", e));
  }, []);

  // Fetch upload details to get question type counts
  useEffect(() => {
    if (uploadDataFromState) {
      // Use passed data immediately (preferred)
      setUploadData(uploadDataFromState);
      setLoadingUpload(false);
      const initialCount = Math.min(10, uploadDataFromState.question_count);
      setCount(initialCount);
    } else if (uploadId) {
      // Fetch as fallback
      setLoadingUpload(true);
      fetchAllUploads()
        .then((uploads) => {
          const upload = uploads.find((u) => u.id === uploadId);
          if (upload) {
            setUploadData(upload);
            // Set initial count to min of 10 or available questions
            const initialCount = Math.min(10, upload.question_count);
            setCount(initialCount);
          }
        })
        .catch((e) => {
          console.error("Failed to fetch upload data:", e);
        })
        .finally(() => {
          setLoadingUpload(false);
        });
    }
  }, [uploadId, uploadDataFromState]);

  // Auto-configure from metadata
  useEffect(() => {
    if (metadata) {
      if (metadata.recommended_count) {
        setCount(metadata.recommended_count);
      }
    }
  }, [metadata]);

  const handleCreateNewClass = async () => {
    if (!newClassName.trim()) {
      alert("Please enter a class name");
      return;
    }

    try {
      const newClass = await createClass(
        newClassName,
        newClassDescription || undefined,
        "#007bff"
      );
      // Convert Class to ClassSummary by adding upload_count
      const newClassSummary: ClassSummary = {
        ...newClass,
        upload_count: 0,
      };
      setClasses([...classes, newClassSummary]);
      setSelectedClassId(newClass.id);
      setShowCreateClass(false);
      setNewClassName("");
      setNewClassDescription("");
    } catch (e: any) {
      alert(`Failed to create class: ${e?.message || "Unknown error"}`);
    }
  };

  const availableQuestions = uploadData?.question_count || 0;
  const questionTypeCounts = uploadData?.question_type_counts || {};
  const isCountValid = count > 0 && count <= availableQuestions;

  const onStart = async () => {
    if (!uploadId) return;
    setLoading(true);
    setError(null);
    try {
      const exam = await createExam({
        uploadId,
        includeConceptIds: [],
        questionTypes: [], // Empty array means all types
        count,
      });
      setExam(exam.examId, exam.questions);

      // Navigate based on selected mode
      if (examMode === "practice") {
        nav(`/practice/${exam.examId}`);
      } else {
        nav(`/exam/${exam.examId}`);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16, color: theme.text }}>
      {!uploadId && (
        <div style={{ color: "crimson" }}>
          No upload selected. Go back to Upload.
        </div>
      )}
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

      {loadingUpload ? (
        <div style={{ padding: 24, textAlign: "center", color: theme.text }}>
          Loading CSV details...
        </div>
      ) : uploadData ? (
        <>
          {/* Questions Available Section */}
          <section
            style={{
              backgroundColor: darkMode ? "#1a3a52" : "#e3f2fd",
              border: `1px solid ${darkMode ? "#2a4a62" : "#bbdefb"}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: 20,
                color: darkMode ? "#64b5f6" : "#1976d2",
              }}
            >
              Questions Available in CSV
            </h3>
            <div
              style={{
                fontSize: 16,
                marginBottom: 16,
                fontWeight: "bold",
                color: darkMode ? "#90caf9" : "#1976d2",
              }}
            >
              Total: {availableQuestions} questions
            </div>
            {Object.keys(questionTypeCounts).length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 14,
                    marginBottom: 8,
                    color: darkMode ? "#64b5f6" : "#1976d2",
                    fontWeight: 500,
                  }}
                >
                  Breakdown by Type:
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {Object.entries(questionTypeCounts).map(([type, count]) => (
                    <div
                      key={type}
                      style={{
                        fontSize: 14,
                        color: darkMode ? "#90caf9" : "#1565c0",
                        paddingLeft: 12,
                      }}
                    >
                      • {QUESTION_TYPE_LABELS[type as QuestionType] || type}:{" "}
                      {count}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Mode Selection */}
          <section
            style={{
              backgroundColor: darkMode ? "#2a3a4a" : "#e8f4f8",
              border: `1px solid ${darkMode ? "#3a4a5a" : "#b3d9e6"}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: 20,
                color: theme.text,
              }}
            >
              Select Mode
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <button
                onClick={() => setExamMode("exam")}
                style={{
                  padding: "20px",
                  border: `2px solid ${
                    examMode === "exam" ? "#dc3545" : theme.border
                  }`,
                  borderRadius: 8,
                  backgroundColor:
                    examMode === "exam"
                      ? darkMode
                        ? "#3d1a1a"
                        : "#fff0f0"
                      : theme.cardBg,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 8,
                    color: examMode === "exam" ? "#dc3545" : theme.text,
                  }}
                >
                  📝 Exam Mode
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: theme.textSecondary,
                    lineHeight: 1.5,
                  }}
                >
                  Take all questions at once, submit at the end for grading
                </div>
              </button>
              <button
                onClick={() => setExamMode("practice")}
                style={{
                  padding: "20px",
                  border: `2px solid ${
                    examMode === "practice" ? "#007bff" : theme.border
                  }`,
                  borderRadius: 8,
                  backgroundColor:
                    examMode === "practice"
                      ? darkMode
                        ? "#1a2a3a"
                        : "#f0f8ff"
                      : theme.cardBg,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 8,
                    color: examMode === "practice" ? "#007bff" : theme.text,
                  }}
                >
                  🎯 Practice Mode
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: theme.textSecondary,
                    lineHeight: 1.5,
                  }}
                >
                  One question at a time with immediate feedback
                </div>
              </button>
            </div>
          </section>

          {/* Exam Configuration */}
          <section>
            <h3 style={{ margin: "0 0 12px 0", color: theme.text }}>
              {examMode === "practice" ? "Practice " : "Exam "}Details
              (Optional)
            </h3>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 4,
                    fontWeight: "bold",
                    color: theme.text,
                  }}
                >
                  Exam Name
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="Enter exam name (optional)"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 4,
                    fontSize: 14,
                    backgroundColor: theme.cardBg,
                    color: theme.text,
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 4,
                    fontWeight: "bold",
                    color: theme.text,
                  }}
                >
                  Assign to Class (Optional)
                </label>
                <select
                  value={selectedClassId || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "create_new") {
                      setShowCreateClass(true);
                    } else {
                      setSelectedClassId(value ? parseInt(value) : null);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 4,
                    fontSize: 14,
                    backgroundColor: theme.cardBg,
                    color: theme.text,
                  }}
                >
                  <option value="">No class (unassigned)</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                  <option value="create_new">+ Create New Class...</option>
                </select>

                {/* Inline Class Creation */}
                {showCreateClass && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 16,
                      backgroundColor: darkMode ? "#2a3a4a" : "#f0f8ff",
                      border: `1px solid ${theme.border}`,
                      borderRadius: 6,
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: 14,
                        color: theme.text,
                      }}
                    >
                      Create New Class
                    </h4>
                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        type="text"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Class name (e.g., CPA Review)"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: `1px solid ${theme.border}`,
                          borderRadius: 4,
                          fontSize: 13,
                          backgroundColor: theme.cardBg,
                          color: theme.text,
                        }}
                      />
                      <input
                        type="text"
                        value={newClassDescription}
                        onChange={(e) => setNewClassDescription(e.target.value)}
                        placeholder="Description (optional)"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: `1px solid ${theme.border}`,
                          borderRadius: 4,
                          fontSize: 13,
                          backgroundColor: theme.cardBg,
                          color: theme.text,
                        }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={handleCreateNewClass}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Create
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateClass(false);
                            setNewClassName("");
                            setNewClassDescription("");
                          }}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Question Count */}
          <section>
            <h3 style={{ margin: "0 0 12px 0", color: theme.text }}>
              How many questions for this exam?
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="number"
                min={1}
                max={availableQuestions}
                value={count}
                onChange={(e) => {
                  const val = parseInt(e.target.value || "1");
                  setCount(Math.min(val, availableQuestions));
                }}
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${
                    isCountValid
                      ? theme.border
                      : darkMode
                      ? "#ef5350"
                      : "#dc3545"
                  }`,
                  borderRadius: "4px",
                  fontSize: "15px",
                  width: "120px",
                  backgroundColor: theme.cardBg,
                  color: theme.text,
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  color: theme.textSecondary,
                }}
              >
                (max: {availableQuestions})
              </span>
            </div>
            {!isCountValid && (
              <div
                style={{
                  marginTop: 8,
                  color: darkMode ? "#ef5350" : "#dc3545",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                ⚠️ You cannot request more than {availableQuestions} questions
              </div>
            )}
            {Object.keys(questionTypeCounts).length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  color: theme.text,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: theme.textSecondary }}>
                  Available types:
                </span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.keys(questionTypeCounts).map((type) => (
                    <span
                      key={type}
                      style={{
                        padding: "4px 10px",
                        backgroundColor: darkMode ? "#2a4a62" : "#e3f2fd",
                        color: darkMode ? "#90caf9" : "#1976d2",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {QUESTION_TYPE_LABELS[type as QuestionType]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Start Exam Button */}
          <button
            onClick={onStart}
            disabled={!uploadId || loading || !isCountValid}
            style={{
              padding: "12px 24px",
              backgroundColor:
                uploadId && !loading && isCountValid ? "#dc3545" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor:
                uploadId && !loading && isCountValid
                  ? "pointer"
                  : "not-allowed",
              fontSize: "16px",
              fontWeight: "bold",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (uploadId && !loading && isCountValid) {
                e.currentTarget.style.filter = "brightness(0.85)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "brightness(1)";
            }}
          >
            {loading ? "Starting..." : "Start Exam"}
          </button>
        </>
      ) : null}
    </div>
  );
}
