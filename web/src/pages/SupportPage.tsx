import { useNavigate, useOutletContext } from "react-router-dom";

export default function SupportPage() {
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
          Support & Contact
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

      {/* Contact Information */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 24,
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: 20, color: theme.text }}>
          Contact Information
        </h3>
        <p style={{ margin: "0 0 12px 0", color: theme.text, lineHeight: 1.6 }}>
          If you have questions, feedback, or need assistance with the Hoosier
          Prep Portal, please reach out:
        </p>
        <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 12, color: theme.text }}>
            <strong>Developer:</strong> Banks
          </div>
          <div style={{ marginBottom: 12, color: theme.text }}>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:banknich@iu.edu"
              style={{ color: theme.crimson, textDecoration: "underline" }}
            >
              banknich@iu.edu
            </a>
          </div>
          <div style={{ marginBottom: 12, color: theme.text }}>
            <strong>GitHub:</strong>{" "}
            <a
              href="https://github.com/banknich-MSIS/StudyTool"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: theme.crimson, textDecoration: "underline" }}
            >
              github.com/banknich-MSIS/StudyTool
            </a>
          </div>
          <div style={{ marginBottom: 12, color: theme.text }}>
            <strong>Issues/Bugs:</strong>{" "}
            <a
              href="https://github.com/banknich-MSIS/StudyTool/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: theme.crimson, textDecoration: "underline" }}
            >
              Submit an issue on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 24,
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: 20, color: theme.text }}>
          Frequently Asked Questions
        </h3>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: 16,
                color: theme.text,
              }}
            >
              How do I create a practice exam?
            </h4>
            <p
              style={{
                margin: 0,
                color: theme.textSecondary,
                lineHeight: 1.6,
              }}
            >
              Upload a CSV file with your questions, then go to Settings to
              configure and create an exam. See the Instructions for a detailed
              guide.
            </p>
          </div>
          <div>
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: 16,
                color: theme.text,
              }}
            >
              What format should my CSV be in?
            </h4>
            <p
              style={{
                margin: 0,
                color: theme.textSecondary,
                lineHeight: 1.6,
              }}
            >
              Download the CSV template from the Upload page, or check the
              detailed guide in the Instructions/Tutorial.
            </p>
          </div>
          <div>
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: 16,
                color: theme.text,
              }}
            >
              Can I use this with Gemini AI?
            </h4>
            <p
              style={{
                margin: 0,
                color: theme.textSecondary,
                lineHeight: 1.6,
              }}
            >
              This tool has built-in Gemini AI integration for quick exam
              generation. Alternatively, use our Gemini Gem for a more
              consultative approach that tailors exams with detailed
              customization. The template can be used with other LLMs, though
              subtle formatting differences may cause errors.
            </p>
          </div>
          <div>
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: 16,
                color: theme.text,
              }}
            >
              Why do I get a permission error opening the Gemini Gem?
            </h4>
            <p
              style={{
                margin: 0,
                color: theme.textSecondary,
                lineHeight: 1.6,
              }}
            >
              The Gemini Gem requires a Gemini Pro account, which IU school
              accounts provide. However, for API keys used in this tool, school
              accounts may block access - use a personal Google account to
              obtain a free API key.
            </p>
          </div>
          <div>
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: 16,
                color: theme.text,
              }}
            >
              CSV format expectations
            </h4>
            <p
              style={{
                margin: 0,
                color: theme.textSecondary,
                lineHeight: 1.6,
              }}
            >
              Use the template from the Upload page. Ensure headers and column
              order match exactly. Save as UTF-8 CSV. If pasting text, ensure
              commas separate fields and options use the pipe (|) delimiter.
            </p>
          </div>
          <div>
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: 16,
                color: theme.text,
              }}
            >
              Common errors and fixes
            </h4>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: theme.textSecondary,
                lineHeight: 1.6,
              }}
            >
              <li>
                "Invalid API key": trim whitespace; ensure API enabled; use
                personal account.
              </li>
              <li>
                "Could not extract enough content": upload files with selectable
                text.
              </li>
              <li>
                CSV parse errors: check headers; quote fields containing commas;
                use UTF-8.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
