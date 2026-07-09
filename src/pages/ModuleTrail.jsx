// src/pages/ModuleTrail.jsx
import React, { useState, useEffect, useLayoutEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../admin/services/api";
import ModulesLabsSection from "../components/OrbitDashboard/ModulesLabsSection";
import { setCurrentModule } from "../components/OrbitDashboard/currentModuleStorage";
import AuthContext from "../context/AuthContext";
import "../components/OrbitDashboard/OrbitDashboard.css";

export default function ModuleTrail() {
  const [modules, setModules] = useState([]);
  const [completedCardIds, setCompletedCardIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesData, progressData] = await Promise.all([
          api.getModules(),
          api.getUserProgress().catch(() => null),
        ]);

        const mods = modulesData?.success ? modulesData.data : modulesData;
        setModules(Array.isArray(mods) ? mods : []);

        if (progressData) {
          const pData = progressData?.success ? progressData.data : progressData;
          const ids = Array.isArray(pData?.completedCardIds) ? pData.completedCardIds : [];
          setCompletedCardIds(ids.map((id) => id.toString()));
        }
      } catch (err) {
        console.error("ModuleTrail fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getModuleProgress = (mod) => {
    const total = mod.totalCardCount || 0;
    const allIds = (mod.allCardIds || []).map((id) => id.toString());
    const done = allIds.length > 0 ? allIds.filter((id) => completedCardIds.includes(id)).length : 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  };

  const handleModuleClick = (module) => {
    setCurrentModule(user?._id, { moduleId: module._id });
    if (module.hasTopics === false) navigate(`/quiz/${module._id}/undefined`);
    else navigate(`/orbit/modules/${module._id}/topics`);
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "8px 4px 32px" }}>
      <ModulesLabsSection
        modules={modules}
        getModuleProgress={getModuleProgress}
        onOpenModule={handleModuleClick}
        loading={loading}
        title="Learn"
        subtitle="Modules build knowledge. Labs build practice."
        showSearch
      />
    </div>
  );
}
