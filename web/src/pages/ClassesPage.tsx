import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  fetchClasses,
  createClass,
  updateClass,
  deleteClass,
} from "../api/client";
import type { ClassSummary } from "../types";

const CLASS_COLORS = [
  { name: "Blue", value: "#007bff", darkBg: "#1a3a52", darkText: "#64b5f6" },
  { name: "Green", value: "#28a745", darkBg: "#1a3d1a", darkText: "#66bb6a" },
  { name: "Red", value: "#dc3545", darkBg: "#3d1a1a", darkText: "#ef5350" },
  { name: "Yellow", value: "#ffc107", darkBg: "#4d4520", darkText: "#ffb74d" },
  { name: "Purple", value: "#6f42c1", darkBg: "#2a1a3d", darkText: "#ba68c8" },
  { name: "Orange", value: "#fd7e14", darkBg: "#3d2a1a", darkText: "#ff9800" },
  { name: "Teal", value: "#20c997", darkBg: "#1a3d35", darkText: "#4db6ac" },
  { name: "Pink", value: "#e83e8c", darkBg: "#3d1a30", darkText: "#ec407a" },
  { name: "Indigo", value: "#6610f2", darkBg: "#2a1a3d", darkText: "#7c4dff" },
  { name: "Cyan", value: "#17a2b8", darkBg: "#1a353d", darkText: "#4fc3f7" },
  { name: "Brown", value: "#795548", darkBg: "#2a2220", darkText: "#a1887f" },
  { name: "Gray", value: "#6c757d", darkBg: "#2d2d2d", darkText: "#b0bec5" },
];

