// src/components/homepage/IrisOrbitHome.jsx
// Dark, cinematic, space-themed marketing homepage for IRIS Orbit.
// Self-contained: all styling lives in IrisOrbitHome.css scoped under
// .ioh-root, all motion is CSS @keyframes + the small set of effects below
// (scroll reveal, count-up, cursor spotlight, hero parallax, browser tilt).
import React, { useContext, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  PiSparkleFill,
  PiCrosshairBold,
  PiSquaresFourBold,
  PiTargetBold,
  PiGameControllerBold,
  PiTrophyBold,
  PiArrowUpRightBold,
  PiArrowRightBold,
  PiFlameBold,
  PiCardsBold,
  PiLightbulbFilamentBold,
  PiFlaskBold,
  PiBrainBold,
  PiChartLineUpBold,
  PiUsersThreeBold,
  PiGraduationCapBold,
  PiCheckCircleBold,
  PiStackBold,
  PiCheckBold,
  PiPlayBold,
  PiRocketLaunchFill,
} from "react-icons/pi";
import AuthContext from "../../context/AuthContext";
import irisOrbitLogo from "../../assets/iris-orbit-logo.png";
import "./IrisOrbitHome.css";

// ============================================================
// Stable (computed once) decorative starfields — module scope so they never
// regenerate on re-render.
// ============================================================
function makeStars(count, seedOffset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + seedOffset;
    const rand = (n) => {
      const x = Math.sin(seed * 999 + n * 57) * 10000;
      return x - Math.floor(x);
    };
    return {
      top: rand(1) * 100,
      left: rand(2) * 100,
      size: 1 + rand(3) * 2,
      delay: rand(4) * 5,
    };
  });
}
const HERO_STARS = makeStars(70, 0);
const BAND_STARS = makeStars(30, 500);
const CLOSING_STARS = makeStars(50, 900);
const NEBULA_SPARKS = makeStars(20, 1500);

