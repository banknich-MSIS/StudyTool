import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchClasses,
  assignUploadToClass,
  removeUploadFromClass,
  createClass,
} from "../api/client";
import type { ClassSummary } from "../types";

interface ClassTagSelectorProps {
  uploadId: number;
  currentTags: string[];
  onUpdate: () => void;
  darkMode: boolean;
  theme: any;
}

export default function ClassTagSelector({
  uploadId,
  currentTags,
  onUpdate,
  darkMode,
  theme,
}: ClassTagSelectorProps) {
  const navigate = useNavigate();
  const [allClasses, setAllClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const CLASS_COLORS = [
    { name: "Blue", value: "#007bff", darkBg: "#1a3a52", darkText: "#64b5f6" },
    { name: "Green", value: "#28a745", darkBg: "#1a3d1a", darkText: "#66bb6a" },
    { name: "Red", value: "#dc3545", darkBg: "#3d1a1a", darkText: "#ef5350" },
    {
      name: "Yellow",
      value: "#ffc107",
      darkBg: "#4d4520",
      darkText: "#ffb74d",
    },
    {
      name: "Purple",
      value: "#6f42c1",
      darkBg: "#2a1a3d",
      darkText: "#ba68c8",
    },
    {
      name: "Orange",
      value: "#fd7e14",
      darkBg: "#3d2a1a",
      darkText: "#ff9800",
    },
    { name: "Teal", value: "#20c997", darkBg: "#1a3d35", darkText: "#4db6ac" },
    { name: "Pink", value: "#e83e8c", darkBg: "#3d1a30", darkText: "#ec407a" },
    {
      name: "Indigo",
      value: "#6610f2",
      darkBg: "#2a1a3d",
      darkText: "#7c4dff",
    },
    { name: "Cyan", value: "#17a2b8", darkBg: "#1a353d", darkText: "#4fc3f7" },
    { name: "Brown", value: "#795548", darkBg: "#2a2220", darkText: "#a1887f" },
    { name: "Gray", value: "#6c757d", darkBg: "#2d2d2d", darkText: "#b0bec5" },
  ];

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await fetchClasses();
      setAllClasses(data);
    } catch (e) {
      console.error("Failed to load classes:", e);
    }
  };

  const handleToggleClass = async (classId: number, className: string) => {
    setLoading(true);
    try {
      if (currentTags.includes(className)) {
        // Remove
        await removeUploadFromClass(uploadId, classId);
      } else {
        // Add
        await assignUploadToClass(uploadId, classId);
      }
      onUpdate();
    } catch (e: any) {
      alert(`Failed to update class: ${e?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const newCls = await createClass(
        newName.trim(),
        newDesc || undefined,
        newColor
      );
      // Assign the current upload to the new class
      await assignUploadToClass(uploadId, newCls.id);
      await loadClasses();
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      onUpdate();
    } catch (e: any) {
      alert(`Failed to create class: ${e?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minWidth: 220 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 8px",
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: theme.textSecondary,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Classes
        </span>
        <button
          onClick={() => navigate("/classes")}
          title="Go to classes page"
          disabled={loading}
          onMouseEnter={() => !loading && setHoveredButton("createClass")}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            padding: 4,
            borderRadius: 6,
            border: `1px solid ${theme.glassBorder}`,
            background:
              hoveredButton === "createClass" ? theme.navHover : "transparent",
            cursor: loading ? "not-allowed" : "pointer",
            color: theme.text,
          }}
        >
          +
        </button>
      </div>

      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {allClasses.length === 0 ? (
          <div
            style={{
              padding: 12,
              color: theme.textSecondary,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            No classes available.
          </div>
        ) : (
          allClasses.map((cls) => {
            const isSelected = currentTags.includes(cls.name);
            return (
              <div
                key={cls.id}
                onClick={() => handleToggleClass(cls.id, cls.name)}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  borderBottom: `1px solid ${theme.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: isSelected
                    ? darkMode
                      ? "#2a4a62"
                      : "#e3f2fd"
                    : theme.cardBg,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      theme.navHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      theme.cardBg;
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  style={{ cursor: "pointer" }}
                />
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: cls.color || "#007bff",
                    marginRight: 4,
                  }}
                />
                <span style={{ fontSize: 14, color: theme.text }}>
                  {cls.name}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
