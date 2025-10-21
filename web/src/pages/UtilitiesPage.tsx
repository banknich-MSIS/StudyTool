import { useNavigate, useOutletContext } from "react-router-dom";

export default function UtilitiesPage() {
  const navigate = useNavigate();
  const { darkMode, theme } = useOutletContext<{
    darkMode: boolean;
    theme: any;
  }>();

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
          Utilities
        </h2>
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

      {/* Utilities Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {/* CSV Template */}
        <div
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: 18, color: theme.text }}>
            CSV Template
          </h3>
          <p
            style={{
              margin: "0 0 16px 0",
              color: theme.textSecondary,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Download a sample CSV template to help you format your study
            questions correctly.
          </p>
          <button
            onClick={() => navigate("/upload")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              width: "100%",
            }}
          >
            Go to Upload Page
          </button>
        </div>

        {/* View All Classes */}
        <div
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: 18, color: theme.text }}>
            Manage Classes
          </h3>
          <p
            style={{
              margin: "0 0 16px 0",
              color: theme.textSecondary,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Organize your CSVs by creating classes and assigning study materials
            to them.
          </p>
          <button
            onClick={() => navigate("/classes")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              width: "100%",
            }}
          >
            Manage Classes
          </button>
        </div>

        {/* Export Data (Future) */}
        <div
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: 20,
            opacity: 0.6,
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: 18, color: theme.text }}>
            Export Data
          </h3>
          <p
            style={{
              margin: "0 0 16px 0",
              color: theme.textSecondary,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Export your exam history and performance analytics to CSV or PDF.
          </p>
          <button
            disabled
            style={{
              padding: "8px 16px",
              backgroundColor: theme.border,
              color: theme.textSecondary,
              border: "none",
              borderRadius: 4,
              cursor: "not-allowed",
              fontSize: 14,
              width: "100%",
            }}
          >
            Coming Soon
          </button>
        </div>

        {/* Backup/Restore (Future) */}
        <div
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: 20,
            opacity: 0.6,
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: 18, color: theme.text }}>
            Backup & Restore
          </h3>
          <p
            style={{
              margin: "0 0 16px 0",
              color: theme.textSecondary,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Backup your database and restore from previous backups.
          </p>
          <button
            disabled
            style={{
              padding: "8px 16px",
              backgroundColor: theme.border,
              color: theme.textSecondary,
              border: "none",
              borderRadius: 4,
              cursor: "not-allowed",
              fontSize: 14,
              width: "100%",
            }}
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}

