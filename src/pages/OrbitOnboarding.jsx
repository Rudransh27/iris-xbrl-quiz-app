// src/pages/OrbitOnboarding.jsx
// ─────────────────────────────────────────────────────────────────────────────
// IRIS Orbit — First-Time Onboarding Screen (v3 — Single Column Centerpiece)
//
// Mounted at /onboarding — Layout.jsx passes it through (no Navbar/Footer).
// Body orbital canvas (index.css) provides the base backdrop.
// Colorful decorative rings are layered on top for visual depth.
// Phase machine: "question" → "q-exit" → "response" (no back, commit-forward)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PiSunBold, PiMoonBold } from "react-icons/pi";
import { ThemeContext } from "../context/ThemeContext";

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
    accent: "var(--cat-rose)", accentBg: "var(--cat-rose-soft)", tagColor: "var(--cat-rose-text)",
  },
  sharp: {
    tag: "GOOD — SO ARE WE",
    title: "The ones who stay sharp, stay.",
    body: "This is a workshop for people who want to stay ahead of what's coming. AI, new frameworks, how the buyer is changing — you'll see it here first, before the market catches up.",
    accent: "var(--cat-teal)", accentBg: "var(--cat-teal-soft)", tagColor: "var(--cat-teal-text)",
  },
  ideas: {
    tag: "WE WERE HOPING YOU'D SAY THAT",
    title: "Your ideas are not going into a void.",
    body: "Every idea you submit goes to a real Product Council. They meet fortnightly. You'll get a reply — always. Build, Ship, Not Yet, or Parked with a reason. No silence.",
    accent: "var(--cat-amber)", accentBg: "var(--cat-amber-soft)", tagColor: "var(--cat-amber-text)",
  },
};

// ── Decorative rings — thin outlines on the page canvas ──────────────────────
// Each uses a category token so the rings read as multi-coloured but calm.
// `auth-ring-pulse` keyframe lives in index.css.
const RINGS = [
  { top: "3%",   right: "2%",  size: 260, color: "var(--ui-accent)",  opacity: 0.28, speed: 8  },
  { top: "7%",   right: "9%",  size: 140, color: "var(--cat-violet)", opacity: 0.35, speed: 10 },
  { bottom: "4%",left: "2%",   size: 320, color: "var(--cat-teal)",   opacity: 0.20, speed: 13 },
  { bottom: "13%",left: "8%",  size: 95,  color: "var(--cat-rose)",   opacity: 0.35, speed: 9  },
  { top: "42%",  left: "1%",   size: 160, color: "var(--cat-amber)",  opacity: 0.26, speed: 15 },
  { top: "56%",  right: "1%",  size: 120, color: "var(--cat-sky)",    opacity: 0.32, speed: 11 },
  { top: "28%",  right: "3%",  size:  72, color: "var(--cat-green)",  opacity: 0.38, speed: 7  },
];

