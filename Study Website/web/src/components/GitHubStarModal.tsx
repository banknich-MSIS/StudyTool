interface GitHubStarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GitHubStarModal({
  isOpen,
  onClose,
}: GitHubStarModalProps) {
  if (!isOpen) return null;

  const handleStarClick = () => {
    window.open("https://github.com/banknich-MSIS/StudyTool", "_blank");
    localStorage.setItem("hoosier_prep_github_star_shown", "true");
    onClose();
  };

  const handleDismiss = () => {
    localStorage.setItem("hoosier_prep_github_star_shown", "true");
    onClose();
  };

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
        zIndex: 2000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          border: "2px solid #dc3545",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            fontSize: "24px",
            color: "#333",
            textAlign: "center",
          }}
        >
          Thanks for Using Hoosier Prep Portal!
        </h2>

        <div
          style={{
            fontStyle: "italic",
            lineHeight: "1.8",
            fontSize: "15px",
            color: "#555",
            marginBottom: "16px",
          }}
        >
          <p style={{ margin: "0 0 12px 0" }}>
            I appreciate any stars on GitHub - it really helps! I hope this tool
            assists you in your studies and makes exam prep a bit easier.
          </p>
          <p style={{ margin: "0" }}>Good luck with your studying!</p>
        </div>

        <p
          style={{
            textAlign: "right",
            fontWeight: "bold",
            marginTop: "16px",
            marginBottom: "24px",
            fontSize: "16px",
            color: "#333",
          }}
        >
          - Banks
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginTop: "24px",
          }}
        >
          <button
            onClick={handleStarClick}
            style={{
              padding: "12px 24px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            Star on GitHub
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
