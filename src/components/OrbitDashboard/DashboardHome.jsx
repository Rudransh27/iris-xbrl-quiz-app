// src/components/OrbitDashboard/DashboardHome.jsx
import React, { useEffect, useMemo } from "react";
import "./OrbitDashboard.css";
import HeroWelcome from "./HeroWelcome";
import ChecklistCard from "./ChecklistCard";
import OrbitCalendar from "./OrbitCalendar";
import NewsCarousel from "./NewsCarousel";
import CurrentModuleCard from "./CurrentModuleCard";
import SuggestIdeaCard from "./SuggestIdeaCard";
import PopularModulesRow from "./PopularModulesRow";
import SlidingPuzzleWidget from "./SlidingPuzzleWidget";
import { engagementHistoryToMap } from "./dashboardStorage";

export default function DashboardHome({
  user,
  navigate,
  todaysRead,
  allReads,
  newsFeed,
  modules,
  widgetModule,
  hotModule,
  moduleTaskDone,
  getModuleProgress,
  handleNavigationGate,
  verifyStreak,
  streakData,
}) {
  const userId = user?._id || "guest";

  // 🎯 Single source of truth: the server's engagementHistory/todayActions
  // (fetched by OrbitWorkspace via GET /api/progress/streak, kept live by
  // verifyStreak) — replaces the old localStorage-only history, which had no
  // way to stay in sync across devices/browsers with the "official" streak
  // shown in the sidebar/profile. See dashboardStorage.js's
  // engagementHistoryToMap for the shape conversion.
  const history = useMemo(
    () => engagementHistoryToMap(streakData?.engagementHistory),
    [streakData?.engagementHistory]
  );
  const todayActions = streakData?.todayActions || [];
  const todayEntry = {
    read: todayActions.includes("daily_read"),
    module: todayActions.includes("module_progress"),
    idea: todayActions.includes("idea_submission"),
  };
  const streak = streakData?.currentStreak || 0;

  // Priority for the checklist's "Active Module" widget (the module the user
  // explicitly last opened > admin's platform-wide Hot Module default > the
  // auto-picked fallback) is resolved once in OrbitWorkspace and handed down
  // as `widgetModule` — this is the SAME module moduleTaskDone was computed
  // against, so the widget and the completion check can never diverge.
  //
  // hotModule is only a *default suggestion* now, shown when the user hasn't
  // opened anything themselves — so the "Admin-featured" hint/badge below
  // must only appear when widgetModule actually IS the hot module, not
  // whenever a hot module merely exists somewhere in the module list.
  const isHotModuleActive =
    !!hotModule &&
    !!widgetModule &&
    (hotModule._id || hotModule.id)?.toString() === (widgetModule._id || widgetModule.id)?.toString();

  // Task 2 (Module Completion) is the one automatic condition this component
  // can observe directly — the parent (OrbitWorkspace) computes the tiered
  // "full module" vs "at least one topic" rule and hands down a plain
  // boolean. Tasks 1/3 (Today's Read / Idea Submission) call the server
  // directly from their own pages (DailyReadReader / IdeasAndRD) — every
  // qualifying action, including this one, goes through verifyStreak, which
  // updates the same shared engagementHistory, so there's nothing left to
  // persist locally here.
  useEffect(() => {
    if (moduleTaskDone && !todayEntry.module) {
      verifyStreak("module_progress");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleTaskDone]);

  const goToRead = () => {
    if (todaysRead?.id) navigate(`/orbit/daily-read/${todaysRead.id}`);
  };

  const goToModule = () => {
    if (widgetModule) handleNavigationGate(widgetModule);
    else navigate("/orbit/modules");
  };

  const goToIdea = () => navigate("/orbit/ideas");

  const moduleHint = isHotModuleActive
    ? `Admin-featured "${hotModule.title}" — ${
        hotModule.hasTopics === false
          ? "auto-checks at 100% complete"
          : "auto-checks once you complete at least one topic inside it"
      }`
    : !widgetModule
    ? "Auto-checks once you have an active module"
    : widgetModule.hasTopics === false
    ? "Auto-checks when this module reaches 100% complete"
    : "Auto-checks once you complete at least one topic inside it";

  const moduleProgress = widgetModule
    ? getModuleProgress(widgetModule)
    : { total: 0, done: 0, pct: 0 };

  // Every row's `done` is read straight from history — never set by a click.
  const checklistItems = [
    {
      key: "read",
      label: "Today's Read",
      hint: "Auto-checks after 30s spent on today's article",
      done: !!todayEntry.read,
      action: goToRead,
    },
    {
      key: "module",
      label: "Module Completion",
      hint: moduleHint,
      done: !!todayEntry.module,
      action: goToModule,
      // Extra fields consumed only by ChecklistCard's rich rendering for this
      // one slot — the module/progress the "Active Module" widget shows.
      widgetModule,
      progress: moduleProgress,
      isHotModule: isHotModuleActive,
    },
    {
      key: "idea",
      label: "Idea Submission",
      hint: "Auto-checks once you submit an idea",
      done: !!todayEntry.idea,
      action: goToIdea,
    },
  ];

  return (
    <div className="orbit-dash">
      <HeroWelcome />

      <div className="orbit-dash__split">
        <ChecklistCard items={checklistItems} />
        <OrbitCalendar
          history={history}
          streak={streak}
          reads={allReads}
          onSelectRead={(readId) => navigate(`/orbit/daily-read/${readId}`)}
        />
      </div>

      <NewsCarousel newsFeed={newsFeed} />

      <div className="orbit-dash__split--even">
        <CurrentModuleCard module={widgetModule} progress={moduleProgress} onResume={goToModule} />
        <SuggestIdeaCard onClick={goToIdea} />
      </div>

      <div className="orbit-dash__bottom-grid">
        <div className="orbit-dash__bottom-grid-modules">
          <PopularModulesRow modules={modules} getModuleProgress={getModuleProgress} onOpenModule={handleNavigationGate} />
        </div>
        <div className="orbit-dash__bottom-grid-puzzle">
          <SlidingPuzzleWidget />
        </div>
      </div>
    </div>
  );
}
