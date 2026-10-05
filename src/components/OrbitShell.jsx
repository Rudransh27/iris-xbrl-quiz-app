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
import { SOCKET_ORIGIN, SOCKET_PATH } from "../admin/services/config";
import SuperAdminDashboard from "../admin/SuperAdminDashboard";
import Dashboard1 from "../admin/Dashboard1";
import {
  House, Book, BarChart, Lightbulb, Trophy, PersonCircle,
  Shield, Building, Broadcast, RocketTakeoffFill,
  SunFill, MoonFill, Activity, BoxArrowRight,
  List, XLg, TagFill,
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
    // Authenticated socket: the server checks this token + the session cookie.
    const socket = socketIO(SOCKET_ORIGIN, {
      path: SOCKET_PATH, transports: ["websocket"], reconnectionAttempts: 5,
      withCredentials: true, auth: { token: localStorage.getItem("token") },
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
        message:     message || `☄️ You've been awarded ${xpAwarded} Lightyears for "${moduleTitle}"!`,
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
    p.startsWith("/orbit/modules") || p.startsWith("/orbit/tags") || p.startsWith("/orbit/paths") ? "modules"
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

  // 🎯 BUG FIX ("Admin pill shows selected but the page is Learner, and
  // clicking it does nothing"): currentViewMode is resolved from the
  // user's ROLE alone (see resolveViewMode) and stays "admin"/"superadmin"
  // even on bare /orbit, where isDashboardHome is false and the Learner
  // workspace is what's actually rendered. The mode-switcher pills used to
  // highlight raw currentViewMode, so an admin landed on Learner content
  // with "Admin" already shown active — and since the click handler's
  // no-op guard also compared against currentViewMode, clicking that
  // already-"active" Admin pill did nothing. The switcher must reflect
  // what's actually on screen, exactly like the badge above already does.
  const displayedViewMode = isDashboardHome ? currentViewMode : "learner";

  const goTo = (dest) => {
    // "Learn" opens the tag picker now — the flat "/orbit/modules" list
    // stays exactly what it always was (dozens of other flows depend on
    // that), reachable from the tag picker's own "Browse all modules" link.
    if (dest === "modules")  return navigate("/orbit/tags");
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
  // Icon-on-top, label-below on the desktop rail (icon sits in a rounded
  // indicator that tints --ui-hover on hover and --ui-accent-soft when
  // active); the mobile drawer re-flows the same markup into icon-left rows.
  // All visuals live in OrbitShell.css — `title` still carries the label,
  // useful since a long label can be truncated at rail width.
  const sideNavItem = (Icon, label, isActive, onClickFn, isDanger = false) => (
    <div
      key={label}
      className={`orbit-nav-item${isActive ? " is-active" : ""}${isDanger ? " orbit-nav-item--danger" : ""}`}
      onClick={() => { onClickFn(); setIsMobileDrawerOpen(false); }}
      title={label}
    >
      <div className="orbit-nav-item__icon">
        <Icon size={20} />
      </div>
      <span className="orbit-nav-item__label">
        {label}
      </span>
    </div>
  );

  // ─── Section header / divider ─────────────────────────────────────────────
  // Just a small gap between logical groups now — the icon-rail is too
  // narrow for readable uppercase group labels (and the reference layout
  // doesn't show any); grouping is still implicit in the JSX list order.
  const sideSection = (label) => <div key={`sec-${label}`} className="orbit-nav-gap" />;

  return (
    <div className="orbit-app-root">

      {/* Mobile-only dimmed backdrop behind the drawer — closes it on tap. */}
      {isMobileDrawerOpen && (
        <div className="orbit-sidebar-backdrop" onClick={() => setIsMobileDrawerOpen(false)} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PERSISTENT ICON-RAIL SIDEBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <aside className={`orbit-sidebar ${isMobileDrawerOpen ? "orbit-sidebar--open" : ""}`}>

        {/* ── Logo — the ONE place the Iris Orbit mark appears. This cell is
               exactly --ui-topbar-h tall and shares the topbar's bottom
               border, so the two read as one continuous line. Plain
               --ui-surface in both themes (tokens switch it). */}
        <div className="orbit-sidebar__brand">
          <img
            src={irisOrbitLogo}
            alt="Iris Orbit"
            className="orbit-sidebar__logo"
          />
          <button
            className="orbit-mobile-drawer-close ui-btn ui-btn--ghost ui-btn--icon"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-label="Close menu"
          >
            <XLg size={16} />
          </button>
        </div>

        {/* ── Navigation stack ──────────────────────────────────────── */}
        <div className="orbit-sidebar-nav">

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
              {sideNavItem(TagFill,   "Tags",      adminTab === "tags",               () => goAdmin("tags"))}
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
              {sideNavItem(TagFill,  "Tags",      false, () => {
                setCurrentViewMode("admin");
                if (viewModeKey) localStorage.setItem(viewModeKey, "admin");
                navigate("/orbit/dashboard?tab=tags");
              })}
              {sideNavItem(Activity, "Analytics", false, () => navigate("/orbit/dashboard?tab=platform-analytics"))}
            </>
          )}
        </div>

        {/* ── Footer — Sign Out lives up top now, not buried here ────── */}
        <div className="orbit-sidebar__foot">
          {sideNavItem(PersonCircle, "Profile", activeNav === "profile", () => goTo("profile"))}
          {sideNavItem(House,        "Exit",    false,                   () => navigate("/"))}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT COLUMN
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="orbit-shell__column">

        {/* Topbar — a calm, solid --ui-surface bar with a single bottom
            border (no glass/blur/gradient). <main> below is the sole scroll
            container, so the bar never scrolls away. */}
        <header className="orbit-topbar">

          {/* Left: hamburger (mobile-only) + department / view context */}
          <div className="orbit-topbar__left">
            <button
              className="orbit-hamburger-trigger ui-btn ui-btn--ghost ui-btn--icon"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Open menu"
            >
              <List size={20} />
            </button>

            {/* The Iris Orbit mark itself now lives ONLY in the sidebar's
                logo cell above — this used to duplicate it right next to
                that cell. In its place: the user's own department, since
                that's more useful context here than a repeated brand mark. */}
            <div className="orbit-topbar__context">
              {departmentName && (
                <span className="orbit-topbar__dept">
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
              <span className="orbit-topbar__mode ui-badge ui-badge--accent">
                {isDashboardHome && currentViewMode === "admin"      ? "Admin Console"
                 : isDashboardHome && currentViewMode === "superadmin" ? "Superadmin Hub"
                 : "Learner View"}
              </span>
            </div>
          </div>

          {/* Right: controls */}
          <div className="orbit-topbar__right">

            {/* Theme toggle */}
            <button
              className="orbit-topbar__theme ui-btn ui-btn--ghost ui-btn--icon"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              {theme === "light" ? <MoonFill size={16} /> : <SunFill size={16} />}
            </button>

            {/* View-mode switcher — one segmented control for both roles.
                "learner" always goes Home (/orbit); "admin"/"superadmin" both
                go to the dashboard/hub screen — bare /orbit is never the
                dashboard, regardless of which mode is picked here. */}
            {(user?.role === "admin" || user?.role === "superadmin") && (
              <div className="orbit-mode-switch ui-tabs" role="tablist" aria-label="View mode">
                {(user.role === "superadmin"
                  ? [
                      { key: "superadmin", label: "Superadmin", Icon: Shield },
                      { key: "admin", label: "Admin", Icon: Building },
                      { key: "learner", label: "Learner", Icon: PersonCircle },
                    ]
                  : [
                      { key: "admin", label: "Admin", Icon: Building },
                      { key: "learner", label: "Learner", Icon: PersonCircle },
                    ]
                ).map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={displayedViewMode === key}
                    className={`ui-tab orbit-mode-pill ${displayedViewMode === key ? "orbit-mode-pill--active is-active" : ""}`}
                    onClick={() => {
                      if (displayedViewMode === key) return;
                      setCurrentViewMode(key);
                      if (viewModeKey) localStorage.setItem(viewModeKey, key);
                      navigate(key === "learner" ? "/orbit" : "/orbit/dashboard");
                    }}
                  >
                    <Icon size={14} />
                    <span className="orbit-mode-pill-label">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* XP / Lightyears — accent badge (the one branded metric) */}
            <span className="orbit-topbar__stat orbit-topbar__stat--xp ui-badge ui-badge--accent ui-num">
              <PiShootingStarFill size={14} /> {liveXP} <span className="orbit-topbar__stat-unit">Lightyears</span>
            </span>

            {/* Streak — quiet outline badge, rocket-launch icon (not fire) */}
            <span className="orbit-topbar__stat orbit-topbar__stat--streak ui-badge ui-badge--outline ui-num">
              <RocketTakeoffFill size={13} /> {streak}
            </span>

            {/* Profile avatar — navigates inside shell (no hard redirect) */}
            <div
              className="orbit-topbar__avatar ui-avatar"
              onClick={() => navigate("/orbit/profile")}
              title="Go to your profile"
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
        <main ref={mainScrollRef} className="content-fluid-scroller orbit-shell__main">
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
        <div className="orbit-xp-toasts">
          {toastQueue.map(toast => (
            <div
              key={toast.id}
              className="orbit-xp-toast"
              onClick={() => setToastQueue(prev => prev.filter(t => t.id !== toast.id))}
            >
              <span className="orbit-xp-toast__icon ui-icon-tile">
                <PiShootingStarFill size={20} />
              </span>
              <div className="orbit-xp-toast__body">
                <span className="orbit-xp-toast__title">
                  +{toast.xpAwarded} Lightyears Awarded!
                </span>
                <p className="orbit-xp-toast__message">
                  {toast.message}
                </p>
                <p className="orbit-xp-toast__hint">
                  Tap to dismiss
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
