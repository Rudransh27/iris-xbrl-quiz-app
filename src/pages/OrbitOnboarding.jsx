// src/pages/OrbitOnboarding.jsx
// ─────────────────────────────────────────────────────────────────────────────
// IRIS Orbit — First-Time Onboarding Screen (v3 — Single Column Centerpiece)
//
// Mounted at /onboarding — Layout.jsx passes it through (no Navbar/Footer).
// Body orbital canvas (index.css) provides the base backdrop.
// Colorful decorative rings are layered on top for visual depth.
// Phase machine: "question" → "q-exit" → "response" (no back, commit-forward)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const OPTIONS = [
  { key: "product", emoji: "🎯", label: "I want to actually understand what we sell — and why it matters." },
  { key: "sharp",   emoji: "🔥", label: "I want to stay sharp. AI is moving fast, and I don't want to be left behind." },
  { key: "ideas",   emoji: "💡", label: "I have ideas. I want them to actually go somewhere." },
];

const RESPONSES = {
  product: {
    tag: "YOU'RE NOT ALONE",
    title: "Most people don't. And most people pretend they do.",
    body: "IRIS Orbit is built for the ones who'd rather know than pretend. You'll meet the product at the level it actually works — then the customers who buy it, then the reasons they do.",
    accent: "var(--pastel-quiz-border)", accentBg: "var(--pastel-quiz)", tagColor: "var(--pastel-quiz-text)",
  },
  sharp: {
    tag: "GOOD — SO ARE WE",
    title: "The ones who stay sharp, stay.",
    body: "This is a workshop for people who want to stay ahead of what's coming. AI, new frameworks, how the buyer is changing — you'll see it here first, before the market catches up.",
    accent: "var(--pastel-progress-border)", accentBg: "var(--pastel-progress)", tagColor: "var(--pastel-progress-text)",
  },
  ideas: {
    tag: "WE WERE HOPING YOU'D SAY THAT",
    title: "Your ideas are not going into a void.",
    body: "Every idea you submit goes to a real Product Council. They meet fortnightly. You'll get a reply — always. Build, Ship, Not Yet, or Parked with a reason. No silence.",
    accent: "var(--pastel-reads-border)", accentBg: "var(--pastel-reads)", tagColor: "var(--pastel-reads-text)",
  },
};

// ── Colorful decorative rings — overlay on body canvas for visual depth ──────
// Each uses a different pastel token so the rings read as multi-colored.
// `auth-ring-pulse` keyframe lives in index.css.
const RINGS = [
  { top: "3%",   right: "2%",  size: 260, color: "var(--orbit-brand)",           opacity: 0.28, speed: 8  },
  { top: "7%",   right: "9%",  size: 140, color: "var(--pastel-modules-border)",  opacity: 0.45, speed: 10 },
  { bottom: "4%",left: "2%",   size: 320, color: "var(--pastel-progress-border)", opacity: 0.20, speed: 13 },
  { bottom: "13%",left: "8%",  size: 95,  color: "var(--pastel-quiz-border)",     opacity: 0.40, speed: 9  },
  { top: "42%",  left: "1%",   size: 160, color: "var(--pastel-reads-border)",    opacity: 0.26, speed: 15 },
  { top: "56%",  right: "1%",  size: 120, color: "var(--pastel-ideas-border)",    opacity: 0.32, speed: 11 },
  { top: "28%",  right: "3%",  size:  72, color: "var(--pastel-streak-border)",   opacity: 0.38, speed: 7  },
];

