// src/components/OrbitShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ORBIT SHELL — Persistent collapsible sidebar + topbar for all /orbit/* routes.
// Uses <Outlet /> so the sidebar NEVER tears down while navigating.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useContext, useEffect, useRef } from "react";
import { io as socketIO } from "socket.io-client";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import api from "../admin/services/api";
import SuperAdminDashboard from "../admin/SuperAdminDashboard";
import Dashboard1 from "../admin/Dashboard1";
import {
  House, Book, BarChart, Lightbulb, Trophy, PersonCircle,
  Shield, Building, Broadcast, ArrowLeftRight, RocketTakeoffFill,
  SunFill, MoonFill, Activity, BoxArrowRight,
  List, XLg,
} from "react-bootstrap-icons";
import { PiShootingStarFill } from "react-icons/pi";
import "./Layout.css";
import "./OrbitShell.css";
import { resolveViewMode, viewModeStorageKey } from "../utils/viewMode";
import irisOrbitLogo from "../assets/iris-orbit-logo.png";

export default function OrbitShell() {
  const location    = useLocation();
  const navigate    = useNavigate();
  const { user, logout, refreshUser }  = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const bio = localStorage.getItem("orbit_profile_bio") || "";

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [liveXP,      setLiveXP]      = useState(user?.xp || 0);
  const [streak,      setStreak]      = useState(0);
  const [toastQueue,  setToastQueue]  = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const socketRef = useRef(null);
  const mainScrollRef = useRef(null);

  // 🎯 BUG FIX ("navigating to a new page lands wherever we last scrolled,
  // not the top"): OrbitShell itself never unmounts across /orbit/* routes
  // (only <Outlet/>'s content swaps), so the persistent scroll container
  // below keeps whatever scrollTop it had on the PREVIOUS page. Reset it
  // every time the route actually changes.
  useEffect(() => {
    mainScrollRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  // Department label shown in the topbar (replaces the old duplicate
  // "Iris Orbit" wordmark there, now that the single logo lives in the
  // sidebar/topbar intersection cell) — resolved from the public
  // departments list since `user.department` is only a bare ObjectId.
  useEffect(() => {
    if (!user?.department || typeof api.getDepartments !== "function") return;
    let cancelled = false;
    api.getDepartments().then((res) => {
      if (cancelled) return;
      const list = res?.data || res || [];
      const match = list.find((d) => d._id === user.department || d._id?.toString?.() === user.department);
      if (match?.name) setDepartmentName(match.name);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.department]);

  // Streak isn't tracked anywhere in this shell today (only OrbitWorkspace
  // fetches it) — the topbar needs it too now, so pull it once here via the
  // same endpoint OrbitWorkspace already uses.
  useEffect(() => {
    if (!user?.id || typeof api.getMyStreak !== "function") return;
    let cancelled = false;
    api.getMyStreak().then((res) => {
      if (!cancelled && res?.success) setStreak(res.currentStreak || 0);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  // "learner" is the only safe default before the user's real role is known
  // (AuthContext hydrates asynchronously) — never trust any pre-role-check
  // storage read for the initial render.
  const [currentViewMode, setCurrentViewMode] = useState("learner");
  const viewModeKey = viewModeStorageKey(user?.id);

  // One-time cleanup: the old unscoped key could still be sitting in a
  // browser's localStorage from before this fix and must never be read
  // again by anything.
  useEffect(() => { localStorage.removeItem("orbit_view_mode"); }, []);

  useEffect(() => {
    if (!user?.role) return;
    const saved = viewModeKey ? localStorage.getItem(viewModeKey) : null;
    setCurrentViewMode(resolveViewMode(user.role, saved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  useEffect(() => { if (user?.xp !== undefined) setLiveXP(user.xp); }, [user?.xp]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = socketIO("http://localhost:5000", {
      transports: ["websocket"], reconnectionAttempts: 5,
    });
    socketRef.current = socket;
    socket.on("connect", () => { socket.emit("register_session", String(user.id)); });
    socket.on("xp_award", (data) => {
      const { xpAwarded, message, moduleTitle, notificationId } = data;
      if (xpAwarded > 0) setLiveXP(prev => prev + xpAwarded);
      // Keep AuthContext's user.xp in sync too — every other XP consumer (Navbar,
      // useQuizEngine, legacy pages) reads from there, not this component's local liveXP.
      refreshUser?.();
      const toast = {
        id:          notificationId || String(Date.now()),
        message:     message || `☄️ You've been awarded ${xpAwarded} Lightyear for "${moduleTitle}"!`,
        xpAwarded:   xpAwarded || 0,
        moduleTitle: moduleTitle || "",
      };
      setToastQueue(prev => [...prev, toast]);
      setTimeout(() => setToastQueue(prev => prev.filter(t => t.id !== toast.id)), 6000);
    });
    return () => { socket.disconnect(); };
  }, [user?.id]);

  // ─── Active section detection ────────────────────────────────────────────
  // Derived purely from the real URL now — no more ?view= query param.
  const p = location.pathname;

  const activeNav =
    p.startsWith("/orbit/modules") ? "modules"
    : p === "/orbit/ideas"         ? "ideas"
    : p === "/orbit/profile"       ? "profile"
    : p === "/orbit"               ? "home"
    : p.replace("/orbit/", "");

  // 🎯 BUG FIX ("why are we landing on the superadmin page from Iris Orbit"):
  // bare /orbit is the "Home" destination — the navbar's "Iris Orbit" link
  // and the sidebar's own "Home" item both point there — and MUST always
  // render the learner workspace for every role, never the admin/superadmin
  // dashboard. Only /orbit/dashboard (a distinct URL, reached via the
  // explicit "Hub"/"Admin Panel"/mode-switcher controls, intentionally
  // routed to `element={null}` in App.jsx for exactly this reason) is the
  // actual dashboard/hub screen. Any other /orbit/* path (modules, profile,
  // ideas, etc.) is a real, purposeful navigation and must always render
  // its own routed page too.
  const isDashboardHome = p.startsWith("/orbit/dashboard");

  const goTo = (dest) => {
    if (dest === "modules")  return navigate("/orbit/modules");
    if (dest === "ideas")    return navigate("/orbit/ideas");
    if (dest === "profile")  return navigate("/orbit/profile");
    navigate(dest === "home" ? "/orbit" : `/orbit/${dest}`);
  };

  const goAdmin  = (tab) => navigate(`/orbit/dashboard?tab=${tab}`);
  const adminTab = new URLSearchParams(location.search).get("tab") || "overview";

  const handleSignOut = () => {
    if (viewModeKey) localStorage.removeItem(viewModeKey);
    logout();
    navigate("/");
  };

  // ─── Sidebar nav item renderer (plain function, NOT a React component) ───
  // Icon-box-on-top, label-below, centered — a common, generic nav-rail
  // convention (icon tinted/boxed when active, plain otherwise). Full label
  // always renders now (no more collapsed/expanded duality); `title` still
  // carries it too, useful since some labels are truncated at this width.
  const sideNavItem = (Icon, label, isActive, onClickFn, isDanger = false) => (
    <div
      key={label}
      className="orbit-nav-item"
      onClick={() => { onClickFn(); setIsMobileDrawerOpen(false); }}
      title={label}
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            "4px",
        padding:        "8px 4px",
        margin:         "2px 8px",
        borderRadius:   "12px",
        cursor:         "pointer",
        userSelect:     "none",
      }}
    >
      <div
        className="orbit-nav-item__icon"
        style={{
          width:          "44px",
          height:         "44px",
          borderRadius:   "12px",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          // Active: a lavender→sky gradient tile (same fixed pastel in both
          // themes — matches the Learner Dashboard's redesigned accent
          // language) rather than the old solid-black fill.
          background:     isActive ? "linear-gradient(135deg, var(--orbit-lavender), var(--orbit-sky))" : "transparent",
          color:          isActive ? "#20222f" : isDanger ? "var(--orbit-rose-text)" : "var(--orbit-text-muted)",
          transition:     "background 0.14s ease, color 0.14s ease",
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--orbit-brand-light)"; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
      >
        <Icon size={19} />
      </div>
      <span style={{
        fontSize:   "10.5px",
        fontWeight: isActive ? "700" : "600",
        textAlign:  "center",
        lineHeight: 1.2,
        maxWidth:   "76px",
        color:      isActive ? "var(--orbit-text-heading)" : isDanger ? "var(--orbit-rose-text)" : "var(--orbit-text-muted)",
      }}>
        {label}
      </span>
    </div>
  );

  // ─── Section header / divider ─────────────────────────────────────────────
  // Just a small gap between logical groups now — the icon-rail is too
  // narrow for readable uppercase group labels (and the reference layout
  // doesn't show any); grouping is still implicit in the JSX list order.
  const sideSection = (label) => <div key={`sec-${label}`} style={{ height: "10px" }} />;

  return (
    <div className="orbit-app-root" style={{
      display: "flex", height: "100vh", overflow: "hidden", background: "var(--orbit-canvas)",
    }}>

      {/* Mobile-only dimmed backdrop behind the drawer — closes it on tap. */}
      {isMobileDrawerOpen && (
        <div className="orbit-sidebar-backdrop" onClick={() => setIsMobileDrawerOpen(false)} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PERSISTENT ICON-RAIL SIDEBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <aside className={`orbit-sidebar ${isMobileDrawerOpen ? "orbit-sidebar--open" : ""}`} style={{
        width:            "92px",
        borderRight:      "1px solid var(--orbit-border)",
        display:          "flex",
        flexDirection:    "column",
        overflow:         "hidden",
        flexShrink:       0,
        boxShadow:        "var(--orbit-shadow-sm)",
        zIndex:           10,
      }}>

        {/* ── Logo — the ONE place the Iris Orbit mark appears. This cell's
               height (56px) matches the topbar's height exactly, and its
               bottom border reuses the topbar's own border color
               (--orbit-glass-border) so the two form one continuous,
               unbroken line at the intersection instead of two
               slightly-different-colored borders meeting at a seam. A
               distinct dark fill (matching the reference "keka"-style
               corner tile) makes this cell read as a self-contained brand
               mark rather than blending into either the sidebar or topbar. */}
        <div style={{
          padding:        "10px 7px",
          borderBottom:   "1px solid var(--orbit-glass-border)",
          // The logo artwork is a medium-saturation purple mark on a
          // transparent background — it reads cleanly on plain white, so
          // light mode uses the real page surface instead of a dark tile
          // (which used to apply regardless of theme). Dark mode keeps the
          // galaxy gradient — plain white there would be a jarring bright
          // hole in the rest of the dark UI.
          background:     theme === "dark" ? "linear-gradient(135deg, #2a2140, #232a56)" : "var(--orbit-surface)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          minHeight:      "56px",
          boxSizing:      "border-box",
          gap:            "6px",
        }}>
          <img
            src={irisOrbitLogo}
            alt="Iris Orbit"
            style={{ maxWidth: "72px", maxHeight: "38px", objectFit: "contain", flexShrink: 0 }}
          />
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

        {/* ── Sign Out — deliberately  placed here, not buried at the bottom.
               Same icon-box/label shape as nav items below, but keeps its
               own amber-glow accent (a distinct "exit" color, unrelated to
               the brand-violet nav accent) so it reads as "always available"
               rather than alarming. */}
        
        {/* ── Navigation stack ──────────────────────────────────────── */}
        <div className="orbit-sidebar-nav" style={{ flex: 1, padding: "6px 0", overflowY: "auto" }}>

          {/* LEARNER NAV — shown for the actual learner role, AND for an
              admin/superadmin browsing any non-dashboard-home /orbit/* page
              (modules, profile, etc.). Mirrors the main content pane's
              isDashboardHome gate below: those pages always render their
              real learner-style content regardless of role, so the sidebar
              must match instead of permanently showing the admin/superadmin
              nav no matter what's actually on screen. */}
          {(currentViewMode === "learner" || !isDashboardHome) && (
            <>
              {sideSection("Main")}
              {sideNavItem(House,     "Home",     activeNav === "home",        () => goTo("home"))}
              {sideNavItem(Book,      "Learn",    activeNav === "modules",     () => goTo("modules"))}
              {sideNavItem(BarChart,  "Progress", activeNav === "progress",    () => goTo("progress"))}
              {sideSection("Engage")}
              {sideNavItem(Lightbulb, "Ideas",    activeNav === "ideas",       () => goTo("ideas"))}
              {sideNavItem(Trophy,    "Leaderboard", activeNav === "leaderboard", () => goTo("leaderboard"))}
              {sideSection("Discover")}
              {sideNavItem(Broadcast, "Pipeline", activeNav === "pipeline",    () => goTo("pipeline"))}
            </>
          )}

          {/* ADMIN NAV — only on the dashboard/hub screen itself */}
          {isDashboardHome && currentViewMode === "admin" && (
            <>
              {sideSection("Overview")}
              {sideNavItem(BarChart,  "Dashboard", adminTab === "overview",          () => goAdmin("overview"))}
              {sideNavItem(Building,  "Team",      adminTab === "create-team",       () => goAdmin("create-team"))}
              {sideSection("Content")}
              {sideNavItem(Book,      "Modules",   adminTab === "add-module",        () => goAdmin("add-module"))}
              {sideSection("Analytics")}
              {sideNavItem(Activity,  "Analytics", adminTab === "platform-analytics", () => goAdmin("platform-analytics"))}
              {sideNavItem(BarChart,  "Users",     adminTab === "user-analytics",     () => goAdmin("user-analytics"))}
              {sideSection("Review")}
              {sideNavItem(Lightbulb, "Ideas",     adminTab === "ideas-review",       () => goAdmin("ideas-review"))}
            </>
          )}

          {/* SUPERADMIN NAV — only on the dashboard/hub screen itself */}
          {isDashboardHome && currentViewMode === "superadmin" && (
            <>
              {sideSection("Platform")}
              {sideNavItem(Shield,   "Hub",   isDashboardHome, () => navigate("/orbit/dashboard"))}
              {sideNavItem(Building, "Admin", false, () => {
                setCurrentViewMode("admin");
                if (viewModeKey) localStorage.setItem(viewModeKey, "admin");
                navigate("/orbit/dashboard?tab=overview");
              })}
              {sideSection("Content")}
              {sideNavItem(Book,     "Modules",   false, () => navigate("/orbit/modules"))}
              {sideNavItem(Activity, "Analytics", false, () => navigate("/orbit/dashboard?tab=platform-analytics"))}
            </>
          )}
        </div>

        {/* ── Footer — Sign Out lives up top now, not buried here ────── */}
        <div style={{ borderTop: "1px solid var(--orbit-border)", padding: "6px 0" }}>
          {sideNavItem(PersonCircle, "Profile", activeNav === "profile", () => goTo("profile"))}
          {sideNavItem(House,        "Exit",    false,                   () => navigate("/"))}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT COLUMN
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--orbit-canvas)" }}>

        {/* Topbar — true glassmorphism:
              - sticky (belt-and-suspenders alongside the root's own
                height:100vh/overflow:hidden fix, which is what actually
                makes <main> the sole scroll container now)
              - ~50% transparent background + backdrop blur/saturate, so
                content scrolling underneath stays faintly, softly visible
              - a thin semi-transparent border on the top/left/right only
                (a "specular highlight" edge) — the bottom border is
                explicitly none so the glass blends into the content below
                instead of being boxed in
              - a soft, diffused, low-opacity drop shadow to lift it off
                the page, no harsh edge
            The extra sheen layer (a soft light-catching gradient beyond
            the crisp top border above) is a ::after in OrbitShell.css,
            since a pseudo-element can't be expressed as an inline style. */}
        <header className="orbit-topbar" style={{
          height:           "56px",
          position:         "sticky",
          top:              0,
          zIndex:           5,
          // A distinctly lighter/more saturated indigo than the near-black
          // page canvas (--orbit-canvas is #0b0a14, --orbit-surface is
          // #131124) — blending 50% of THOSE colors into themselves reads
          // as flat black no matter how correct the opacity math is, since
          // there's no hue/brightness gap for the transparency to reveal.
          // This tint is deliberately brighter/more violet so the panel
          // visibly separates from the canvas even at rest.
          background:       theme === "dark" ? "rgba(64, 54, 112, 0.6)" : "rgba(255, 255, 255, 0.6)",
          backdropFilter:   "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          backgroundImage:  "var(--orbit-glass-highlight)",
          borderTop:        "1px solid rgba(255, 255, 255, 0.35)",
          borderLeft:       "1px solid rgba(255, 255, 255, 0.22)",
          borderRight:      "1px solid rgba(255, 255, 255, 0.22)",
          borderBottom:     "none",
          display:          "flex",
          alignItems:       "center",
          justifyContent:   "space-between",
          padding:          "0 clamp(12px, 4vw, 24px)",
          flexShrink:       0,
          // Stronger than before — at the very top of the page (before
          // anything has scrolled under the sticky header), blur has
          // nothing behind it to blur, so the panel needs to read as
          // "glass" from its own border/shadow/tint alone, not just blur.
          boxShadow:        theme === "dark"
            ? "0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)"
            : "0 12px 40px rgba(31, 38, 50, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
          gap:              "10px",
        }}>

          {/* Left: hamburger (mobile-only) + logo/wordmark lockup */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
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

            {/* The Iris Orbit mark itself now lives ONLY in the sidebar's
                logo cell above — this used to duplicate it right next to
                that cell. In its place: the user's own department, since
                that's more useful context here than a repeated brand mark. */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, overflow: "hidden" }}>
              {departmentName && (
                <span style={{
                  fontSize:      "15px",
                  fontWeight:    "800",
                  color:         "var(--orbit-text-heading)",
                  letterSpacing: "0.1px",
                  whiteSpace:    "nowrap",
                }}>
                  {departmentName}
                </span>
              )}
              {/* 🎯 BUG FIX ("navbar shows Superadmin Hub after closing a
                  module"): this badge used to reflect currentViewMode alone,
                  so it kept saying "Superadmin Hub" on ordinary learner
                  pages (modules, profile, etc.) just because that's the
                  role's stored preference — not because that's what's
                  actually on screen. It must match isDashboardHome exactly
                  like the content pane and sidebar nav do. */}
              <span style={{
                fontSize:      "10px",
                fontWeight:    "800",
                color:         "var(--orbit-brand)",
                background:    "var(--orbit-brand-muted)",
                letterSpacing: "0.4px",
                textTransform: "uppercase",
                padding:       "3px 8px",
                borderRadius:  "999px",
                whiteSpace:    "nowrap",
              }}>
                {isDashboardHome && currentViewMode === "admin"      ? "Admin Console"
                 : isDashboardHome && currentViewMode === "superadmin" ? "Superadmin Hub"
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
                  if (viewModeKey) localStorage.setItem(viewModeKey, next);
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
                  if (viewModeKey) localStorage.setItem(viewModeKey, m);
                  // "learner" goes Home (/orbit); "superadmin"/"admin" both
                  // go to the dashboard/hub screen — bare /orbit is never
                  // the dashboard, regardless of which mode is picked here.
                  navigate(m === "learner" ? "/orbit" : "/orbit/dashboard?tab=overview");
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

            {/* XP / Lightyear pill — lavender, per the dashboard redesign's chip palette */}
            <span style={{
              display:     "inline-flex",
              alignItems:  "center",
              gap:         "4px",
              background:  "rgba(201, 184, 255, 0.14)",
              border:      "1.5px solid var(--orbit-lavender)",
              color:       "var(--orbit-lavender-text)",
              borderRadius:"var(--radius-full)",
              padding:     "4px 12px",
              fontSize:    "12px",
              fontWeight:  "800",
            }}>
              <PiShootingStarFill size={11} /> {liveXP} Lightyear
            </span>

            {/* Streak pill — pink, rocket-launch icon (not fire) */}
            <span style={{
              display:     "inline-flex",
              alignItems:  "center",
              gap:         "4px",
              background:  "rgba(255, 158, 207, 0.14)",
              border:      "1.5px solid var(--orbit-pink)",
              color:       "var(--orbit-pink-text)",
              borderRadius:"var(--radius-full)",
              padding:     "4px 12px",
              fontSize:    "12px",
              fontWeight:  "800",
            }}>
              <RocketTakeoffFill size={11} /> {streak}
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
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 0 4px rgba(201,184,255,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px var(--orbit-brand-muted)"; }}
            >
              {user?.username?.substring(0, 2).toUpperCase() || "OR"}
            </div>
          </div>
        </header>

        {/* Content pane — Outlet keeps sidebar mounted across all /orbit/* routes.
            🎯 BUG FIX: this used to branch on currentViewMode ALONE, so an
            admin/superadmin got SuperAdminDashboard/Dashboard1 crammed into
            EVERY /orbit/* route — including /orbit/modules, module detail,
            profile, etc. — instead of the actual routed page, even though
            the sidebar has real working nav links to those pages for both
            roles. The dashboard/hub override must only apply on the actual
            dashboard screen (bare /orbit, or /orbit/dashboard) — every other
            path always renders its real route via <Outlet />. */}
        <main ref={mainScrollRef} className="content-fluid-scroller" style={{ flex: 1, overflowY: "auto", padding: "clamp(12px, 4vw, 24px)" }}>
          {isDashboardHome && currentViewMode === "superadmin" ? (
            <SuperAdminDashboard />
          ) : isDashboardHome && currentViewMode === "admin" ? (
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
                <PiShootingStarFill size={22} style={{ flexShrink: 0, color: "var(--orbit-lavender)" }} />
                <span style={{
                  fontSize:              "13px",
                  fontWeight:            "800",
                  background:            "linear-gradient(90deg, #e7c6ff, #a78bfa)",
                  WebkitBackgroundClip:  "text",
                  WebkitTextFillColor:   "transparent",
                  lineHeight:            1.3,
                }}>
                  +{toast.xpAwarded} Lightyear Awarded!
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
