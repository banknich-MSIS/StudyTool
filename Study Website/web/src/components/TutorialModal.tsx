import React, { useState } from "react";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const steps = [
    {
      title: "Welcome to Study Tool!",
      content: (
        <div>
          <p>
            This tool helps you create and take practice exams from your study
            materials.
          </p>
          <p>
            We work seamlessly with Gemini AI to convert your documents into
            study-ready quizzes.
          </p>
        </div>
      ),
    },
    {
      title: "Step 1: Upload to Gemini Gem",
      content: (
        <div>
          <p>
            First, use our dedicated Gemini Gem to convert your study materials:
          </p>
          <a
            href="https://gemini.google.com/gem/582bd1e1e16d"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#4285f4",
              color: "white",
              borderRadius: 8,
              textDecoration: "none",
              margin: "12px 0",
              fontWeight: "bold",
            }}
          >
            Open Gemini Gem →
          </a>
          <p>
            Upload your PDF, PowerPoint, or DOCX and ask the Gem to create a
            study CSV.
          </p>
        </div>
      ),
    },
    {
      title: "Step 2: Download CSV",
      content: (
        <div>
          <p>Gemini will create a CSV file with:</p>
          <ul>
            <li>Questions and answers</li>
            <li>Study themes and topics</li>
            <li>Recommended question types</li>
            <li>Difficulty settings</li>
          </ul>
          <p>Download this CSV file to your computer.</p>
        </div>
      ),
    },
    {
      title: "Step 3: Upload Here",
      content: (
        <div>
          <p>Upload the CSV file to this tool.</p>
          <p>
            We'll automatically configure your exam settings based on Gemini's
            recommendations.
          </p>
          <p>You can still customize the settings if needed.</p>
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
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, color: "#333" }}>
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
                  backgroundColor: index === currentStep ? "#007bff" : "#ddd",
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: 24, lineHeight: 1.6 }}>
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #eee",
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
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Previous
              </button>
            )}
            <button
              onClick={nextStep}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: 6,
                backgroundColor: "#007bff",
                color: "white",
                cursor: "pointer",
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
