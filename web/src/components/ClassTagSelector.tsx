import { useEffect, useState } from "react";
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
  const [allClasses, setAllClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("#007bff");

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
          onClick={() => setShowCreate(true)}
          title="Create class"
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

      {showCreate && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value.slice(0, 12))}
              placeholder="Name (max 12 chars)"
              style={{
                width: "100%",
                padding: "6px 10px",
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
              {newName.length}/12
            </div>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional: short description"
              style={{
                width: "100%",
                padding: "6px 10px",
                border: `1px solid ${theme.border}`,
                borderRadius: 4,
                fontSize: 13,
                backgroundColor: theme.cardBg,
                color: theme.text,
              }}
            />
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: "bold",
                fontSize: 12,
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
                  onClick={() => setNewColor(colorOption.value)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 8,
                    backgroundColor: colorOption.value,
                    border:
                      newColor === colorOption.value
                        ? "3px solid white"
                        : "1px solid #ccc",
                    cursor: "pointer",
                    boxShadow:
                      newColor === colorOption.value
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
              Selected: {CLASS_COLORS.find((c) => c.value === newColor)?.name}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || loading}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: theme.crimson,
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor:
                    !newName.trim() || loading ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                  setNewDesc("");
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: theme.textSecondary,
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
