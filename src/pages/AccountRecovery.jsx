// src/pages/AccountRecovery.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Password Reset — Email Entry (v2 — Premium design, no React Bootstrap)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../admin/services/api";
import AuthLayout from "../components/auth/AuthLayout";
import AuthCaptcha from "../components/auth/AuthCaptcha";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

function Spinner() {
  return (
    <span className="auth-spinner" />
  );
}

export default function AccountRecovery() {
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaToken) { setError("Please complete the CAPTCHA."); return; }
    setLoading(true); setMessage(""); setError("");
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase(), captchaToken);
      setMessage(res.message || "Reset link sent! Check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to send reset link. Please try again.");
      captchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-fade-in auth-pane auth-pane--sm">

        {/* Icon */}
        <div className="auth-icon">
          ✉️
        </div>

        <h1 className="auth-title">
          Reset your password.
        </h1>
        <p className="auth-sub">
          Enter your work email and we'll send you a secure link to reset it.
        </p>

        {message && <div className="auth-alert-success">{message}</div>}
        {error   && <div className="auth-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            className="auth-input"
            type="email" placeholder="Work email"
            value={email} onChange={e => setEmail(e.target.value)}
            disabled={loading || !!message} required
          />

          <AuthCaptcha
            ref={captchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={setCaptchaToken}
            onExpired={() => setCaptchaToken(null)}
            verified={!!captchaToken}
          />

          <button
            type="submit" className="auth-btn-primary"
            disabled={loading || !email.trim() || !!message || !captchaToken}
          >
            {loading ? <Spinner /> : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <div className="auth-note">
            Didn't receive it? Check your spam folder or wait 60 seconds before requesting again.
          </div>
        )}

        <div className="auth-switch">
          Remembered it?{" "}
          <button type="button" className="auth-link-btn" onClick={() => navigate("/login")}>
            Back to Sign In
          </button>
        </div>

      </div>
    </AuthLayout>
  );
}