export default function ClassesPage() {
  const navigate = useNavigate();
  const { darkMode, theme } = useOutletContext<{
    darkMode: boolean;
    theme: any;
  }>();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSummary | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#007bff");
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await fetchClasses();
      setClasses(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!formName.trim()) {
      alert("Please enter a class name");
      return;
    }

    try {
      await createClass(formName, formDescription || undefined, formColor);
      setShowCreateModal(false);
      setFormName("");
      setFormDescription("");
      setFormColor("#007bff");
      loadClasses();
    } catch (e: any) {
      alert(`Failed to create class: ${e?.message || "Unknown error"}`);
    }
  };

  const handleEditClass = async () => {
    if (!editingClass || !formName.trim()) {
      alert("Please enter a class name");
      return;
    }

    try {
      await updateClass(editingClass.id, formName, formDescription, formColor);
      setShowEditModal(false);
      setEditingClass(null);
      setFormName("");
      setFormDescription("");
      setFormColor("#007bff");
      loadClasses();
    } catch (e: any) {
      alert(`Failed to update class: ${e?.message || "Unknown error"}`);
    }
  };

  const handleDeleteClass = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the class "${name}"?`)) {
      return;
    }

    try {
      await deleteClass(id);
      loadClasses();
    } catch (e: any) {
      alert(`Failed to delete class: ${e?.message || "Unknown error"}`);
    }
  };

  const openEditModal = (cls: ClassSummary) => {
    setEditingClass(cls);
    setFormName(cls.name);
    setFormDescription(cls.description || "");
    setFormColor(cls.color || "#007bff");
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ color: theme.text }}>Loading classes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: theme.crimson, marginBottom: 12 }}>
          Error: {error}
        </div>
        <button
          onClick={loadClasses}
          onMouseEnter={() => setHoveredButton("retry")}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            padding: "10px 20px",
            background:
              hoveredButton === "retry" ? theme.crimsonDark : theme.crimson,
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.3s ease",
            boxShadow:
              hoveredButton === "retry"
                ? "0 6px 20px rgba(196, 30, 58, 0.4)"
                : "0 3px 12px rgba(196, 30, 58, 0.3)",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 28, color: theme.text }}>
          Manage Classes
        </h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: "10px 24px",
              background: theme.crimson,
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.2px",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 2px 8px rgba(196, 30, 58, 0.25)",
              transform:
                hoveredButton === "createNew" ? "translateY(-1px)" : "none",
            }}
            onMouseEnter={(e) => {
              setHoveredButton("createNew");
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(196, 30, 58, 0.35)";
            }}
            onMouseLeave={(e) => {
              setHoveredButton(null);
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(196, 30, 58, 0.25)";
            }}
          >
            Create New Class
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 24px",
              background: theme.amber,
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.2px",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 2px 8px rgba(212, 166, 80, 0.25)",
              transform:
                hoveredButton === "backToDashboard"
                  ? "translateY(-1px)"
                  : "none",
            }}
            onMouseEnter={(e) => {
              setHoveredButton("backToDashboard");
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(212, 166, 80, 0.35)";
            }}
            onMouseLeave={(e) => {
              setHoveredButton(null);
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(212, 166, 80, 0.25)";
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Classes Grid */}
      {classes.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          {classes.map((cls) => {
            const classColor = cls.color || "#007bff";
            return (
              <div
                key={cls.id}
                style={{
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  padding: 20,
                  backgroundColor: theme.cardBg,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: classColor,
                    border: "2px solid white",
                  }}
                  title={`Class color: ${classColor}`}
                />
                <h3
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: 20,
                    color: theme.text,
                  }}
                >
                  {cls.name}
                </h3>
                {cls.description && (
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      color: theme.textSecondary,
                      fontSize: 14,
                    }}
                  >
                    {cls.description}
                  </p>
                )}
                <div
                  style={{
                    fontSize: 14,
                    color: theme.textSecondary,
                    marginBottom: 16,
                  }}
                >
                  {cls.upload_count} CSV{cls.upload_count !== 1 ? "s" : ""}{" "}
                  assigned
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => openEditModal(cls)}
                    onMouseEnter={() => setHoveredButton(`edit-${cls.id}`)}
                    onMouseLeave={() => setHoveredButton(null)}
                    style={{
                      flex: 1,
                      padding: "8px 14px",
                      background:
                        hoveredButton === `edit-${cls.id}`
                          ? "rgba(196, 30, 58, 0.15)"
                          : "rgba(196, 30, 58, 0.08)",
                      color: theme.crimson,
                      border: `1px solid ${theme.glassBorder}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      transition: "0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClass(cls.id, cls.name)}
                    onMouseEnter={() => setHoveredButton(`delete-${cls.id}`)}
                    onMouseLeave={() => setHoveredButton(null)}
                    style={{
                      flex: 1,
                      padding: "8px 14px",
                      background:
                        hoveredButton === `delete-${cls.id}`
                          ? "rgba(196, 30, 58, 0.15)"
                          : "rgba(196, 30, 58, 0.08)",
                      color: theme.crimson,
                      border: `1px solid ${theme.glassBorder}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      transition: "0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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
            No classes yet
          </h3>
          <p style={{ margin: "0 0 16px 0", color: theme.textSecondary }}>
            Create your first class to organize your study materials.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            onMouseEnter={() => setHoveredButton("createNewEmpty")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 15,
              filter:
                hoveredButton === "createNewEmpty"
                  ? "brightness(0.85)"
                  : "brightness(1)",
              transition: "all 0.2s ease",
            }}
          >
            Create New Class
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: theme.modalBg,
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
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
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., CPA, ITS, APA, BUSA"
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
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of this class"
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
                    onClick={() => setFormColor(colorOption.value)}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: 8,
                      backgroundColor: colorOption.value,
                      border:
                        formColor === colorOption.value
                          ? "3px solid white"
                          : "1px solid #ccc",
                      cursor: "pointer",
                      boxShadow:
                        formColor === colorOption.value
                          ? "0 0 8px rgba(0,0,0,0.3)"
                          : "none",
                    }}
                    title={colorOption.name}
                  />
                ))}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: theme.textSecondary,
                }}
              >
                Selected:{" "}
                {CLASS_COLORS.find((c) => c.value === formColor)?.name}
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
                  setShowCreateModal(false);
                  setFormName("");
                  setFormDescription("");
                  setFormColor("#007bff");
                }}
                onMouseEnter={() => setHoveredButton("cancelCreate")}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  filter:
                    hoveredButton === "cancelCreate"
                      ? "brightness(0.85)"
                      : "brightness(1)",
                  transition: "all 0.2s ease",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                onMouseEnter={() => setHoveredButton("createClass")}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  filter:
                    hoveredButton === "createClass"
                      ? "brightness(0.85)"
                      : "brightness(1)",
                  transition: "all 0.2s ease",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingClass && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: theme.modalBg,
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", color: theme.text }}>
              Edit Class
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
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., CPA, ITS, APA, BUSA"
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
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of this class"
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
                    onClick={() => setFormColor(colorOption.value)}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: 8,
                      backgroundColor: colorOption.value,
                      border:
                        formColor === colorOption.value
                          ? "3px solid white"
                          : "1px solid #ccc",
                      cursor: "pointer",
                      boxShadow:
                        formColor === colorOption.value
                          ? "0 0 8px rgba(0,0,0,0.3)"
                          : "none",
                    }}
                    title={colorOption.name}
                  />
                ))}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: theme.textSecondary,
                }}
              >
                Selected:{" "}
                {CLASS_COLORS.find((c) => c.value === formColor)?.name}
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
                  setShowEditModal(false);
                  setEditingClass(null);
                  setFormName("");
                  setFormDescription("");
                  setFormColor("#007bff");
                }}
                onMouseEnter={() => setHoveredButton("cancelEdit")}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  filter:
                    hoveredButton === "cancelEdit"
                      ? "brightness(0.85)"
                      : "brightness(1)",
                  transition: "all 0.2s ease",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditClass}
                onMouseEnter={() => setHoveredButton("saveEdit")}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  filter:
                    hoveredButton === "saveEdit"
                      ? "brightness(0.85)"
                      : "brightness(1)",
                  transition: "all 0.2s ease",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
