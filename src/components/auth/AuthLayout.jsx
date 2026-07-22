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
import React from "react";

// ── Inject shared auth utility classes once ────────────────────────────────
// Keyframes (auth-fade-up, auth-fade-out, auth-otp-focus, orbit-spin, etc.)
// live in index.css. This block injects the reusable class-based styles.
if (typeof document !== "undefined" && !document.getElementById("orbit-auth-styles")) {
  const s = document.createElement("style");
  s.id = "orbit-auth-styles";
  s.textContent = `
    /* ── Entry / exit animations ─────────────────────────────────────────── */
    .auth-fade-in  { animation: auth-fade-up  0.34s cubic-bezier(0.22,1,0.36,1) both; }
    .auth-fade-out { animation: auth-fade-out 0.26s ease both; }

    /* ── Form inputs ──────────────────────────────────────────────────────── */
    .auth-input {
      width: 100%; padding: 12px 14px;
      background: var(--orbit-surface-subtle);
      border: 1.5px solid var(--orbit-border);
      border-radius: 10px;
      font-size: 14px; color: var(--orbit-text-heading);
      font-family: inherit; outline: none;
      transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
      box-sizing: border-box;
    }
    .auth-input::placeholder { color: var(--orbit-text-muted); }
    .auth-input:focus {
      border-color: var(--orbit-brand);
      box-shadow: 0 0 0 3px rgba(124,110,247,0.14);
      background: var(--orbit-surface);
    }
    .auth-input:disabled { opacity: 0.52; cursor: not-allowed; }

    /* ── Cascade selects ──────────────────────────────────────────────────── */
    .auth-select {
      width: 100%; padding: 12px 38px 12px 14px;
      background: var(--orbit-surface-subtle);
      border: 1.5px solid var(--orbit-border);
      border-radius: 10px;
      font-size: 14px; color: var(--orbit-text-heading);
      font-family: inherit; outline: none; cursor: pointer;
      transition: border-color 0.18s, box-shadow 0.18s;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' viewBox='0 0 11 7'%3E%3Cpath stroke='%238b8399' stroke-width='1.4' fill='none' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4.5 4.5L10 1'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 13px center;
      box-sizing: border-box;
    }
    .auth-select:focus {
      border-color: var(--orbit-brand);
      box-shadow: 0 0 0 3px rgba(124,110,247,0.14);
    }
    .auth-select:disabled { opacity: 0.48; cursor: not-allowed; }
    .auth-select option { background: var(--orbit-surface); color: var(--orbit-text-heading); }

    /* ── Primary CTA button ───────────────────────────────────────────────── */
    .auth-btn-primary {
      width: 100%; padding: 13px 20px;
      background: var(--orbit-brand);
      border: none; border-bottom: 3px solid var(--orbit-brand-dark);
      border-radius: 12px; color: #fff;
      font-size: 15px; font-weight: 700; cursor: pointer;
      font-family: inherit; letter-spacing: 0.15px;
      transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      will-change: transform;
    }
    .auth-btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(124,110,247,0.34);
      filter: brightness(1.06);
    }
    .auth-btn-primary:active:not(:disabled) { transform: translateY(0); }
    .auth-btn-primary:disabled { opacity: 0.48; cursor: not-allowed; }

    /* ── Secondary / SSO button ───────────────────────────────────────────── */
    .auth-btn-secondary {
      width: 100%; padding: 11px 18px;
      background: var(--orbit-surface);
      border: 1.5px solid var(--orbit-border-strong);
      border-radius: 12px; color: var(--orbit-text-body);
      font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: inherit;
      transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
      display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .auth-btn-secondary:hover {
      background: var(--orbit-surface-subtle);
      border-color: var(--orbit-text-muted);
      box-shadow: var(--orbit-shadow-sm);
    }

    /* ── Ghost / text links ───────────────────────────────────────────────── */
    .auth-ghost-link {
      background: none; border: none; cursor: pointer; padding: 0;
      font-size: 13px; color: var(--orbit-text-muted); font-family: inherit;
      text-decoration: underline; transition: color 0.15s;
    }
    .auth-ghost-link:hover { color: var(--orbit-brand); }
    .auth-link-btn {
      background: none; border: none; cursor: pointer; padding: 0;
      color: var(--orbit-brand); font-weight: 700; font-size: 13px;
      font-family: inherit; text-decoration: none; transition: color 0.15s;
    }
    .auth-link-btn:hover { color: var(--orbit-brand-dark); text-decoration: underline; }

    /* ── OR divider ───────────────────────────────────────────────────────── */
    .auth-or-divider {
      display: flex; align-items: center; gap: 12px;
      font-size: 11px; font-weight: 700; color: var(--orbit-text-muted);
      letter-spacing: 0.8px; text-transform: uppercase;
      margin: 2px 0;
    }
    .auth-or-divider::before,
    .auth-or-divider::after {
      content: ""; flex: 1; height: 1px; background: var(--orbit-border);
    }

    /* ── Alert boxes ──────────────────────────────────────────────────────── */
    .auth-alert-error {
      padding: 10px 14px; border-radius: 10px; font-size: 13px;
      font-weight: 500; line-height: 1.55;
      background: var(--pastel-quiz); border: 1px solid var(--pastel-quiz-border);
      color: var(--pastel-quiz-text);
    }
    .auth-alert-success {
      padding: 10px 14px; border-radius: 10px; font-size: 13px;
      font-weight: 500; line-height: 1.55;
      background: var(--pastel-progress); border: 1px solid var(--pastel-progress-border);
      color: var(--pastel-progress-text);
    }
    .auth-alert-warning {
      padding: 10px 14px; border-radius: 10px; font-size: 13px;
      font-weight: 500; line-height: 1.55;
      background: var(--pastel-reads); border: 1px solid var(--pastel-reads-border);
      color: var(--pastel-reads-text);
    }

    /* ── Password show/hide toggle ────────────────────────────────────────── */
    .auth-pw-toggle {
      position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 0;
      font-size: 12px; font-weight: 700; color: var(--orbit-brand);
      font-family: inherit; letter-spacing: 0.2px;
      transition: color 0.15s;
    }
    .auth-pw-toggle:hover { color: var(--orbit-brand-dark); }

    /* ── OTP boxes ────────────────────────────────────────────────────────── */
    .auth-otp-box {
      width: 48px; height: 56px;
      border: 1.5px solid var(--orbit-border);
      border-radius: 12px; text-align: center;
      font-size: 22px; font-weight: 800;
      color: var(--orbit-text-heading); font-family: inherit;
      background: var(--orbit-surface-subtle); outline: none;
      transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
      caret-color: var(--orbit-brand);
    }
    .auth-otp-box:focus {
      border-color: var(--orbit-brand);
      background: var(--orbit-surface);
      animation: auth-otp-focus 0.4s ease;
    }

    /* ── Char counter ─────────────────────────────────────────────────────── */
    .auth-char-counter {
      font-size: 11px; font-weight: 600; color: var(--orbit-text-muted);
      text-align: right; transition: color 0.2s;
    }
    .auth-char-counter.warn  { color: var(--pastel-reads-text); }
    .auth-char-counter.limit { color: var(--pastel-quiz-text); }

    /* ── Field validation hint ────────────────────────────────────────────── */
    .auth-field-hint {
      font-size: 11.5px; font-weight: 500;
      color: var(--pastel-quiz-text); margin-top: 4px;
    }
  `;
  document.head.appendChild(s);
}

