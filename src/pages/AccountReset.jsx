// src/pages/AccountReset.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Password Reset Wizard (v2 — Premium design, no React Bootstrap)
// Accessed via /reset-password/:token (link sent from AccountRecovery).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../admin/services/api";
import AuthLayout from "../components/auth/AuthLayout";

function Spinner() {
  return (
    <span className="auth-spinner" />
  );
}

// Strength is scored from the input value on each keystroke; only the
// score (0-4) is kept, never the value itself.
function scoreStrength(value) {
  return [value.length >= 8, /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
}

function StrengthBar({ score, hasValue }) {

  const labels  = ["", "Weak", "Fair", "Good", "Strong"];
  const colors  = ["", "var(--ui-danger-text)", "var(--ui-warning-text)", "var(--ui-accent)", "var(--ui-success-text)"];
  const widths  = ["0%", "25%", "50%", "75%", "100%"];

  if (!hasValue) return null;

  return (
    <div className="auth-strength">
      <div className="auth-strength__track">
        <div className="auth-strength__bar" style={{ width: widths[score], background: colors[score] }} />
      </div>
      <span className="auth-strength__label" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}

export default function AccountReset() {
  // Uncontrolled fields: values are read from the inputs on submit only.
  const nextRef    = useRef(null);
  const confirmRef = useRef(null);
  const [fieldInfo, setFieldInfo] = useState({ len: 0, score: 0, confirmLen: 0, matches: true });
  const updateFieldInfo = () => {
    const next = nextRef.current?.value || "";
    const confirm = confirmRef.current?.value || "";
    setFieldInfo({ len: next.length, score: scoreStrength(next), confirmLen: confirm.length, matches: next === confirm });
  };
  const [showNew,         setShowNew]         = useState(false);
  const [message,         setMessage]         = useState("");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);

  const { token } = useParams();
  const navigate  = useNavigate();

  const passwordsMatch = fieldInfo.matches;
  const isValid        = fieldInfo.len >= 6 && fieldInfo.confirmLen > 0 && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordsMatch) { setError("Passwords do not match."); return; }
    setLoading(true); setMessage(""); setError("");
    try {
      const res = await api.resetPassword(token, nextRef.current?.value || "");
      setMessage(res.message || "Password updated successfully!");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(err.message || "Reset link may be invalid or expired. Please request a new one.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-fade-in auth-pane auth-pane--sm">

        {/* Icon */}
        <div className="auth-icon">
          🔑
        </div>

        <h1 className="auth-title">
          Set a new password.
        </h1>
        <p className="auth-sub">
          Choose something strong. You won't be able to reuse this link.
        </p>

        {message && (
          <div className="auth-alert-success">
            {message}{" "}
            <strong>Redirecting to login…</strong>
          </div>
        )}
        {error && <div className="auth-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* New password */}
          <div>
            <div className="auth-pw-wrap">
              <input
                className="auth-input auth-input--pw"
                type={showNew ? "text" : "password"}
                placeholder="New password"
                ref={nextRef}
                onChange={updateFieldInfo}
                name="next"
                autoComplete="new-password"
                disabled={loading || !!message} required
              />
              {fieldInfo.len > 0 && (
                <button type="button" className="auth-pw-toggle"
                  onClick={() => setShowNew(p => !p)}>
                  {showNew ? "Hide" : "Show"}
                </button>
              )}
            </div>
            <StrengthBar score={fieldInfo.score} hasValue={fieldInfo.len > 0} />
          </div>

          {/* Confirm password */}
          <div>
            <input
              className="auth-input"
              type="password"
              placeholder="Confirm new password"
              ref={confirmRef}
              onChange={updateFieldInfo}
              name="confirm"
              autoComplete="new-password"
              disabled={loading || !!message} required
            />
            {fieldInfo.confirmLen > 0 && !passwordsMatch && (
              <p className="auth-field-hint">
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit" className="auth-btn-primary auth-mt-1"
            disabled={loading || !isValid || !!message}
          >
            {loading ? <Spinner /> : "Update Password"}
          </button>
        </form>

        <div className="auth-switch">
          Changed your mind?{" "}
          <button type="button" className="auth-link-btn" onClick={() => navigate("/login")}>
            Back to Sign In
          </button>
        </div>

      </div>
    </AuthLayout>
  );
}
