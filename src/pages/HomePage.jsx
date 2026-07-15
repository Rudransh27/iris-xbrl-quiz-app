// src/pages/HomePage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Routing gate for the root `/` route.
//
// Decision tree (evaluated top-down, NEVER auto-redirects authenticated users
// away from `/` — that was the infinite-loop root cause):
//
//   loading             → show pastel spinner (prevents onboarding flash)
//   !user + !onboarded  → OrbitOnboarding (first-time visitor)
//   user (any)          → show marketing page (same as everyone else — no
//                         "return to Orbit" ribbon; Navbar's own "Iris Orbit"
//                         link already covers that for admin/superadmin, and
//                         forcing it here isn't needed for the marketing page)
//   !user + onboarded   → show plain marketing page
// ─────────────────────────────────────────────────────────────────────────────
import React, { useContext, useLayoutEffect } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import HeroEntryCard from "../components/HeroEntryCard";
import FeaturesShowcase from "../components/FeaturesShowcase";
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

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, loading } = useContext(AuthContext);
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
  // We deliberately do NOT auto-redirect to /orbit here — doing so caused the
  // infinite loop when "Exit to Web" was clicked from OrbitShell.
  return (
    <div>
      <HeroEntryCard />
      <FeaturesShowcase />
      <CoursesSection />
      <WorkflowStepper />
      <HomeLeaderboard />
    </div>
  );
}