if (typeof document !== "undefined" && !document.getElementById("orbit-onboarding-kf")) {
  const s = document.createElement("style");
  s.id = "orbit-onboarding-kf";
  s.textContent = `
    .ob-fade-in  { animation: auth-fade-up  0.34s cubic-bezier(0.22,1,0.36,1) both; }
    .ob-fade-out { animation: auth-fade-out 0.26s ease both; }

    .ob-opt-btn {
      display: flex; align-items: flex-start; gap: 16px;
      padding: 18px 24px; width: 100%; text-align: left;
      background: rgba(255,255,255,0.84);
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border: 1.5px solid rgba(124,110,247,0.22);
      border-radius: 16px; cursor: pointer; font-family: inherit;
      transition: background 0.18s, border-color 0.18s, transform 0.14s, box-shadow 0.18s;
      will-change: transform;
    }
    [data-theme="dark"] .ob-opt-btn {
      background: rgba(19,17,36,0.80);
      border-color: rgba(49,46,92,0.62);
    }
    .ob-opt-btn:hover {
      background: rgba(237,233,254,0.96);
      border-color: var(--orbit-brand);
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(124,110,247,0.18);
    }
    [data-theme="dark"] .ob-opt-btn:hover {
      background: rgba(49,46,92,0.72);
    }
    .ob-opt-btn:hover .ob-opt-text { color: var(--orbit-brand) !important; }
    .ob-opt-btn.selected {
      background: rgba(237,233,254,0.98);
      border-color: var(--orbit-brand);
      box-shadow: 0 4px 20px rgba(124,110,247,0.14);
    }
    [data-theme="dark"] .ob-opt-btn.selected { background: rgba(49,46,92,0.82); }

    .ob-cta-btn {
      width: 100%; padding: 15px 20px;
      background: var(--orbit-brand);
      border: none; border-bottom: 3px solid var(--orbit-brand-dark);
      border-radius: 14px; color: #fff;
      font-size: 15px; font-weight: 700; cursor: pointer;
      font-family: inherit; letter-spacing: 0.15px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: transform 0.14s, box-shadow 0.14s, filter 0.14s;
      will-change: transform;
    }
    .ob-cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(124,110,247,0.36);
      filter: brightness(1.06);
    }
    .ob-ghost-btn {
      background: none; border: none; cursor: pointer; padding: 0;
      font-size: 13px; color: var(--orbit-text-muted); font-family: inherit;
      text-decoration: underline; transition: color 0.15s;
    }
    .ob-ghost-btn:hover { color: var(--orbit-brand); }
  `;
  document.head.appendChild(s);
}

