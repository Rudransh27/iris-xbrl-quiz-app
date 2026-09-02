// src/pages/ModuleTrail.jsx
import React, { useState, useEffect, useLayoutEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "react-bootstrap-icons";
import api from "../admin/services/api";
import ModulesLabsSection from "../components/OrbitDashboard/ModulesLabsSection";
import LearnHero from "../components/OrbitDashboard/LearnHero";
import OrbitFooter from "../components/OrbitDashboard/OrbitFooter";
import { setCurrentModule } from "../components/OrbitDashboard/currentModuleStorage";
import AuthContext from "../context/AuthContext";
import "../components/OrbitDashboard/OrbitDashboard.css";
import "../components/OrbitDashboard/TagCard.css";

// Mounted three ways: `/orbit/modules` (no filter, every visible module —
// the long-standing meaning of this path, still relied on by quiz-completion
// redirects, back buttons, the homepage/footer Learn links, etc.),
// `/orbit/tags/:categoryId` (filtered to one tag, via useParams), and the
// legacy top-level `/modules` (no filter). The category param, when
// present, is passed straight through to the backend's ?categoryId= filter
// on workspace-curriculum — nothing is filtered client-side.
export default function ModuleTrail() {
  const { categoryId } = useParams();
  const [modules, setModules] = useState([]);
  const [category, setCategory] = useState(null);
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
    if (categoryId) {
      api.getCategory(categoryId).then((res) => setCategory(res?.data || null)).catch(() => setCategory(null));
    } else {
      setCategory(null);
    }
  }, [categoryId]);

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
          api.getWorkspaceCurriculum(categoryId),
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
    setLoading(true);
    fetchData();
  }, [categoryId]);

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
    // Defense in depth only — the real gate is server-side (GET /:id and
    // recordCardCompletion both reject a locked module regardless of this).
    if (module.locked) return;
    setCurrentModule(user?._id, { moduleId: module._id });
    const tagSuffix = categoryId ? `?tag=${categoryId}` : "";
    if (module.hasTopics === false) navigate(`/quiz/${module._id}/undefined${tagSuffix}`);
    else navigate(`/orbit/modules/${module._id}/topics${tagSuffix}`);
  };

  // Hero stats row — all real, derived from the same data ModulesLabsSection
  // itself computes per-card (no separate/duplicate fetch).
  const inProgressCount = modules.filter((mod) => {
    const { pct } = getModuleProgress(mod);
    return pct > 0 && pct < 100;
  }).length;

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 28px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
      {categoryId ? (
        // Plain, minimal tag header — replaces the full Learn hero here so
        // drilling into a tag doesn't just repeat the exact same big "Fuel
        // Your Orbit" block the learner already saw one click ago. Just a
        // back button and the tag name, no bar/background/border around it.
        <div className="tag-context-bar">
          <button type="button" className="tag-context-bar__back" onClick={() => navigate("/orbit/tags")} aria-label="Back to all tags">
            <ArrowLeft size={15} />
          </button>
          <h2 className="tag-context-bar__current">{category?.name || "…"}</h2>
        </div>
      ) : (
        <LearnHero
          moduleCount={modules.length}
          inProgressCount={inProgressCount}
          plasmaEarned={user?.xp ?? 0}
        />
      )}
      <ModulesLabsSection
        modules={modules}
        getModuleProgress={getModuleProgress}
        onOpenModule={handleModuleClick}
        loading={loading}
      />
      <OrbitFooter />
    </div>
  );
}
