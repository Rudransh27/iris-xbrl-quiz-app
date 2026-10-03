// src/pages/LegacyJourneyRedirect.jsx
// Old Learn links (/orbit/tags/:categoryId/region/:regionId — bookmarks,
// shared links, the "back" target of sessions started before Paths) open the
// matching Path once Paths are published. Before that, the old journey view
// renders as it always did.
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../admin/services/api";
import ModuleJourney from "./ModuleJourney";

export default function LegacyJourneyRedirect() {
  const { categoryId, regionId } = useParams();
  const navigate = useNavigate();
  const [legacy, setLegacy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const learn = await api.getLearnTags().catch(() => null);
      if (cancelled) return;
      if (!learn?.pathsEnabled) { setLegacy(true); return; }
      const res = await api.getLegacyPath(categoryId, regionId).catch(() => null);
      if (cancelled) return;
      navigate(res?.pathId ? `/orbit/paths/${res.pathId}` : `/orbit/tags/${categoryId}`, { replace: true });
    })();
    return () => { cancelled = true; };
  }, [categoryId, regionId, navigate]);

  return legacy ? <ModuleJourney /> : null;
}
