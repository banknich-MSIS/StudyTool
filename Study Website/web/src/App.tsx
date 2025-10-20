import { Link, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import TutorialModal from "./components/TutorialModal";

export default function App() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
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

  return (
    <div
      style={{
        fontFamily: "system-ui, Arial, sans-serif",
        maxWidth: 1200,
        margin: "0 auto",
        padding: 16,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20 }}>Local Exam Builder</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/">Dashboard</Link>
          <Link to="/upload">Upload CSV</Link>
          <button
            onClick={() => setShowTutorial(true)}
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Help
          </button>
        </nav>
      </header>
      <Outlet />

      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}
