// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import { AuthProvider, default as AuthContext } from "./context/AuthContext";
import { Spinner } from "./components/ui";
import HomePage from "./pages/HomePage";
import TopicTrail from "./pages/TopicTrail";
import Quiz from "./pages/Quiz";
import ModuleTrail from "./pages/ModuleTrail";
import ModuleDetail from "./components/ModuleDetail";
import Layout from "./components/Layout";
import DocumentationPage from "./components/DocumentationPage";
import AuthPage from "./pages/Auth";
import SsoCallback from "./pages/SsoCallback";
import CompleteProfile from "./pages/CompleteProfile";
import AccountRecovery from "./pages/AccountRecovery";
import AccountReset from "./pages/AccountReset";
import VerifyEmail from "./pages/VerifyEmail";
import EmailVerificationPage from "./components/EmailVerificationPage";
import UserProfile from "./pages/UserProfile";
import IdeasAndRD from "./components/IdeasAndRD"; // ✅ IMPORTED: Mount point for Ideas Sandbox Canvas
import { ToastContainer } from "react-toastify";
import OrbitWorkspaceContainer from "./pages/OrbitWorkspaceContainer";
import DailyReadReader from "./pages/DailyReadReader";
import OrbitShell from "./components/OrbitShell";
import OrbitOnboarding from "./pages/OrbitOnboarding";
import CategorySelect from "./pages/CategorySelect";
import PathSelect from "./pages/PathSelect";
import PathCheck from "./pages/PathCheck";
import LegacyJourneyRedirect from "./pages/LegacyJourneyRedirect";
import ModuleJourney from "./pages/ModuleJourney";
import StreakCelebrationOverlay from "./components/StreakCelebrationOverlay";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";

import Dashboard from "./admin/Dashboard";
import useSessionGuard from "./admin/hooks/useSessionGuard";
import { io } from "socket.io-client";
import { SOCKET_ORIGIN, SOCKET_PATH } from "./admin/services/config";
import api from "./admin/services/api";

// The IRIS Orbit session id inside our own JWT (to tell whether a
// "session_ended" notice is about this tab's session).
const tokenSessionId = (token) => {
  try {
    const part = String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part))?.user?.sessionId || null;
  } catch {
    return null;
  }
};

// Protected Route for All Logged-In Users (Trainees & Admins Aligned)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="ui-loading vh-100">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    localStorage.setItem("redirectPath", location.pathname);
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Protected Route for Administrative Authorities (SaaS Hierarchy Locked)
const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="ui-loading vh-100">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    localStorage.setItem("redirectPath", location.pathname);
    return <Navigate to="/login" replace />;
  }

  // Allow both admin and superadmin hierarchies seamlessly
  const hasAdministrativePrivilege =
    user.role === "admin" || user.role === "superadmin";

  if (!hasAdministrativePrivilege) {
    console.warn(
      "Access Interceptor: Trainee attempted illegal route bypass to admin cluster panels.",
    );
    return <Navigate to="/" replace />;
  }

  return children;
};