export default function OrbitOnboarding() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [phase, setPhase]       = useState("question");

  const handleSelect = useCallback((key) => {
    setSelected(key);
    setPhase("q-exit");
    setTimeout(() => setPhase("response"), 300);
  }, []);

  const commit = (dest) => {
    localStorage.setItem("orbit_onboarded", "true");
    if (selected) localStorage.setItem("orbit_motivation", selected);
    navigate(dest);
  };

  const resp  = selected ? RESPONSES[selected] : null;
  const showQ = phase === "question" || phase === "q-exit";
  const showR = phase === "response";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "60px 24px 48px",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: "relative", overflow: "hidden",
    }}>

      {/* ── Colorful decorative rings — overlay on global body canvas ─────── */}
      {RINGS.map((r, i) => (
        <div key={i} aria-hidden="true" style={{
          position: "absolute",
          top: r.top, right: r.right, bottom: r.bottom, left: r.left,
          width: r.size, height: r.size, borderRadius: "50%",
          border: `1.5px solid ${r.color}`, opacity: r.opacity,
          pointerEvents: "none",
          animation: `auth-ring-pulse ${r.speed}s ease-in-out infinite`,
          animationDelay: `${i * 0.8}s`,
        }} />
      ))}

      {/* ── Centered content column (max 720px) ─────────────────────────── */}
      <div style={{ width: "100%", maxWidth: "720px" }}>

        {/* ══ SCREEN 1 — QUESTION ══════════════════════════════════════════ */}
        {showQ && (
          <div
            className={phase === "q-exit" ? "ob-fade-out" : "ob-fade-in"}
            style={{ width: "100%" }}
          >
            {/* "BEFORE YOU GO IN" badge */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "rgba(255,255,255,0.70)",
                backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
                color: "var(--orbit-brand)",
                fontSize: "10px", fontWeight: "800", letterSpacing: "2.4px",
                textTransform: "uppercase", padding: "7px 20px",
                borderRadius: "var(--radius-full)",
                border: "1.5px solid rgba(124,110,247,0.40)",
                boxShadow: "0 2px 20px rgba(124,110,247,0.12)",
              }}>
                ◎ BEFORE YOU GO IN
              </span>
            </div>

            {/* Premium editorial serif heading */}
            <h1 style={{
              fontSize: "clamp(36px, 5.8vw, 60px)",
              fontWeight: "800", letterSpacing: "-1.4px", lineHeight: 1.06,
              color: "var(--orbit-text-heading)", margin: "0 0 18px",
              fontFamily: "'Georgia', 'Palatino', 'Times New Roman', serif",
              textAlign: "center",
            }}>
              What brought you here?
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: "16px", color: "var(--orbit-text-muted)",
              margin: "0 auto 44px", lineHeight: 1.74, textAlign: "center",
              maxWidth: "500px",
            }}>
              Pick the one that sounds most like you right now.{" "}
              <em>No wrong answer.</em>
            </p>

            {/* Stacked frosted-glass option cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "0" }}>
              {OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className={`ob-opt-btn${selected === opt.key ? " selected" : ""}`}
                  onClick={() => handleSelect(opt.key)}
                >
                  <span style={{ fontSize: "26px", flexShrink: 0, lineHeight: 1.3, marginTop: "1px" }}>
                    {opt.emoji}
                  </span>
                  <span className="ob-opt-text" style={{
                    fontSize: "15px", fontWeight: "600", lineHeight: 1.58,
                    color: "var(--orbit-text-heading)", transition: "color 0.18s",
                  }}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ SCREEN 2 — RESPONSE (no back — commit forward) ══════════════ */}
        {showR && resp && (
          <div className="ob-fade-in" style={{ width: "100%" }}>

            <div style={{
              textAlign: "center", marginBottom: "30px",
              fontSize: "13px", color: "var(--orbit-text-muted)", fontWeight: "600",
            }}>
              You said:{" "}
              <span style={{ color: "var(--orbit-text-body)" }}>
                {OPTIONS.find(o => o.key === selected)?.emoji}{" "}
                &ldquo;{OPTIONS.find(o => o.key === selected)?.label}&rdquo;
              </span>
            </div>

            <div style={{
              background: resp.accentBg,
              backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
              borderLeft: `5px solid ${resp.accent}`,
              borderRadius: "0 20px 20px 0",
              padding: "28px 32px 32px",
              marginBottom: "32px",
              position: "relative", overflow: "hidden",
            }}>
              <div aria-hidden="true" style={{
                position: "absolute", top: "-32px", right: "-32px",
                width: "130px", height: "130px", borderRadius: "50%",
                border: `2px solid ${resp.accent}`, opacity: 0.16, pointerEvents: "none",
              }} />

              <div style={{
                display: "inline-flex", alignItems: "center",
                padding: "4px 14px",
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                border: `1px solid ${resp.accent}`, borderRadius: "var(--radius-full)",
                fontSize: "10px", fontWeight: "800", letterSpacing: "1.5px",
                textTransform: "uppercase", color: resp.tagColor, marginBottom: "16px",
              }}>
                {resp.tag}
              </div>

              <h2 style={{
                fontSize: "clamp(20px, 2.8vw, 26px)", fontWeight: "800",
                color: "var(--orbit-text-heading)", margin: "0 0 12px",
                lineHeight: 1.24, letterSpacing: "-0.4px",
                fontFamily: "'Georgia', 'Palatino', serif",
              }}>
                {resp.title}
              </h2>
              <p style={{ fontSize: "14.5px", color: "var(--orbit-text-body)", margin: 0, lineHeight: 1.78 }}>
                {resp.body}
              </p>
            </div>

            <button className="ob-cta-btn" onClick={() => commit("/register")} style={{ marginBottom: "16px" }}>
              I'm ready. Let's go →
            </button>

            <div style={{ textAlign: "center" }}>
              <button className="ob-ghost-btn" onClick={() => commit("/login")}>
                Already have an account? Sign in
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Skip anchor — below main column, only on question screen ─────── */}
      {showQ && (
        <div style={{ marginTop: "36px", textAlign: "center" }}>
          <button
            className="ob-ghost-btn"
            onClick={() => navigate("/login")}
          >
            Already know what this is? Skip to sign in →
          </button>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: "52px", textAlign: "center",
        fontSize: "11px", color: "var(--orbit-text-muted)", lineHeight: 1.6,
        opacity: 0.7,
      }}>
        © IRIS Orbit · Built by IRIS Regtech Solutions
      </div>

    </div>
  );
}
