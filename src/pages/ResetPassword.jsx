// src/pages/ResetPassword.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Password Reset Wizard (v2 — Premium design, no React Bootstrap)
// Accessed via /reset-password/:token (link sent from ForgotPassword).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../admin/services/api";
import AuthLayout from "../components/auth/AuthLayout";

function Spinner() {
  return (
    <span style={{
      display: "inline-block",
      width: "16px", height: "16px", borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.4)",
      borderTopColor: "#fff",
      animation: "orbit-spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

// Simple password strength meter
function StrengthBar({ password }) {
  const len = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasNum   = /\d/.test(password);
  const hasSpec  = /[^A-Za-z0-9]/.test(password);
  const score    = [len >= 8, hasUpper, hasNum, hasSpec].filter(Boolean).length;

  const labels  = ["", "Weak", "Fair", "Good", "Strong"];
  const colors  = ["", "var(--pastel-quiz-text)", "var(--pastel-reads-text)", "var(--orbit-brand)", "var(--pastel-progress-text)"];
  const widths  = ["0%", "25%", "50%", "75%", "100%"];

  if (!password) return null;

  return (
    <div style={{ marginTop: "6px" }}>
      <div style={{
        height: "3px", borderRadius: "4px",
        background: "var(--orbit-border)", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: widths[score],
          background: colors[score],
          transition: "width 0.3s ease, background 0.3s ease",
          borderRadius: "4px",
        }} />
      </div>
      <span style={{ fontSize: "11px", color: colors[score], fontWeight: "600", marginTop: "3px", display: "block" }}>
        {labels[score]}
      </span>
    </div>
  );
}

export default function ResetPassword() {
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew,         setShowNew]         = useState(false);
  const [message,         setMessage]         = useState("");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);

  const { token } = useParams();
  const navigate  = useNavigate();

  const passwordsMatch = newPassword === confirmPassword;
  const isValid        = newPassword.length >= 6 && confirmPassword && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordsMatch) { setError("Passwords do not match."); return; }
    setLoading(true); setMessage(""); setError("");
    try {
      const res = await api.resetPassword(token, newPassword);
      setMessage(res.message || "Password updated successfully!");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(err.message || "Reset link may be invalid or expired. Please request a new one.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-fade-in" style={{ width: "100%", maxWidth: "360px" }}>

        {/* Icon */}
        <div style={{
          width: "56px", height: "56px", borderRadius: "50%",
          background: "var(--orbit-brand-muted)",
          border: "2px solid var(--orbit-brand)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", marginBottom: "22px",
        }}>
          🔑
        </div>

        <h1 style={{
          fontSize: "clamp(22px, 2.8vw, 28px)", fontWeight: "800",
          letterSpacing: "-0.5px", color: "var(--orbit-text-heading)",
          margin: "0 0 8px", lineHeight: 1.2,
        }}>
          Set a new password.
        </h1>
        <p style={{ fontSize: "14px", color: "var(--orbit-text-muted)", margin: "0 0 28px", lineHeight: 1.7 }}>
          Choose something strong. You won't be able to reuse this link.
        </p>

        {message && (
          <div className="auth-alert-success" style={{ marginBottom: "16px" }}>
            {message}{" "}
            <span style={{ fontWeight: "600" }}>Redirecting to login…</span>
          </div>
        )}
        {error && <div className="auth-alert-error" style={{ marginBottom: "16px" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* New password */}
          <div>
            <div style={{ position: "relative" }}>
              <input
                className="auth-input"
                type={showNew ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={loading || !!message} required
                style={{ paddingRight: "60px" }}
              />
              {newPassword && (
                <button type="button" className="auth-pw-toggle"
                  onClick={() => setShowNew(p => !p)}>
                  {showNew ? "Hide" : "Show"}
                </button>
              )}
            </div>
            <StrengthBar password={newPassword} />
          </div>

          {/* Confirm password */}
          <div>
            <input
              className="auth-input"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading || !!message} required
            />
            {confirmPassword && !passwordsMatch && (
              <p className="auth-field-hint" style={{ marginTop: "5px" }}>
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit" className="auth-btn-primary"
            disabled={loading || !isValid || !!message}
            style={{ marginTop: "4px" }}
          >
            {loading ? <Spinner /> : "Update Password"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "22px", fontSize: "13px", color: "var(--orbit-text-muted)" }}>
          Changed your mind?{" "}
          <button type="button" className="auth-link-btn" onClick={() => navigate("/login")}>
            Back to Sign In
          </button>
        </div>

      </div>
    </AuthLayout>
  );
}