// ── Left panel branding data ──────────────────────────────────────────────────
const FEATURES = [
  "Bite-sized learning modules for every team",
  "Ideas inbox reviewed by a real Product Council",
  "Daily streaks, checklists, and Lightyear rewards",
  "Live leaderboard & team progress tracking",
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AuthLayout({ children }) {
  return (
    /* Transparent centering wrapper — body orbital canvas shows behind the card */
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 20px",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>

      {/* ── Wide split-panel card (has own solid surface — floats on canvas) ── */}
      <div style={{
        width: "100%", maxWidth: "960px",
        background: "var(--orbit-surface)",
        borderRadius: "24px",
        boxShadow: "0 24px 80px rgba(124,110,247,0.18), 0 0 0 1.5px var(--orbit-border)",
        overflow: "hidden",
        display: "flex",
        minHeight: "580px",
      }}>

        {/* ── LEFT: Branding panel ─────────────────────────────────────── */}
        <div style={{
          width: "360px", flexShrink: 0, padding: "52px 38px",
          background: "linear-gradient(168deg, var(--orbit-brand-muted) 0%, var(--pastel-modules) 52%, rgba(209,250,229,0.48) 100%)",
          borderRight: "1.5px solid var(--orbit-border)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          position: "relative", overflow: "hidden",
        }}>
          {/* Watermark rings */}
          <div aria-hidden="true" style={{
            position: "absolute", bottom: "-55px", right: "-55px",
            width: "255px", height: "255px", borderRadius: "50%",
            border: "2px solid var(--orbit-brand-muted)", opacity: 0.28, pointerEvents: "none",
          }} />
          <div aria-hidden="true" style={{
            position: "absolute", bottom: "8px", right: "8px",
            width: "165px", height: "165px", borderRadius: "50%",
            border: "1.5px solid var(--pastel-modules-border)", opacity: 0.22, pointerEvents: "none",
          }} />

          <div>
            {/* Logo mark */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "44px" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: "var(--orbit-brand)",
                boxShadow: "0 0 0 7px rgba(124,110,247,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "16px", fontWeight: "900", flexShrink: 0,
              }}>◎</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--orbit-text-heading)", letterSpacing: "0.2px" }}>
                  IRIS Orbit
                </div>
                <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--orbit-text-muted)", letterSpacing: "1.3px", textTransform: "uppercase" }}>
                  by IRIS Regtech
                </div>
              </div>
            </div>

            {/* Tagline */}
            <h2 style={{
              fontSize: "clamp(20px, 2.2vw, 26px)",
              fontWeight: "800", letterSpacing: "-0.5px", lineHeight: 1.22,
              color: "var(--orbit-text-heading)", margin: "0 0 10px",
              fontFamily: "'Georgia', 'Palatino', serif",
            }}>
              Your learning,{" "}
              <span style={{ color: "var(--orbit-brand)" }}>your pace.</span>
            </h2>
            <p style={{
              fontSize: "13.5px", color: "var(--orbit-text-muted)", lineHeight: 1.72, margin: "0 0 34px",
            }}>
              One platform to learn, practice, and grow — built for every team at IRIS.
            </p>

            {/* Feature dots */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: "var(--orbit-brand-muted)",
                    border: "1.5px solid var(--orbit-brand)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: "1px",
                  }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--orbit-brand)" }} />
                  </div>
                  <span style={{ fontSize: "13px", color: "var(--orbit-text-body)", fontWeight: "500", lineHeight: 1.5 }}>
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer copy */}
          <div style={{ fontSize: "11px", color: "var(--orbit-text-muted)", lineHeight: 1.6, paddingTop: "24px" }}>
            © IRIS Orbit · Built by IRIS Regtech Solutions
          </div>
        </div>

        {/* ── RIGHT: Content slot ───────────────────────────────────────── */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "52px 48px", overflowY: "auto",
        }}>
          {children}
        </div>

      </div>
    </div>
  );
}
