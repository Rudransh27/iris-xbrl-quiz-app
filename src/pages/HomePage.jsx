// src/pages/HomePage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Routing gate for the root `/` route.
//
// Decision tree (evaluated top-down, NEVER auto-redirects authenticated users
// away from `/` — that was the infinite-loop root cause):
//
//   loading         → show pastel spinner (prevents onboarding flash)
//   !user + !onboarded  → OrbitOnboarding (first-time visitor)
//   user (any)      → show marketing page + "Return to Orbit" ribbon
//   !user + onboarded   → show plain marketing page
// ─────────────────────────────────────────────────────────────────────────────
import React, { useContext, useLayoutEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import HeroEntryCard from "../components/HeroEntryCard";
import CoursesSection from "../components/CoursesHeroSection";
import WorkflowStepper from "../components/WorkflowStepper";
import HomeLeaderboard from "../components/HomeLeaderboard";

// ── Pastel loading screen ─────────────────────────────────────────────────
// Shown while AuthContext is validating the stored token against the backend.
// Prevents the "onboarding flash" that happened when loading=true caused the
// gate to fall through and render OrbitOnboarding for a brief moment.
function OrbitLoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: `
        radial-gradient(ellipse 50% 40% at 20% 20%, var(--orbit-brand-light) 0%, transparent 60%),
        radial-gradient(ellipse 40% 40% at 80% 80%, var(--pastel-progress)   0%, transparent 55%),
        var(--orbit-canvas)
      `,
      gap: "18px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Spinning orbit ring */}
      <div style={{
        position: "relative",
        width: "52px", height: "52px",
      }}>
        {/* Outer pulse ring */}
        <div style={{
          position: "absolute", inset: "-8px",
          borderRadius: "50%",
          border: "2px solid var(--orbit-brand-muted)",
          animation: "orbit-ping 1.4s ease-in-out infinite",
        }} />
        {/* Spinning ring */}
        <div style={{
          width: "52px", height: "52px",
          borderRadius: "50%",
          border: "3px solid var(--orbit-brand-muted)",
          borderTopColor: "var(--orbit-brand)",
          animation: "orbit-spin 0.85s linear infinite",
        }} />
        {/* Center dot */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "8px", height: "8px", borderRadius: "50%",
          background: "var(--orbit-brand)",
        }} />
      </div>

      <span style={{
        fontSize: "12px", fontWeight: "700",
        color: "var(--orbit-text-muted)",
        letterSpacing: "1.6px", textTransform: "uppercase",
        animation: "orbit-pulse-text 1.5s ease-in-out infinite",
      }}>
        Syncing session
      </span>
    </div>
  );
}

// ── Return-to-orbit ribbon for authenticated users on the public page ─────
// Shown at the top of the marketing page when a logged-in user visits `/`
// (e.g. after clicking "Exit to Web" from OrbitShell). Gives them a clear
// path back without forcing a redirect.
function AuthenticatedHomeBanner({ username, xp, onReturn, onLogout }) {
  return (
    <div style={{
      background: "var(--orbit-brand-muted)",
      borderBottom: "2px solid var(--orbit-border)",
      padding: "10px 24px",
      display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        {/* Mini avatar */}
        <div style={{
          width: "26px", height: "26px", borderRadius: "50%",
          background: "var(--orbit-brand)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", fontWeight: "800", flexShrink: 0,
        }}>
          {(username || "U").substring(0, 1).toUpperCase()}
        </div>
        <span style={{ fontSize: "13px", color: "var(--orbit-text-body)", fontWeight: "600" }}>
          Welcome back, <strong style={{ color: "var(--orbit-text-heading)" }}>{username}</strong>
          {xp > 0 && (
            <span style={{
              marginLeft: "8px", fontSize: "11px", fontWeight: "700",
              color: "var(--orbit-xp-text)", background: "var(--orbit-xp-bg)",
              border: "1px solid var(--orbit-xp-border)",
              borderRadius: "var(--radius-full)", padding: "2px 8px",
            }}>
              ⚡ {xp} XP
            </span>
          )}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={onReturn}
          style={{
            background: "var(--orbit-brand)",
            color: "#fff", border: "none",
            borderBottom: "2px solid var(--orbit-brand-dark)",
            borderRadius: "var(--radius-md)",
            padding: "7px 16px", fontSize: "12px", fontWeight: "700",
            cursor: "pointer", letterSpacing: "0.2px",
            transition: "transform 0.12s, filter 0.12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
        >
          Return to Orbit →
        </button>
        <button
          onClick={onLogout}
          style={{
            background: "transparent", color: "var(--orbit-text-muted)",
            border: "1.5px solid var(--orbit-border)",
            borderRadius: "var(--radius-md)",
            padding: "6px 13px", fontSize: "12px", fontWeight: "600",
            cursor: "pointer",
            transition: "color 0.12s, border-color 0.12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--orbit-text-heading)"; e.currentTarget.style.borderColor = "var(--orbit-text-muted)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = ""; e.currentTarget.style.borderColor = ""; }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const hasOnboarded = localStorage.getItem("orbit_onboarded");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ─── Phase 1: Auth hydrating — show clean loading screen ─────────────────
  // This prevents OrbitOnboarding from flashing before the token is validated.
  if (loading) {
    return <OrbitLoadingScreen />;
  }

  // ─── Phase 2: Fresh visitor — redirect to dedicated onboarding route ────────
  // Only triggers when: no active session AND no prior onboarding flag.
  // /onboarding is in Layout.jsx's isAuthRoute list → no Navbar or Footer there.
  if (!user && !hasOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  // ─── Phase 3: Marketing page (authenticated OR returning visitor) ─────────
  // Authenticated users see a return ribbon at the top.
  // We deliberately do NOT auto-redirect to /orbit here — doing so caused the
  // infinite loop when "Exit to Web" was clicked from OrbitShell.
  const handleLogoutFromHome = () => {
    localStorage.removeItem("orbit_view_mode");
    logout();
    // Stay on `/` — loading will flip back to false with user=null,
    // and since orbit_onboarded is set, the marketing page renders correctly.
  };

  return (
    <div>
      {user && (
        <AuthenticatedHomeBanner
          username={user.username}
          xp={user.xp}
          onReturn={() => navigate("/orbit")}
          onLogout={handleLogoutFromHome}
        />
      )}
      <HeroEntryCard />
      <CoursesSection />
      <WorkflowStepper />
      <HomeLeaderboard />
    </div>
  );
}