function Starfield({ stars, className = "" }) {
  return (
    <div className={`ioh-starfield ${className}`} aria-hidden="true">
      {stars.map((s, i) => (
        <span
          key={i}
          className="ioh-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Static content — icons are actual react-icons/pi components (already an
// installed dependency, used elsewhere in the app, e.g. Layout.jsx), not the
// Phosphor CDN font-icon classes or raw unicode glyphs this used to render.
// ============================================================
const NAV_LINKS = [
  { label: "Why Orbit", href: "#why-orbit" },
  { label: "Platform", href: "#platform" },
  { label: "Gamification", href: "#gamification" },
  { label: "Outcomes", href: "#outcomes" },
];

const MARQUEE_ITEMS = [
  { label: "Daily Streaks", icon: PiFlameBold },
  { label: "Lightyears", icon: PiSparkleFill },
  { label: "Micro-Learning Cards", icon: PiCardsBold },
  { label: "Team Leaderboards", icon: PiTrophyBold },
  { label: "Idea Pipeline", icon: PiLightbulbFilamentBold },
  { label: "Sandbox Labs", icon: PiFlaskBold },
];

const WHY_CARDS = [
  {
    icon: PiBrainBold,
    tint: "",
    title: "AI",
    text: "AI fluency built into daily work — practised on real deals, not a one-off webinar.",
  },
  {
    icon: PiChartLineUpBold,
    tint: "ioh-card-icon--teal",
    title: "Sales & Marketing at Scale",
    text: "The same sharp, provable story — for every rep, every deal, at scale.",
  },
  {
    icon: PiUsersThreeBold,
    tint: "ioh-card-icon--pink",
    title: "Delivery & Product Teams at Scale",
    text: "One shared playbook for Delivery and Product teams — so quality holds, project after project.",
  },
];

const OUTCOME_CARDS = [
  {
    icon: PiTargetBold,
    title: "Judgment",
    text: "You'll see exactly where you stand — thinking and action, not presence and tenure.",
  },
  {
    icon: PiGraduationCapBold,
    title: "Upskilling",
    text: "You grow on evidence, not title — your own path across product, domain, and AI.",
  },
];

// Six cards, six distinct hues — deliberately broader than the 3-hue
// accent/teal/pink system used where cards are tied to the Why-Orbit legend.
const FEATURE_CARDS = [
  {
    icon: PiFlameBold,
    tint: "ioh-card-icon--amber",
    title: "Daily Streak & Calendar",
    text: "Every read, module, or idea lights up your streak — a full calendar tracks consistency.",
  },
  {
    icon: PiCheckCircleBold,
    tint: "ioh-card-icon--teal",
    title: "Daily Checklist",
    text: "Three simple goals reset daily: Today's Read, Module Completion, Idea Submission.",
  },
  {
    icon: PiSparkleFill,
    tint: "ioh-card-icon--pink",
    title: "Lightyears & Gamification",
    text: "Every card, quiz, and topic earns real Lightyears — watch your total climb.",
  },
  {
    icon: PiTrophyBold,
    tint: "ioh-card-icon--violet",
    title: "Team Leaderboard",
    text: "See how your team stacks up org-wide — friendly competition keeps momentum alive.",
  },
  {
    icon: PiLightbulbFilamentBold,
    tint: "ioh-card-icon--sky",
    title: "Ideas & R&D Studio",
    text: "Submit a process or product idea straight to the Product Council and track its status.",
  },
  {
    icon: PiStackBold,
    tint: "ioh-card-icon--coral",
    title: "Hot Modules",
    text: "Admins spotlight one platform-wide \"hot\" module — exactly what's most important, right now.",
  },
];

const PARAGRAPH_PHRASES = [
  "In a world built for Instagram streaks and Snapchat flames, ",
  { marker: "IRIS stays just as creative — for learning that sticks. " },
  "Orbit turns training into a habit, one card at a time.",
];

// ============================================================
// Main component
// ============================================================
export default function IrisOrbitHome() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const rootRef = useRef(null);
  const heroSectionRef = useRef(null);
  const orbitSystemRef = useRef(null);
  const browserRef = useRef(null);
  const browserWindowRef = useRef(null);

  const isLoggedIn = Boolean(user);
  const launchTarget = isLoggedIn ? "/orbit" : "/login";

  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // --- Scroll reveal + count-up -------------------------------------------
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const revealEls = Array.from(root.querySelectorAll("[data-reveal]"));
    const counterEls = Array.from(root.querySelectorAll("[data-to]"));

    if (reduceMotion) {
      revealEls.forEach((el) => el.classList.add("in"));
      counterEls.forEach((el) => {
        el.textContent = el.getAttribute("data-to");
      });
      return undefined;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    const animateCounter = (el) => {
      const target = parseFloat(el.getAttribute("data-to"));
      const suffix = el.getAttribute("data-suffix") || "";
      const duration = 1100;
      const start = performance.now();
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const value = Math.round(target * easeOutCubic(progress));
        el.textContent = `${value}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counterEls.forEach((el) => counterObserver.observe(el));

    return () => {
      revealObserver.disconnect();
      counterObserver.disconnect();
    };
  }, [reduceMotion]);

  // --- Cursor spotlight on every .spot-card -------------------------------
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduceMotion) return undefined;

    const handleMove = (e) => {
      const card = e.target.closest(".spot-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${mx}%`);
      card.style.setProperty("--my", `${my}%`);
    };

    root.addEventListener("mousemove", handleMove);
    return () => root.removeEventListener("mousemove", handleMove);
  }, [reduceMotion]);

  // --- Hero orbit parallax -------------------------------------------------
  useEffect(() => {
    const section = heroSectionRef.current;
    const system = orbitSystemRef.current;
    if (!section || !system || reduceMotion) return undefined;

    const handleMove = (e) => {
      const rect = section.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = ((e.clientX - cx) / (rect.width / 2)) * 26;
      const dy = ((e.clientY - cy) / (rect.height / 2)) * 26;
      const clamp = (v) => Math.max(-26, Math.min(26, v));
      system.style.transform = `translate3d(${clamp(dx)}px, ${clamp(dy)}px, 0)`;
    };
    const handleLeave = () => {
      system.style.transform = "translate3d(0,0,0)";
    };

    section.addEventListener("mousemove", handleMove);
    section.addEventListener("mouseleave", handleLeave);
    return () => {
      section.removeEventListener("mousemove", handleMove);
      section.removeEventListener("mouseleave", handleLeave);
    };
  }, [reduceMotion]);

  // --- Browser window 3D tilt ---------------------------------------------
  useEffect(() => {
    const wrap = browserRef.current;
    const win = browserWindowRef.current;
    if (!wrap || !win || reduceMotion) return undefined;

    const handleMove = (e) => {
      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      win.style.transform = `rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg)`;
    };
    const handleLeave = () => {
      win.style.transform = "rotateX(0deg) rotateY(0deg)";
    };

    wrap.addEventListener("mousemove", handleMove);
    wrap.addEventListener("mouseleave", handleLeave);
    return () => {
      wrap.removeEventListener("mousemove", handleMove);
      wrap.removeEventListener("mouseleave", handleLeave);
    };
  }, [reduceMotion]);

  return (
    <div className="ioh-root" ref={rootRef}>
      {/* ================= NAV ================= */}
      <nav className="ioh-nav">
        <div className="ioh-nav-inner">
          <a href="#top" className="ioh-nav-brand">
            <img src={irisOrbitLogo} alt="IRIS Orbit" className="ioh-nav-logo-img" />
          </a>

          <div className="ioh-nav-links">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="ioh-nav-link">
                {l.label}
              </a>
            ))}
          </div>

          <div className="ioh-nav-actions">
            {/* This page owns its own full-page canvas (see Layout.jsx's
                isHomeRoute) instead of sitting under the app's real Navbar,
                so this link has to cover the "already signed in" case itself
                rather than assuming every visitor is anonymous. */}
            <a
              href="#"
              className="ioh-nav-signin"
              onClick={(e) => { e.preventDefault(); navigate(isLoggedIn ? "/orbit/profile" : "/login"); }}
            >
              {isLoggedIn ? "My profile" : "Sign in"}
            </a>
            <button
              type="button"
              className="ioh-btn ioh-btn-primary"
              onClick={() => navigate(launchTarget)}
            >
              <span className="ioh-sheen" />
              Launch Orbit <PiArrowUpRightBold className="ioh-arrow" size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <section className="ioh-hero" id="top" ref={heroSectionRef}>
        <div className="ioh-hero-grid" aria-hidden="true" />
        <div className="ioh-aurora" aria-hidden="true">
          <span /><span /><span />
        </div>
        <Starfield stars={HERO_STARS} />
        <span className="ioh-shoot ioh-shoot--1" aria-hidden="true" />
        <span className="ioh-shoot ioh-shoot--2" aria-hidden="true" />

        <div className="ioh-container ioh-hero-inner">
          <div>
            <span className="ioh-eyebrow">
              <PiSparkleFill className="ioh-float-icon" size={13} /> KNOWLEDGE &amp; GROWTH ENABLEMENT
            </span>

            <h1 className="ioh-hero-h1">
              Growth doesn&apos;t stand still.
              <span className="ioh-shimmer">Neither should you.</span>
            </h1>

            <p className="ioh-hero-lede">
              Sharper judgment, real upskilling, AI that works with you — built into how you already
              work, not one more thing on your plate.
            </p>

            <div className="ioh-hero-actions">
              <button type="button" className="ioh-btn ioh-btn-primary" onClick={() => navigate(launchTarget)}>
                <span className="ioh-sheen" />
                Launch IRIS Orbit <PiArrowRightBold className="ioh-arrow" size={15} />
              </button>
              <a href="#platform" className="ioh-btn ioh-btn-ghost">
                Explore the platform
              </a>
            </div>

            <div className="ioh-hero-stats">
              <div>
                <div className="ioh-stat-num" data-to="3">0</div>
                <div className="ioh-stat-label">Orbits to master</div>
              </div>
              <div>
                <div className="ioh-stat-num" data-to="12">0</div>
                <div className="ioh-stat-label">Modules live</div>
              </div>
              <div>
                <div className="ioh-stat-num">Daily</div>
                <div className="ioh-stat-label">Streaks &amp; missions</div>
              </div>
            </div>
          </div>

          <div className="ioh-orbit-wrap">
            <div className="ioh-orbit-system" ref={orbitSystemRef}>
              <div className="ioh-ring ioh-ring--1" />
              <div className="ioh-ring ioh-ring--2" />
              <div className="ioh-ring ioh-ring--3" />
              <div className="ioh-arc ioh-arc--1" />
              <div className="ioh-arc ioh-arc--2" />
              <div className="ioh-arc ioh-arc--3" />
              <div className="ioh-moon-pivot ioh-moon-pivot--1"><span className="ioh-moon ioh-moon--accent" /></div>
              <div className="ioh-moon-pivot ioh-moon-pivot--2"><span className="ioh-moon ioh-moon--teal" /></div>
              <div className="ioh-moon-pivot ioh-moon-pivot--3"><span className="ioh-moon ioh-moon--pink" /></div>
              {/* The orbital core is a living nebula, modeled on a real deep-
                  field nebula photo — not a labeled badge or the brand mark
                  (that already has its own spot in the nav/footer): layered
                  violet/magenta/blue cloud banks drifting past each other at
                  different speeds, a bright screen-blended core glow, a
                  diffraction-spike star plus a smaller warm companion, and a
                  scattered field of tiny stars threaded through the gas. */}
              <div className="ioh-nebula-core" aria-hidden="true">
                <span className="ioh-nebula-clouds" />
                <span className="ioh-nebula-clouds-2" />
                <span className="ioh-nebula-grain" />
                <span className="ioh-nebula-eye" />
                {NEBULA_SPARKS.map((s, i) => (
                  <span
                    key={i}
                    className={`ioh-nebula-spark${i % 4 === 0 ? " ioh-nebula-spark--warm" : ""}`}
                    style={{
                      top: `${s.top}%`,
                      left: `${s.left}%`,
                      width: `${(s.size * 0.65).toFixed(2)}px`,
                      height: `${(s.size * 0.65).toFixed(2)}px`,
                      animationDelay: `${s.delay}s`,
                    }}
                  />
                ))}
                <span className="ioh-nebula-star" />
                <span className="ioh-nebula-star ioh-nebula-star--sub" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MARQUEE ================= */}
      <div className="ioh-marquee">
        <div className="ioh-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => {
            const Icon = item.icon;
            return (
              <span className="ioh-marquee-item" key={i}>
                <Icon size={16} /> {item.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* ================= WHY ORBIT ================= */}
      <section className="ioh-section" id="why-orbit">
        <div className="ioh-container">
          <div className="ioh-why-head" data-reveal>
            <div className="ioh-section-head" style={{ marginBottom: 0 }}>
              <span className="ioh-eyebrow"><PiCrosshairBold className="ioh-float-icon" size={13} /> WHY ORBIT EXISTS</span>
              <h2>Three forces, one shared orbit.</h2>
              <p>
                The work is changing on three fronts at once. Orbit puts them on the same path
                instead of three disconnected trainings.
              </p>
            </div>
            <div className="ioh-legend">
              <span className="ioh-legend-item"><span className="ioh-legend-dot" style={{ background: "var(--accent-300)", color: "var(--accent-300)" }} /> AI</span>
              <span className="ioh-legend-item"><span className="ioh-legend-dot" style={{ background: "var(--teal)", color: "var(--teal)" }} /> Sales &amp; Marketing at Scale</span>
              <span className="ioh-legend-item"><span className="ioh-legend-dot" style={{ background: "var(--pink)", color: "var(--pink)" }} /> Delivery &amp; Product Teams at Scale</span>
            </div>
          </div>

          <div className="ioh-card-grid">
            {WHY_CARDS.map((c, i) => (
              <div className="spot-card" key={c.title} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                <div className={`ioh-card-icon ${c.tint}`}><c.icon size={20} /></div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PLATFORM PREVIEW ================= */}
      <section className="ioh-section" id="platform">
        <div className="ioh-container">
          <div className="ioh-platform-head" data-reveal>
            <span className="ioh-eyebrow"><PiSquaresFourBold className="ioh-float-icon" size={13} /> THE PLATFORM</span>
            <h2>Your whole learning orbit, one screen.</h2>
            <p>
              Daily missions, streaks, featured paths, and the break room — everything you need to
              keep momentum, in one dashboard.
            </p>
          </div>

          <div className="ioh-browser" ref={browserRef} data-reveal>
            <div className="ioh-browser-window" ref={browserWindowRef}>
              <div className="ioh-browser-bar">
                <div className="ioh-traffic"><span /><span /><span /></div>
                <span className="ioh-browser-url">iris-orbit.app/dashboard</span>
              </div>

              <div className="ioh-browser-body">
                <div className="ioh-welcome-banner">
                  <span className="ioh-welcome-star" style={{ top: "20%", left: "70%" }} />
                  <span className="ioh-welcome-star" style={{ top: "60%", left: "85%", animationDelay: "1s" }} />
                  <span className="ioh-welcome-star" style={{ top: "40%", left: "55%", animationDelay: "2s" }} />
                  <span className="ioh-welcome-comet" />
                  <h4>Welcome back, Riya</h4>
                  {/* Matches the real dashboard's HeroWelcome subheading copy
                      (src/components/OrbitDashboard/HeroWelcome.jsx) exactly. */}
                  <p>You are orbiting through knowledge, hope you find something interesting today!</p>
                </div>

                {/* These 3 rows mirror the real ChecklistCard exactly: same 3
                    tasks, same copy, same point values (daily_read/idea_submission
                    pay 10 Lightyears each on the day's first qualifying action —
                    see progressController.js's POINTS_BY_ACTION; module completion
                    shows live % rather than a flat point badge, same as the real
                    widget). */}
                <div className="ioh-missions">
                  <div className="ioh-mission-row">
                    <span className="ioh-mission-icon" style={{ background: "linear-gradient(135deg,#8fe0d8,#4bab9f)" }}>
                      <PiCheckBold size={15} />
                    </span>
                    <div>
                      <div className="ioh-mission-title">Today&apos;s Read</div>
                      <div className="ioh-mission-sub">Completed</div>
                    </div>
                    <span className="ioh-mission-badge" style={{ background: "rgba(143,224,216,0.16)", color: "var(--teal)" }}>+10</span>
                  </div>
                  <div className="ioh-mission-row">
                    <span className="ioh-mission-icon" style={{ background: "linear-gradient(135deg,var(--accent-400),var(--accent-700))" }}>
                      <PiPlayBold size={14} />
                    </span>
                    <div>
                      <div className="ioh-mission-title">Module 1: Introduction to XBRL</div>
                      <div className="ioh-mission-sub">In progress</div>
                    </div>
                    <span className="ioh-mission-badge" style={{ background: "rgba(145,132,217,0.16)", color: "var(--accent-200)" }}>58%</span>
                  </div>
                  <div className="ioh-mission-row">
                    <span className="ioh-mission-icon" style={{ background: "linear-gradient(135deg,#f0a2c0,#b45a7d)" }}>
                      <PiLightbulbFilamentBold size={15} />
                    </span>
                    <div>
                      <div className="ioh-mission-title">Idea Submission</div>
                      <div className="ioh-mission-sub">Not started</div>
                    </div>
                    <span className="ioh-mission-badge" style={{ background: "rgba(240,162,192,0.16)", color: "var(--pink)" }}>+10</span>
                  </div>
                </div>

                <div className="ioh-side-cards">
                  <div className="ioh-mini-card">
                    <div className="ioh-rocket-tile"><PiRocketLaunchFill size={16} /></div>
                    <div className="ioh-streak-count"><span data-to="5">0</span> day streak</div>
                    <div className="ioh-streak-strip">
                      {Array.from({ length: 7 }, (_, i) => (
                        <span
                          key={i}
                          className="ioh-streak-cell"
                          data-reveal
                          style={{ transitionDelay: `${i * 70}ms` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="ioh-mini-card">
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Orbit 3 · Practitioner</div>
                    <div style={{ fontSize: 12, color: "var(--neutral-400)", marginTop: 4 }}>1,104 / 3,333 lightyears</div>
                    <div className="ioh-orbit-progress-bar">
                      <div className="ioh-orbit-progress-fill" data-reveal />
                    </div>
                    <div className="ioh-tag-row">
                      <span className="ioh-tag">+412 Lightyears</span>
                      <span className="ioh-tag">6 modules</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= OUTCOME ================= */}
      <section className="ioh-section" id="outcomes">
        <div className="ioh-container">
          <div className="ioh-outcome-head" data-reveal>
            <span className="ioh-eyebrow"><PiTargetBold className="ioh-float-icon" size={13} /> THE OUTCOME</span>
            <h2>Your judgment. Your growth.</h2>
            <p>See exactly where you stand today, and exactly how far you can go.</p>
          </div>
          <div className="ioh-outcome-cta" data-reveal>
            <a href="#gamification" className="ioh-btn ioh-btn-ghost">
              Are you a Thinker, a Doer, or both? <PiArrowRightBold className="ioh-arrow" size={15} />
            </a>
          </div>

          <div className="ioh-card-grid ioh-card-grid--2">
            {OUTCOME_CARDS.map((c, i) => (
              <div className="spot-card" key={c.title} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                <div className="ioh-card-icon"><c.icon size={20} /></div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= GAMIFICATION BAND ================= */}
      <section className="ioh-section ioh-band" id="gamification">
        <Starfield stars={BAND_STARS} />
        <span className="ioh-shoot ioh-shoot--1" style={{ top: "20%" }} aria-hidden="true" />

        <div className="ioh-container ioh-band-inner">
          <div className="ioh-band-copy">
            <span className="ioh-eyebrow"><PiGameControllerBold className="ioh-float-icon" size={13} /> HABIT BY DESIGN</span>
            <h2 className="ioh-word-h2">
              {"Upskilling need not be boring.".split(" ").map((word, i, arr) => (
                <React.Fragment key={i}>
                  <span
                    className={`ioh-word ${i === arr.length - 1 ? "ioh-word--accent" : ""}`}
                    data-reveal
                    style={{ transitionDelay: `${i * 90}ms` }}
                  >
                    {word}
                  </span>{" "}
                </React.Fragment>
              ))}
            </h2>

            <p>
              {PARAGRAPH_PHRASES.map((phrase, i) =>
                typeof phrase === "string" ? (
                  <span className="ioh-phrase" data-reveal key={i} style={{ transitionDelay: `${i * 260}ms` }}>
                    {phrase}
                  </span>
                ) : (
                  <span
                    className="ioh-phrase ioh-marker"
                    data-reveal
                    key={i}
                    style={{ transitionDelay: `${i * 260}ms` }}
                  >
                    {phrase.marker}
                  </span>
                )
              )}
            </p>

            <div className="ioh-band-actions">
              <a href={launchTarget} className="ioh-btn ioh-btn-primary" data-reveal style={{ transitionDelay: "820ms" }} onClick={(e) => { e.preventDefault(); navigate(launchTarget); }}>
                <span className="ioh-sheen" />
                Start your streak <PiArrowRightBold className="ioh-arrow" size={15} />
              </a>
              <a href="#platform" className="ioh-btn ioh-btn-ghost" data-reveal style={{ transitionDelay: "900ms" }}>
                See the cards
              </a>
            </div>
          </div>

          <div className="ioh-solar" data-reveal>
            <div className="ioh-halo" />
            <div className="ioh-halo ioh-halo--2" />
            <div className="ioh-halo ioh-halo--3" />

            <div className="ioh-orbit-ring ioh-orbit-ring--1 ioh-orbit-ring--dashed" />
            <div className="ioh-orbit-ring ioh-orbit-ring--2" />
            <div className="ioh-orbit-ring ioh-orbit-ring--3" />

            <div className="ioh-comet ioh-comet--1" />
            <div className="ioh-comet ioh-comet--2" />
            <div className="ioh-comet ioh-comet--3" />

            <div className="ioh-planet-pivot ioh-planet-pivot--1"><span className="ioh-planet ioh-planet--1" /></div>
            <div className="ioh-planet-pivot ioh-planet-pivot--2"><span className="ioh-planet ioh-planet--2" /></div>
            <div className="ioh-planet-pivot ioh-planet-pivot--3">
              <span className="ioh-planet ioh-planet--3">
                <span className="ioh-moon-outer-pivot"><span className="ioh-moon-outer" /></span>
              </span>
            </div>

            <div className="ioh-sun" />

            <span className="ioh-spark" style={{ top: "8%", left: "18%" }} />
            <span className="ioh-spark" style={{ top: "78%", left: "12%", animationDelay: "0.8s" }} />
            <span className="ioh-spark" style={{ top: "14%", left: "82%", animationDelay: "1.6s" }} />
            <span className="ioh-spark" style={{ top: "86%", left: "80%", animationDelay: "2.4s" }} />

            <span className="ioh-chip ioh-chip--1">🚀 5-DAY STREAK</span>
            <span className="ioh-chip ioh-chip--2">⚡ +412 LIGHTYEARS</span>
          </div>
        </div>
      </section>

      {/* ================= FEATURE GRID ================= */}
      <section className="ioh-section ioh-features-section">
        <div className="ioh-container">
          <div className="ioh-features-head" data-reveal>
            <span className="ioh-eyebrow"><PiTrophyBold className="ioh-float-icon" size={13} /> BUILT-IN GAMIFICATION</span>
            <h2>Six systems that keep momentum alive.</h2>
          </div>

          <div className="ioh-card-grid ioh-card-grid--6">
            {FEATURE_CARDS.map((c, i) => (
              <div className="spot-card" key={c.title} data-reveal style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
                <div className={`ioh-card-icon ${c.tint || ""}`}><c.icon size={20} /></div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CLOSING CTA ================= */}
      <section className="ioh-closing">
        <div className="ioh-hero-grid" aria-hidden="true" />
        <div className="ioh-aurora" aria-hidden="true"><span /><span /><span /></div>
        <Starfield stars={CLOSING_STARS} />

        <div className="ioh-container" data-reveal>
          <h2>Ready to leave the launchpad?</h2>
          <p>Open your dashboard, clear today&apos;s three missions, and start the streak.</p>
          <div className="ioh-closing-actions">
            <button type="button" className="ioh-btn ioh-btn-primary" onClick={() => navigate(launchTarget)}>
              <span className="ioh-sheen" />
              Launch IRIS Orbit <PiArrowRightBold className="ioh-arrow" size={15} />
            </button>
            <button type="button" className="ioh-btn ioh-btn-ghost" onClick={() => navigate(isLoggedIn ? "/orbit/profile" : "/login")}>
              View your profile
            </button>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="ioh-footer">
        <div className="ioh-container ioh-footer-inner">
          <div className="ioh-footer-brand">
            <img src={irisOrbitLogo} alt="IRIS Orbit" className="ioh-footer-logo-img" />
            <span>Knowledge &amp; Growth Enablement</span>
          </div>
          <div className="ioh-footer-links">
            <a href={launchTarget} onClick={(e) => { e.preventDefault(); navigate(launchTarget); }}>Dashboard</a>
            <a href="/orbit/modules" onClick={(e) => { e.preventDefault(); navigate("/orbit/modules"); }}>Learn</a>
            <a href="/orbit/profile" onClick={(e) => { e.preventDefault(); navigate(isLoggedIn ? "/orbit/profile" : "/login"); }}>Profile</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
