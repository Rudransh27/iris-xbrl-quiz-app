// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, default as AuthContext } from "./context/AuthContext";
import { Container, Spinner } from "react-bootstrap";
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
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import EmailVerificationPage from "./components/EmailVerificationPage";
import UserProfile from "./pages/UserProfile";
import IdeasAndRD from "./components/IdeasAndRD"; // ✅ IMPORTED: Mount point for Ideas Sandbox Canvas
import { ToastContainer } from "react-toastify";
import OrbitWorkspaceContainer from "./pages/OrbitWorkspaceContainer";
import DailyReadReader from "./pages/DailyReadReader";
import OrbitShell from "./components/OrbitShell";
import OrbitOnboarding from "./pages/OrbitOnboarding";
import StreakCelebrationOverlay from "./components/StreakCelebrationOverlay";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";

import Dashboard from "./admin/Dashboard";
import useSessionGuard from "./admin/hooks/useSessionGuard";
import { io } from "socket.io-client";

// Protected Route for All Logged-In Users (Trainees & Admins Aligned)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
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
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
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
        "Global Guard: 15-minute idle threshold breached. Invalidating states.",
      );

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

    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      socket.emit("register_session", user.id);
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

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

          {/* Deep-link module routes — render INSIDE the persistent sidebar shell */}
          <Route path="modules" element={<ModuleTrail />} />
          <Route path="modules/:moduleId" element={<ModuleDetail />} />
          <Route path="modules/:moduleId/topics" element={<TopicTrail />} />
          <Route path="modules/:moduleId/topics/:topicId/cards/:cardId/documentation" element={<DocumentationPage />} />

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
          element={<h1 className="text-center p-5">404 Not Found</h1>}
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