if (typeof document !== "undefined" && !document.getElementById("orbit-onboarding-kf")) {
  const s = document.createElement("style");
  s.id = "orbit-onboarding-kf";
  s.textContent = `
    .ob-fade-in  { animation: auth-fade-up  0.34s cubic-bezier(0.22,1,0.36,1) both; }
    .ob-fade-out { animation: auth-fade-out 0.26s ease both; }

    .ob-shell {
      min-height: 100vh; position: relative; overflow: hidden;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 60px 24px 48px;
      background: var(--ui-bg);
      font-family: var(--ui-font-sans);
    }
    .ob-theme-toggle {
      position: absolute; top: 14px; right: 14px; z-index: 2;
      background: var(--ui-surface); border: 1px solid var(--ui-border);
    }
    .ob-ring { position: absolute; border-radius: 50%; border: 1.5px solid; pointer-events: none; }
    .ob-col { position: relative; z-index: 1; width: 100%; max-width: 720px; }
    .ob-badge-row { display: flex; justify-content: center; margin-bottom: 28px; }
    .ob-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--ui-accent-soft); color: var(--ui-accent-text);
      border: 1px solid var(--ui-accent-soft-2); border-radius: var(--ui-radius-pill);
      padding: 6px 18px;
      font-size: var(--ui-fs-2xs); font-weight: var(--ui-fw-heavy);
      letter-spacing: var(--ui-tracking-wide); text-transform: uppercase;
    }
    .ob-title {
      font-family: var(--ui-font-display);
      font-size: clamp(32px, 5.6vw, var(--ui-fs-4xl)); font-weight: var(--ui-fw-heavy);
      letter-spacing: -0.03em; line-height: var(--ui-lh-tight);
      color: var(--ui-text); text-align: center; margin: 0 0 16px;
    }
    .ob-sub {
      font-size: var(--ui-fs-md); line-height: var(--ui-lh-body); color: var(--ui-text-2);
      text-align: center; margin: 0 auto 40px; max-width: 500px;
    }
    .ob-opts { display: flex; flex-direction: column; gap: 12px; }

    .ob-opt-btn {
      display: flex; align-items: flex-start; gap: 16px;
      padding: 18px 24px; width: 100%; text-align: left;
      background: var(--ui-surface);
      border: 1px solid var(--ui-border);
      border-radius: var(--ui-radius-lg); cursor: pointer; font-family: inherit;
      transition: background-color var(--ui-duration) var(--ui-ease), border-color var(--ui-duration) var(--ui-ease), transform var(--ui-duration) var(--ui-ease), box-shadow var(--ui-duration) var(--ui-ease);
    }
    .ob-opt-btn:hover {
      background: var(--ui-accent-soft);
      border-color: var(--ui-accent);
      transform: translateY(-1px);
      box-shadow: var(--ui-shadow-md);
    }
    .ob-opt-btn:focus-visible { outline: none; box-shadow: var(--ui-ring); }
    .ob-opt-btn.selected { background: var(--ui-accent-soft); border-color: var(--ui-accent); box-shadow: 0 0 0 1px var(--ui-accent); }
    .ob-opt-emoji { font-size: 26px; flex-shrink: 0; line-height: 1.3; margin-top: 1px; }
    .ob-opt-text {
      font-size: var(--ui-fs-md); font-weight: var(--ui-fw-semibold); line-height: 1.5;
      color: var(--ui-text); transition: color var(--ui-duration);
    }
    .ob-opt-btn:hover .ob-opt-text { color: var(--ui-accent-text); }

    .ob-said { text-align: center; margin-bottom: 28px; font-size: var(--ui-fs-sm); font-weight: var(--ui-fw-semibold); color: var(--ui-text-3); }
    .ob-said span { color: var(--ui-text-2); }
    .ob-resp {
      position: relative; overflow: hidden; margin-bottom: 28px;
      padding: 28px 32px 32px;
      background: var(--ob-accent-bg);
      border: 1px solid var(--ob-accent); border-left-width: 5px;
      border-radius: var(--ui-radius-lg);
    }
    .ob-resp__ring {
      position: absolute; top: -32px; right: -32px; width: 130px; height: 130px;
      border: 2px solid var(--ob-accent); border-radius: 50%; opacity: 0.2; pointer-events: none;
    }
    .ob-resp__tag {
      display: inline-flex; align-items: center; margin-bottom: 16px; padding: 4px 14px;
      background: var(--ui-surface); color: var(--ob-tag);
      border: 1px solid var(--ob-accent); border-radius: var(--ui-radius-pill);
      font-size: var(--ui-fs-2xs); font-weight: var(--ui-fw-heavy);
      letter-spacing: var(--ui-tracking-wide); text-transform: uppercase;
    }
    .ob-resp__title {
      font-family: var(--ui-font-display); font-size: clamp(20px, 2.8vw, var(--ui-fs-2xl));
      font-weight: var(--ui-fw-heavy); letter-spacing: var(--ui-tracking-tight); line-height: var(--ui-lh-tight);
      color: var(--ui-text); margin: 0 0 12px;
    }
    .ob-resp__body { font-size: var(--ui-fs-md); line-height: var(--ui-lh-body); color: var(--ui-text-2); margin: 0; }

    .ob-cta-btn {
      width: 100%; height: 48px; padding: 0 20px; margin-bottom: 16px;
      background: var(--ui-accent); border: 1px solid var(--ui-accent);
      border-radius: var(--ui-radius); color: var(--ui-on-accent);
      font-size: var(--ui-fs-md); font-weight: var(--ui-fw-semibold); cursor: pointer;
      font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background-color var(--ui-duration) var(--ui-ease), box-shadow var(--ui-duration) var(--ui-ease);
    }
    .ob-cta-btn:hover { background: var(--ui-accent-hover); }
    .ob-cta-btn:focus-visible { outline: none; box-shadow: var(--ui-ring); }
    .ob-ghost-btn {
      background: none; border: none; cursor: pointer; padding: 0;
      font-size: var(--ui-fs-sm); color: var(--ui-text-3); font-family: inherit;
      text-decoration: underline; transition: color var(--ui-duration);
    }
    .ob-ghost-btn:hover { color: var(--ui-accent-text); }
    .ob-center { text-align: center; }
    .ob-skip { position: relative; z-index: 1; margin-top: 32px; text-align: center; }
    .ob-foot { position: relative; z-index: 1; margin-top: 48px; text-align: center; font-size: var(--ui-fs-xs); line-height: 1.6; color: var(--ui-text-3); }
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

  const { theme, toggleTheme } = useContext(ThemeContext) || {};
  const resp  = selected ? RESPONSES[selected] : null;
  const showQ = phase === "question" || phase === "q-exit";
  const showR = phase === "response";

  return (
    <div className="ob-shell">
      <button
        type="button"
        className="ui-btn ui-btn--ghost ui-btn--icon ob-theme-toggle"
        aria-label="Toggle theme"
        onClick={toggleTheme}
      >
        {theme === "dark" ? <PiSunBold size={18} /> : <PiMoonBold size={18} />}
      </button>

      {/* ── Decorative rings — thin outlines behind the content ─────────────── */}
      {RINGS.map((r, i) => (
        <div key={i} aria-hidden="true" className="ob-ring" style={{
          top: r.top, right: r.right, bottom: r.bottom, left: r.left,
          width: r.size, height: r.size,
          borderColor: r.color, opacity: r.opacity,
          animation: `auth-ring-pulse ${r.speed}s ease-in-out infinite`,
          animationDelay: `${i * 0.8}s`,
        }} />
      ))}

      {/* ── Centered content column (max 720px) ─────────────────────────── */}
      <div className="ob-col">

        {/* ══ SCREEN 1 — QUESTION ══════════════════════════════════════════ */}
        {showQ && (
          <div className={phase === "q-exit" ? "ob-fade-out" : "ob-fade-in"}>
            {/* "BEFORE YOU GO IN" badge */}
            <div className="ob-badge-row">
              <span className="ob-badge">
                ◎ BEFORE YOU GO IN
              </span>
            </div>

            <h1 className="ob-title">
              What brought you here?
            </h1>

            {/* Subtitle */}
            <p className="ob-sub">
              Pick the one that sounds most like you right now.{" "}
              <em>No wrong answer.</em>
            </p>

            {/* Stacked option cards */}
            <div className="ob-opts">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className={`ob-opt-btn${selected === opt.key ? " selected" : ""}`}
                  onClick={() => handleSelect(opt.key)}
                >
                  <span className="ob-opt-emoji">
                    {opt.emoji}
                  </span>
                  <span className="ob-opt-text">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ SCREEN 2 — RESPONSE (no back — commit forward) ══════════════ */}
        {showR && resp && (
          <div className="ob-fade-in">

            <div className="ob-said">
              You said:{" "}
              <span>
                {OPTIONS.find(o => o.key === selected)?.emoji}{" "}
                &ldquo;{OPTIONS.find(o => o.key === selected)?.label}&rdquo;
              </span>
            </div>

            <div
              className="ob-resp"
              style={{ "--ob-accent": resp.accent, "--ob-accent-bg": resp.accentBg, "--ob-tag": resp.tagColor }}
            >
              <div aria-hidden="true" className="ob-resp__ring" />

              <div className="ob-resp__tag">
                {resp.tag}
              </div>

              <h2 className="ob-resp__title">
                {resp.title}
              </h2>
              <p className="ob-resp__body">
                {resp.body}
              </p>
            </div>

            <button className="ob-cta-btn" onClick={() => commit("/register")}>
              I'm ready. Let's go →
            </button>

            <div className="ob-center">
              <button className="ob-ghost-btn" onClick={() => commit("/login")}>
                Already have an account? Sign in
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Skip anchor — below main column, only on question screen ─────── */}
      {showQ && (
        <div className="ob-skip">
          <button
            className="ob-ghost-btn"
            onClick={() => navigate("/login")}
          >
            Already know what this is? Skip to sign in →
          </button>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="ob-foot">
        © IRIS Orbit · Built by IRIS Regtech Solutions
      </div>

    </div>
  );
}