// 🛡️ GLOBAL APP CONTENT WRAPPER FOR SESSION HARDENING
const AppContent = () => {
  const { user } = React.useContext(AuthContext);

  // ⏳ FORCE EXIT OVERRIDE METHOD FOR IDLE TIMEOUTS
  const triggerGlobalForceExit = () => {
    if (localStorage.getItem("token") || user) {
      console.warn(
        "Global Guard: idle threshold breached. Invalidating states.",
      );

      // End the session on the server too (recorded as an expiry), not just
      // in this browser — the request outlives the page change (keepalive).
      if (localStorage.getItem("token")) api.logoutUser("idle");
      localStorage.removeItem("token");
      localStorage.removeItem("iris_studio_active_tree_state");

      window.location.href = "/login?session_status=expired_timeout";
    }
  };

  // Enforce strict global 15-minute runtime inactivity scan
  useSessionGuard(triggerGlobalForceExit, 45 * 60 * 1000);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user || !user.id) return;

    // The server authenticates the socket from this token + the session
    // cookie (sent because of withCredentials) — not from register_session.
    const socket = io(SOCKET_ORIGIN, { path: SOCKET_PATH, withCredentials: true, auth: { token } });

    socket.on("connect", () => {
      socket.emit("register_session", user.id);
    });

    // The server ended a session of this user (logout in another tab, a
    // password change, an admin): sign out if it's this tab's session.
    socket.on("session_ended", (data) => {
      if (!data?.sessionId || data.sessionId !== tokenSessionId(localStorage.getItem("token"))) return;
      localStorage.removeItem("token");
      localStorage.removeItem("iris_studio_active_tree_state");
      socket.disconnect();
      window.location.href = "/login?session_status=revoked";
    });

    socket.on("force_logout_event", (data) => {
      console.warn("🚨 CRITICAL: Remote system login detected!");
      localStorage.removeItem("token");
      localStorage.removeItem("iris_studio_active_tree_state");
      socket.disconnect();
      window.location.href = "/login?session_status=concurrent_kickout";
    });

    // 🎯 This socket lives at the app root, so — unlike OrbitShell's own
    // socket, which disconnects the moment the user leaves /orbit/* for the
    // sibling /quiz/:moduleId/:topicId route (exactly where card completions
    // happen) — this one stays connected for the whole session regardless of
    // route. Re-broadcasting as a plain DOM CustomEvent lets any mounted
    // component (e.g. the Learn page's module cards) react without needing
    // its own socket connection or a shared Context provider.
    socket.on("module_progress_update", (data) => {
      window.dispatchEvent(new CustomEvent("orbit:module-progress", { detail: data }));
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  return (
    <>
      <Layout>
        <Routes>
        {/* 🔐 Auth & Verification Streams (Public Access Routes) */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/sso/callback" element={<SsoCallback />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/verify-email/:token"
          element={<EmailVerificationPage />}
        />
        <Route path="/forgot-password" element={<AccountRecovery />} />
        <Route path="/reset-password/:token" element={<AccountReset />} />

        {/* ── PUBLIC PAGES ─────────────────────────────────────────── */}
        <Route path="/onboarding" element={<OrbitOnboarding />} />
        <Route path="/" element={<HomePage />} />

        {/* ── LEGACY PUBLIC MODULE ROUTES (kept for backward compat) ── */}
        <Route path="/modules" element={<ProtectedRoute><ModuleTrail /></ProtectedRoute>} />
        <Route path="/modules/:moduleId" element={<ProtectedRoute><ModuleDetail /></ProtectedRoute>} />
        <Route path="/modules/:moduleId/topics" element={<ProtectedRoute><TopicTrail /></ProtectedRoute>} />
        <Route path="/modules/:moduleId/topics/:topicId/cards/:cardId/documentation" element={<ProtectedRoute><DocumentationPage /></ProtectedRoute>} />
        <Route path="/ideas" element={<ProtectedRoute><IdeasAndRD /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

        {/* ── QUIZ — fullscreen, no shell ───────────────────────────── */}
        <Route path="/quiz/:moduleId/:topicId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />

        {/* ── ORBIT SHELL — persistent sidebar for ALL /orbit/* routes ─
            OrbitShell renders <Outlet /> for learner routes so sidebar
            NEVER tears down when navigating Module → Topics → Cards.      */}
        <Route
          path="/orbit"
          element={<ProtectedRoute><OrbitShell /></ProtectedRoute>}
        >
          {/* Learner home (OrbitWorkspace SPA — home/progress/leaderboard sections) */}
          <Route index element={<OrbitWorkspaceContainer />} />
          {/* Real routes for the OrbitWorkspace SPA's remaining internal
              views (progress/leaderboard/pipeline) — static routes below
              (modules/ideas/profile/dashboard) always win over this dynamic
              segment at the same depth, so this only ever catches those
              three values (or a stray value, which OrbitWorkspace's own
              fallback-to-home logic already handles). Same element as
              `index` above — React Router keeps this as ONE mounted
              OrbitWorkspace instance across both, so its data-fetching
              effects don't re-run on section navigation. */}
          <Route path=":section" element={<OrbitWorkspaceContainer />} />

          {/* Deep-link module routes — render INSIDE the persistent sidebar shell.
              "modules" MUST stay the flat, unfiltered module list — dozens of
              existing call sites (quiz-completion redirects, back buttons,
              the homepage/footer "Learn" links, the popular-modules row)
              already navigate straight to "/orbit/modules" expecting exactly
              that. The tag picker lives at its own "tags" path instead, so
              none of those existing flows break. */}
          <Route path="modules" element={<ModuleTrail />} />
          <Route path="modules/:moduleId" element={<ModuleDetail />} />
          <Route path="modules/:moduleId/topics" element={<TopicTrail />} />
          <Route path="modules/:moduleId/topics/:topicId/cards/:cardId/documentation" element={<DocumentationPage />} />

          {/* Tag picker — the new Learn landing. Kept entirely separate from
              "modules" above so nothing that already depends on that path's
              meaning (flat list) is affected. */}
          {/* Learn → Tag → Path → modules. PathSelect / LegacyJourneyRedirect fall
              back to the old Tag → Region views until any Path is published. */}
          <Route path="tags" element={<CategorySelect />} />
          <Route path="tags/:categoryId" element={<PathSelect />} />
          <Route path="tags/:categoryId/region/:regionId" element={<LegacyJourneyRedirect />} />
          <Route path="paths/:pathId" element={<ModuleJourney />} />
          <Route path="paths/:pathId/check/:kind" element={<PathCheck />} />

          {/* Other learner sections as real routes */}
          <Route path="ideas" element={<IdeasAndRD />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="daily-read/:readId" element={<DailyReadReader />} />

          {/* /orbit/dashboard — OrbitShell itself handles admin/superadmin dispatch
              via currentViewMode, so no nested route needed here; this path
              just re-enters the shell (URL changes, sidebar stays mounted). */}
          <Route path="dashboard" element={null} />
        </Route>

        {/* ── LEGACY ADMIN ROUTE ───────────────────────────────────── */}
        <Route path="/admin/*" element={<AdminProtectedRoute><Dashboard /></AdminProtectedRoute>} />
        {/* ⚠️ Fallback Route */}
        <Route
          path="*"
          element={
            <div className="ui-page ui-page--narrow">
              <div className="ui-empty">
                <h1 className="ui-h2">404 Not Found</h1>
                <p className="ui-small">The page you're looking for doesn't exist or may have moved.</p>
                <Link to="/" className="ui-btn ui-btn--primary">Back to home</Link>
              </div>
            </div>
          }
        />
        </Routes>
      </Layout>
      <StreakCelebrationOverlay />
    </>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <ToastContainer />
      </AuthProvider>
    </Router>
  );
}
