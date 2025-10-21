import { useEffect, useState } from "react";
import {
  fetchClasses,
  assignUploadToClass,
  removeUploadFromClass,
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        style={{
          padding: "6px 12px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 12,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Loading..." : "Assign Classes"}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 4,
              backgroundColor: theme.modalBg,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              minWidth: 200,
              maxHeight: 300,
              overflowY: "auto",
              zIndex: 1000,
            }}
          >
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
                <br />
                Create one first!
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
                        e.currentTarget.style.backgroundColor = theme.navHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = theme.cardBg;
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
        </>
      )}
    </div>
  );
}
