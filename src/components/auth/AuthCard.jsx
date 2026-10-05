// src/components/auth/AuthCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// IRIS Orbit — Unified Authentication Card (v2)
//
// Steps:
//   "login"    → Login form (email + password + SSO)
//   "register" → Registration form (username + dept + team + email + pw)
//   "describe" → Post-signup micro-description ("Tell us who's walking in")
//
// All API calls preserved exactly. React Bootstrap removed — styling comes
// from AuthLayout's injected token-based utility classes (auth-*).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useContext, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import api from "../../admin/services/api";
import AuthLayout from "./AuthLayout";
import AuthCaptcha from "./AuthCaptcha";
import { API_BASE_URL } from "../../admin/services/config";
import { takeRedirectPath } from "../../utils/safeNav";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// ── Spinner (no React Bootstrap dependency) ───────────────────────────────
function Spinner() {
  return (
    <span className="auth-spinner" />
  );
}

// ── Real Microsoft SSO redirect — full-page navigation, not a fetch, since
// the backend needs to redirect the browser on to login.microsoftonline.com ──
const redirectToMicrosoftSso = () => {
  window.location.href = `${API_BASE_URL}/auth/microsoft`;
};

// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_SECRET_INFO = { len: 0, confirmLen: 0, matches: true };

export default function AuthCard() {
  // ── Form fields ────────────────────────────────────────────────────────
  const [email,           setEmail]           = useState("");
  const [username,        setUsername]        = useState("");
  // Password fields are uncontrolled: the values live only in the inputs and
  // are read on submit. State keeps just what the UI needs (lengths, match).
  const secretRef  = useRef(null);
  const confirmRef = useRef(null);
  const [secretInfo, setSecretInfo] = useState(EMPTY_SECRET_INFO);
  const updateSecretInfo = () => {
    const main = secretRef.current?.value || "";
    const confirm = confirmRef.current?.value || "";
    setSecretInfo({ len: main.length, confirmLen: confirm.length, matches: main === confirm });
  };
  const [description,     setDescription]     = useState("");

  // ── Dept / team cascade ────────────────────────────────────────────────
  const [departmentsData,  setDepartmentsData]  = useState([]);
  const [selectedDeptCode, setSelectedDeptCode] = useState("");
  const [selectedTeamId,   setSelectedTeamId]   = useState("");

  // ── Region(s) — optional, multi-select. Leaving this empty just means
  // "unrestricted" (sees content in every region) until picked later from
  // the profile page. ──────────────────────────────────────────────────────
  const [regionsData,       setRegionsData]       = useState([]);
  const [selectedRegionIds, setSelectedRegionIds]  = useState([]);

  // ── UI state ───────────────────────────────────────────────────────────
  const [step,           setStep]           = useState("login"); // "login"|"register"|"describe"
  const [error,          setError]          = useState("");
  const [success,        setSuccess]        = useState("");
  const [loading,        setLoading]        = useState(false);
  const [showPassword,   setShowPassword]   = useState(false);
  const [securityNotice, setSecurityNotice] = useState({ message: "", variant: "" });
  const [pendingEmail,   setPendingEmail]   = useState(""); // used in describe → verify-email

  // ── CAPTCHA (VAPT 7.4) — one widget mounted at a time (login XOR register),
  // so a single token/ref pair is safe to share between both steps ─────────
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const resetCaptcha = () => { captchaRef.current?.reset(); setCaptchaToken(null); };

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
    setCaptchaToken(null);
    if (location.pathname === "/login") {
      setStep("login");
      const sp = new URLSearchParams(location.search);
      const status = sp.get("session_status");
      const SESSION_NOTICES = {
        expired: { message: "Your session expired. Please sign in again.", variant: "warning" },
        expired_timeout: { message: "You were signed out after a period of inactivity.", variant: "warning" },
        revoked: { message: "You were signed out on this device — you signed out elsewhere, your password changed, or an admin ended the session.", variant: "danger" },
        signed_out: { message: "You were signed out. Please sign in again.", variant: "warning" },
        concurrent_kickout: { message: "Access revoked: your account signed in on another device.", variant: "danger" },
      };
      if (SESSION_NOTICES[status]) {
        setSecurityNotice(SESSION_NOTICES[status]);
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

  // Load regions when entering register step — optional, so a failed fetch
  // just means the picker is empty, never blocks registration.
  useEffect(() => {
    if (step === "register" && regionsData.length === 0) {
      api.getRegions()
        .then(res => setRegionsData(res?.data || []))
        .catch(() => {});
    }
  }, [step]);

  const toggleRegion = (regionId) => {
    setSelectedRegionIds(prev =>
      prev.includes(regionId) ? prev.filter(id => id !== regionId) : [...prev, regionId]
    );
  };

  const availableTeams = departmentsData.find(d => d.code === selectedDeptCode)?.teams || [];

  const isLoginValid    = email.trim() && secretInfo.len >= 6;
  const isRegisterValid = username.trim() && email.trim() && selectedDeptCode && selectedTeamId
                          && secretInfo.len >= 6 && secretInfo.confirmLen > 0 && secretInfo.matches;

  // Login and register render different inputs — start each step clean.
  useEffect(() => { setSecretInfo(EMPTY_SECRET_INFO); }, [step]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!captchaToken) { setError("Please complete the CAPTCHA."); return; }
    setError(""); setSuccess(""); setSecurityNotice({ message: "", variant: "" });
    setLoading(true);
    try {
      const res = await login(email.trim().toLowerCase(), secretRef.current?.value || "", captchaToken);
      if (res.success) {
        // A logged-in user always lands straight in the Orbit dashboard —
        // "/" (the marketing homepage) is only ever for logged-out visitors.
        const redirect = takeRedirectPath("/orbit");
        navigate(redirect, { replace: true });
      } else {
        setError(res.message || "Invalid credentials. Please try again.");
        resetCaptcha();
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if ((secretRef.current?.value || "") !== (confirmRef.current?.value || "")) { setError("Passwords do not match."); return; }
    if (!captchaToken) { setError("Please complete the CAPTCHA."); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await register(
        username.trim(), email.trim().toLowerCase(),
        secretRef.current?.value || "", selectedDeptCode, selectedTeamId, selectedRegionIds, captchaToken
      );
      if (res && res.success) {
        setPendingEmail(email.trim().toLowerCase());
        setStep("describe"); // → micro-description step
      } else {
        setError(res?.message || "Registration failed. Try again.");
        resetCaptcha();
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please check domain restrictions.");
      resetCaptcha();
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
    setStep("register"); setError(""); setSuccess(""); setCaptchaToken(null);
    setSelectedDeptCode(""); setSelectedTeamId(""); setSelectedRegionIds([]);
    navigate("/register");
  };
  const switchToLogin = () => {
    setStep("login"); setError(""); setSuccess(""); setCaptchaToken(null);
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
        <div className="auth-fade-in auth-pane">
          <h1 className="auth-title">
            Welcome back.
          </h1>
          <p className="auth-sub">
            Sign in to continue your learning journey.
          </p>

          {/* Security notices */}
          {securityNotice.message && (
            <div className={`auth-alert-${securityNotice.variant === "danger" ? "error" : "warning"}`}>
              {securityNotice.message}
            </div>
          )}
          {error   && <div className="auth-alert-error">{error}</div>}
          {success && <div className="auth-alert-success">{success}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <input
              className="auth-input"
              type="email" placeholder="Work email"
              value={email} onChange={e => setEmail(e.target.value)}
              disabled={loading} required
            />

            <div className="auth-pw-wrap">
              <input
                className="auth-input auth-input--pw"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                ref={secretRef} onChange={updateSecretInfo} name="secret" autoComplete={step === "register" ? "new-password" : "current-password"}
                disabled={loading} required
              />
              {secretInfo.len > 0 && (
                <button type="button" className="auth-pw-toggle"
                  onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              )}
            </div>

            {/* Forgot password */}
            <div className="auth-forgot-row">
              <button type="button" className="auth-ghost-link"
                onClick={() => navigate("/forgot-password")}>
                Forgot password?
              </button>
            </div>

            <AuthCaptcha
              ref={captchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={setCaptchaToken}
              onExpired={() => setCaptchaToken(null)}
              verified={!!captchaToken}
            />

            <button type="submit" className="auth-btn-primary" disabled={loading || !isLoginValid || !captchaToken}>
              {loading ? <Spinner /> : "Log In"}
            </button>
          </form>

          {/* OR divider + SSO */}
          <div className="auth-sso">
            <div className="auth-or-divider">or</div>
            <div className="auth-sso__btn">
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
          <div className="auth-switch">
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
        <div className="auth-fade-in auth-pane">
          <h1 className="auth-title">
            Create your account.
          </h1>
          <p className="auth-sub">
            Join IRIS Orbit and start leveling up your skills.
          </p>

          {error   && <div className="auth-alert-error">{error}</div>}
          {success && <div className="auth-alert-success">{success}</div>}

          <form onSubmit={handleRegister} className="auth-form auth-form--tight">
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

            {/* Region(s) — optional multi-select toggle chips */}
            {regionsData.length > 0 && (
              <div className="auth-region">
                <span className="auth-region__label">
                  Your region (optional — pick one or more)
                </span>
                <div className="auth-chips">
                  {regionsData.map(r => {
                    const isSelected = selectedRegionIds.includes(r._id);
                    return (
                      <button
                        key={r._id}
                        type="button"
                        onClick={() => toggleRegion(r._id)}
                        disabled={loading}
                        className={`auth-chip${isSelected ? " is-selected" : ""}`}
                      >
                        <span
                          className="auth-chip__dot"
                          style={r.color ? { backgroundColor: r.color } : undefined}
                        />
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <input
              className="auth-input"
              type="email" placeholder="Work email"
              value={email} onChange={e => setEmail(e.target.value)}
              disabled={loading} required
            />

            <div className="auth-pw-wrap">
              <input
                className="auth-input auth-input--pw"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                ref={secretRef} onChange={updateSecretInfo} name="secret" autoComplete={step === "register" ? "new-password" : "current-password"}
                disabled={loading} required
              />
              {secretInfo.len > 0 && (
                <button type="button" className="auth-pw-toggle"
                  onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              )}
            </div>
            {secretInfo.len > 0 && secretInfo.len < 6 && (
              <p className="auth-field-hint auth-field-hint--tight">
                Minimum 6 characters
              </p>
            )}

            <input
              className="auth-input"
              type="password" placeholder="Confirm Password"
              ref={confirmRef} onChange={updateSecretInfo} name="confirm" autoComplete="new-password"
              disabled={loading} required
            />
            {secretInfo.confirmLen > 0 && !secretInfo.matches && (
              <p className="auth-field-hint auth-field-hint--tight">
                Passwords do not match
              </p>
            )}

            <AuthCaptcha
              ref={captchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={setCaptchaToken}
              onExpired={() => setCaptchaToken(null)}
              verified={!!captchaToken}
            />

            <button
              type="submit" className="auth-btn-primary auth-mt-1"
              disabled={loading || !isRegisterValid || !captchaToken}
            >
              {loading ? <Spinner /> : "Sign Up"}
            </button>
          </form>

          {/* OR + SSO */}
          <div className="auth-sso">
            <div className="auth-or-divider">or</div>
            <div className="auth-sso__btn">
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

          <div className="auth-switch">
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
        <div className="auth-fade-in auth-pane auth-pane--lg">
          {/* Chip */}
          <div className="auth-kicker">
            One last thing
          </div>

          <h1 className="auth-title">
            Tell us who's walking in.
          </h1>
          <p className="auth-sub auth-sub--tight">
            Describe yourself in a line. Make it specific. Emojis are encouraged.
          </p>

          {/* Example pills */}
          <div className="auth-chips auth-chips--spaced">
            {["💻 Best Coder", "📊 Data Wizard", "🚀 Product Dreamer", "🎯 Sharp Analyst"].map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDescription(ex)}
                className="auth-chip"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Description input */}
          <div>
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
          <div className="auth-desc-meta">
            <span className="auth-desc-meta__hint">
              One line. Make it specific.
            </span>
            <span className={`auth-char-counter${descCharsLeft < 20 ? " warn" : ""}${descCharsLeft === 0 ? " limit" : ""}`}>
              {descCharsLeft} chars left
            </span>
          </div>

          <button
            type="button" className="auth-btn-primary auth-mb-3"
            onClick={() => handleDescribe(false)}
            disabled={!description.trim()}
          >
            Continue →
          </button>

          <div className="auth-center">
            <button type="button" className="auth-ghost-link" onClick={() => handleDescribe(true)}>
              Skip for now — verify email first
            </button>
          </div>
        </div>
      )}

    </AuthLayout>
  );
}
