// src/components/Layout.jsx
import React, { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AuthContext from "../context/AuthContext";
import SuperAdminDashboard from "../admin/SuperAdminDashboard";
import Dashboard1 from "../admin/Dashboard1";
import {
  House,
  Book,
  BarChart,
  Lightbulb,
  Trophy,
  PersonCircle,
  Gear,
  List,
  Shield,
  Building,
  Broadcast,
  ArrowLeftRight,
  LightningCharge,
} from "react-bootstrap-icons";
import "./Layout.css";
import { resolveViewMode, viewModeStorageKey } from "../utils/viewMode";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🔒 Same per-user-scoped, role-clamped view mode as OrbitShell.jsx — see
  // src/utils/viewMode.js. Never trust a shared/global storage key here:
  // that's exactly what let one account's "admin" view mode leak onto the
  // next different account logging in on the same browser.
  const [currentViewMode, setCurrentViewMode] = useState("learner");
  const viewModeKey = viewModeStorageKey(user?._id);

  useEffect(() => {
    if (!user?.role) return;
    const saved = viewModeKey ? localStorage.getItem(viewModeKey) : null;
    setCurrentViewMode(resolveViewMode(user.role, saved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.role]);

  // Current section from URL param — only meaningful on /orbit
  const currentSection = searchParams.get("view") || "home";

  // Navigate to a named section inside the /orbit shell via search params.
  // If the user is not on /orbit already, navigate there first then set the param.
  const goSection = (view) => {
    if (location.pathname === "/orbit") {
      setSearchParams({ view });
    } else {
      navigate(`/orbit?view=${view}`);
    }
  };

  // =========================================================================
  // CONDITION AUTH: Auth screens own their full-page layout — pass through
  // =========================================================================
  if (isAuthRoute) {
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
            React.isValidElement(child) ? React.cloneElement(child, { currentViewMode }) : child
          )}
        </main>
        {!isQuizRoute && <Footer />}
      </div>
    );
  }

  // =========================================================================
  // CONDITION B: /orbit* routes — OrbitShell.jsx handles the persistent
  // sidebar/topbar via React Router <Outlet />. Layout is transparent here so
  // we don't double-render the shell.
  // =========================================================================
  if (isDashboardRoute) {
    return <>{children}</>;
  }

  // =========================================================================
  // CONDITION C: LEGACY ORBIT SHELL (kept as fallback — not normally reached)
  // =========================================================================
  return (
    <div
      className="orbit-premium-shell"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-global-canvas)",
      }}
    >
      {/* INTEGRATED SIDEBAR ENGINE */}
      <aside
        className={`wireframe-sidebar ${isCollapsed ? "collapsed" : ""}`}
        style={{
          width: isCollapsed ? "70px" : "240px",
          backgroundColor: "var(--bg-tactile-cards)",
          borderRight: "2px solid var(--border-tactile)",
          borderBottom: "5px solid var(--border-tactile)",
          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {/* Sidebar Header Trigger */}
        <div
          style={{ padding: "20px", cursor: "pointer", borderBottom: "2px solid var(--border-tactile)" }}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <List size={22} color="var(--bg-hud-banner)" />
            {!isCollapsed && (
              <div>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "0.5px" }}>
                  IRIS Orbit
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px", fontWeight: "bold" }}>
                  Iris Platform
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Nav Stack */}
        <div className="nav-links-stack" style={{ flex: 1, padding: "10px 0" }}>
          {currentViewMode === "learner" && (
            <>
              <div className="nav-section">Main</div>
              <div
                className={`nav-item ${currentSection === "home" ? "active" : ""}`}
                onClick={() => goSection("home")}
              >
                <House /> {!isCollapsed && "Home"}
              </div>
              <div
                className={`nav-item ${currentSection === "modules" ? "active" : ""}`}
                onClick={() => goSection("modules")}
              >
                <Book /> {!isCollapsed && "My Modules"}
              </div>
              <div
                className={`nav-item ${currentSection === "progress" ? "active" : ""}`}
                onClick={() => goSection("progress")}
              >
                <BarChart /> {!isCollapsed && "My Progress"}
              </div>
              <div className="nav-section">Engage</div>
              <div
                className={`nav-item ${currentSection === "ideas" ? "active" : ""}`}
                onClick={() => goSection("ideas")}
              >
                <Lightbulb /> {!isCollapsed && "Submit Idea"}
              </div>
              <div
                className={`nav-item ${currentSection === "leaderboard" ? "active" : ""}`}
                onClick={() => goSection("leaderboard")}
              >
                <Trophy /> {!isCollapsed && "Leaderboard"}
              </div>
            </>
          )}

          {currentViewMode === "admin" && (
            <>
              <div className="nav-section">Overview</div>
              <div
                className={`nav-item ${location.search === "" || location.search.includes("tab=overview") ? "active" : ""}`}
                onClick={() => navigate("/orbit/dashboard?tab=overview")}
              >
                <BarChart /> {!isCollapsed && "Dashboard"}
              </div>
              <div
                className={`nav-item ${location.search.includes("tab=create-team") ? "active" : ""}`}
                onClick={() => navigate("/orbit/dashboard?tab=create-team")}
              >
                <Building /> {!isCollapsed && "Team Members"}
              </div>
              <div className="nav-section">Content</div>
              <div
                className={`nav-item ${location.search.includes("tab=add-module") ? "active" : ""}`}
                onClick={() => navigate("/orbit/dashboard?tab=add-module")}
              >
                <Book /> {!isCollapsed && "Modules Curation"}
              </div>
              <div className="nav-section">Review</div>
              <div
                className={`nav-item ${location.search.includes("tab=ideas-review") ? "active" : ""}`}
                onClick={() => navigate("/orbit/dashboard?tab=ideas-review")}
              >
                <Lightbulb /> {!isCollapsed && "Ideas Inbox"}
              </div>
            </>
          )}

          {currentViewMode === "superadmin" && (
            <>
              <div className="nav-section">Platform</div>
              <div className="nav-item active" onClick={() => navigate("/orbit")}>
                <Shield /> {!isCollapsed && "IRIS Orbit Hub"}
              </div>
              <div
                className="nav-item"
                onClick={() => {
                  setCurrentViewMode("admin");
                  if (viewModeKey) localStorage.setItem(viewModeKey, "admin");
                  navigate("/orbit");
                }}
              >
                <Building /> {!isCollapsed && "Admin Panel"}
              </div>
              <div
                className="nav-item"
                onClick={() => {
                  setCurrentViewMode("admin");
                  if (viewModeKey) localStorage.setItem(viewModeKey, "admin");
                  navigate("/orbit");
                }}
              >
                <PersonCircle /> {!isCollapsed && "All Users"}
              </div>
              <div className="nav-section">Content</div>
              <div className="nav-item" onClick={() => navigate("/orbit/modules")}>
                <Book /> {!isCollapsed && "All Modules"}
              </div>
              <div
                className="nav-item"
                onClick={() => {
                  setCurrentViewMode("admin");
                  if (viewModeKey) localStorage.setItem(viewModeKey, "admin");
                  navigate("/orbit");
                }}
              >
                <Broadcast /> {!isCollapsed && "Broadcast Module"}
              </div>
            </>
          )}
        </div>

        <div style={{ borderTop: "2px solid var(--border-tactile)", padding: "10px 0" }}>
          <div className="nav-item" onClick={() => navigate("/profile")}>
            <PersonCircle /> {!isCollapsed && "Profile"}
          </div>
          <div className="nav-item">
            <Gear /> {!isCollapsed && "Settings"}
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/")}
            style={{ color: "var(--badge-progress-text)" }}
          >
            <House /> {!isCollapsed && "Exit to Main Web"}
          </div>
        </div>
      </aside>

      {/* SECONDARY INNER CONTAINER DECK */}
      <div
        className="workspace-main"
        style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, backgroundColor: "var(--bg-global-canvas)" }}
      >
        <header
          className="topbar"
          style={{
            height: "65px",
            backgroundColor: "var(--bg-tactile-cards)",
            borderBottom: "2px solid var(--border-tactile)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
          }}
        >
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "bold" }}>
            Active Channel:{" "}
            <span style={{ color: "var(--bg-hud-banner)", fontWeight: "800" }}>
              {currentViewMode.toUpperCase()} VIEW
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {user?.role === "admin" && (
              <button
                onClick={() => {
                  const nextMode = currentViewMode === "admin" ? "learner" : "admin";
                  setCurrentViewMode(nextMode);
                  if (viewModeKey) localStorage.setItem(viewModeKey, nextMode);
                  if (nextMode === "admin") navigate("/orbit/dashboard?tab=overview");
                  else navigate("/orbit");
                }}
                className="btn btn-sm text-white font-monospace"
                style={{
                  background: "var(--bg-hud-banner)",
                  borderRadius: "12px",
                  borderBottom: "3px solid var(--border-hud-tactile)",
                  fontWeight: "800",
                }}
              >
                <ArrowLeftRight size={12} className="me-1" />{" "}
                {currentViewMode === "admin" ? "Switch to My Learning" : "Return to Admin Panel"}
              </button>
            )}

            {user?.role === "superadmin" && (
              <select
                value={currentViewMode}
                onChange={(e) => {
                  const selectedMode = e.target.value;
                  setCurrentViewMode(selectedMode);
                  if (viewModeKey) localStorage.setItem(viewModeKey, selectedMode);
                  if (selectedMode === "admin") navigate("/orbit/dashboard?tab=overview");
                  else navigate("/orbit");
                }}
                style={{
                  background: "var(--bg-hud-banner)",
                  border: "none",
                  color: "var(--text-inverse)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  borderBottom: "3px solid var(--border-hud-tactile)",
                }}
              >
                <option value="superadmin">Superadmin Deck</option>
                <option value="admin">Admin Panel Proxy</option>
                <option value="learner">My Learner Profile</option>
              </select>
            )}

            <span
              className="xp-pill font-monospace"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "var(--badge-progress-bg)",
                border: "2px solid var(--badge-progress-text)",
                color: "var(--badge-progress-text)",
                borderRadius: "12px",
                padding: "4px 14px",
                fontSize: "13px",
                fontWeight: "800",
                borderBottom: "4px solid var(--badge-progress-text)",
              }}
            >
              <LightningCharge size={14} /> {user?.xp || 0} Plasma
            </span>

            <div
              className="avatar"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "var(--bg-hud-banner)",
                color: "var(--text-inverse)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
                borderBottom: "3px solid var(--border-hud-tactile)",
              }}
            >
              {user?.username?.substring(0, 2).toUpperCase() || "RN"}
            </div>
          </div>
        </header>

        {/* View Node multiplexer */}
        <main className="content-fluid-scroller" style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
          {currentViewMode === "superadmin" ? (
            <SuperAdminDashboard />
          ) : currentViewMode === "admin" ? (
            <Dashboard1 />
          ) : (
            React.Children.map(children, (child) =>
              React.isValidElement(child) ? React.cloneElement(child, { currentViewMode }) : child
            )
          )}
        </main>
      </div>
    </div>
  );
}
