import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import TutorialModal from "./components/TutorialModal";
import IURedLogo from "./assets/IURedLogo.svg";
import IUGreyLogo from "./assets/IUGreyLogo.svg";

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

  // Update body class for dark/light mode
  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("studytool_dark_mode", String(newMode));
  };

  const handleGitHubClick = () => {
    window.open("https://github.com/banknich-MSIS/StudyTool", "_blank");
  };

  // Glassmorphism Theme
  // DARK MODE ACCENT: Muted Amber (less bright than original)
  const DARK_ACCENT = "#C29B4A";
  const DARK_ACCENT_LIGHT = "#D4AD5E";
  const DARK_ACCENT_DARK = "#A88438";

  const theme = {
    // Background
    bg: darkMode ? "#1A0E0E" : "#F5F3ED",
    bgGradient: darkMode
      ? "linear-gradient(135deg, #1A0E0E 0%, #2D1819 100%)"
      : "linear-gradient(135deg, #F5F3ED 0%, #FAF8F2 100%)",

    // Cards & Surfaces
    cardBg: darkMode ? "rgba(61, 35, 37, 0.4)" : "rgba(255, 255, 255, 0.7)",
    cardBgSolid: darkMode ? "#3D2325" : "#FFFFFF",
    navBg: darkMode ? "rgba(45, 24, 25, 0.6)" : "rgba(255, 255, 255, 0.6)",
    navHover: darkMode ? "rgba(61, 35, 37, 0.8)" : "rgba(255, 255, 255, 0.9)",
    modalBg: darkMode ? "rgba(45, 24, 25, 0.95)" : "rgba(255, 255, 255, 0.95)",

    // Text
    text: darkMode ? "#F5F3ED" : "#262626",
    textSecondary: darkMode ? "#D4D4D4" : "#525252",

    // Borders
    border: darkMode ? "rgba(194, 155, 74, 0.2)" : "rgba(196, 30, 58, 0.12)",
    borderSolid: darkMode ? "#4D2E30" : "#EBE8DF",

    // Glass Effects
    glassBlur: "blur(12px)",
    glassShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
    glassShadowHover: "0 12px 40px 0 rgba(31, 38, 135, 0.25)",
    glassBorder: darkMode
      ? "rgba(194, 155, 74, 0.15)"
      : "rgba(255, 255, 255, 0.18)",

    // Brand Colors
    crimson: "#C41E3A",
    crimsonLight: "#D94A5F",
    crimsonDark: "#990F26",
    amber: darkMode ? DARK_ACCENT : "#D4A650",
    amberLight: darkMode ? DARK_ACCENT_LIGHT : "#E0BB71",
    amberDark: darkMode ? DARK_ACCENT_DARK : "#B88B3A",

    // Action Buttons
    btnPrimary: "#C41E3A",
    btnPrimaryHover: "#990F26",
    btnSecondary: darkMode ? DARK_ACCENT : "#D4A650",
    btnSecondaryHover: darkMode ? DARK_ACCENT_DARK : "#B88B3A",
    btnSuccess: "#28a745",
    btnSuccessHover: "#218838",
    btnInfo: "#17a2b8",
    btnInfoHover: "#138496",
    btnWarning: "#ffc107",
    btnDanger: "#dc3545",
    btnDangerHover: "#c82333",
  };

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/ai-exam-creator", label: "AI Exam Creator" },
    { path: "/upload", label: "Manual Creator" },
    { path: "/library", label: "Library" },
    { path: "/classes", label: "Classes" },
    { path: "/history", label: "History" },
  ];

  return (
    <div
      style={{
        fontFamily: "system-ui, Arial, sans-serif",
        background: theme.bgGradient,
        color: theme.text,
        minHeight: "100vh",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Full-width Navigation Ribbon - Glassmorphism */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: theme.navBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          borderBottom: `1px solid ${theme.glassBorder}`,
          padding: "12px 0",
          marginBottom: 24,
          boxShadow: theme.glassShadow,
          transition: "all 0.3s ease",
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
            <img
              src={darkMode ? IURedLogo : IUGreyLogo}
              alt="IU Logo"
              style={{ height: 24 }}
            />
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: "bold",
                color: darkMode ? theme.text : "#404040",
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
                    background:
                      location.pathname === item.path
                        ? theme.crimson
                        : "transparent",
                    color:
                      location.pathname === item.path ? "white" : theme.text,
                    border:
                      location.pathname === item.path
                        ? "none"
                        : `1px solid ${theme.glassBorder}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                    backdropFilter:
                      location.pathname === item.path
                        ? "none"
                        : theme.glassBlur,
                    WebkitBackdropFilter:
                      location.pathname === item.path
                        ? "none"
                        : theme.glassBlur,
                    transition: "all 0.2s ease",
                    boxShadow:
                      location.pathname === item.path
                        ? "0 4px 12px rgba(196, 30, 58, 0.3)"
                        : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== item.path) {
                      e.currentTarget.style.background = theme.navHover;
                    } else {
                      e.currentTarget.style.background = theme.crimsonDark;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== item.path) {
                      e.currentTarget.style.background = "transparent";
                    } else {
                      e.currentTarget.style.background = theme.crimson;
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
            {/* GitHub Section - Glass Style */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: darkMode
                  ? "rgba(194, 155, 74, 0.1)"
                  : "rgba(212, 166, 80, 0.15)",
                backdropFilter: theme.glassBlur,
                WebkitBackdropFilter: theme.glassBlur,
                border: `1px solid ${theme.amber}`,
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: darkMode ? theme.amberLight : "#B88B3A",
                  fontStyle: "italic",
                  fontWeight: 500,
                }}
              >
                Enjoying the tool? Star it on GitHub! - Banks
              </span>
              <button
                onClick={handleGitHubClick}
                style={{
                  padding: "6px 12px",
                  background: theme.crimson,
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: "bold",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(196, 30, 58, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.crimsonDark;
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(196, 30, 58, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.crimson;
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(196, 30, 58, 0.3)";
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ marginRight: 4, verticalAlign: "middle" }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Star
              </button>
            </div>

            {/* Help Button - Glass Style */}
            <button
              onClick={() => setShowTutorial(true)}
              style={{
                padding: "8px 16px",
                background: theme.btnInfo,
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(23, 162, 184, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.btnInfoHover;
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(23, 162, 184, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.btnInfo;
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(23, 162, 184, 0.3)";
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

      {/* Footer - Glassmorphism */}
      <footer
        style={{
          marginTop: "auto",
          padding: "20px 16px",
          borderTop: `1px solid ${theme.glassBorder}`,
          background: theme.navBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          textAlign: "center",
          boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.1)",
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

      {/* Floating Dark Mode Toggle - Bottom Left - Glassmorphism */}
      <div
        onClick={toggleDarkMode}
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: darkMode
            ? `linear-gradient(135deg, ${theme.amber} 0%, ${theme.amberDark} 100%)`
            : `linear-gradient(135deg, ${theme.crimson} 0%, ${theme.crimsonDark} 100%)`,
          border: `3px solid ${
            darkMode ? theme.amberLight : theme.crimsonLight
          }`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: darkMode
            ? "0 8px 24px rgba(194, 155, 74, 0.4)"
            : "0 8px 24px rgba(196, 30, 58, 0.4)",
          zIndex: 9999,
          transition: "all 0.3s ease",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1) rotate(15deg)";
          e.currentTarget.style.boxShadow = darkMode
            ? "0 12px 32px rgba(194, 155, 74, 0.6)"
            : "0 12px 32px rgba(196, 30, 58, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) rotate(0deg)";
          e.currentTarget.style.boxShadow = darkMode
            ? "0 8px 24px rgba(194, 155, 74, 0.4)"
            : "0 8px 24px rgba(196, 30, 58, 0.4)";
        }}
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {darkMode ? (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </div>
    </div>
  );
}
