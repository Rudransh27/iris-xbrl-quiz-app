// src/components/OrbitShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ORBIT SHELL — Persistent collapsible sidebar + topbar for all /orbit/* routes.
// Uses <Outlet /> so the sidebar NEVER tears down while navigating.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useContext, useEffect, useRef } from "react";
import { io as socketIO } from "socket.io-client";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import SuperAdminDashboard from "../admin/SuperAdminDashboard";
import Dashboard1 from "../admin/Dashboard1";
import {
  House, Book, BarChart, Lightbulb, Trophy, PersonCircle,
  Shield, Building, Broadcast, ArrowLeftRight, LightningCharge,
  SunFill, MoonFill, Activity, BoxArrowRight,
  ChevronLeft, ChevronRight, List, XLg,
} from "react-bootstrap-icons";
import "./Layout.css";
import "./OrbitShell.css";

export default function OrbitShell() {
  const location    = useLocation();
  const navigate    = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, refreshUser }  = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const bio = localStorage.getItem("orbit_profile_bio") || "";

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [liveXP,      setLiveXP]      = useState(user?.xp || 0);
  const [toastQueue,  setToastQueue]  = useState([]);
  const socketRef = useRef(null);

  const [currentViewMode, setCurrentViewMode] = useState(() => {
    const saved = localStorage.getItem("orbit_view_mode");
    if (saved) return saved;
    if (user?.role === "superadmin") return "superadmin";
    if (user?.role === "admin")      return "admin";
    return "learner";
  });

  useEffect(() => {
    if (!localStorage.getItem("orbit_view_mode") && user?.role) {
      if (user.role === "superadmin") setCurrentViewMode("superadmin");
      else if (user.role === "admin") setCurrentViewMode("admin");
    }
  }, [user]);

  useEffect(() => { if (user?.xp !== undefined) setLiveXP(user.xp); }, [user?.xp]);

  useEffect(() => {
    if (!user?._id) return;
    const socket = socketIO("http://localhost:5000", {
      transports: ["websocket"], reconnectionAttempts: 5,
    });
    socketRef.current = socket;
    socket.on("connect", () => { socket.emit("register_session", String(user._id)); });
    socket.on("xp_award", (data) => {
      const { xpAwarded, message, moduleTitle, notificationId } = data;
      if (xpAwarded > 0) setLiveXP(prev => prev + xpAwarded);
      // Keep AuthContext's user.xp in sync too — every other XP consumer (Navbar,
      // useQuizEngine, legacy pages) reads from there, not this component's local liveXP.
      refreshUser?.();
      const toast = {
        id:          notificationId || String(Date.now()),
        message:     message || `⚡ You've been awarded ${xpAwarded} XP for "${moduleTitle}"!`,
        xpAwarded:   xpAwarded || 0,
        moduleTitle: moduleTitle || "",
      };
      setToastQueue(prev => [...prev, toast]);
      setTimeout(() => setToastQueue(prev => prev.filter(t => t.id !== toast.id)), 6000);
    });
    return () => { socket.disconnect(); };
  }, [user?._id]);

  // ─── Active section detection ────────────────────────────────────────────
  const p     = location.pathname;
  const qview = searchParams.get("view") || "home";

  const activeNav =
    p.startsWith("/orbit/modules") ? "modules"
    : p === "/orbit/ideas"         ? "ideas"
    : p === "/orbit/profile"       ? "profile"
    : qview;

  const goTo = (dest) => {
    if (dest === "modules")  return navigate("/orbit/modules");
    if (dest === "ideas")    return navigate("/orbit/ideas");
    if (dest === "profile")  return navigate("/orbit/profile");
    if (p === "/orbit") setSearchParams({ view: dest });
    else navigate(`/orbit?view=${dest}`);
  };

  const goAdmin  = (tab) => navigate(`/orbit/dashboard?tab=${tab}`);
  const adminTab = new URLSearchParams(location.search).get("tab") || "overview";

  const handleSignOut = () => {
    localStorage.removeItem("orbit_view_mode");
    logout();
    navigate("/");
  };

  // ─── Sidebar nav item renderer (plain function, NOT a React component) ───
  const sideNavItem = (Icon, label, isActive, onClickFn, isDanger = false) => (
    <div
      key={label}
      className="orbit-nav-item"
      onClick={() => { onClickFn(); setIsMobileDrawerOpen(false); }}
      title={isCollapsed ? label : undefined}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            "10px",
        padding:        isCollapsed ? "10px 0" : "9px 14px",
        margin:         isCollapsed ? "2px 8px" : "1px 10px",
        borderRadius:   "9px",
        cursor:         "pointer",
        transition:     "background 0.14s ease, padding-left 0.14s ease, color 0.14s ease",
        // Active state: bold heading-ink for the label (not the amber accent
        // itself) — the tinted background + left border already carry the
        // brand color, and amber-on-white text alone reads too low-contrast.
        // --orbit-text-heading (not a fixed ink) so this still swaps
        // correctly against the sidebar's own dark-mode surface.
        color:          isActive ? "var(--orbit-text-heading)"
                        : isDanger ? "var(--pastel-streak-text)"
                        : "var(--orbit-text-body)",
        background:     isActive ? "var(--orbit-brand-muted)" : "transparent",
        fontWeight:     isActive ? "700" : "600",
        fontSize:       "13.5px",
        justifyContent: isCollapsed ? "center" : "flex-start",
        borderLeft:     isActive && !isCollapsed ? "3px solid var(--orbit-brand)" : "3px solid transparent",
        whiteSpace:     "nowrap",
        overflow:       "hidden",
        userSelect:     "none",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background  = "var(--orbit-brand-light)";
          e.currentTarget.style.color       = isDanger ? "var(--pastel-streak-text)" : "var(--orbit-text-heading)";
          if (!isCollapsed) e.currentTarget.style.paddingLeft = "18px";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background  = "transparent";
          e.currentTarget.style.color       = isDanger ? "var(--pastel-streak-text)" : "var(--orbit-text-body)";
          if (!isCollapsed) e.currentTarget.style.paddingLeft = "14px";
        }
      }}
    >
      <Icon size={15} style={{ flexShrink: 0 }} />
      {!isCollapsed && <span>{label}</span>}
    </div>
  );

  // ─── Section header / divider ─────────────────────────────────────────────
  const sideSection = (label) =>
    !isCollapsed ? (
      <div key={`sec-${label}`} style={{
        fontSize:      "9.5px",
        color:         "var(--orbit-text-muted)",
        padding:       "14px 20px 4px",
        letterSpacing: "1.6px",
        textTransform: "uppercase",
        fontWeight:    "800",
      }}>
        {label}
      </div>
    ) : (
      <div key={`sec-${label}`} style={{
        height:     "1px",
        background: "var(--orbit-border)",
        margin:     "8px 12px",
      }} />
    );

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: "var(--orbit-canvas)",
      // Re-theme the whole Orbit shell (sidebar, topbar, and every section
      // rendered through the Outlet below) onto the amber-glow palette by
      // overriding these custom properties at the root — every descendant
      // that reads var(--orbit-brand...) picks it up automatically, so
      // there's no need to hunt down each individual usage site. Translucent
      // amber (not a solid frozen-water swatch) for the muted/light tiers so
      // hover/active states stay legible in both light AND dark mode.
      "--orbit-brand": "var(--amber-glow)",
      "--orbit-brand-dark": "var(--amber-glow-dark)",
      "--orbit-brand-muted": "var(--amber-glow-muted)",
      "--orbit-brand-light": "var(--amber-glow-hover)",
    }}>

      {/* Mobile-only dimmed backdrop behind the drawer — closes it on tap. */}
      {isMobileDrawerOpen && (
        <div className="orbit-sidebar-backdrop" onClick={() => setIsMobileDrawerOpen(false)} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PERSISTENT COLLAPSIBLE SIDEBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <aside className={`orbit-sidebar ${isMobileDrawerOpen ? "orbit-sidebar--open" : ""}`} style={{
        width:          isCollapsed ? "68px" : "256px",
        background:     "var(--orbit-surface)",
        borderRight:    "1px solid var(--orbit-border)",
        transition:     "width 0.26s cubic-bezier(0.4, 0, 0.2, 1)",
        display:        "flex",
        flexDirection:  "column",
        overflow:       "hidden",
        whiteSpace:     "nowrap",
        flexShrink:     0,
        boxShadow:      "2px 0 20px rgba(255, 159, 28, 0.10)",
        zIndex:         10,
      }}>

        {/* ── Logo + collapse toggle ────────────────────────────────── */}
        <div style={{
          padding:        isCollapsed ? "14px 7px" : "14px 14px 14px 16px",
          borderBottom:   "1px solid var(--orbit-border)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          minHeight:      "56px",
          boxSizing:      "border-box",
          gap:            "6px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px", overflow: "hidden", flex: 1 }}>
            <div style={{
              width:       "30px",
              height:      "30px",
              borderRadius:"9px",
              background:  "linear-gradient(135deg, var(--orbit-brand) 0%, var(--orbit-brand-dark) 100%)",
              display:     "flex",
              alignItems:  "center",
              justifyContent: "center",
              boxShadow:   "0 2px 10px rgba(255,159,28,0.38)",
              flexShrink:  0,
              fontSize:    "15px",
            }}>
            </div>
            {!isCollapsed && (
              <div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--orbit-text-heading)", letterSpacing: "0.1px", lineHeight: 1.2 }}>
                  IRIS Orbit
                </div>
                <div style={{ fontSize: "9px", color: "var(--orbit-text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "1px" }}>
                  Learning Platform
                </div>
              </div>
            )}
          </div>
          <button
            className="orbit-sidebar-collapse-toggle"
            onClick={() => setIsCollapsed(c => !c)}
            style={{
              background:    "var(--orbit-brand-muted)",
              border:        "1px solid var(--orbit-border-strong)",
              borderRadius:  "7px",
              color:         "var(--orbit-brand)",
              width:         "24px",
              height:        "24px",
              minWidth:      "24px",
              cursor:        "pointer",
              display:       "flex",
              alignItems:    "center",
              justifyContent:"center",
              flexShrink:    0,
              transition:    "all 0.14s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--orbit-brand)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--orbit-brand-muted)"; e.currentTarget.style.color = "var(--orbit-brand)"; }}
          >
            {isCollapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
          </button>
          <button
            className="orbit-mobile-drawer-close"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-label="Close menu"
            style={{
              background:     "var(--orbit-brand-muted)",
              border:         "1px solid var(--orbit-border-strong)",
              borderRadius:   "7px",
              color:          "var(--orbit-brand)",
              cursor:         "pointer",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
            }}
          >
            <XLg size={14} />
          </button>
        </div>

        {/* ── Sign Out — deliberately placed here, not buried at the bottom.
               Outlined (not filled/red) so it reads as "always available"
               rather than alarming, but it's the first thing under the logo. */}
        {user && (
          <button
            className="orbit-sidebar-signout-btn"
            onClick={handleSignOut}
            title="Sign out"
            style={{
              margin:         isCollapsed ? "10px 8px" : "12px 14px",
              padding:        isCollapsed ? "9px 0" : "10px 12px",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            "8px",
              background:     "var(--white)",
              border:         "1.5px solid var(--amber-glow)",
              color:          "var(--ink-strong)",
              borderRadius:   "10px",
              fontSize:       "13px",
              fontWeight:     "800",
              cursor:         "pointer",
              transition:     "all 0.14s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--amber-glow)"; e.currentTarget.style.color = "var(--white)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--white)"; e.currentTarget.style.color = "var(--ink-strong)"; }}
          >
            <BoxArrowRight size={15} />
            {!isCollapsed && "Sign Out"}
          </button>
        )}

        {/* ── Navigation stack ──────────────────────────────────────── */}
        <div style={{ flex: 1, padding: "6px 0", overflowY: "auto" }}>

          {/* LEARNER NAV */}
          {currentViewMode === "learner" && (
            <>
              {sideSection("Main")}
              {sideNavItem(House,     "Home",               activeNav === "home",       () => goTo("home"))}
              {sideNavItem(Book,      "Learn",              activeNav === "modules",    () => goTo("modules"))}
              {sideNavItem(BarChart,  "My Progress",        activeNav === "progress",   () => goTo("progress"))}
              {sideSection("Engage")}
              {sideNavItem(Lightbulb, "Submit Idea",        activeNav === "ideas",      () => goTo("ideas"))}
              {sideNavItem(Trophy,    "Leaderboard",        activeNav === "leaderboard",() => goTo("leaderboard"))}
              {sideSection("Discover")}
              {sideNavItem(Broadcast, "What's Landing Next",activeNav === "pipeline",   () => goTo("pipeline"))}
            </>
          )}

          {/* ADMIN NAV */}
          {currentViewMode === "admin" && (
            <>
              {sideSection("Overview")}
              {sideNavItem(BarChart,  "Dashboard",          adminTab === "overview",          () => goAdmin("overview"))}
              {sideNavItem(Building,  "Team Members",       adminTab === "create-team",       () => goAdmin("create-team"))}
              {sideSection("Content")}
              {sideNavItem(Book,      "Module Curation",    adminTab === "add-module",         () => goAdmin("add-module"))}
              {sideSection("Analytics")}
              {sideNavItem(Activity,  "Platform Analytics", adminTab === "platform-analytics", () => goAdmin("platform-analytics"))}
              {sideNavItem(BarChart,  "User Analytics",     adminTab === "user-analytics",     () => goAdmin("user-analytics"))}
              {sideSection("Review")}
              {sideNavItem(Lightbulb, "Ideas Inbox",        adminTab === "ideas-review",       () => goAdmin("ideas-review"))}
            </>
          )}

          {/* SUPERADMIN NAV */}
          {currentViewMode === "superadmin" && (
            <>
              {sideSection("Platform")}
              {sideNavItem(Shield,   "IRIS Orbit Hub", p === "/orbit",    () => navigate("/orbit"))}
              {sideNavItem(Building, "Admin Panel",    false, () => {
                setCurrentViewMode("admin");
                localStorage.setItem("orbit_view_mode", "admin");
                navigate("/orbit/dashboard?tab=overview");
              })}
              {sideSection("Content")}
              {sideNavItem(Book,     "All Modules", false, () => navigate("/orbit/modules"))}
              {sideNavItem(Activity, "Analytics",   false, () => navigate("/orbit/dashboard?tab=platform-analytics"))}
            </>
          )}
        </div>

        {/* ── Footer — Sign Out lives up top now, not buried here ────── */}
        <div style={{ borderTop: "1px solid var(--orbit-border)", padding: "6px 0" }}>
          {sideNavItem(PersonCircle, "Profile",     activeNav === "profile", () => goTo("profile"))}
          {sideNavItem(House,        "Exit to Web", false,                   () => navigate("/"))}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT COLUMN
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--orbit-canvas)" }}>

        {/* Topbar */}
        <header style={{
          height:       "56px",
          background:   "var(--orbit-surface)",
          borderBottom: "1px solid var(--orbit-border)",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "space-between",
          padding:      "0 clamp(12px, 4vw, 24px)",
          flexShrink:   0,
          boxShadow:    "0 1px 8px rgba(255, 159, 28, 0.08)",
          gap:          "10px",
        }}>

          {/* Left: hamburger (mobile-only) + breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <button
              className="orbit-hamburger-trigger"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                background:     "var(--orbit-brand-muted)",
                border:         "1px solid var(--orbit-border-strong)",
                borderRadius:   "8px",
                color:          "var(--orbit-brand)",
                cursor:         "pointer",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
              }}
            >
              <List size={18} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--orbit-text-muted)", letterSpacing: "0.4px" }}>
              IRIS Orbit
            </span>
            <span style={{
              width: "3px", height: "3px", borderRadius: "50%",
              background: "var(--orbit-border-strong)", display: "inline-block",
            }} />
            <span style={{
              fontSize:      "11px",
              fontWeight:    "800",
              color:         "var(--orbit-text-heading)",
              letterSpacing: "0.4px",
              textTransform: "uppercase",
            }}>
              {currentViewMode === "admin"      ? "Admin Console"
               : currentViewMode === "superadmin" ? "Superadmin Hub"
               : "Learner View"}
            </span>
            </div>
          </div>

          {/* Right: controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              style={{
                background:    "var(--orbit-brand-muted)",
                border:        "1px solid var(--orbit-border-strong)",
                color:         "var(--orbit-brand)",
                width:         "32px",
                height:        "32px",
                borderRadius:  "8px",
                cursor:        "pointer",
                display:       "flex",
                alignItems:    "center",
                justifyContent:"center",
                transition:    "all 0.14s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--orbit-brand)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--orbit-brand-muted)"; e.currentTarget.style.color = "var(--orbit-brand)"; }}
            >
              {theme === "light" ? <MoonFill size={13} /> : <SunFill size={13} />}
            </button>

            {/* Admin view toggle */}
            {user?.role === "admin" && (
              <button
                onClick={() => {
                  const next = currentViewMode === "admin" ? "learner" : "admin";
                  setCurrentViewMode(next);
                  localStorage.setItem("orbit_view_mode", next);
                  navigate(next === "admin" ? "/orbit/dashboard?tab=overview" : "/orbit");
                }}
                style={{
                  background:   "var(--orbit-brand)",
                  color:        "#fff",
                  border:       "none",
                  borderBottom: "3px solid var(--orbit-brand-dark)",
                  borderRadius: "8px",
                  padding:      "5px 12px",
                  fontSize:     "11.5px",
                  fontWeight:   "700",
                  cursor:       "pointer",
                  display:      "flex",
                  alignItems:   "center",
                  gap:          "5px",
                }}
              >
                <ArrowLeftRight size={11} />
                {currentViewMode === "admin" ? "My Learning" : "Admin Panel"}
              </button>
            )}

            {/* Superadmin mode picker */}
            {user?.role === "superadmin" && (
              <select
                value={currentViewMode}
                onChange={(e) => {
                  const m = e.target.value;
                  setCurrentViewMode(m);
                  localStorage.setItem("orbit_view_mode", m);
                  navigate(m === "admin" ? "/orbit/dashboard?tab=overview" : "/orbit");
                }}
                style={{
                  background:   "var(--orbit-brand)",
                  border:       "none",
                  borderBottom: "3px solid var(--orbit-brand-dark)",
                  color:        "#fff",
                  padding:      "5px 10px",
                  borderRadius: "8px",
                  fontSize:     "11.5px",
                  cursor:       "pointer",
                  fontWeight:   "700",
                }}
              >
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin Proxy</option>
                <option value="learner">Learner View</option>
              </select>
            )}

            {/* XP pill */}
            <span style={{
              display:     "inline-flex",
              alignItems:  "center",
              gap:         "4px",
              background:  "var(--orbit-xp-bg)",
              border:      "1.5px solid var(--orbit-xp-border)",
              color:       "var(--orbit-xp-text)",
              borderRadius:"var(--radius-full)",
              padding:     "4px 12px",
              fontSize:    "12px",
              fontWeight:  "800",
            }}>
              <LightningCharge size={11} /> {liveXP} XP
            </span>

            {/* Profile avatar — navigates inside shell (no hard redirect) */}
            <div
              onClick={() => navigate("/orbit/profile")}
              title="Go to your profile"
              style={{
                width:          "34px",
                height:         "34px",
                borderRadius:   "50%",
                background:     "linear-gradient(135deg, var(--orbit-brand) 0%, var(--orbit-brand-dark) 100%)",
                color:          "#fff",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       "12px",
                fontWeight:     "800",
                border:         "2px solid var(--orbit-border-strong)",
                cursor:         "pointer",
                boxShadow:      "0 0 0 3px var(--orbit-brand-muted)",
                transition:     "box-shadow 0.14s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,159,28,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px var(--orbit-brand-muted)"; }}
            >
              {user?.username?.substring(0, 2).toUpperCase() || "OR"}
            </div>
          </div>
        </header>

        {/* Content pane — Outlet keeps sidebar mounted across all /orbit/* routes */}
        <main className="content-fluid-scroller" style={{ flex: 1, overflowY: "auto", padding: "clamp(12px, 4vw, 24px)" }}>
          {currentViewMode === "superadmin" ? (
            <SuperAdminDashboard />
          ) : currentViewMode === "admin" ? (
            <Dashboard1 />
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* ══ XP Award Toast Stack ═════════════════════════════════════════════ */}
      {toastQueue.length > 0 && (
        <div style={{
          position:      "fixed",
          bottom:        "28px",
          right:         "28px",
          display:       "flex",
          flexDirection: "column-reverse",
          gap:           "12px",
          zIndex:        9999,
          pointerEvents: "none",
        }}>
          {toastQueue.map(toast => (
            <div
              key={toast.id}
              onClick={() => setToastQueue(prev => prev.filter(t => t.id !== toast.id))}
              style={{
                pointerEvents: "auto",
                maxWidth:      "360px",
                minWidth:      "280px",
                background:    "linear-gradient(135deg, #1a1040 0%, #2d1f5e 100%)",
                border:        "1.5px solid rgba(167,139,250,0.6)",
                borderRadius:  "18px",
                padding:       "16px 20px",
                boxShadow:     "0 8px 40px rgba(124,110,247,0.45), 0 2px 8px rgba(0,0,0,0.4)",
                animation:     "xp-toast-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                display:       "flex",
                flexDirection: "column",
                gap:           "6px",
                cursor:        "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "22px", lineHeight: 1 }}>⚡</span>
                <span style={{
                  fontSize:              "13px",
                  fontWeight:            "800",
                  background:            "linear-gradient(90deg, #e7c6ff, #a78bfa)",
                  WebkitBackgroundClip:  "text",
                  WebkitTextFillColor:   "transparent",
                  lineHeight:            1.3,
                }}>
                  +{toast.xpAwarded} XP Awarded!
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "rgba(231,198,255,0.85)", fontWeight: "500", lineHeight: 1.5 }}>
                {toast.message}
              </p>
              <p style={{ margin: 0, fontSize: "10px", color: "rgba(167,139,250,0.55)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.7px" }}>
                Tap to dismiss
              </p>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes xp-toast-in {
          from { opacity: 0; transform: translateX(60px) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}
