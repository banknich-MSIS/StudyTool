import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import TutorialModal from "./components/TutorialModal";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTutorial, setShowTutorial] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("studytool_dark_mode");
    if (savedDarkMode === "true") {
      setDarkMode(true);
    }

    // Check if tutorial has been completed
    const tutorialCompleted = localStorage.getItem(
      "studytool_tutorial_completed"
    );
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }

    // Listen for custom event from UploadPage
    const handleShowTutorial = () => setShowTutorial(true);
    window.addEventListener("showTutorial", handleShowTutorial);

    return () => {
      window.removeEventListener("showTutorial", handleShowTutorial);
    };
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("studytool_dark_mode", String(newMode));
  };

  const handleGitHubClick = () => {
    window.open("https://github.com/banknich-MSIS/StudyTool", "_blank");
  };

  // Theme colors
  const theme = {
    bg: darkMode ? "#1e1e1e" : "#ffffff",
    cardBg: darkMode ? "#2d2d2d" : "#ffffff",
    text: darkMode ? "#e0e0e0" : "#333333",
    textSecondary: darkMode ? "#a0a0a0" : "#6c757d",
    border: darkMode ? "#3d3d3d" : "#dee2e6",
    navBg: darkMode ? "#2d2d2d" : "#f8f9fa",
    navHover: darkMode ? "#3d3d3d" : "#e9ecef",
    modalBg: darkMode ? "#2d2d2d" : "#ffffff",
  };

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/upload", label: "Upload CSV" },
    { path: "/classes", label: "Classes" },
    { path: "/history", label: "History" },
  ];

  return (
    <div
      style={{
        fontFamily: "system-ui, Arial, sans-serif",
        backgroundColor: theme.bg,
        color: theme.text,
        minHeight: "100vh",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Full-width Navigation Ribbon */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: theme.navBg,
          borderBottom: `1px solid ${theme.border}`,
          padding: "12px 0",
          marginBottom: 24,
          transition: "background-color 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Left: Brand and Main Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: "bold",
                color: theme.text,
              }}
            >
              Hoosier Prep Portal
            </h1>
            <div style={{ display: "flex", gap: 8 }}>
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor:
                      location.pathname === item.path
                        ? "#007bff"
                        : "transparent",
                    color:
                      location.pathname === item.path ? "white" : theme.text,
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== item.path) {
                      e.currentTarget.style.backgroundColor = theme.navHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== item.path) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: GitHub Section, Dark Mode, Help */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {/* GitHub Section */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                backgroundColor: darkMode ? "#3d3d3d" : "#fff3cd",
                border: `1px solid ${darkMode ? "#4d4d4d" : "#ffc107"}`,
                borderRadius: 6,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: darkMode ? "#ffd54f" : "#856404",
                  fontStyle: "italic",
                }}
              >
                Enjoying the tool? Star it on GitHub! - Banks
              </span>
              <button
                onClick={handleGitHubClick}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: "bold",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                ⭐ Star
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              style={{
                padding: "8px 12px",
                backgroundColor: darkMode ? "#ffc107" : "#343a40",
                color: darkMode ? "#000" : "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>

            {/* Help Button */}
            <button
              onClick={() => setShowTutorial(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Help
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 16px 80px 16px",
          minHeight: "calc(100vh - 160px)",
        }}
      >
        <Outlet context={{ darkMode, theme }} />
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: "auto",
          padding: "20px 16px",
          borderTop: `1px solid ${theme.border}`,
          backgroundColor: theme.navBg,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            alignItems: "center",
            fontSize: 14,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/utilities")}
            style={{
              background: "none",
              border: "none",
              color: theme.text,
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            Utilities
          </button>
          <span style={{ color: theme.textSecondary }}>|</span>
          <button
            onClick={() => navigate("/support")}
            style={{
              background: "none",
              border: "none",
              color: theme.text,
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            Support/Contact
          </button>
          <span style={{ color: theme.textSecondary }}>|</span>
          <button
            onClick={() => setShowTutorial(true)}
            style={{
              background: "none",
              border: "none",
              color: theme.text,
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            Instructions
          </button>
          <span style={{ color: theme.textSecondary }}>|</span>
          <a
            href="https://github.com/banknich-MSIS/StudyTool"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: theme.text,
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            GitHub
          </a>
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: theme.textSecondary,
          }}
        >
          © 2025 Hoosier Prep Portal - Built by Banks
        </div>
      </footer>

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        darkMode={darkMode}
        theme={theme}
      />
    </div>
  );
}
