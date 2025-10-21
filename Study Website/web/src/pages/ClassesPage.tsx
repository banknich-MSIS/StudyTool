import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchClasses,
  createClass,
  updateClass,
  deleteClass,
} from "../api/client";
import type { ClassSummary } from "../types";

export default function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSummary | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

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
      await createClass(formName, formDescription || undefined);
      setShowCreateModal(false);
      setFormName("");
      setFormDescription("");
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
      await updateClass(editingClass.id, formName, formDescription);
      setShowEditModal(false);
      setEditingClass(null);
      setFormName("");
      setFormDescription("");
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
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div>Loading classes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: "crimson" }}>
        <div>Error: {error}</div>
        <button onClick={loadClasses} style={{ marginTop: 12 }}>
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
        <h2 style={{ margin: 0, fontSize: 28 }}>Manage Classes</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 15,
            }}
          >
            Create New Class
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 15,
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
          {classes.map((cls) => (
            <div
              key={cls.id}
              style={{
                border: "1px solid #dee2e6",
                borderRadius: 8,
                padding: 20,
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ margin: "0 0 8px 0", fontSize: 20 }}>{cls.name}</h3>
              {cls.description && (
                <p
                  style={{
                    margin: "0 0 12px 0",
                    color: "#6c757d",
                    fontSize: 14,
                  }}
                >
                  {cls.description}
                </p>
              )}
              <div
                style={{
                  fontSize: 14,
                  color: "#495057",
                  marginBottom: 16,
                }}
              >
                {cls.upload_count} CSV{cls.upload_count !== 1 ? "s" : ""}{" "}
                assigned
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => openEditModal(cls)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    backgroundColor: "#ffc107",
                    color: "#000",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClass(cls.id, cls.name)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
            No classes yet
          </h3>
          <p style={{ margin: "0 0 16px 0", color: "#6c757d" }}>
            Create your first class to organize your study materials.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 15,
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
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0" }}>Create New Class</h3>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: "bold",
                  fontSize: 14,
                }}
              >
                Class Name *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., CPA Review, Math 101"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ced4da",
                  borderRadius: 4,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: "bold",
                  fontSize: 14,
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
                  border: "1px solid #ced4da",
                  borderRadius: 4,
                  fontSize: 14,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
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
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
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
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0" }}>Edit Class</h3>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: "bold",
                  fontSize: 14,
                }}
              >
                Class Name *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., CPA Review, Math 101"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ced4da",
                  borderRadius: 4,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: "bold",
                  fontSize: 14,
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
                  border: "1px solid #ced4da",
                  borderRadius: 4,
                  fontSize: 14,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
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
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditClass}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
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
