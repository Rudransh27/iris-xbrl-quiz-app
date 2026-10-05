// src/components/auth/AuthLayout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared full-page shell for every auth screen.
// The global orbital canvas lives on <body> (index.css: global-canvas-shimmer),
// so this component is a transparent centering wrapper — no own background layers.
// The split-panel card has its own solid surface so it floats cleanly on the canvas.
//
// Usage:
//   <AuthLayout>
//     <MyFormContent />
//   </AuthLayout>
// ─────────────────────────────────────────────────────────────────────────────
import React, { useContext } from "react";
import { PiSunBold, PiMoonBold } from "react-icons/pi";
import { ThemeContext } from "../../context/ThemeContext";

// ── Inject shared auth utility classes once ────────────────────────────────
// Keyframes (auth-fade-up, auth-fade-out, orbit-spin, etc.) live in index.css.
// This block injects the reusable class-based styles — tokens only (--ui-*).
if (typeof document !== "undefined" && !document.getElementById("orbit-auth-styles")) {
  const s = document.createElement("style");
  s.id = "orbit-auth-styles";
  s.textContent = `
    /* ── Entry / exit animations ─────────────────────────────────────────── */
    .auth-fade-in  { animation: auth-fade-up  0.34s cubic-bezier(0.22,1,0.36,1) both; }
    .auth-fade-out { animation: auth-fade-out 0.26s ease both; }

    /* ── Page shell + split card ──────────────────────────────────────────── */
    .auth-shell {
      min-height: 100vh; position: relative;
      display: flex; align-items: center; justify-content: center;
      padding: 32px 20px;
      background: var(--ui-bg);
      font-family: var(--ui-font-sans);
    }
    .auth-theme-toggle {
      position: absolute; top: 14px; right: 14px; z-index: 2;
      background: var(--ui-surface); border: 1px solid var(--ui-border);
    }
    .auth-card-shell {
      width: 100%; max-width: 960px; min-height: 580px;
      display: flex; overflow: hidden;
      background: var(--ui-surface);
      border: 1px solid var(--ui-border);
      border-radius: var(--ui-radius-xl);
      box-shadow: var(--ui-shadow-lg);
    }
    .auth-slot {
      flex: 1; min-width: 0;
      display: flex; align-items: center; justify-content: center;
      padding: 52px 48px; overflow-y: auto;
    }

    /* ── Brand panel (.ui-hero gradient) ──────────────────────────────────── */
    .auth-brand.ui-hero {
      width: 360px; flex-shrink: 0; border-radius: 0; padding: 52px 38px;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    .auth-brand__top { position: relative; z-index: 1; }
    .auth-brand__ring {
      position: absolute; border-radius: 50%; pointer-events: none;
      border: 1.5px solid color-mix(in srgb, var(--ui-on-accent) 18%, transparent);
    }
    .auth-brand__ring--1 { bottom: -55px; right: -55px; width: 255px; height: 255px; }
    .auth-brand__ring--2 { bottom: 8px; right: 8px; width: 165px; height: 165px; border-color: color-mix(in srgb, var(--ui-on-accent) 12%, transparent); }
    .auth-brand__logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 44px; }
    .auth-brand__logo {
      width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--ui-accent); color: var(--ui-on-accent);
      box-shadow: 0 0 0 7px color-mix(in srgb, var(--ui-accent) 30%, transparent);
      font-size: var(--ui-fs-md); font-weight: var(--ui-fw-heavy);
    }
    .auth-brand__name { font-family: var(--ui-font-display); font-size: var(--ui-fs-base); font-weight: var(--ui-fw-heavy); color: var(--ui-on-accent); }
    .auth-brand__by { font-size: var(--ui-fs-2xs); font-weight: var(--ui-fw-bold); letter-spacing: var(--ui-tracking-wide); text-transform: uppercase; color: color-mix(in srgb, var(--ui-on-accent) 70%, transparent); }
    .auth-brand__tagline {
      font-family: var(--ui-font-display); font-size: clamp(22px, 2.4vw, 30px);
      font-weight: var(--ui-fw-heavy); letter-spacing: var(--ui-tracking-tight); line-height: var(--ui-lh-tight);
      color: var(--ui-on-accent); margin: 0 0 12px;
    }
    .auth-brand__tagline .ui-accent-word { white-space: nowrap; }
    .auth-brand__sub { font-size: var(--ui-fs-base); line-height: var(--ui-lh-body); color: color-mix(in srgb, var(--ui-on-accent) 78%, transparent); margin: 0 0 32px; }
    .auth-brand__features { display: flex; flex-direction: column; gap: 14px; }
    .auth-brand__feature { display: flex; align-items: flex-start; gap: 10px; font-size: var(--ui-fs-sm); font-weight: var(--ui-fw-medium); line-height: 1.5; color: color-mix(in srgb, var(--ui-on-accent) 88%, transparent); }
    .auth-brand__tick {
      width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: color-mix(in srgb, var(--ui-on-accent) 14%, transparent);
      border: 1.5px solid color-mix(in srgb, var(--ui-on-accent) 55%, transparent);
    }
    .auth-brand__tick::after { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--ui-on-accent); }
    .auth-brand__foot { position: relative; z-index: 1; padding-top: 24px; font-size: var(--ui-fs-xs); line-height: 1.6; color: color-mix(in srgb, var(--ui-on-accent) 65%, transparent); }

    @media (max-width: 820px) {
      .auth-shell { align-items: flex-start; padding: 64px 16px 24px; }
      .auth-card-shell { flex-direction: column; min-height: 0; }
      .auth-brand.ui-hero { width: 100%; padding: 24px; }
      .auth-brand__logo-row { margin-bottom: 18px; }
      .auth-brand__sub, .auth-brand__features, .auth-brand__foot { display: none; }
      .auth-brand__tagline { margin: 0; }
      .auth-slot { padding: 32px 20px; }
    }

    /* ── Pane typography / structure ──────────────────────────────────────── */
    .auth-pane { width: 100%; max-width: 380px; }
    .auth-pane--sm { max-width: 360px; }
    .auth-pane--lg { max-width: 400px; }
    .auth-pane--center { text-align: center; }
    .auth-title {
      font-family: var(--ui-font-display); font-size: clamp(24px, 3vw, 30px);
      font-weight: var(--ui-fw-heavy); letter-spacing: var(--ui-tracking-tight); line-height: var(--ui-lh-tight);
      color: var(--ui-text); margin: 0 0 8px;
    }
    .auth-title--sm { font-size: var(--ui-fs-xl); margin-bottom: 10px; }
    .auth-sub { font-size: var(--ui-fs-base); line-height: var(--ui-lh-body); color: var(--ui-text-2); margin: 0 0 24px; }
    .auth-sub strong { color: var(--ui-text); font-weight: var(--ui-fw-semibold); }
    .auth-sub--tight { margin-bottom: 8px; }
    .auth-icon {
      width: 56px; height: 56px; margin-bottom: 20px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--ui-radius-lg);
      background: var(--ui-accent-soft); border: 1px solid var(--ui-accent-soft-2);
      font-size: 24px;
    }
    .auth-form { display: flex; flex-direction: column; gap: 12px; }
    .auth-form--tight { gap: 10px; }
    .auth-pw-wrap { position: relative; }
    .auth-forgot-row { text-align: right; margin-top: -4px; }
    .auth-sso { margin-top: 20px; }
    .auth-sso__btn { margin-top: 12px; }
    .auth-switch { text-align: center; margin-top: 24px; font-size: var(--ui-fs-sm); color: var(--ui-text-3); }
    .auth-center { text-align: center; }
    .auth-mt-1 { margin-top: 4px; }
    .auth-mt-2 { margin-top: 8px; }
    .auth-mb-3 { margin-bottom: 12px; }
    .auth-pane > .auth-alert-error,
    .auth-pane > .auth-alert-success,
    .auth-pane > .auth-alert-warning { margin-bottom: 16px; }
    .auth-pane--center > .auth-alert-error { text-align: left; margin-bottom: 20px; }
    .auth-note {
      margin-top: 18px; padding: 14px 16px;
      background: var(--ui-surface-2); border: 1px solid var(--ui-border); border-radius: var(--ui-radius);
      font-size: var(--ui-fs-sm); line-height: 1.6; color: var(--ui-text-2);
    }

    /* ── Form inputs ──────────────────────────────────────────────────────── */
    .auth-input, .auth-select {
      width: 100%; min-height: 42px; padding: 10px 14px;
      background: var(--ui-surface);
      border: 1px solid var(--ui-border-2);
      border-radius: var(--ui-radius-sm);
      font-size: var(--ui-fs-base); line-height: 1.4; color: var(--ui-text);
      font-family: inherit; outline: none;
      transition: border-color var(--ui-duration) var(--ui-ease), box-shadow var(--ui-duration) var(--ui-ease), background-color var(--ui-duration) var(--ui-ease);
      box-sizing: border-box;
    }
    .auth-input::placeholder { color: var(--ui-text-4); }
    .auth-input:hover:not(:disabled), .auth-select:hover:not(:disabled) { border-color: var(--ui-text-4); }
    .auth-input:focus, .auth-select:focus { border-color: var(--ui-accent); box-shadow: var(--ui-ring); }
    .auth-input:disabled, .auth-select:disabled { background: var(--ui-surface-2); color: var(--ui-text-3); cursor: not-allowed; }
    .auth-input--pw { padding-right: 60px; }

    /* ── Cascade selects ──────────────────────────────────────────────────── */
    .auth-select {
      padding-right: 36px; cursor: pointer; appearance: none;
      background-image: linear-gradient(45deg, transparent 50%, var(--ui-text-3) 50%), linear-gradient(135deg, var(--ui-text-3) 50%, transparent 50%);
      background-position: calc(100% - 17px) 50%, calc(100% - 12px) 50%;
      background-size: 5px 5px, 5px 5px;
      background-repeat: no-repeat;
    }
    .auth-select option { background: var(--ui-surface); color: var(--ui-text); }

    /* ── Primary CTA button ───────────────────────────────────────────────── */
    .auth-btn-primary {
      width: 100%; height: 46px; padding: 0 20px;
      background: var(--ui-accent); border: 1px solid var(--ui-accent);
      border-radius: var(--ui-radius); color: var(--ui-on-accent);
      font-size: var(--ui-fs-md); font-weight: var(--ui-fw-semibold); cursor: pointer;
      font-family: inherit;
      transition: background-color var(--ui-duration) var(--ui-ease), box-shadow var(--ui-duration) var(--ui-ease);
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .auth-btn-primary:hover:not(:disabled) { background: var(--ui-accent-hover); }
    .auth-btn-primary:focus-visible { outline: none; box-shadow: var(--ui-ring); }
    .auth-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Secondary / SSO button ───────────────────────────────────────────── */
    .auth-btn-secondary {
      width: 100%; height: 44px; padding: 0 18px;
      background: var(--ui-surface);
      border: 1px solid var(--ui-border-2);
      border-radius: var(--ui-radius); color: var(--ui-text);
      font-size: var(--ui-fs-base); font-weight: var(--ui-fw-semibold); cursor: pointer;
      font-family: inherit;
      transition: border-color var(--ui-duration) var(--ui-ease), background-color var(--ui-duration) var(--ui-ease), box-shadow var(--ui-duration) var(--ui-ease);
      display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .auth-btn-secondary:hover { background: var(--ui-hover); }
    .auth-btn-secondary:focus-visible { outline: none; box-shadow: var(--ui-ring); }

    /* ── Ghost / text links ───────────────────────────────────────────────── */
    .auth-ghost-link {
      background: none; border: none; cursor: pointer; padding: 0;
      font-size: var(--ui-fs-sm); color: var(--ui-text-3); font-family: inherit;
      text-decoration: underline; transition: color var(--ui-duration);
    }
    .auth-ghost-link:hover { color: var(--ui-accent-text); }
    .auth-link-btn {
      background: none; border: none; cursor: pointer; padding: 0;
      color: var(--ui-accent-text); font-weight: var(--ui-fw-bold); font-size: var(--ui-fs-sm);
      font-family: inherit; text-decoration: none; transition: color var(--ui-duration);
    }
    .auth-link-btn:hover { text-decoration: underline; }

    /* ── OR divider ───────────────────────────────────────────────────────── */
    .auth-or-divider {
      display: flex; align-items: center; gap: 12px;
      font-size: var(--ui-fs-2xs); font-weight: var(--ui-fw-bold); color: var(--ui-text-3);
      letter-spacing: var(--ui-tracking-wide); text-transform: uppercase;
      margin: 2px 0;
    }
    .auth-or-divider::before,
    .auth-or-divider::after {
      content: ""; flex: 1; height: 1px; background: var(--ui-border);
    }

    /* ── Alert boxes (ui-callout look) ────────────────────────────────────── */
    .auth-alert-error, .auth-alert-success, .auth-alert-warning {
      padding: 10px 14px; border-radius: var(--ui-radius); font-size: var(--ui-fs-sm);
      font-weight: var(--ui-fw-medium); line-height: var(--ui-lh-body);
    }
    .auth-alert-error   { background: var(--ui-danger-soft);  color: var(--ui-danger-text); }
    .auth-alert-success { background: var(--ui-success-soft); color: var(--ui-success-text); }
    .auth-alert-warning { background: var(--ui-warning-soft); color: var(--ui-warning-text); }

    /* ── Password show/hide toggle ────────────────────────────────────────── */
    .auth-pw-toggle {
      position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 0;
      font-size: var(--ui-fs-xs); font-weight: var(--ui-fw-bold); color: var(--ui-accent-text);
      font-family: inherit;
    }
    .auth-pw-toggle:hover { text-decoration: underline; }

    /* ── OTP boxes ────────────────────────────────────────────────────────── */
    .auth-otp-row { display: flex; gap: 10px; margin-bottom: 28px; justify-content: center; }
    .auth-otp-box {
      width: 48px; height: 56px;
      border: 1px solid var(--ui-border-2);
      border-radius: var(--ui-radius); text-align: center;
      font-size: var(--ui-fs-xl); font-weight: var(--ui-fw-heavy);
      color: var(--ui-text); font-family: var(--ui-font-display);
      background: var(--ui-surface); outline: none;
      transition: border-color var(--ui-duration), box-shadow var(--ui-duration);
      caret-color: var(--ui-accent);
    }
    .auth-otp-box:focus { border-color: var(--ui-accent); box-shadow: var(--ui-ring); }
    .auth-otp-box:disabled { background: var(--ui-surface-2); color: var(--ui-text-3); }
    @media (max-width: 480px) {
      .auth-otp-row { gap: 6px; }
      .auth-otp-box { width: 40px; height: 50px; }
    }

    /* ── Char counter ─────────────────────────────────────────────────────── */
    .auth-char-counter {
      font-size: var(--ui-fs-xs); font-weight: var(--ui-fw-semibold); color: var(--ui-text-3);
      text-align: right; transition: color 0.2s;
    }
    .auth-char-counter.warn  { color: var(--ui-warning-text); }
    .auth-char-counter.limit { color: var(--ui-danger-text); }

    /* ── Field validation hint ────────────────────────────────────────────── */
    .auth-field-hint {
      font-size: var(--ui-fs-xs); font-weight: var(--ui-fw-medium);
      color: var(--ui-danger-text); margin: 4px 0 0;
    }
    .auth-field-hint--tight { margin-top: -4px; }

    /* ── Region / example chips ───────────────────────────────────────────── */
    .auth-region { margin: 2px 0 4px; }
    .auth-region__label { display: block; font-size: var(--ui-fs-xs); color: var(--ui-text-3); margin-bottom: 6px; }
    .auth-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .auth-chips--spaced { margin-bottom: 22px; }
    .auth-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; font-size: var(--ui-fs-xs); font-weight: var(--ui-fw-medium);
      color: var(--ui-text-2); background: var(--ui-surface-2);
      border: 1px solid var(--ui-border); border-radius: var(--ui-radius-pill);
      cursor: pointer; font-family: inherit;
      transition: background-color var(--ui-duration), border-color var(--ui-duration), color var(--ui-duration);
    }
    .auth-chip:hover:not(:disabled) { background: var(--ui-accent-soft); border-color: var(--ui-accent); }
    .auth-chip.is-selected { background: var(--ui-accent-soft); border-color: var(--ui-accent); color: var(--ui-accent-text); font-weight: var(--ui-fw-bold); }
    .auth-chip:disabled { opacity: 0.55; cursor: not-allowed; }
    .auth-chip__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--ui-accent); display: inline-block; }
    .auth-kicker {
      display: inline-block; margin-bottom: 20px; padding: 5px 13px;
      background: var(--ui-accent-soft); color: var(--ui-accent-text);
      border: 1px solid var(--ui-accent-soft-2); border-radius: var(--ui-radius-pill);
      font-size: var(--ui-fs-2xs); font-weight: var(--ui-fw-heavy);
      letter-spacing: var(--ui-tracking-wide); text-transform: uppercase;
    }
    .auth-desc-meta { display: flex; justify-content: space-between; align-items: center; margin: 6px 0 24px; }
    .auth-desc-meta__hint { font-size: var(--ui-fs-xs); color: var(--ui-text-3); }

    /* ── Spinners ─────────────────────────────────────────────────────────── */
    .auth-spinner {
      display: inline-block; width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
      border: 2px solid color-mix(in srgb, var(--ui-on-accent) 40%, transparent);
      border-top-color: var(--ui-on-accent);
      animation: orbit-spin 0.7s linear infinite;
    }
    .auth-spinner--lg {
      width: 28px; height: 28px; margin: 0 auto 18px; border-width: 3px;
      border-color: var(--ui-border); border-top-color: var(--ui-accent);
    }

    /* ── Password strength meter ──────────────────────────────────────────── */
    .auth-strength { margin-top: 6px; }
    .auth-strength__track { height: 3px; border-radius: 4px; background: var(--ui-border); overflow: hidden; }
    .auth-strength__bar { height: 100%; border-radius: 4px; transition: width 0.3s ease, background-color 0.3s ease; }
    .auth-strength__label { display: block; margin-top: 3px; font-size: var(--ui-fs-xs); font-weight: var(--ui-fw-semibold); }

    /* ── CAPTCHA frame ─────────────────────────────────────────────────────── */
    .auth-captcha-wrap { display: flex; flex-direction: column; gap: 8px; margin: 2px 0; }
    .auth-captcha-label {
      display: flex; align-items: center; gap: 6px;
      font-size: var(--ui-fs-2xs); font-weight: var(--ui-fw-bold); letter-spacing: var(--ui-tracking-wide); text-transform: uppercase;
      color: var(--ui-text-3); transition: color 0.2s;
    }
    .auth-captcha-wrap.is-verified .auth-captcha-label { color: var(--ui-accent-text); }
    .auth-captcha-frame {
      display: flex; justify-content: center; align-items: center;
      padding: 12px; background: var(--ui-surface-2);
      border: 1px solid var(--ui-border); border-radius: var(--ui-radius);
      transition: border-color 0.22s, box-shadow 0.22s, background-color 0.22s;
      overflow: hidden;
    }
    .auth-captcha-frame:hover { border-color: var(--ui-border-2); }
    .auth-captcha-wrap.is-verified .auth-captcha-frame {
      border-color: var(--ui-accent);
      box-shadow: var(--ui-ring);
      background: var(--ui-surface);
    }
  `;
  document.head.appendChild(s);
}

