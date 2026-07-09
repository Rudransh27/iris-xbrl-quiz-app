// src/pages/VerifyEmail.jsx
// ─────────────────────────────────────────────────────────────────────────────
// OTP Verification Pane (v2 — Premium design, no React Bootstrap)
// 6 individual digit inputs with auto-focus + paste support.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";

// ── Spinner ───────────────────────────────────────────────────────────────
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
        const redirect = localStorage.getItem("redirectPath") || "/";
        localStorage.removeItem("redirectPath");
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
      <div className="auth-fade-in" style={{ width: "100%", maxWidth: "360px" }}>

        {/* Icon + heading */}
        <div style={{
          width: "56px", height: "56px", borderRadius: "50%",
          background: "var(--orbit-brand-muted)",
          border: "2px solid var(--orbit-brand)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", marginBottom: "22px",
        }}>
          🔐
        </div>

        <h1 style={{
          fontSize: "clamp(22px, 2.8vw, 28px)", fontWeight: "800",
          letterSpacing: "-0.5px", color: "var(--orbit-text-heading)",
          margin: "0 0 8px", lineHeight: 1.2,
        }}>
          Verify your identity.
        </h1>
        <p style={{ fontSize: "14px", color: "var(--orbit-text-muted)", margin: "0 0 28px", lineHeight: 1.7 }}>
          Enter the 6-digit code sent to{" "}
          <strong style={{ color: "var(--orbit-text-body)" }}>{email || "your email"}</strong>.
        </p>

        {error   && <div className="auth-alert-error"   style={{ marginBottom: "16px" }}>{error}</div>}
        {success && <div className="auth-alert-success" style={{ marginBottom: "16px" }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* 6 individual OTP boxes */}
          <div
            style={{
              display: "flex", gap: "10px", marginBottom: "28px",
              justifyContent: "center",
            }}
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

        <div style={{ textAlign: "center", marginTop: "22px", fontSize: "13px", color: "var(--orbit-text-muted)" }}>
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
