import { useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import {
  createExam,
  fetchAllUploads,
  fetchClasses,
  createClass,
  validateGeminiKey,
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

  // API Key management state
  const [apiKey, setApiKey] = useState("");
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [validatingKey, setValidatingKey] = useState(false);

  // Load API key on mount
  useEffect(() => {
    const encrypted = localStorage.getItem("gemini_api_key");
    if (encrypted) {
      try {
        const decrypted = atob(encrypted);
        setApiKey(decrypted);
        setApiKeyValid(true); // Assume valid if stored
      } catch (e) {
        console.error("Failed to decrypt API key");
      }
    }
  }, []);

  // Load classes
  useEffect(() => {
    fetchClasses()
      .then((data) => setClasses(data))
      .catch((e) => console.error("Failed to load classes:", e));
  }, []);

  const handleValidateAndSaveKey = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setValidatingKey(true);
    setError(null);

    try {
      // Use detailed variant for clearer feedback
      const { valid, message } = await (async () => {
        try {
          const mod = await import("../api/client");
          return await mod.validateGeminiKeyDetailed(apiKey.trim());
        } catch (e: any) {
          return {
            valid: false,
            message: e?.message || "Failed to validate key",
          };
        }
      })();

      setApiKeyValid(valid);

      if (valid) {
        // Encrypt and save
        const encrypted = btoa(apiKey);
        localStorage.setItem("gemini_api_key", encrypted);
        setError(null);
      } else {
        setError(message || "API key is invalid. Please check and try again.");
      }
    } catch (e: any) {
      setError("Failed to validate API key. Please try again.");
      setApiKeyValid(false);
    } finally {
      setValidatingKey(false);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setApiKeyValid(null);
  };

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
    <div style={{ display: "grid", gap: 24, color: theme.text }}>
      {/* API Key Management Section */}
      <section
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
            margin: "0 0 12px 0",
            fontSize: 24,
            fontWeight: 700,
            color: theme.crimson,
          }}
        >
          Gemini API Configuration
        </h2>
        <p style={{ margin: "0 0 16px 0", color: theme.textSecondary }}>
          Enable AI-powered exam generation by setting up your free Gemini API
          key.{" "}
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: theme.crimson, textDecoration: "underline" }}
          >
            Get your free key here
          </a>
        </p>
        <div
          style={{
            marginTop: 8,
            color: theme.textSecondary,
            fontSize: 13,
          }}
        >
          Note: If you’re signed into an IU email account in this browser, you
          may encounter an error due to administrator restrictions.
        </div>
        <div
          style={{
            marginTop: 8,
            color: theme.textSecondary,
            fontSize: 13,
          }}
        >
          Disclosure: The linked Gemini Gem may require a paid-enabled personal
          Google account. Visiting with a school-managed account can cause
          permission errors. Use a non-school personal account.
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: theme.text,
              fontWeight: 500,
            }}
          >
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgSolid,
              color: theme.text,
              fontSize: 14,
              fontFamily: "monospace",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleValidateAndSaveKey}
            disabled={!apiKey.trim() || validatingKey}
            style={{
              padding: "10px 24px",
              background:
                apiKey.trim() && !validatingKey ? theme.crimson : theme.border,
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor:
                apiKey.trim() && !validatingKey ? "pointer" : "not-allowed",
              fontWeight: 600,
              boxShadow:
                apiKey.trim() && !validatingKey
                  ? "0 3px 12px rgba(196, 30, 58, 0.3)"
                  : "none",
            }}
          >
            {validatingKey ? "Validating..." : "Save & Validate"}
          </button>

          {apiKeyValid !== null && (
            <div
              style={{
                padding: "8px 16px",
                background: apiKeyValid
                  ? "rgba(40, 167, 69, 0.1)"
                  : "rgba(220, 53, 69, 0.1)",
                color: apiKeyValid ? theme.btnSuccess : theme.btnDanger,
                borderRadius: 8,
                border: `1px solid ${
                  apiKeyValid ? theme.btnSuccess : theme.btnDanger
                }`,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {apiKeyValid ? "Key is valid" : "Invalid key"}
            </div>
          )}

          {apiKey && (
            <button
              onClick={handleClearApiKey}
              style={{
                padding: "8px 16px",
                background: "transparent",
                color: theme.textSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Clear Key
            </button>
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: darkMode
              ? "rgba(212, 166, 80, 0.08)"
              : "rgba(212, 166, 80, 0.1)",
            borderRadius: 8,
            fontSize: 13,
            color: theme.textSecondary,
          }}
        >
          <strong style={{ color: theme.amber }}>Free Tier Limits:</strong> 1M
          tokens/day (~100 exams), 60 requests/hour • No credit card required
        </div>
      </section>

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
          {/* Questions Available Section - Glassmorphism */}
          <section
            style={{
              background: theme.cardBg,
              backdropFilter: theme.glassBlur,
              WebkitBackdropFilter: theme.glassBlur,
              border: `1px solid ${theme.glassBorder}`,
              borderRadius: 12,
              padding: 24,
              boxShadow: theme.glassShadow,
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: 22,
                fontWeight: 700,
                color: theme.crimson,
              }}
            >
              Questions Available in CSV
            </h3>
            <div
              style={{
                fontSize: 18,
                marginBottom: 16,
                fontWeight: 700,
                color: theme.amber,
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
                    color: theme.textSecondary,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
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
                        color: theme.text,
                        paddingLeft: 12,
                      }}
                    >
                      • {QUESTION_TYPE_LABELS[type as QuestionType] || type}:{" "}
                      <strong style={{ color: theme.crimson }}>{count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Mode Selection - Glassmorphism */}
          <section
            style={{
              background: theme.cardBg,
              backdropFilter: theme.glassBlur,
              WebkitBackdropFilter: theme.glassBlur,
              border: `1px solid ${theme.glassBorder}`,
              borderRadius: 12,
              padding: 24,
              boxShadow: theme.glassShadow,
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
                    examMode === "exam" ? theme.crimson : theme.glassBorder
                  }`,
                  borderRadius: 12,
                  background:
                    examMode === "exam"
                      ? darkMode
                        ? "rgba(196, 30, 58, 0.15)"
                        : "rgba(196, 30, 58, 0.1)"
                      : theme.cardBg,
                  backdropFilter: theme.glassBlur,
                  WebkitBackdropFilter: theme.glassBlur,
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow:
                    examMode === "exam"
                      ? theme.glassShadowHover
                      : theme.glassShadow,
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: examMode === "exam" ? theme.crimson : theme.text,
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
                    examMode === "practice" ? theme.amber : theme.glassBorder
                  }`,
                  borderRadius: 12,
                  background:
                    examMode === "practice"
                      ? darkMode
                        ? "rgba(212, 166, 80, 0.15)"
                        : "rgba(212, 166, 80, 0.1)"
                      : theme.cardBg,
                  backdropFilter: theme.glassBlur,
                  WebkitBackdropFilter: theme.glassBlur,
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow:
                    examMode === "practice"
                      ? theme.glassShadowHover
                      : theme.glassShadow,
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: examMode === "practice" ? theme.amber : theme.text,
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
                        onChange={(e) =>
                          setNewClassName(e.target.value.slice(0, 12))
                        }
                        placeholder="Class name (max 12 chars)"
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
                      <div
                        style={{
                          fontSize: 11,
                          color: theme.textSecondary,
                          textAlign: "right",
                        }}
                      >
                        {newClassName.length}/12
                      </div>
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
                            padding: "8px 16px",
                            background: theme.crimson,
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            boxShadow: "0 2px 8px rgba(196, 30, 58, 0.3)",
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
                            padding: "8px 16px",
                            background: theme.textSecondary,
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
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

          {/* Start Exam Button - Glassmorphism */}
          <button
            onClick={onStart}
            disabled={!uploadId || loading || !isCountValid}
            style={{
              padding: "12px 36px",
              background:
                uploadId && !loading && isCountValid
                  ? theme.crimson
                  : theme.border,
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor:
                uploadId && !loading && isCountValid
                  ? "pointer"
                  : "not-allowed",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.2px",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow:
                uploadId && !loading && isCountValid
                  ? "0 2px 8px rgba(196, 30, 58, 0.25)"
                  : "none",
              transform: "translateY(0)",
            }}
            onMouseEnter={(e) => {
              if (uploadId && !loading && isCountValid) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(196, 30, 58, 0.35)";
              }
            }}
            onMouseLeave={(e) => {
              if (uploadId && !loading && isCountValid) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(196, 30, 58, 0.25)";
              }
            }}
          >
            {loading ? "Starting..." : "Start Exam"}
          </button>
        </>
      ) : null}
    </div>
  );
}
