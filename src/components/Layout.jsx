// src/components/Layout.jsx
import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AuthContext from "../context/AuthContext";
import "./Layout.css";

export default function Layout({ children }) {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const isQuizRoute = location.pathname.startsWith("/quiz");
  const isDashboardRoute = location.pathname.startsWith("/orbit");
  // Auth routes manage their own full-page canvas — no Navbar or Footer
  const isAuthRoute = location.pathname === "/login"
    || location.pathname === "/register"
    || location.pathname === "/onboarding"
    || location.pathname.startsWith("/verify-email")
    || location.pathname.startsWith("/forgot-password")
    || location.pathname.startsWith("/reset-password");
  // "/" (IrisOrbitHome) ships its own cinematic sticky nav + footer — the
  // real global Navbar/Footer would stack a second, redundant chrome on top
  // of it, so it gets the same full-page-canvas pass-through as auth routes.
  const isHomeRoute = location.pathname === "/";

  // =========================================================================
  // CONDITION AUTH: Auth screens own their full-page layout — pass through
  // =========================================================================
  if (isAuthRoute || isHomeRoute) {
    return <>{children}</>;
  }

  // =========================================================================
  // CONDITION A: CLASSIC PUBLIC WEBSITE ENVIRONMENT
  // =========================================================================
  if (!isDashboardRoute) {
    return (
      <div
        className="classic-public-global-shell"
        style={{
          backgroundColor: "var(--bg-global-canvas)",
          color: "var(--text-primary)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!isQuizRoute && <Navbar />}
        <main className="main-public-fluid-container" style={{ flex: 1, position: "relative" }}>
          {React.Children.map(children, (child) =>
            React.isValidElement(child) ? React.cloneElement(child, { currentViewMode: user?.role === "user" ? "learner" : user?.role }) : child
          )}
        </main>
        {!isQuizRoute && <Footer />}
      </div>
    );
  }

  // =========================================================================
  // CONDITION B: /orbit* routes — OrbitShell.jsx handles the persistent
  // sidebar/topbar (including its own view-mode switcher) via React Router
  // <Outlet />. Layout is transparent here so we don't double-render the
  // shell — a second, divergent copy of the sidebar/topbar/mode-switcher
  // used to live here as a "legacy fallback" but was never actually
  // reachable (isDashboardRoute is already handled above), so it was deleted
  // outright rather than left as dead code with its own out-of-sync labels.
  // =========================================================================
  return <>{children}</>;
}
