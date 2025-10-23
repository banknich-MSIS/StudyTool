import React, { useState } from "react";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  theme: any;
}

const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  theme,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const steps = [
    {
      title: "Welcome to Hoosier Prep Portal!",
      content: (
        <div>
          <p>
            This tool helps you create and take practice exams from your study
            materials using AI-powered generation.
          </p>
          <p>Choose between two approaches based on your preference.</p>
        </div>
      ),
    },
    {
      title: "Two Ways to Generate Exams",
      content: (
        <div>
          <div style={{ marginBottom: 20 }}>
            <strong style={{ color: theme.crimson }}>
              Option 1: AI Exam Creator (Built-in)
            </strong>
            <p>
              Fast and streamlined. Upload files, configure settings, and
              generate instantly—no conversation needed.
            </p>
          </div>
          <div>
            <strong style={{ color: theme.amber }}>
              Option 2: Gemini Gem (Consultative)
            </strong>
            <p>
              Guided, interactive experience. The Gem walks you through Q&A to
              refine your exam, then outputs a CSV to upload.
            </p>
            <a
              href="https://gemini.google.com/gem/582bd1e1e16d"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                background: theme.amber,
                color: "white",
                borderRadius: 6,
                textDecoration: "none",
                margin: "8px 0",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(212, 166, 80, 0.25)",
              }}
            >
              Open Gemini Gem →
            </a>
            <div style={{ marginTop: 8, fontSize: 12, color: theme.textSecondary }}>
              Note: Access may require a paid-enabled personal Google account. Using
              a school-managed account can cause permission errors.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Step 2: Copy & Save CSV",
      content: (
        <div>
          <p>Gemini will generate a CSV with your questions. To use it:</p>
          <ol style={{ paddingLeft: 20, marginTop: 12 }}>
            <li>Copy the entire CSV content from Gemini's response</li>
            <li>Open Notepad or any text editor</li>
            <li>Paste the CSV content</li>
            <li>Save As → Choose "All Files (*.*)"</li>
            <li>Name it something like "questions.csv"</li>
            <li>Make sure it ends with .csv extension</li>
          </ol>
        </div>
      ),
    },
    {
      title: "Step 3: Upload Here",
      content: (
        <div>
          <p>Upload the CSV file to Hoosier Prep Portal.</p>
          <p>
            The tool will automatically configure your exam settings based on
            Gemini's recommendations.
          </p>
          <p>You can still customize the settings if needed.</p>
          <div style={{ marginTop: 8, fontSize: 12, color: theme.textSecondary }}>
            Tip: Ensure your CSV matches the expected template (headers and
            column order). See the Upload page for the downloadable template.
          </div>
        </div>
      ),
    },
    {
      title: "Step 4: Take Your Exam",
      content: (
        <div>
          <p>Start your practice exam!</p>
          <p>
            Answer questions, get instant feedback, and track your progress.
          </p>
          <p>Review your results to identify areas for improvement.</p>
        </div>
      ),
    },
  ];

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("studytool_tutorial_completed", "true");
    }
    onClose();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.modalBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          border: `1px solid ${theme.glassBorder}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, color: theme.text }}>
            {steps[currentStep].title}
          </h2>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
              justifyContent: "center",
            }}
          >
            {steps.map((_, index) => (
              <div
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    index === currentStep ? theme.crimson : theme.border,
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: 24, lineHeight: 1.6, color: theme.text }}>
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${theme.border}`,
            paddingTop: 16,
          }}
        >
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: theme.text,
              }}
            >
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              Don't show this again
            </label>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                style={{
                  padding: "8px 20px",
                  border: `1px solid ${theme.glassBorder}`,
                  borderRadius: 6,
                  background: "transparent",
                  color: theme.text,
                  cursor: "pointer",
                  fontWeight: 500,
                  letterSpacing: "-0.2px",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(196, 30, 58, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Previous
              </button>
            )}
            <button
              onClick={nextStep}
              style={{
                padding: "8px 20px",
                border: "none",
                borderRadius: 6,
                background: theme.crimson,
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
                letterSpacing: "-0.2px",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 2px 8px rgba(196, 30, 58, 0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(196, 30, 58, 0.35)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(196, 30, 58, 0.25)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
