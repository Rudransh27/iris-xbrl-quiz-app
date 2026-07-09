// src/components/OrbitDashboard/DashboardHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./OrbitDashboard.css";
import HeroWelcome from "./HeroWelcome";
import ChecklistCard from "./ChecklistCard";
import ActivityCalendar from "./ActivityCalendar";
import TodaysReadBanner from "./TodaysReadBanner";
import CurrentModuleCard from "./CurrentModuleCard";
import SuggestIdeaCard from "./SuggestIdeaCard";
import PopularModulesRow from "./PopularModulesRow";
import SlidingPuzzleWidget from "./SlidingPuzzleWidget";
import { toDateKey, loadHistory, markDay, computeStreak } from "./dashboardStorage";
import { getCurrentModule } from "./currentModuleStorage";

export default function DashboardHome({
  user,
  navigate,
  todaysRead,
  modules,
  displayModule,
  hotModule,
  moduleTaskDone,
  getModuleProgress,
  handleNavigationGate,
  verifyStreak,
}) {
  const userId = user?._id || "guest";
  const [history, setHistory] = useState(() => loadHistory(userId));
  const todayKey = toDateKey(new Date());
  const todayEntry = history[todayKey] || {};

  // Priority for the checklist's "Active Module" widget: admin's platform-wide
  // Hot Module override > the module the user explicitly last opened > the
  // auto-picked displayModule fallback.
  const currentModuleEntry = useMemo(() => getCurrentModule(userId), [userId]);
  const userSelectedModule = useMemo(() => {
    if (!currentModuleEntry?.moduleId) return null;
    return (
      modules.find(
        (m) => (m._id || m.id)?.toString() === currentModuleEntry.moduleId.toString()
      ) || null
    );
  }, [modules, currentModuleEntry]);
  const widgetModule = hotModule || userSelectedModule || displayModule;

  // Task 2 (Module Completion) is the one automatic condition this component
  // can observe directly — the parent (OrbitWorkspace) computes the tiered
  // "full module" vs "at least one topic" rule and hands down a plain
  // boolean. Task 1 (Today's Read, 30s timer) and Task 3 (Idea Submission)
  // are detected on OTHER routes (DailyReadReader / IdeasAndRD) and write
  // straight to the same localStorage history — this effect only needs to
  // persist Task 2's signal the moment it flips true.
  useEffect(() => {
    if (moduleTaskDone && !todayEntry.module) {
      const nextHistory = markDay(userId, history, todayKey, { module: true });
      setHistory(nextHistory);
      verifyStreak("module_progress");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleTaskDone]);

  const streak = useMemo(() => computeStreak(history), [history]);

  const goToRead = () => {
    if (todaysRead?.id) navigate(`/orbit/daily-read/${todaysRead.id}`);
  };

  const goToModule = () => {
    if (widgetModule) handleNavigationGate(widgetModule);
    else navigate("/orbit/modules");
  };

  const goToIdea = () => navigate("/orbit/ideas");

  const moduleHint = hotModule
    ? `Admin-featured "${hotModule.title}" — ${
        hotModule.hasTopics === false
          ? "auto-checks at 100% complete"
          : "auto-checks once you finish the topic you're on"
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
      isHotModule: !!hotModule,
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
        <ActivityCalendar history={history} streak={streak} />
      </div>

      <TodaysReadBanner todaysRead={todaysRead} onRead={goToRead} />

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
