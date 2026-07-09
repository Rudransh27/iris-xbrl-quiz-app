// src/pages/OrbitWorkspace.jsx
import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PlayFill,
  CheckCircleFill,
  TrophyFill,
  LightningCharge,
  Search,
  StarFill,
  CheckLg,
  SendFill,
} from "react-bootstrap-icons";
import AuthContext from "../context/AuthContext";
import api from "../admin/services/api";
import DashboardHome from "../components/OrbitDashboard/DashboardHome";
import { toDateKey, loadHistory, markDay } from "../components/OrbitDashboard/dashboardStorage";
import { getCurrentModule, setCurrentModule } from "../components/OrbitDashboard/currentModuleStorage";

// ============================================================
// PROGRESS RING  --  SVG circular progress indicator
// ============================================================
const ProgressRing = ({ pct, size = 52, stroke = 5 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct === 100 ? "#10b981" : pct > 0 ? "#457b9d" : "#e2e8f0";
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
};

// ============================================================
// MODULE CARD GRADIENT PALETTE
// ============================================================
const CARD_GRADIENTS = [
  "linear-gradient(135deg,#1d3557,#457b9d)",
  "linear-gradient(135deg,#065f46,#10b981)",
  "linear-gradient(135deg,#7c2d12,#f97316)",
  "linear-gradient(135deg,#4c1d95,#8b5cf6)",
  "linear-gradient(135deg,#831843,#ec4899)",
  "linear-gradient(135deg,#1e3a5f,#3b82f6)",
];

// ============================================================
// SHARED STYLE TOKENS
// ============================================================
const tactilePanelStyle = {
  background: "var(--bg-tactile-cards)",
  border: "2px solid var(--border-tactile)",
  borderBottom: "5px solid var(--border-tactile)",
  borderRadius: "16px",
  padding: "24px 28px",
  boxShadow: "0 4px 0 rgba(0,0,0,0.01)",
  transition: "background-color 0.2s ease, border-color 0.2s ease",
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function OrbitWorkspace({ currentViewMode = "learner" }) {
  const { user, updateUserStreak } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSection = searchParams.get("view") || "home";

  // â"€â"€ Shared data â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [modules, setModules] = useState([]);
  const [todaysRead, setTodaysRead] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [completedCardIds, setCompletedCardIds] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [telemetry, setTelemetry] = useState({
    modulesCompleted: 0,
    cardsRead: 0,
    codingProblems: 0,
    streak: 0,
    activeModuleId: null,
  });

  const [streakData, setStreakData] = useState({
    currentStreak:      0,
    longestStreak:      0,
    qualifiesForStreak: false,
    todayActions:       [],
    engagementHistory:  [],
  });

  const verifyStreak = useCallback(async (actionType) => {
    try {
      if (typeof api.verifyDailyStreak !== "function") return;
      const res = await api.verifyDailyStreak(actionType);
      if (res?.success) {
        setStreakData(prev => ({
          ...prev,
          currentStreak:      res.currentStreak,
          longestStreak:      res.longestStreak,
          qualifiesForStreak: res.qualifiesForStreak,
          todayActions:       res.todayActions || [],
        }));
        if (res.currentStreak !== undefined) {
          setTelemetry(prev => ({ ...prev, streak: res.currentStreak }));
          updateUserStreak(res.currentStreak);
        }
      }
    } catch (_) {}
  }, [updateUserStreak]);

  // â"€â"€ Loading flags â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);
  // 'idle' → 'loading' → 'loaded' — drives skeleton vs real content
  const [pageStatus, setPageStatus] = useState("idle");

  // â"€â"€ Ideas section state â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [ideaCategory, setIdeaCategory] = useState("Process Improvement");
  const [ideaSubmitting, setIdeaSubmitting] = useState(false);
  const [ideaSuccess, setIdeaSuccess] = useState(false);
  const [ideaError, setIdeaError] = useState("");
  const [myIdeas, setMyIdeas] = useState([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  // â"€â"€ Modules section filter â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  // â"€â"€ Derived identity â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const liveXp = user?.xp ?? 0;
  const rawName = user?.username || "Trainee";
  const capitalizedWelcomeName =
    rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

  const resolvedDeptName =
    user?.department && typeof user.department === "object"
      ? user.department.name
      : departmentsList.find(
          (d) => d._id?.toString() === user?.department?.toString()
        )?.name || "GENERAL OPERATIONS";

  const resolvedTeamName =
    user?.team && typeof user.team === "object"
      ? user.team.name
      : (() => {
          const activeDeptDoc = departmentsList.find(
            (d) => d._id?.toString() === user?.department?.toString()
          );
          const activeTeamDoc = activeDeptDoc?.teams?.find(
            (t) => t._id?.toString() === user?.team?.toString()
          );
          return activeTeamDoc ? activeTeamDoc.name : null;
        })();

  // â"€â"€ Navigation gate (quiz vs topic trail) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleNavigationGate = useCallback(
    (mod) => {
      const targetModuleId = mod._id || mod.id;
      // Explicit user selection — track as the "current module" for the checklist widget.
      setCurrentModule(user?._id, { moduleId: targetModuleId });
      if (mod.hasTopics === false || mod.strategy === "EXPRESS_FLAT") {
        navigate(`/quiz/${targetModuleId}/undefined`);
      } else {
        navigate(`/orbit/modules/${targetModuleId}/topics`);
      }
    },
    [navigate, user?._id]
  );

  // â"€â"€ Per-module progress helper â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const getModuleProgress = useCallback(
    (mod) => {
      const ids = (mod.allCardIds || []).map((id) => id.toString());
      const total = mod.totalCardCount || ids.length;
      const done =
        ids.length > 0
          ? ids.filter((id) => completedCardIds.includes(id)).length
          : 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { ids, total, done, pct };
    },
    [completedCardIds]
  );

  // Memoized: only recalculates when modules list or completedCardIds change
  const activeModule = useMemo(() =>
    modules.find((m) => { const { done, total } = getModuleProgress(m); return done > 0 && done < total; }) ||
    modules.find((m) => { const { done, total } = getModuleProgress(m); return done < total; }) ||
    modules[0],
  [modules, getModuleProgress]);

  // Algorithmic "smart" pick: most-recently-attempted in-progress module first.
  // Lives at component level (not inside renderHome) so it's a stable useMemo,
  // not a re-computation inside every render call. This is the exact loop break
  // point: previously this sort ran inside renderHome() on every render cycle.
  const displayModule = useMemo(() => {
    if (!modules.length) return null;
    const inProgress = modules
      .filter(m => { const { done, total } = getModuleProgress(m); return total > 0 && done > 0 && done < total; })
      .sort((a, b) => {
        const tA = a.lastAttemptedTimestamp ? new Date(a.lastAttemptedTimestamp).getTime() : getModuleProgress(a).pct;
        const tB = b.lastAttemptedTimestamp ? new Date(b.lastAttemptedTimestamp).getTime() : getModuleProgress(b).pct;
        return tB - tA;
      });
    return inProgress[0]
      || modules.find(m => { const { done, total } = getModuleProgress(m); return total > 0 && done < total; })
      || modules[0];
  }, [modules, getModuleProgress]);

  // ── Checklist Task 2 (Module Completion) — tiered detection ─────────────
  // Flat modules (hasTopics === false) need the WHOLE module done; modules
  // built from topics only need ONE topic done. The curriculum list
  // (getWorkspaceCurriculum) never includes topics, so fetch the single
  // module's detail lazily whenever the active module changes.
  const [activeModuleTopics, setActiveModuleTopics] = useState([]);
  useEffect(() => {
    if (!displayModule || displayModule.hasTopics === false) {
      setActiveModuleTopics([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getModule(displayModule._id);
        const data = res?.data || res;
        if (!cancelled) setActiveModuleTopics(Array.isArray(data?.topics) ? data.topics : []);
      } catch (_) {
        if (!cancelled) setActiveModuleTopics([]);
      }
    })();
    return () => { cancelled = true; };
  }, [displayModule?._id, displayModule?.hasTopics]);

  // Platform-wide admin override: when set, the checklist tracks THIS module
  // instead of the auto-picked displayModule (see moduleTaskDone below).
  const hotModule = useMemo(
    () => modules.find((m) => m.isHotModule) || null,
    [modules]
  );

  // The module/topic the user last explicitly opened (§3 currentModuleStorage).
  // Re-read on every render of a fresh mount (dashboard remounts on route
  // return), so this stays in sync with TopicTrail's topicId writes.
  const currentModuleEntry = getCurrentModule(user?._id);

  const moduleTaskDone = useMemo(() => {
    if (hotModule) {
      if (hotModule.hasTopics === false) {
        // Type B — ALL cards in the hot module must be done.
        const { total, done } = getModuleProgress(hotModule);
        return total > 0 && done >= total;
      }
      // Type A — the ACTIVE topic (the one the user is actually on) must be
      // done, not "any topic" — uses the persisted currentModule.topicId.
      const hotModuleId = (hotModule._id || hotModule.id || "").toString();
      if (currentModuleEntry?.moduleId?.toString() !== hotModuleId) return false;
      const completedTopicIds = (progressData?.completedTopicIds || []).map((id) => id.toString());
      return !!currentModuleEntry?.topicId && completedTopicIds.includes(currentModuleEntry.topicId.toString());
    }

    if (!displayModule) return false;
    if (displayModule.hasTopics === false) {
      const { total, done } = getModuleProgress(displayModule);
      return total > 0 && done >= total;
    }
    const completedTopicIds = (progressData?.completedTopicIds || []).map((id) => id.toString());
    return activeModuleTopics.some((t) => completedTopicIds.includes((t._id || t.id || "").toString()));
  }, [hotModule, currentModuleEntry, displayModule, activeModuleTopics, progressData, getModuleProgress]);

  // â"€â"€ Data fetching â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  // LOOP-BREAK: dep is user?._id (stable primitive) not the full `user` object.
  // Using the full `user` object caused: fetch → updateUserStreak(n) → setUser({...user,streak:n})
  // → new `user` reference → effect re-fires → infinite loop.
  useEffect(() => {
    const fetchCoreData = async () => {
      setPageStatus("loading");
      setLoadingModules(true);
      setLoadingLeaderboard(true);
      setLoadingProgress(true);
      let currentActiveId = null;

      // Departments
      try {
        if (typeof api.getDepartments === "function") {
          const deptsRes = await api.getDepartments();
          const cleanDepts =
            deptsRes && deptsRes.success ? deptsRes.data : deptsRes;
          if (Array.isArray(cleanDepts)) setDepartmentsList(cleanDepts);
        }
      } catch (_) {}

      // User progress
      try {
        const progressResponse = await api.getUserProgress();
        const progressRes =
          progressResponse && progressResponse.success
            ? progressResponse.data
            : progressResponse;
        if (progressRes) {
          currentActiveId =
            progressRes.activeModuleId || progressRes.currentModuleId || null;
          setTelemetry({
            modulesCompleted:
              progressRes.completedModulesCount ||
              progressRes.modulesCompleted ||
              0,
            cardsRead:
              progressRes.completedCardsCount || progressRes.cardsRead || 0,
            codingProblems:
              progressRes.completedCodingCount ||
              progressRes.codingProblems ||
              0,
            streak: progressRes.currentStreak || progressRes.streak || 0,
            activeModuleId: currentActiveId,
          });
          setProgressData(progressRes);
          if (Array.isArray(progressRes.completedCardIds)) {
            setCompletedCardIds(
              progressRes.completedCardIds.map((id) => id.toString())
            );
          }
        }
      } catch (_) {} finally {
        setLoadingProgress(false);
      }

      // Leaderboard
      try {
        if (typeof api.getDepartmentLeaderboard === "function") {
          const boardResponse = await api.getDepartmentLeaderboard();
          const serverRankings =
            boardResponse && boardResponse.success
              ? boardResponse.data
              : boardResponse;
          if (Array.isArray(serverRankings)) setLeaderboard(serverRankings);
        }
      } catch (_) {} finally {
        setLoadingLeaderboard(false);
      }

      // Streak state — deep-equality guard prevents spurious child remounts
      try {
        if (typeof api.getMyStreak === "function") {
          const streakRes = await api.getMyStreak();
          if (streakRes?.success) {
            const next = {
              currentStreak:      streakRes.currentStreak || 0,
              longestStreak:      streakRes.longestStreak || 0,
              qualifiesForStreak: streakRes.qualifiesForStreak || false,
              todayActions:       streakRes.todayActions || [],
              engagementHistory:  streakRes.engagementHistory || [],
            };
            setStreakData(prev =>
              prev.currentStreak      === next.currentStreak      &&
              prev.longestStreak      === next.longestStreak      &&
              prev.qualifiesForStreak === next.qualifiesForStreak &&
              prev.todayActions.join() === next.todayActions.join() &&
              prev.engagementHistory.length === next.engagementHistory.length
                ? prev   // same data — skip re-render
                : next
            );
          }
        }
      } catch (_) {}

      // Today's read
      try {
        const readResponse = await api.getTodaysRead();
        const cleanArticle =
          readResponse && readResponse.success
            ? readResponse.data
            : readResponse;
        if (cleanArticle && cleanArticle.title) {
          setTodaysRead({
            id: cleanArticle._id || cleanArticle.id,
            title: cleanArticle.title,
            content: cleanArticle.content,
          });
        }
      } catch (_) {}

      // Modules/curriculum
      try {
        const modulesResponse =
          typeof api.getWorkspaceCurriculum === "function"
            ? await api.getWorkspaceCurriculum()
            : await api.getModules();
        const serverModules =
          modulesResponse && modulesResponse.success
            ? modulesResponse.data
            : modulesResponse;

        if (Array.isArray(serverModules) && serverModules.length > 0) {
          const processed = serverModules.map((baseMod, index) => {
            const modId = baseMod._id || baseMod.id;
            const currentModIdStr = modId ? modId.toString() : "";
            const targetStrategy = baseMod.engineStrategy || "STANDARD";
            const calculatedTopicCount =
              baseMod.topicCount !== undefined
                ? baseMod.topicCount
                : baseMod.topics?.length || baseMod.cards?.length || 4;
            const activeIdStr = currentActiveId
              ? currentActiveId.toString()
              : null;
            const isCurrentlyUsing = activeIdStr
              ? currentModIdStr === activeIdStr
              : index === 0;
            return {
              ...baseMod,
              _id: currentModIdStr,
              id: currentModIdStr,
              status: isCurrentlyUsing ? "In Progress" : "Completed",
              badgeClass: isCurrentlyUsing ? "badge-progress" : "badge-done",
              topicCount: calculatedTopicCount,
              strategy: targetStrategy,
            };
          });
          setModules(processed);
        }
      } catch (_) {} finally {
        setLoadingModules(false);
      }
    };

    fetchCoreData().finally(() => setPageStatus("loaded"));
  // user?._id: re-fetch only when a different user logs in, not on every
  // user-object mutation (e.g. streak/XP updates which create new references).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentViewMode, user?._id]);

  // Propagate streak to AuthContext (sidebar + profile) whenever streakData
  // changes. Kept separate from the fetch effect so it cannot re-trigger it.
  // updateUserStreak is stable (useCallback([], [])) so this effect is safe.
  useEffect(() => {
    updateUserStreak(streakData.currentStreak);
  }, [streakData.currentStreak, updateUserStreak]);

  // Ideas fetch  --  only when ideas section is active
  useEffect(() => {
    if (currentSection !== "ideas") return;
    const fetchIdeas = async () => {
      setLoadingIdeas(true);
      try {
        if (typeof api.getUserIdeas === "function") {
          const res = await api.getUserIdeas();
          const data = res && res.success ? res.data : res;
          if (Array.isArray(data)) setMyIdeas(data);
        }
      } catch (_) {} finally {
        setLoadingIdeas(false);
      }
    };
    fetchIdeas();
  }, [currentSection]);

  // â"€â"€ Idea submission handler â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleIdeaSubmit = async (e) => {
    e.preventDefault();
    if (!ideaTitle.trim() || !ideaDescription.trim()) {
      setIdeaError("Title and description are required.");
      return;
    }
    setIdeaSubmitting(true);
    setIdeaError("");
    try {
      await api.submitIdeaNode({
        title: ideaTitle.trim(),
        description: ideaDescription.trim(),
        category: ideaCategory,
      });
      setIdeaSuccess(true);
      verifyStreak("idea_submission");
      const todayKey = toDateKey(new Date());
      markDay(user?._id || "guest", loadHistory(user?._id || "guest"), todayKey, { idea: true });
      setIdeaTitle("");
      setIdeaDescription("");
      setIdeaCategory("Process Improvement");
      // Refresh ideas list
      if (typeof api.getUserIdeas === "function") {
        const res = await api.getUserIdeas();
        const data = res && res.success ? res.data : res;
        if (Array.isArray(data)) setMyIdeas(data);
      }
      setTimeout(() => setIdeaSuccess(false), 4000);
    } catch (err) {
      setIdeaError(err?.message || "Failed to submit idea. Please try again.");
    } finally {
      setIdeaSubmitting(false);
    }
  };

  // ============================================================
  // SECTION: HOME -- delegates to the modular Iris Orbit dashboard
  // (see src/components/OrbitDashboard/). Data fetching + navigation
  // helpers stay in this file; presentation and the checklist -> 
  // calendar -> streak logic live in DashboardHome and its children.
  // ============================================================
  const renderHome = () => {
    // Skeleton layout -- mirrors real structure, locks dimensions during async load
    if (pageStatus !== "loaded") {
      const skel = (h, r = "16px", extra = {}) => ({
        height: h, borderRadius: r,
        background: "var(--orbit-surface)",
        border: "1px solid var(--orbit-border)",
        animation: "orbit-skeleton-pulse 1.5s ease-in-out infinite",
        ...extra,
      });
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={skel("130px", "20px")} />
          <div style={skel("52px", "0 10px 10px 0", { borderLeft: "4px solid var(--orbit-border)" })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px" }}>
            <div style={skel("196px")} />
            <div style={skel("196px", "20px")} />
          </div>
          <div style={skel("112px")} />
          <div style={skel("118px")} />
        </div>
      );
    }

    return (
      <DashboardHome
        user={user}
        navigate={navigate}
        todaysRead={todaysRead}
        modules={modules}
        displayModule={displayModule}
        hotModule={hotModule}
        moduleTaskDone={moduleTaskDone}
        getModuleProgress={getModuleProgress}
        handleNavigationGate={handleNavigationGate}
        verifyStreak={verifyStreak}
      />
    );
  };


  // ============================================================
  // SECTION: LEARN  (formerly "My Modules")
  // ============================================================
  const renderModules = () => {
    const filteredModules = modules.filter((mod) => {
      const { pct } = getModuleProgress(mod);
      const matchesSearch = mod.title
        ?.toLowerCase()
        .includes(moduleSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (moduleFilter === "completed") return pct === 100;
      if (moduleFilter === "inprogress") return pct > 0 && pct < 100;
      if (moduleFilter === "notstarted") return pct === 0;
      return true;
    });

    // Soft-rainbow pastel palette — one theme per card position, cycles every 4
    const LEARN_PALETTE = [
      {
        bg:         "var(--pastel-modules)",
        border:     "var(--pastel-modules-border)",
        label:      "var(--pastel-modules-text)",
        accent:     "#8b5cf6",
        accentBg:   "rgba(139,92,246,0.09)",
        accentRing: "rgba(139,92,246,0.22)",
        bar:        "linear-gradient(90deg,#8b5cf6,#a78bfa)",
      },
      {
        bg:         "var(--pastel-reads)",
        border:     "var(--pastel-reads-border)",
        label:      "var(--pastel-reads-text)",
        accent:     "#0ea5e9",
        accentBg:   "rgba(14,165,233,0.09)",
        accentRing: "rgba(14,165,233,0.22)",
        bar:        "linear-gradient(90deg,#0ea5e9,#38bdf8)",
      },
      {
        bg:         "var(--pastel-progress)",
        border:     "var(--pastel-progress-border)",
        label:      "var(--pastel-progress-text)",
        accent:     "#10b981",
        accentBg:   "rgba(16,185,129,0.09)",
        accentRing: "rgba(16,185,129,0.22)",
        bar:        "linear-gradient(90deg,#10b981,#34d399)",
      },
      {
        bg:         "var(--pastel-streak)",
        border:     "var(--pastel-streak-border)",
        label:      "var(--pastel-streak-text)",
        accent:     "#f59e0b",
        accentBg:   "rgba(245,158,11,0.09)",
        accentRing: "rgba(245,158,11,0.22)",
        bar:        "linear-gradient(90deg,#f59e0b,#fbbf24)",
      },
    ];

    return (
      <div style={{
        background:           "var(--orbit-glass-bg)",
        backdropFilter:       "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border:               "1px solid var(--orbit-border)",
        borderRadius:         "20px",
        padding:              "24px 32px",
      }}>

        {/* ── Header row ──────────────────────────────────────────── */}
        <div style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          marginBottom:   "24px",
          flexWrap:       "wrap",
          gap:            "12px",
        }}>
          <h2 style={{
            fontSize:      "20px",
            fontWeight:    "700",
            color:         "var(--orbit-text-heading)",
            margin:        0,
            letterSpacing: "-0.02em",
          }}>
            Learn
          </h2>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={13} style={{
                position:      "absolute",
                left:          "11px",
                color:         "var(--orbit-text-muted)",
                pointerEvents: "none",
              }} />
              <input
                type="text"
                placeholder="Search modules…"
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                style={{
                  paddingLeft:   "32px",
                  paddingRight:  "12px",
                  paddingTop:    "7px",
                  paddingBottom: "7px",
                  background:    "var(--orbit-surface)",
                  border:        "1px solid var(--orbit-border)",
                  borderRadius:  "10px",
                  fontSize:      "13px",
                  color:         "var(--orbit-text-body)",
                  fontWeight:    "500",
                  outline:       "none",
                  width:         "190px",
                }}
              />
            </div>

            {/* Filter */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{
                padding:      "7px 12px",
                background:   "var(--orbit-surface)",
                border:       "1px solid var(--orbit-border)",
                borderRadius: "10px",
                fontSize:     "13px",
                color:        "var(--orbit-text-body)",
                fontWeight:   "500",
                cursor:       "pointer",
                outline:      "none",
              }}
            >
              <option value="all">All Modules</option>
              <option value="inprogress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="notstarted">Not Started</option>
            </select>
          </div>
        </div>

        {/* ── States: loading skeleton / empty / grid ───────────── */}
        {loadingModules ? (
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap:                 "18px",
          }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                height:    "220px",
                borderRadius: "16px",
                background: "var(--orbit-surface)",
                border:     "1px solid var(--orbit-border)",
                animation:  "orbit-skeleton-pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.08}s`,
              }} />
            ))}
          </div>
        ) : filteredModules.length === 0 ? (
          <div style={{
            textAlign:  "center",
            padding:    "60px 24px",
            color:      "var(--orbit-text-muted)",
            fontSize:   "14px",
            fontWeight: "500",
          }}>
            No modules match your filter.
          </div>
        ) : (
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap:                 "18px",
          }}>
            {filteredModules.map((mod, index) => {
              const { total, done, pct } = getModuleProgress(mod);
              const p           = LEARN_PALETTE[index % LEARN_PALETTE.length];
              const isCompleted = total > 0 && pct === 100;
              const isInProgress= pct > 0 && !isCompleted;
              // Sanitize title — strip encoding artefacts
              const safeTitle   = (mod.title || "Untitled Module").replace(/[� -]/g, "").trim();
              const shortLabel  = safeTitle.length > 26 ? safeTitle.slice(0, 24) + "…" : safeTitle;
              const xpEarned    = done  * 10;
              const xpTotal     = total * 10;

              return (
                <div
                  key={mod._id || mod.id || index}
                  onClick={() => handleNavigationGate(mod)}
                  style={{
                    background:    p.bg,
                    border:        `1px solid ${p.border}`,
                    borderRadius:  "16px",
                    overflow:      "hidden",
                    cursor:        "pointer",
                    display:       "flex",
                    flexDirection: "column",
                    transition:    "transform 0.18s ease, box-shadow 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Thin accent stripe — color signals state */}
                  <div style={{
                    height:     "3px",
                    background: isCompleted
                      ? "linear-gradient(90deg,#10b981,#34d399)"
                      : isInProgress
                      ? p.bar
                      : "var(--orbit-border)",
                    transition: "background 0.35s ease",
                  }} />

                  {/* Card body */}
                  <div style={{
                    padding:       "20px 24px",
                    flex:          1,
                    display:       "flex",
                    flexDirection: "column",
                    gap:           "12px",
                  }}>

                    {/* Row: module number eyebrow + status badge */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{
                        fontSize:      "9px",
                        fontWeight:    "800",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        color:         p.label,
                        opacity:       0.6,
                      }}>
                        MODULE {String(index + 1).padStart(2, "0")}
                      </span>

                      {total > 0 && (
                        <span style={{
                          fontSize:      "9px",
                          fontWeight:    "800",
                          letterSpacing: "0.6px",
                          textTransform: "uppercase",
                          color:         isCompleted ? "#10b981" : isInProgress ? p.accent : "var(--orbit-text-muted)",
                          background:    isCompleted ? "rgba(16,185,129,0.09)" : isInProgress ? p.accentBg : "var(--orbit-surface)",
                          border:        `1px solid ${isCompleted ? "rgba(16,185,129,0.22)" : isInProgress ? p.accentRing : "var(--orbit-border)"}`,
                          borderRadius:  "6px",
                          padding:       "2px 8px",
                        }}>
                          {isCompleted ? "Done" : isInProgress ? "In Progress" : "New"}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div style={{
                      fontSize:         "15px",
                      fontWeight:       "700",
                      color:            "var(--orbit-text-heading)",
                      lineHeight:       1.35,
                      letterSpacing:    "-0.2px",
                      overflow:         "hidden",
                      display:          "-webkit-box",
                      WebkitLineClamp:  2,
                      WebkitBoxOrient:  "vertical",
                    }}>
                      {safeTitle}
                    </div>

                    {/* Segments meta */}
                    <div style={{
                      fontSize:   "11px",
                      fontWeight: "500",
                      color:      "var(--orbit-text-muted)",
                    }}>
                      {mod.topicCount || 0} segments
                    </div>

                    {/* Progress track + live label */}
                    {total > 0 && (
                      <div style={{ marginTop: "auto" }}>
                        <div style={{
                          fontSize:      "10.5px",
                          fontWeight:    "600",
                          color:         p.label,
                          marginBottom:  "6px",
                          opacity:       0.82,
                          whiteSpace:    "nowrap",
                          overflow:      "hidden",
                          textOverflow:  "ellipsis",
                        }}>
                          {shortLabel}: {pct}% Complete{total > 0 ? ` — ${xpEarned}/${xpTotal} XP Earned` : ""}
                        </div>
                        <div style={{
                          height:       "6px",
                          borderRadius: "10px",
                          background:   "rgba(0,0,0,0.06)",
                          overflow:     "hidden",
                        }}>
                          <div style={{
                            height:       "100%",
                            width:        `${pct}%`,
                            borderRadius: "10px",
                            background:   isCompleted
                              ? "linear-gradient(90deg,#10b981,#34d399)"
                              : p.bar,
                            transition:   "width 0.55s cubic-bezier(0.22,1,0.36,1)",
                          }} />
                        </div>
                      </div>
                    )}

                    {/* CTA button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleNavigationGate(mod); }}
                      style={{
                        width:          "100%",
                        background:     isCompleted ? "rgba(16,185,129,0.09)" : "var(--orbit-brand-muted)",
                        color:          isCompleted ? "#10b981"               : "var(--orbit-brand)",
                        border:         `1px solid ${isCompleted ? "rgba(16,185,129,0.22)" : "var(--orbit-border-strong)"}`,
                        borderRadius:   "10px",
                        padding:        "9px 0",
                        fontSize:       "12px",
                        fontWeight:     "700",
                        cursor:         "pointer",
                        letterSpacing:  "0.2px",
                        transition:     "all 0.15s ease",
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        gap:            "5px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "0.85";
                        e.currentTarget.style.transform = "scale(1.015)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {isCompleted   && <CheckCircleFill size={11} />}
                      {isInProgress  && <PlayFill        size={11} />}
                      {isCompleted ? "Review Module" : isInProgress ? `Continue · ${pct}%` : "Start Learning"}
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    );
  };

  // ============================================================
  // SECTION: PROGRESS
  // ============================================================
  const renderProgress = () => {
    const totalXp = liveXp;
    // Simple level calculation: every 500 XP is one level
    const level = Math.floor(totalXp / 500) + 1;
    const xpIntoLevel = totalXp % 500;
    const xpToNextLevel = 500;
    const levelPct = Math.round((xpIntoLevel / xpToNextLevel) * 100);

    const totalCards =
      progressData?.completedCardsCount || telemetry.cardsRead;
    const totalTopics =
      progressData?.completedTopicsCount || 0;
    const totalModulesDone =
      progressData?.completedModulesCount || telemetry.modulesCompleted;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* XP Level bar */}
        <div style={tactilePanelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Level {level}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  margin: "2px 0 0 0",
                  fontWeight: "600",
                }}
              >
                {xpIntoLevel} / {xpToNextLevel} XP to Level {level + 1}
              </p>
            </div>
            <div
              style={{
                background: "var(--badge-progress-bg)",
                border: "2px solid var(--badge-progress-text)",
                borderBottom: "4px solid var(--badge-progress-text)",
                color: "var(--badge-progress-text)",
                padding: "8px 18px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "900",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <LightningCharge size={15} /> {totalXp.toLocaleString()} XP
            </div>
          </div>
          <div
            style={{
              height: "10px",
              background: "var(--stat-row-border)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${levelPct}%`,
                background: "var(--bg-hud-banner)",
                borderRadius: "6px",
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>

        {/* Stats summary tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            {
              label: "Total XP",
              value: totalXp.toLocaleString(),
              color: "var(--bg-daily-read)",
              sub: "experience points",
            },
            {
              label: "Cards Done",
              value: totalCards,
              color: "var(--curriculum-icon-text)",
              sub: "learning cards",
            },
            {
              label: "Topics Done",
              value: totalTopics,
              color: "#10b981",
              sub: "completed topics",
            },
            {
              label: "Modules Done",
              value: totalModulesDone,
              color: "#8b5cf6",
              sub: "full completions",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                ...tactilePanelStyle,
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "900",
                  color: stat.color,
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                  marginTop: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "2px",
                  fontWeight: "600",
                }}
              >
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Module-by-module progress */}
        <div style={tactilePanelStyle}>
          <h5
            style={{
              fontSize: "15px",
              fontWeight: "800",
              color: "var(--text-primary)",
              textTransform: "uppercase",
              margin: "0 0 20px 0",
              letterSpacing: "0.5px",
            }}
          >
            Module Breakdown
          </h5>
          {loadingModules ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                color: "var(--text-secondary)",
                fontWeight: "700",
              }}
            >
              Loading module data...
            </div>
          ) : modules.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                color: "var(--text-secondary)",
              }}
            >
              No modules assigned.
            </div>
          ) : (
            modules.map((mod, index) => {
              const { total, done, pct } = getModuleProgress(mod);
              const isCompleted = total > 0 && pct === 100;
              const isInProgress = pct > 0 && !isCompleted;
              return (
                <div
                  key={mod._id || mod.id || index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "14px 0",
                    borderBottom:
                      index < modules.length - 1
                        ? "2px solid var(--stat-row-border)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: isCompleted
                        ? "rgba(16,185,129,0.12)"
                        : isInProgress
                        ? "var(--curriculum-icon-bg)"
                        : "rgba(100,116,139,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: isCompleted
                        ? "#10b981"
                        : "var(--curriculum-icon-text)",
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircleFill size={16} />
                    ) : (
                      <PlayFill size={16} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "800",
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: "6px",
                      }}
                    >
                      {mod.title}
                    </div>
                    <div
                      style={{
                        height: "5px",
                        background: "var(--stat-row-border)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: isCompleted
                            ? "#10b981"
                            : "var(--curriculum-icon-text)",
                          borderRadius: "4px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        marginTop: "3px",
                        fontWeight: "700",
                      }}
                    >
                      {done}/{total || "?"} cards
                    </div>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "4px 12px",
                      borderRadius: "8px",
                      textTransform: "uppercase",
                      background: isCompleted
                        ? "rgba(16,185,129,0.12)"
                        : isInProgress
                        ? "var(--badge-progress-bg)"
                        : "rgba(100,116,139,0.08)",
                      color: isCompleted
                        ? "#10b981"
                        : isInProgress
                        ? "var(--badge-progress-text)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {pct}%
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // SECTION: LEADERBOARD (full)
  // ============================================================
  const renderLeaderboard = () => {
    const topXp = leaderboard.length > 0 ? leaderboard[0].xp || 1 : 1;

    return (
      <div>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "800",
            color: "var(--text-primary)",
            margin: "0 0 24px 0",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <TrophyFill size={18} color="var(--bg-daily-read)" />
          Department Standings
        </h2>

        {loadingLeaderboard ? (
          <div
            style={{
              ...tactilePanelStyle,
              textAlign: "center",
              padding: "60px",
              color: "var(--text-secondary)",
              fontWeight: "700",
            }}
          >
            Decrypting department rankings...
          </div>
        ) : leaderboard.length === 0 ? (
          <div
            style={{
              ...tactilePanelStyle,
              textAlign: "center",
              padding: "60px",
              color: "var(--text-secondary)",
            }}
          >
            No rankings available yet.
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {leaderboard.map((item, index) => {
              const isMe =
                item.isMe ||
                item.userId === user?.id?.toString() ||
                item.userId === user?._id?.toString();
              const rankColor =
                item.class === "gold"
                  ? "#f59e0b"
                  : item.class === "silver"
                  ? "#94a3b8"
                  : item.class === "bronze"
                  ? "#cd7c3a"
                  : "var(--text-secondary)";
              const xpBarPct = Math.round(
                ((item.xp || 0) / topXp) * 100
              );

              return (
                <div
                  key={`full-lb-${index}`}
                  style={{
                    ...tactilePanelStyle,
                    padding: "18px 24px",
                    background: isMe
                      ? "rgba(0,174,255,0.06)"
                      : "var(--bg-tactile-cards)",
                    borderLeft: isMe
                      ? "4px solid var(--curriculum-icon-text)"
                      : "4px solid transparent",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      marginBottom: "10px",
                    }}
                  >
                    {/* Rank badge */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background:
                          index === 0
                            ? "rgba(245,158,11,0.15)"
                            : index === 1
                            ? "rgba(148,163,184,0.15)"
                            : index === 2
                            ? "rgba(205,124,58,0.15)"
                            : "var(--curriculum-icon-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "900",
                        fontSize: "14px",
                        color: rankColor,
                        flexShrink: 0,
                      }}
                    >
                      {index < 3 ? (
                        <StarFill size={14} color={rankColor} />
                      ) : (
                        `#${item.rank}`
                      )}
                    </div>

                    {/* Avatar */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: isMe
                          ? "var(--curriculum-icon-text)"
                          : item.class === "gold"
                          ? "#f59e0b"
                          : item.class === "silver"
                          ? "#94a3b8"
                          : item.class === "bronze"
                          ? "#cd7c3a"
                          : "var(--stat-row-border)",
                        color:
                          isMe || item.class !== "plain"
                            ? "var(--text-inverse)"
                            : "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: "800",
                        flexShrink: 0,
                        border:
                          index === 0
                            ? "2px solid #f59e0b"
                            : isMe
                            ? "2px solid var(--curriculum-icon-text)"
                            : "none",
                      }}
                    >
                      {item.avatar}
                    </div>

                    {/* Name + rank label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: isMe ? "900" : "700",
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name}
                        {isMe && (
                          <span
                            style={{
                              color: "var(--curriculum-icon-text)",
                              fontSize: "10px",
                              marginLeft: "8px",
                              fontWeight: "800",
                              background: "rgba(0,174,255,0.12)",
                              padding: "2px 7px",
                              borderRadius: "6px",
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color:
                            rankColor !== "var(--text-secondary)"
                              ? rankColor
                              : "var(--text-secondary)",
                          fontWeight: "700",
                          marginTop: "1px",
                        }}
                      >
                        Rank #{item.rank}
                        {index === 0 ? "  --  Top Performer" : ""}
                      </div>
                    </div>

                    {/* XP pill */}
                    <div
                      style={{
                        flexShrink: 0,
                        background:
                          index === 0
                            ? "rgba(245,158,11,0.12)"
                            : "var(--curriculum-icon-bg)",
                        border: `2px solid ${
                          index === 0
                            ? "#f59e0b"
                            : "var(--curriculum-icon-text)"
                        }`,
                        borderBottom: `4px solid ${
                          index === 0
                            ? "#d97706"
                            : "var(--border-hud-tactile)"
                        }`,
                        color:
                          index === 0
                            ? "#f59e0b"
                            : "var(--curriculum-icon-text)",
                        padding: "6px 16px",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "900",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <LightningCharge size={13} />
                      {(item.xp || 0).toLocaleString()} XP
                    </div>
                  </div>

                  {/* Relative XP bar */}
                  <div
                    style={{
                      marginLeft: "92px",
                      height: "6px",
                      background: "var(--stat-row-border)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${xpBarPct}%`,
                        background:
                          index === 0
                            ? "#f59e0b"
                            : isMe
                            ? "var(--curriculum-icon-text)"
                            : rankColor !== "var(--text-secondary)"
                            ? rankColor
                            : "var(--border-tactile)",
                        borderRadius: "4px",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // SECTION: IDEAS
  // ============================================================
  const renderIdeas = () => {
    const CATEGORIES = [
      "Process Improvement",
      "Product Feature",
      "Learning Content",
      "Tooling & Automation",
      "Team Culture",
      "Other",
    ];

    const statusColor = (status) => {
      if (!status) return "var(--text-secondary)";
      const s = status.toLowerCase();
      if (s === "approved" || s === "implemented")
        return { bg: "rgba(16,185,129,0.12)", text: "#10b981" };
      if (s === "under review" || s === "in review")
        return {
          bg: "var(--badge-progress-bg)",
          text: "var(--badge-progress-text)",
        };
      if (s === "rejected")
        return { bg: "rgba(239,68,68,0.1)", text: "#ef4444" };
      return { bg: "var(--curriculum-icon-bg)", text: "var(--curriculum-icon-text)" };
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Submit form */}
        <div style={tactilePanelStyle}>
          <h3
            style={{
              fontSize: "17px",
              fontWeight: "800",
              color: "var(--text-primary)",
              margin: "0 0 6px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Submit an Idea
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              margin: "0 0 20px 0",
              fontWeight: "600",
            }}
          >
            Share a process improvement, content suggestion, or platform idea
            with the team.
          </p>

          {ideaSuccess && (
            <div
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "2px solid #10b981",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "16px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckLg size={15} /> Idea submitted successfully! Our team will
              review it shortly.
            </div>
          )}

          {ideaError && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "2px solid #ef4444",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "16px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#ef4444",
              }}
            >
              {ideaError}
            </div>
          )}

          <form
            onSubmit={handleIdeaSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Idea Title *
              </label>
              <input
                type="text"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder="A concise, clear title..."
                maxLength={120}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--bg-global-canvas)",
                  border: "2px solid var(--border-tactile)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  fontWeight: "600",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--curriculum-icon-text)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--border-tactile)")
                }
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Category
              </label>
              <select
                value={ideaCategory}
                onChange={(e) => setIdeaCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--bg-global-canvas)",
                  border: "2px solid var(--border-tactile)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  fontWeight: "600",
                  outline: "none",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Description *
              </label>
              <textarea
                value={ideaDescription}
                onChange={(e) => setIdeaDescription(e.target.value)}
                placeholder="Describe your idea in detail  --  what problem does it solve, and how?"
                rows={5}
                maxLength={2000}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--bg-global-canvas)",
                  border: "2px solid var(--border-tactile)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  fontWeight: "600",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "110px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  lineHeight: "1.55",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--curriculum-icon-text)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--border-tactile)")
                }
              />
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "4px",
                  textAlign: "right",
                  fontWeight: "600",
                }}
              >
                {ideaDescription.length}/2000
              </div>
            </div>

            <button
              type="submit"
              disabled={ideaSubmitting}
              style={{
                background: ideaSubmitting
                  ? "var(--curriculum-icon-bg)"
                  : "var(--bg-hud-banner)",
                color: ideaSubmitting
                  ? "var(--curriculum-icon-text)"
                  : "var(--text-inverse)",
                border: "none",
                borderBottom: ideaSubmitting
                  ? "3px solid var(--border-tactile)"
                  : "4px solid var(--border-hud-tactile)",
                borderRadius: "12px",
                padding: "12px 28px",
                fontSize: "14px",
                fontWeight: "800",
                cursor: ideaSubmitting ? "not-allowed" : "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                alignSelf: "flex-start",
                transition: "all 0.15s",
              }}
            >
              <SendFill size={13} />
              {ideaSubmitting ? "Submitting..." : "Submit Idea"}
            </button>
          </form>
        </div>

        {/* My submitted ideas */}
        <div style={tactilePanelStyle}>
          <h4
            style={{
              fontSize: "15px",
              fontWeight: "800",
              color: "var(--text-primary)",
              margin: "0 0 18px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            My Submitted Ideas
          </h4>

          {loadingIdeas ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                color: "var(--text-secondary)",
                fontWeight: "700",
              }}
            >
              Loading your ideas...
            </div>
          ) : myIdeas.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                color: "var(--text-secondary)",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              No ideas submitted yet. Share your first one above!
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0",
              }}
            >
              {myIdeas.map((idea, index) => {
                const sc = statusColor(idea.status);
                return (
                  <div
                    key={idea._id || idea.id || index}
                    style={{
                      padding: "16px 0",
                      borderBottom:
                        index < myIdeas.length - 1
                          ? "2px solid var(--stat-row-border)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "800",
                          color: "var(--text-primary)",
                          flex: 1,
                        }}
                      >
                        {idea.title}
                      </div>
                      {idea.status && (
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: "10px",
                            fontWeight: "800",
                            padding: "3px 10px",
                            borderRadius: "8px",
                            textTransform: "uppercase",
                            background: sc.bg,
                            color: sc.text,
                          }}
                        >
                          {idea.status}
                        </span>
                      )}
                    </div>
                    {idea.category && (
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "var(--curriculum-icon-text)",
                          marginBottom: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {idea.category}
                      </div>
                    )}
                    {idea.description && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          fontWeight: "600",
                          lineHeight: "1.5",
                        }}
                      >
                        {idea.description.substring(0, 200)}
                        {idea.description.length > 200 ? "..." : ""}
                      </div>
                    )}
                    {idea.curatorNote && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px 12px",
                          background: "var(--curriculum-icon-bg)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "var(--curriculum-icon-text)",
                          fontWeight: "700",
                          borderLeft: "3px solid var(--curriculum-icon-text)",
                        }}
                      >
                        Curator note: {idea.curatorNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // SECTION: PIPELINE — What's Landing Next (full view)
  // ============================================================
  const renderPipeline = () => {
    const pipelineCards = [
      {
        tag: "NEW MODULE", color: "var(--pastel-modules)", colorText: "var(--pastel-modules-text)", colorBorder: "var(--pastel-modules-border)",
        title: "Advanced XBRL Taxonomy Validation",
        desc: "Deep dive into taxonomy structure, namespace management, and validation rule sets for complex regulatory filings.",
        dept: "Your Department", eta: "This Week", icon: "📚",
      },
      {
        tag: "PLATFORM UPDATE", color: "var(--pastel-progress)", colorText: "var(--pastel-progress-text)", colorBorder: "var(--pastel-progress-border)",
        title: "Leaderboard v2 — Team Rankings",
        desc: "The new leaderboard surfaces team-level aggregate scores alongside individual rankings, with weekly performance deltas.",
        dept: "All Teams", eta: "Next Week", icon: "🏆",
      },
      {
        tag: "CHALLENGE", color: "var(--pastel-quiz)", colorText: "var(--pastel-quiz-text)", colorBorder: "var(--pastel-quiz-border)",
        title: "Monthly SEC Filing Speed Challenge",
        desc: "Timed event. Complete the full SEC 10-K tagging module in under 30 minutes. Top 3 earn triple XP.",
        dept: "Compliance", eta: "Jun 30", icon: "⏱️",
      },
      {
        tag: "NEW MODULE", color: "var(--pastel-modules)", colorText: "var(--pastel-modules-text)", colorBorder: "var(--pastel-modules-border)",
        title: "iXBRL Inline Tagging Masterclass",
        desc: "From anchor tagging to continuation elements — a comprehensive walkthrough of inline XBRL for annual reports.",
        dept: "Reporting", eta: "Jul 7", icon: "🔖",
      },
      {
        tag: "DEPARTMENT", color: "var(--pastel-reads)", colorText: "var(--pastel-reads-text)", colorBorder: "var(--pastel-reads-border)",
        title: "Regulatory Calendar Q3 2026",
        desc: "Filing deadlines, mandatory taxonomy updates, and regulatory changes scoped to your department for Q3.",
        dept: "Your Department", eta: "Jul 1", icon: "📅",
      },
      {
        tag: "CHALLENGE", color: "var(--pastel-quiz)", colorText: "var(--pastel-quiz-text)", colorBorder: "var(--pastel-quiz-border)",
        title: "IRIS Knowledge Bowl — Round 2",
        desc: "Team-based trivia event covering XBRL, SEC regulations, and IFRS standards. Register your team by June 28.",
        dept: "All Departments", eta: "Jun 28", icon: "🎯",
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* Header */}
        <div>
          <div style={{
            fontSize: "10px", fontWeight: "800", letterSpacing: "1.8px",
            textTransform: "uppercase", color: "var(--orbit-text-muted)", marginBottom: "6px",
          }}>
            PIPELINE
          </div>
          <h2 style={{
            margin: "0 0 6px", fontSize: "28px", fontWeight: "900",
            color: "var(--orbit-text-heading)", letterSpacing: "-0.5px",
          }}>
            What's Landing Next
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--orbit-text-muted)", fontWeight: "500" }}>
            Upcoming modules, platform updates, and challenges scoped to your department.
          </p>
        </div>

        {/* Card grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
        }}>
          {pipelineCards.map((card, i) => (
            <div
              key={i}
              style={{
                background: "var(--orbit-surface)",
                border: "1px solid var(--orbit-border)",
                borderRadius: "14px",
                padding: "18px 18px 16px",
                boxShadow: "var(--orbit-shadow-sm)",
                transition: "all 0.15s ease",
                display: "flex", flexDirection: "column", gap: "10px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--orbit-border-strong)";
                e.currentTarget.style.boxShadow   = "var(--orbit-shadow-md)";
                e.currentTarget.style.transform   = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--orbit-border)";
                e.currentTarget.style.boxShadow   = "var(--orbit-shadow-sm)";
                e.currentTarget.style.transform   = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                <span style={{
                  fontSize: "9.5px", fontWeight: "800", letterSpacing: "1.4px",
                  textTransform: "uppercase", color: card.colorText,
                  background: card.color, border: `1px solid ${card.colorBorder}`,
                  padding: "2px 8px", borderRadius: "5px",
                }}>
                  {card.tag}
                </span>
                <span style={{ fontSize: "22px", lineHeight: 1, flexShrink: 0 }}>{card.icon}</span>
              </div>

              <p style={{
                margin: 0, fontSize: "14.5px", fontWeight: "700",
                color: "var(--orbit-text-heading)", lineHeight: 1.35,
              }}>
                {card.title}
              </p>

              <p style={{
                margin: 0, fontSize: "12.5px", fontWeight: "400",
                color: "var(--orbit-text-body)", lineHeight: 1.55,
                flexGrow: 1,
              }}>
                {card.desc}
              </p>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontSize: "11px", color: "var(--orbit-text-muted)", fontWeight: "600",
                paddingTop: "6px", borderTop: "1px solid var(--orbit-border)",
                marginTop: "2px",
              }}>
                <span>{card.dept}</span>
                <span style={{
                  background: "var(--orbit-brand-muted)", color: "var(--orbit-brand)",
                  border: "1px solid var(--orbit-border-strong)",
                  padding: "1px 8px", borderRadius: "var(--radius-full)",
                  fontSize: "10px", fontWeight: "700",
                }}>
                  {card.eta}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p style={{
          textAlign: "center", fontSize: "12px",
          color: "var(--orbit-text-muted)", fontStyle: "italic",
        }}>
          Content is curated for your department. Check back regularly — new modules drop every week.
        </p>
      </div>
    );
  };

  // ============================================================
  // ROOT RENDER — section dispatcher
  // ============================================================
  return (
    <div
      className="orbit-workspace-node"
      style={{
        background: "var(--bg-global-canvas)",
        padding: "16px 0",
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        transition: "background-color 0.2s ease",
        color: "var(--text-primary)",
      }}
    >
      <div
        className="learner-workspace-layout"
        style={{ maxWidth: "1100px", margin: "0 auto" }}
      >
        {currentSection === "home"        && renderHome()}
        {currentSection === "modules"     && renderModules()}
        {currentSection === "progress"    && renderProgress()}
        {currentSection === "leaderboard" && renderLeaderboard()}
        {currentSection === "ideas"       && renderIdeas()}
        {currentSection === "pipeline"    && renderPipeline()}
        {/* Fallback: unknown view → home */}
        {!["home","modules","progress","leaderboard","ideas","pipeline"].includes(currentSection) && renderHome()}
      </div>
    </div>
  );
}
