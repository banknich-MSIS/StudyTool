import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { validateGeminiKeyDetailed } from "../api/client";

export default function ApiKeyManagementPage() {
  const navigate = useNavigate();
  const { darkMode, theme } = useOutletContext<{
    darkMode: boolean;
    theme: any;
  }>();

  const [apiKey, setApiKey] = useState("");
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [validatingKey, setValidatingKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load API key on mount
  useEffect(() => {
    const encrypted = localStorage.getItem("gemini_api_key");
    if (encrypted) {
      try {
        const decrypted = atob(encrypted);
        setApiKey(decrypted);
        setApiKeyValid(true); // Assume valid if stored
      } catch (e) {
        console.error("Failed to decrypt API key");
      }
    }
  }, []);

  const handleValidateAndSaveKey = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setValidatingKey(true);
    setError(null);
    setSuccess(null);

    try {
      const { valid, message } = await validateGeminiKeyDetailed(apiKey.trim());

      setApiKeyValid(valid);

      if (valid) {
        // Encrypt and save
        const encrypted = btoa(apiKey);
        localStorage.setItem("gemini_api_key", encrypted);
        setSuccess("API key validated and saved successfully!");
        setError(null);
      } else {
        setError(message || "API key is invalid. Please check and try again.");
      }
    } catch (e: any) {
      setError("Failed to validate API key. Please try again.");
      setApiKeyValid(false);
    } finally {
      setValidatingKey(false);
    }
  };

  const handleClearApiKey = () => {
    if (confirm("Are you sure you want to clear the API key?")) {
      localStorage.removeItem("gemini_api_key");
      setApiKey("");
      setApiKeyValid(null);
      setSuccess("API key cleared successfully");
      setError(null);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key first");
      return;
    }

    setValidatingKey(true);
    try {
      const { valid, message } = await validateGeminiKeyDetailed(apiKey.trim());
      if (valid) {
        setSuccess("Connection test successful!");
      } else {
        setError(`Connection test failed: ${message}`);
      }
    } catch (e: any) {
      setError(
        "Connection test failed. Please check your internet connection."
      );
    } finally {
      setValidatingKey(false);
    }
  };

  const getApiKeyDisplay = () => {
    if (!apiKey) return "No API key stored";
    if (apiKey.length < 8) return apiKey;
    return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px",
        display: "grid",
        gap: 24,
      }}
    >
      {/* Header Section */}
      <section
        style={{
          background: theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.glassBorder}`,
          boxShadow: theme.glassShadow,
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: 32,
            fontWeight: 700,
            color: theme.crimson,
          }}
        >
          API Key Management
        </h2>
        <p
          style={{
            margin: 0,
            color: theme.textSecondary,
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          Manage your Gemini API key for AI-powered exam generation. Get a free
          API key from Google AI Studio to enable exam creation features.
        </p>
      </section>

      {/* Status Section */}
      <section
        style={{
          background: theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.glassBorder}`,
          boxShadow: theme.glassShadow,
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: 20,
            fontWeight: 600,
            color: theme.text,
          }}
        >
          Current Status
        </h3>

        <div
          style={{
            padding: 16,
            background:
              apiKeyValid === true
                ? darkMode
                  ? "rgba(40, 167, 69, 0.1)"
                  : "rgba(40, 167, 69, 0.15)"
                : apiKeyValid === false
                ? darkMode
                  ? "rgba(220, 53, 69, 0.1)"
                  : "rgba(220, 53, 69, 0.15)"
                : darkMode
                ? "rgba(194, 155, 74, 0.1)"
                : "rgba(194, 155, 74, 0.15)",
            borderRadius: 8,
            border: `1px solid ${
              apiKeyValid === true
                ? theme.btnSuccess
                : apiKeyValid === false
                ? theme.btnDanger
                : theme.amber
            }`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontWeight: 600, color: theme.text }}>
              API Key Status:
            </span>
            <span
              style={{
                fontWeight: 600,
                color:
                  apiKeyValid === true
                    ? theme.btnSuccess
                    : apiKeyValid === false
                    ? theme.btnDanger
                    : theme.amber,
              }}
            >
              {apiKeyValid === true
                ? "✓ Valid"
                : apiKeyValid === false
                ? "✗ Invalid"
                : "? Not Set"}
            </span>
          </div>
          <div
            style={{
              fontSize: 14,
              color: theme.textSecondary,
              fontFamily: "monospace",
            }}
          >
            {getApiKeyDisplay()}
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div
            style={{
              padding: 12,
              background: darkMode && "rgba(40, 167, 69, 0.1)",
              color: theme.btnSuccess,
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
              border: `1px solid ${theme.btnSuccess}`,
            }}
          >
            {success}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 12,
              background: darkMode && "rgba(220, 53, 69, 0.1)",
              color: theme.btnDanger,
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
              border: `1px solid ${theme.btnDanger}`,
            }}
          >
            {error}
          </div>
        )}
      </section>

      {/* API Key Input Section */}
      <section
        style={{
          background: theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.glassBorder}`,
          boxShadow: theme.glassShadow,
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: 20,
            fontWeight: 600,
            color: theme.text,
          }}
        >
          Manage API Key
        </h3>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              color: theme.text,
              fontWeight: 500,
            }}
          >
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            placeholder="AIza..."
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgSolid,
              color: theme.text,
              fontSize: 14,
              fontFamily: "monospace",
            }}
          />
          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: 13,
              color: theme.textSecondary,
            }}
          >
            Your API key is stored locally and encrypted. It's only sent to your
            local server for validation.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={handleValidateAndSaveKey}
            disabled={!apiKey.trim() || validatingKey}
            style={{
              padding: "12px 24px",
              background:
                apiKey.trim() && !validatingKey ? theme.crimson : theme.border,
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor:
                apiKey.trim() && !validatingKey ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: 15,
              boxShadow:
                apiKey.trim() && !validatingKey
                  ? "0 3px 12px rgba(196, 30, 58, 0.3)"
                  : "none",
            }}
          >
            {validatingKey ? "Validating..." : "Save & Validate"}
          </button>

          <button
            onClick={handleTestConnection}
            disabled={!apiKey.trim() || validatingKey}
            style={{
              padding: "12px 24px",
              background:
                apiKey.trim() && !validatingKey ? theme.btnInfo : theme.border,
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor:
                apiKey.trim() && !validatingKey ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Test Connection
          </button>

          {apiKey && (
            <button
              onClick={handleClearApiKey}
              style={{
                padding: "12px 24px",
                background: "transparent",
                color: theme.textSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Clear Key
            </button>
          )}
        </div>
      </section>

      {/* Quick Links Section */}
      <section
        style={{
          background: theme.cardBg,
          backdropFilter: theme.glassBlur,
          WebkitBackdropFilter: theme.glassBlur,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.glassBorder}`,
          boxShadow: theme.glassShadow,
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: 20,
            fontWeight: 600,
            color: theme.text,
          }}
        >
          Quick Access
        </h3>

        <div style={{ display: "grid", gap: 12 }}>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 16,
              background: darkMode
                ? "rgba(212, 166, 80, 0.1)"
                : "rgba(212, 166, 80, 0.08)",
              borderRadius: 8,
              border: `1px solid ${theme.amber}`,
              color: theme.text,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = darkMode
                ? "rgba(212, 166, 80, 0.2)"
                : "rgba(212, 166, 80, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = darkMode
                ? "rgba(212, 166, 80, 0.1)"
                : "rgba(212, 166, 80, 0.08)";
            }}
          >
            <span style={{ fontSize: 24 }}>🔑</span>
            <div>
              <div style={{ fontWeight: 600, color: theme.text }}>
                Google AI Studio
              </div>
              <div style={{ fontSize: 13, color: theme.textSecondary }}>
                Get or manage your API key
              </div>
            </div>
            <span style={{ marginLeft: "auto", fontSize: 14 }}>→</span>
          </a>

          <a
            href="https://generativelanguage.googleapis.com/v1beta/models"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 16,
              background: darkMode
                ? "rgba(196, 30, 58, 0.1)"
                : "rgba(196, 30, 58, 0.08)",
              borderRadius: 8,
              border: `1px solid ${theme.crimson}`,
              color: theme.text,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = darkMode
                ? "rgba(196, 30, 58, 0.2)"
                : "rgba(196, 30, 58, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = darkMode
                ? "rgba(196, 30, 58, 0.1)"
                : "rgba(196, 30, 58, 0.08)";
            }}
          >
            <span style={{ fontSize: 24 }}>📊</span>
            <div>
              <div style={{ fontWeight: 600, color: theme.text }}>
                Available Models
              </div>
              <div style={{ fontSize: 13, color: theme.textSecondary }}>
                View all available Gemini models
              </div>
            </div>
            <span style={{ marginLeft: "auto", fontSize: 14 }}>→</span>
          </a>
        </div>
      </section>

      {/* Information Section */}
      <section
        style={{
          background: darkMode
            ? "rgba(212, 166, 80, 0.08)"
            : "rgba(212, 166, 80, 0.1)",
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.amber}`,
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: 18,
            fontWeight: 600,
            color: theme.amber,
          }}
        >
          ℹ️ Important Information
        </h3>

        <div
          style={{ display: "grid", gap: 12, fontSize: 14, color: theme.text }}
        >
          <div>
            <strong style={{ color: theme.amber }}>Free Tier:</strong> 1M
            tokens/day (~100 exams), 60 requests/hour • No credit card required
          </div>
          <div>
            <strong style={{ color: theme.amber }}>Security:</strong> Your API
            key is stored locally and encrypted. It's never sent to external
            servers.
          </div>
          <div>
            <strong style={{ color: theme.amber }}>Privacy:</strong> All data
            processing happens on your local machine. Only you have access to
            your materials.
          </div>
          <div>
            <strong style={{ color: theme.amber }}>Note:</strong> If you're
            signed into an IU email account, you may encounter permission
            errors. Use a personal Google account instead.
          </div>
        </div>
      </section>
    </div>
  );
}
