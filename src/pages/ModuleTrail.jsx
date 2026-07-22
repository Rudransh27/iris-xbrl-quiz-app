// src/pages/ModuleTrail.jsx
import React, { useState, useEffect, useLayoutEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../admin/services/api";
import ModulesLabsSection from "../components/OrbitDashboard/ModulesLabsSection";
import LearnHero from "../components/OrbitDashboard/LearnHero";
import OrbitFooter from "../components/OrbitDashboard/OrbitFooter";
import { setCurrentModule } from "../components/OrbitDashboard/currentModuleStorage";
import AuthContext from "../context/AuthContext";
import "../components/OrbitDashboard/OrbitDashboard.css";

export default function ModuleTrail() {
  const [modules, setModules] = useState([]);
  // 🎯 ACCURACY FIX: was completedCardIds (any attempted card, right or
  // wrong) — now correctCardIds (backend-filtered to isCorrect === true),
  // so a wrongly-answered quiz/code card no longer inflates a module's
  // progress %. Passive card types (knowledge/video/pdf/ppt) are always
  // recorded correct, so they're unaffected.
  const [correctCardIds, setCorrectCardIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🎯 BUG FIX: this used to call api.getModules() (the plain /modules
        // list), which does NOT include allCardIds/totalCardCount — those
        // fields only exist on the workspace-curriculum aggregation. Without
        // them, getModuleProgress()'s `total` was always 0, so `pct` was
        // always 0, so every card computed as "Not Started" regardless of
        // real progress, for every user. workspace-curriculum already
        // carries allCardIds/totalCardCount (plus estimatedTime/pointsReward/
        // isHotModule/isPopular/hasTopics), so this is a straight upgrade,
        // not a behavior change — same RBAC/visibility filtering applies.
        const [modulesData, progressData] = await Promise.all([
          api.getWorkspaceCurriculum(),
          api.getUserProgress().catch(() => null),
        ]);

        const mods = modulesData?.success ? modulesData.data : modulesData;
        setModules(Array.isArray(mods) ? mods : []);

        if (progressData) {
          // 🎯 BUG FIX: getUserProgress()'s response is flat (confirmed via
          // handleFetchResponse in api.js — no `.data` nesting), unlike
          // workspace-curriculum above. `progressData.data` was always
          // undefined here, so correctCardIds silently fell back to `[]`
          // every time — compounding the bug above.
          const pData = progressData?.data ?? progressData;
          const ids = Array.isArray(pData?.correctCardIds) ? pData.correctCardIds : [];
          setCorrectCardIds(ids.map((id) => id.toString()));
        }
      } catch (err) {
        console.error("ModuleTrail fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🎯 Live update, no manual refresh — App.jsx's root socket re-broadcasts
  // the backend's 'module_progress_update' event as this DOM CustomEvent
  // (its own socket connection survives the /quiz/* trip where completions
  // actually happen, unlike OrbitShell's). Re-running the same progress
  // fetch (not manual incremental merging) keeps this simple and correct.
  useEffect(() => {
    const handleLiveProgress = async () => {
      try {
        const progressData = await api.getUserProgress();
        const pData = progressData?.data ?? progressData;
        const ids = Array.isArray(pData?.correctCardIds) ? pData.correctCardIds : [];
        setCorrectCardIds(ids.map((id) => id.toString()));
      } catch (_) {}
    };
    window.addEventListener("orbit:module-progress", handleLiveProgress);
    return () => window.removeEventListener("orbit:module-progress", handleLiveProgress);
  }, []);

  const getModuleProgress = (mod) => {
    const total = mod.totalCardCount || 0;
    const allIds = (mod.allCardIds || []).map((id) => id.toString());
    const done = allIds.length > 0 ? allIds.filter((id) => correctCardIds.includes(id)).length : 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  };

  const handleModuleClick = (module) => {
    setCurrentModule(user?._id, { moduleId: module._id });
    if (module.hasTopics === false) navigate(`/quiz/${module._id}/undefined`);
    else navigate(`/orbit/modules/${module._id}/topics`);
  };

  // Hero stats row — all real, derived from the same data ModulesLabsSection
  // itself computes per-card (no separate/duplicate fetch).
  const inProgressCount = modules.filter((mod) => {
    const { pct } = getModuleProgress(mod);
    return pct > 0 && pct < 100;
  }).length;

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 28px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
      <LearnHero
        moduleCount={modules.length}
        inProgressCount={inProgressCount}
        plasmaEarned={user?.xp ?? 0}
      />
      <ModulesLabsSection
        modules={modules}
        getModuleProgress={getModuleProgress}
        onOpenModule={handleModuleClick}
        loading={loading}
        showSearch
      />
      <OrbitFooter />
    </div>
  );
}
