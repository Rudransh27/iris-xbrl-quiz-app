// src/pages/VerifyEmail.jsx
// ─────────────────────────────────────────────────────────────────────────────
// OTP Verification Pane (v2 — Premium design, no React Bootstrap)
// 6 individual digit inputs with auto-focus + paste support.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import { takeRedirectPath } from "../utils/safeNav";

// ── Spinner ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span className="auth-spinner" />
  );
}

export default function VerifyEmail() {
  const [otp,     setOtp]     = useState(["", "", "", "", "", ""]);
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([...Array(6)].map(() => React.createRef()));
  const location  = useLocation();
  const navigate  = useNavigate();
  const { verifyEmail } = useContext(AuthContext);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const em = params.get("email");
    if (!em) {
      setError("Email context missing. Please return to registration.");
    } else {
      setEmail(em);
    }
  }, [location]);

  // ── Individual digit handlers ──────────────────────────────────────────
  const handleDigit = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      inputRefs.current[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].current?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0)  inputRefs.current[index - 1].current?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1].current?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...otp];
    text.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setOtp(next);
    const lastFilled = Math.min(text.length, 5);
    inputRefs.current[lastFilled].current?.focus();
  };

  const otpString = otp.join("");

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otpString.length !== 6) { setError("Please enter all 6 digits."); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await verifyEmail(email, otpString);
      if (res && res.success) {
        setSuccess("Identity verified! Redirecting you to Orbit…");
        const redirect = takeRedirectPath("/");
        setTimeout(() => navigate(redirect, { replace: true }), 1400);
      } else {
        setError(res?.message || "Incorrect OTP. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-fade-in auth-pane auth-pane--sm">

        {/* Icon + heading */}
        <div className="auth-icon">
          🔐
        </div>

        <h1 className="auth-title">
          Verify your identity.
        </h1>
        <p className="auth-sub">
          Enter the 6-digit code sent to{" "}
          <strong>{email || "your email"}</strong>.
        </p>

        {error   && <div className="auth-alert-error">{error}</div>}
        {success && <div className="auth-alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* 6 individual OTP boxes */}
          <div
            className="auth-otp-row"
            onPaste={handlePaste}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={inputRefs.current[i]}
                className="auth-otp-box"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading || !!success}
                autoFocus={i === 0}
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="submit" className="auth-btn-primary"
            disabled={loading || otpString.length !== 6 || !!success || !email}
          >
            {loading ? <Spinner /> : "Confirm Identity"}
          </button>
        </form>

        <div className="auth-switch">
          Wrong account?{" "}
          <button
            type="button" className="auth-link-btn"
            onClick={() => navigate("/register")}
          >
            Sign up again
          </button>
        </div>

      </div>
    </AuthLayout>
  );
}