// ── Left panel branding data ──────────────────────────────────────────────────
const FEATURES = [
  "Bite-sized learning modules for every team",
  "Ideas inbox reviewed by a real Product Council",
  "Daily streaks, checklists, and Lightyears rewards",
  "Live leaderboard & team progress tracking",
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AuthLayout({ children }) {
  const { theme, toggleTheme } = useContext(ThemeContext) || {};
  return (
    <div className="auth-shell">
      <button
        type="button"
        className="ui-btn ui-btn--ghost ui-btn--icon auth-theme-toggle"
        aria-label="Toggle theme"
        onClick={toggleTheme}
      >
        {theme === "dark" ? <PiSunBold size={18} /> : <PiMoonBold size={18} />}
      </button>

      {/* ── Split-panel card ───────────────────────────────────────────────── */}
      <div className="auth-card-shell">

        {/* ── LEFT: Branding panel (.ui-hero gradient) ─────────────────────── */}
        <div className="auth-brand ui-hero">
          <div aria-hidden="true" className="auth-brand__ring auth-brand__ring--1" />
          <div aria-hidden="true" className="auth-brand__ring auth-brand__ring--2" />

          <div className="auth-brand__top">
            {/* Logo mark */}
            <div className="auth-brand__logo-row">
              <div className="auth-brand__logo">◎</div>
              <div>
                <div className="auth-brand__name">IRIS Orbit</div>
                <div className="auth-brand__by">by IRIS Regtech</div>
              </div>
            </div>

            {/* Tagline */}
            <h2 className="auth-brand__tagline">
              Your learning,{" "}
              <span className="ui-accent-word">your pace.</span>
            </h2>
            <p className="auth-brand__sub">
              One platform to learn, practice, and grow — built for every team at IRIS.
            </p>

            {/* Feature dots */}
            <div className="auth-brand__features">
              {FEATURES.map((f, i) => (
                <div key={i} className="auth-brand__feature">
                  <div className="auth-brand__tick" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer copy */}
          <div className="auth-brand__foot">
            © IRIS Orbit · Built by IRIS Regtech Solutions
          </div>
        </div>

        {/* ── RIGHT: Content slot ───────────────────────────────────────── */}
        <div className="auth-slot">
          {children}
        </div>

      </div>
    </div>
  );
}
