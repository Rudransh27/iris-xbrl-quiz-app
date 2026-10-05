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
import IrisOrbitHome from "../components/homepage/IrisOrbitHome";

// ── Pastel loading screen ─────────────────────────────────────────────────
// Shown while AuthContext is validating the stored token against the backend.
// Prevents the "onboarding flash" that happened when loading=true caused the
// gate to fall through and render OrbitOnboarding for a brief moment.
function OrbitLoadingScreen() {
  return (
    <div className="ioh-loading">
      <span className="ui-spinner ui-spinner--lg" aria-hidden="true" />
      <span className="ui-eyebrow ui-eyebrow--caps ioh-loading__text">Syncing session</span>
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
  //
  // 🎯 BUG FIX ("landing page background must be white, not this tint"):
  // <body>'s decorative "nebula" background (index.css) is intentionally
  // used site-wide, including under Auth/Onboarding — but the blended peach/
  // lavender/cream blobs read as an unwanted tint specifically on this plain
  // marketing page. An explicit opaque canvas color here masks the body's
  // blobs on this one route without touching the shared global background.
  //
  // paddingTop (not the hero's old margin-top) is deliberate — a child's top
  // margin collapses through a parent with no padding/border between them,
  // which would leave that gap unpainted by this div's own background and
  // show the body's nebula through it instead. Padding never collapses.
  return <IrisOrbitHome />;
}
