// src/components/auth/AuthCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// IRIS Orbit — Unified Authentication Card (v2)
//
// Steps:
//   "login"    → Login form (email + password + SSO)
//   "register" → Registration form (username + dept + team + email + pw)
//   "describe" → Post-signup micro-description ("Tell us who's walking in")
//
// All API calls preserved exactly. React Bootstrap removed — pure inline styles
// + AuthLayout's injected CSS utility classes.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useContext, useEffect, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import api from "../../admin/services/api";
import AuthLayout from "./AuthLayout";
import { API_BASE_URL } from "../../admin/services/config";

// ── Spinner (no React Bootstrap dependency) ───────────────────────────────
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

// ── Real Microsoft SSO redirect — full-page navigation, not a fetch, since
// the backend needs to redirect the browser on to login.microsoftonline.com ──
const redirectToMicrosoftSso = () => {
  window.location.href = `${API_BASE_URL}/auth/microsoft`;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function AuthCard() {
  // ── Form fields ────────────────────────────────────────────────────────
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [username,        setUsername]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [description,     setDescription]     = useState("");

  // ── Dept / team cascade ────────────────────────────────────────────────
  const [departmentsData,  setDepartmentsData]  = useState([]);
  const [selectedDeptCode, setSelectedDeptCode] = useState("");
  const [selectedTeamId,   setSelectedTeamId]   = useState("");

  // ── UI state ───────────────────────────────────────────────────────────
  const [step,           setStep]           = useState("login"); // "login"|"register"|"describe"
  const [error,          setError]          = useState("");
  const [success,        setSuccess]        = useState("");
  const [loading,        setLoading]        = useState(false);
  const [showPassword,   setShowPassword]   = useState(false);
  const [securityNotice, setSecurityNotice] = useState({ message: "", variant: "" });
  const [pendingEmail,   setPendingEmail]   = useState(""); // used in describe → verify-email

  const { login, register, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  // Redirect already-logged-in users
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // Set step from route path
  useEffect(() => {
    if (location.pathname === "/login") {
      setStep("login");
      const sp = new URLSearchParams(location.search);
      const status = sp.get("session_status");
      if (status === "concurrent_kickout") {
        setSecurityNotice({
          message: "Access revoked: your account signed in on another device.",
          variant: "danger",
        });
      } else if (status === "expired_timeout") {
        setSecurityNotice({
          message: "Session expired after 15 minutes of inactivity.",
          variant: "warning",
        });
      } else {
        setSecurityNotice({ message: "", variant: "" });
      }
    } else if (location.pathname === "/register") {
      setStep("register");
      setSecurityNotice({ message: "", variant: "" });
    }
  }, [location.pathname, location.search]);

  // Load departments when entering register step
  useEffect(() => {
    if (step === "register" && departmentsData.length === 0) {
      api.getDepartments()
        .then(data => setDepartmentsData(data || []))
        .catch(() => setError("Failed to load business units. Please refresh."));
    }
  }, [step]);

  const availableTeams = departmentsData.find(d => d.code === selectedDeptCode)?.teams || [];

  const isLoginValid    = email.trim() && password.length >= 6;
  const isRegisterValid = username.trim() && email.trim() && selectedDeptCode && selectedTeamId
                          && password.length >= 6 && password === confirmPassword;

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSecurityNotice({ message: "", variant: "" });
    setLoading(true);
    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (res.success) {
        const redirect = localStorage.getItem("redirectPath") || "/";
        localStorage.removeItem("redirectPath");
        navigate(redirect, { replace: true });
      } else {
        setError(res.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await register(
        username.trim(), email.trim().toLowerCase(),
        password, selectedDeptCode, selectedTeamId
      );
      if (res && res.success) {
        setPendingEmail(email.trim().toLowerCase());
        setStep("describe"); // → micro-description step
      } else {
        setError(res?.message || "Registration failed. Try again.");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please check domain restrictions.");
    } finally {
      setLoading(false);
    }
  };

  const handleDescribe = (skip = false) => {
    if (!skip && description.trim()) {
      localStorage.setItem("orbit_profile_bio", description.trim());
    }
    const target = `/verify-email?email=${encodeURIComponent(pendingEmail)}`;
    navigate(target);
  };

  const switchToRegister = () => {
    setStep("register"); setError(""); setSuccess("");
    setSelectedDeptCode(""); setSelectedTeamId("");
    navigate("/register");
  };
  const switchToLogin = () => {
    setStep("login"); setError(""); setSuccess("");
    navigate("/login");
  };

  const descCharsLeft = 140 - description.length;

  // ─────────────────────────────────────────────────────────────────────
  return (
    <AuthLayout>

      {/* ══════════════════════════════════════════════════════════════════
          STEP: LOGIN
      ══════════════════════════════════════════════════════════════════ */}
      {step === "login" && (
        <div className="auth-fade-in" style={{ width: "100%", maxWidth: "380px" }}>
          <h1 style={{
            fontSize: "clamp(24px, 3vw, 30px)", fontWeight: "800",
            letterSpacing: "-0.5px", color: "var(--orbit-text-heading)",
            margin: "0 0 6px", lineHeight: 1.2,
          }}>
            Welcome back.
          </h1>
          <p style={{ fontSize: "14px", color: "var(--orbit-text-muted)", margin: "0 0 28px", lineHeight: 1.6 }}>
            Sign in to continue your learning journey.
          </p>

          {/* Security notices */}
          {securityNotice.message && (
            <div className={`auth-alert-${securityNotice.variant === "danger" ? "error" : "warning"}`}
              style={{ marginBottom: "16px" }}>
              {securityNotice.message}
            </div>
          )}
          {error   && <div className="auth-alert-error"   style={{ marginBottom: "16px" }}>{error}</div>}
          {success && <div className="auth-alert-success" style={{ marginBottom: "16px" }}>{success}</div>}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              className="auth-input"
              type="email" placeholder="Work email"
              value={email} onChange={e => setEmail(e.target.value)}
              disabled={loading} required
            />

            <div style={{ position: "relative" }}>
              <input
                className="auth-input"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)}
                disabled={loading} required
                style={{ paddingRight: "60px" }}
              />
              {password && (
                <button type="button" className="auth-pw-toggle"
                  onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              )}
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: "right", marginTop: "-4px" }}>
              <button type="button" className="auth-ghost-link"
                onClick={() => navigate("/forgot-password")}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading || !isLoginValid}>
              {loading ? <Spinner /> : "Log In"}
            </button>
          </form>

          {/* OR divider + SSO */}
          <div style={{ margin: "20px 0 0" }}>
            <div className="auth-or-divider">or</div>
            <div style={{ marginTop: "12px" }}>
              <button
                type="button" className="auth-btn-secondary"
                onClick={redirectToMicrosoftSso}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <rect x="1" y="1" width="7.5" height="7.5" fill="#f25022"/>
                  <rect x="9.5" y="1" width="7.5" height="7.5" fill="#7fba00"/>
                  <rect x="1" y="9.5" width="7.5" height="7.5" fill="#00a4ef"/>
                  <rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#ffb900"/>
                </svg>
                Sign in with Enterprise SSO
              </button>
            </div>
          </div>

          {/* Switch to register */}
          <div style={{ textAlign: "center", marginTop: "28px", fontSize: "13px", color: "var(--orbit-text-muted)" }}>
            Don't have an account?{" "}
            <button type="button" className="auth-link-btn" onClick={switchToRegister}>
              Sign up
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP: REGISTER
      ══════════════════════════════════════════════════════════════════ */}
      {step === "register" && (
        <div className="auth-fade-in" style={{ width: "100%", maxWidth: "380px" }}>
          <h1 style={{
            fontSize: "clamp(22px, 2.8vw, 28px)", fontWeight: "800",
            letterSpacing: "-0.5px", color: "var(--orbit-text-heading)",
            margin: "0 0 6px", lineHeight: 1.2,
          }}>
            Create your account.
          </h1>
          <p style={{ fontSize: "14px", color: "var(--orbit-text-muted)", margin: "0 0 24px", lineHeight: 1.6 }}>
            Join IRIS Orbit and start your compliance learning journey.
          </p>

          {error   && <div className="auth-alert-error"   style={{ marginBottom: "14px" }}>{error}</div>}
          {success && <div className="auth-alert-success" style={{ marginBottom: "14px" }}>{success}</div>}

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              className="auth-input"
              type="text" placeholder="Username"
              value={username} onChange={e => setUsername(e.target.value)}
              disabled={loading} required
            />

            {/* Dept cascade */}
            <select
              className="auth-select"
              value={selectedDeptCode}
              onChange={e => { setSelectedDeptCode(e.target.value); setSelectedTeamId(""); }}
              disabled={loading} required
            >
              <option value="" disabled>Select Line of Business</option>
              {departmentsData.map(d => (
                <option key={d._id} value={d.code}>{d.name}</option>
              ))}
            </select>

            {/* Team cascade */}
            <select
              className="auth-select"
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              disabled={loading || !selectedDeptCode} required
            >
              <option value="" disabled>
                {!selectedDeptCode ? "Awaiting business line…" : "Select Team"}
              </option>
              {availableTeams.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>

            <input
              className="auth-input"
              type="email" placeholder="Work email"
              value={email} onChange={e => setEmail(e.target.value)}
              disabled={loading} required
            />

            <div style={{ position: "relative" }}>
              <input
                className="auth-input"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)}
                disabled={loading} required
                style={{ paddingRight: "60px" }}
              />
              {password && (
                <button type="button" className="auth-pw-toggle"
                  onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              )}
            </div>
            {password && password.length < 6 && (
              <p className="auth-field-hint" style={{ marginTop: "-4px" }}>
                Minimum 6 characters
              </p>
            )}

            <input
              className="auth-input"
              type="password" placeholder="Confirm Password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading} required
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="auth-field-hint" style={{ marginTop: "-4px" }}>
                Passwords do not match
              </p>
            )}

            <button
              type="submit" className="auth-btn-primary"
              disabled={loading || !isRegisterValid}
              style={{ marginTop: "4px" }}
            >
              {loading ? <Spinner /> : "Sign Up"}
            </button>
          </form>

          {/* OR + SSO */}
          <div style={{ margin: "18px 0 0" }}>
            <div className="auth-or-divider">or</div>
            <div style={{ marginTop: "12px" }}>
              <button type="button" className="auth-btn-secondary"
                onClick={redirectToMicrosoftSso}>
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <rect x="1" y="1" width="7.5" height="7.5" fill="#f25022"/>
                  <rect x="9.5" y="1" width="7.5" height="7.5" fill="#7fba00"/>
                  <rect x="1" y="9.5" width="7.5" height="7.5" fill="#00a4ef"/>
                  <rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#ffb900"/>
                </svg>
                Sign up with Enterprise SSO
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--orbit-text-muted)" }}>
            Already have an account?{" "}
            <button type="button" className="auth-link-btn" onClick={switchToLogin}>
              Log in
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP: DESCRIBE — "Tell us who's walking in"
          Shown after successful registration, before OTP verification.
      ══════════════════════════════════════════════════════════════════ */}
      {step === "describe" && (
        <div className="auth-fade-in" style={{ width: "100%", maxWidth: "400px" }}>
          {/* Chip */}
          <div style={{
            display: "inline-block",
            background: "var(--orbit-brand-muted)", color: "var(--orbit-brand)",
            fontSize: "10px", fontWeight: "800", letterSpacing: "1.6px",
            textTransform: "uppercase", padding: "5px 13px",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--orbit-brand)", marginBottom: "20px",
          }}>
            One last thing
          </div>

          <h1 style={{
            fontSize: "clamp(24px, 3vw, 30px)", fontWeight: "800",
            letterSpacing: "-0.5px", color: "var(--orbit-text-heading)",
            margin: "0 0 8px", lineHeight: 1.18,
            fontFamily: "'Georgia', 'Palatino', serif",
          }}>
            Tell us who's walking in.
          </h1>
          <p style={{ fontSize: "14px", color: "var(--orbit-text-muted)", margin: "0 0 8px", lineHeight: 1.7 }}>
            Describe yourself in a line. Make it specific. Emojis are encouraged.
          </p>

          {/* Example pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "22px" }}>
            {["💻 Best Coder", "📊 Data Wizard", "🚀 Product Dreamer", "🎯 Sharp Analyst"].map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDescription(ex)}
                style={{
                  background: "var(--orbit-surface-subtle)",
                  border: "1px solid var(--orbit-border)",
                  borderRadius: "var(--radius-full)",
                  padding: "4px 12px", fontSize: "12px",
                  color: "var(--orbit-text-body)", cursor: "pointer",
                  fontFamily: "inherit", fontWeight: "500",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--orbit-brand-muted)"; e.currentTarget.style.borderColor = "var(--orbit-brand)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--orbit-surface-subtle)"; e.currentTarget.style.borderColor = "var(--orbit-border)"; }}
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Description input */}
          <div style={{ marginBottom: "6px" }}>
            <input
              className="auth-input"
              type="text"
              placeholder="e.g. 💻 Best Coder"
              value={description}
              onChange={e => { if (e.target.value.length <= 140) setDescription(e.target.value); }}
              maxLength={140}
              autoFocus
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <span style={{ fontSize: "11px", color: "var(--orbit-text-muted)" }}>
              One line. Make it specific.
            </span>
            <span className={`auth-char-counter${descCharsLeft < 20 ? " warn" : ""}${descCharsLeft === 0 ? " limit" : ""}`}>
              {descCharsLeft} chars left
            </span>
          </div>

          <button
            type="button" className="auth-btn-primary"
            onClick={() => handleDescribe(false)}
            style={{ marginBottom: "12px" }}
            disabled={!description.trim()}
          >
            Continue →
          </button>

          <div style={{ textAlign: "center" }}>
            <button type="button" className="auth-ghost-link" onClick={() => handleDescribe(true)}>
              Skip for now — verify email first
            </button>
          </div>
        </div>
      )}

    </AuthLayout>
  );
}
