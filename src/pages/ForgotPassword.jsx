// src/pages/ForgotPassword.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Password Reset — Email Entry (v2 — Premium design, no React Bootstrap)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(""); setError("");
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      setMessage(res.message || "Reset link sent! Check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to send reset link. Please try again.");
    } finally {
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
          ✉️
        </div>

        <h1 style={{
          fontSize: "clamp(22px, 2.8vw, 28px)", fontWeight: "800",
          letterSpacing: "-0.5px", color: "var(--orbit-text-heading)",
          margin: "0 0 8px", lineHeight: 1.2,
        }}>
          Reset your password.
        </h1>
        <p style={{ fontSize: "14px", color: "var(--orbit-text-muted)", margin: "0 0 28px", lineHeight: 1.7 }}>
          Enter your work email and we'll send you a secure link to reset it.
        </p>

        {message && <div className="auth-alert-success" style={{ marginBottom: "16px" }}>{message}</div>}
        {error   && <div className="auth-alert-error"   style={{ marginBottom: "16px" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            className="auth-input"
            type="email" placeholder="Work email"
            value={email} onChange={e => setEmail(e.target.value)}
            disabled={loading || !!message} required
          />

          <button
            type="submit" className="auth-btn-primary"
            disabled={loading || !email.trim() || !!message}
          >
            {loading ? <Spinner /> : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: "18px", padding: "14px 16px",
            background: "var(--orbit-surface-subtle)",
            border: "1px solid var(--orbit-border)",
            borderRadius: "12px",
            fontSize: "13px", color: "var(--orbit-text-muted)", lineHeight: 1.6,
          }}>
            Didn't receive it? Check your spam folder or wait 60 seconds before requesting again.
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "22px", fontSize: "13px", color: "var(--orbit-text-muted)" }}>
          Remembered it?{" "}
          <button type="button" className="auth-link-btn" onClick={() => navigate("/login")}>
            Back to Sign In
          </button>
        </div>

      </div>
    </AuthLayout>
  );
}
