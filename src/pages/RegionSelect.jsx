// src/pages/RegionSelect.jsx
// Screen 2 of the Tag -> Region -> Journey drill-down (see orbit_flow.html):
// mounted at /orbit/tags/:categoryId. Shows one tile per region that this
// tag actually has region-specific modules in, plus an "All Regions" tile
// (the full, unfiltered set). A tag with NO region-specific modules at all
// skips this screen entirely and redirects straight to the journey view —
// there's nothing to choose between.
import React, { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe2 } from "react-bootstrap-icons";
import api from "../admin/services/api";
import RegionIcon from "../components/OrbitDashboard/RegionIcon";
import OrbitFooter from "../components/OrbitDashboard/OrbitFooter";
import "../components/OrbitDashboard/OrbitDashboard.css";
import "../components/OrbitDashboard/TagCard.css";
import "../components/OrbitDashboard/JourneyFlow.css";
import { safeId } from "../utils/safeNav";

export default function RegionSelect() {
  const categoryId = safeId(useParams().categoryId);
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [tiles, setTiles] = useState(null); // null = still deciding; [] handled via redirect
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [catRes, regionsRes, modsRes] = await Promise.all([
          api.getCategory(categoryId),
          api.getRegions(),
          api.getWorkspaceCurriculum(categoryId), // unfiltered by region — the full set this learner can see for this tag
        ]);
        if (cancelled) return;

        setCategory(catRes?.data || null);

        const allRegions = (regionsRes?.data || []).filter((r) => !r.isDefault);
        const mods = modsRes?.success ? modsRes.data : modsRes;
        const modsArr = Array.isArray(mods) ? mods : [];

        const usedRegionIds = new Set();
        modsArr.forEach((m) => {
          (m.regions || []).forEach((r) => usedRegionIds.add((r && r._id ? r._id : r).toString()));
        });

        const relevantRegions = allRegions.filter((r) => usedRegionIds.has(r._id));

        if (relevantRegions.length === 0) {
          // Nothing under this tag is region-specific — no real choice to
          // make, so skip straight to the journey view.
          navigate(`/orbit/tags/${categoryId}/region/all`, { replace: true });
          return;
        }

        const regionTiles = relevantRegions.map((r) => ({
          ...r,
          moduleCount: modsArr.filter((m) =>
            !(m.regions && m.regions.length) || m.regions.some((rid) => (rid._id || rid).toString() === r._id)
          ).length,
        }));

        setTiles([
          {
            _id: "all",
            name: "All Regions",
            description: "Every module under this tag, regardless of region.",
            color: "var(--orbit-brand)",
            moduleCount: modsArr.length,
            isAllTile: true,
          },
          ...regionTiles,
        ]);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load regions for this tag.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [categoryId, navigate]);

  if (loading) {
    return (
      <div className="ui-page">
        <div className="jf-region-grid" aria-hidden="true">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="ui-card jf-region-card jf-region-card--skeleton">
              <div className="ui-skeleton jf-region-card__skel-icon" />
              <div className="ui-skeleton jf-region-card__skel-line" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page">
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm rs-back-btn" onClick={() => navigate("/orbit/tags")}>
        <ArrowLeft size={15} /> Back to Categories
      </button>

      <header className="ui-page-header rs-heading">
        <div className="ui-page-header__text">
          <span className="ui-eyebrow">{category?.name || "…"}</span>
          <h1 className="ui-h1">Choose Your Region</h1>
          <p className="ui-lead">
            This category offers different modules depending on region. Pick yours to see the right path.
          </p>
        </div>
      </header>

      {error && <div className="ui-callout ui-callout--danger">{error}</div>}

      <div className="jf-region-grid">
        {(tiles || []).map((tile) => (
          <button
            type="button"
            key={tile._id}
            className="ui-card ui-card--interactive jf-region-card"
            style={{ "--jf-region-color": tile.isAllTile ? "var(--ui-accent)" : (tile.color || "var(--ui-accent)") }}
            onClick={() => navigate(`/orbit/tags/${categoryId}/region/${tile._id}`)}
          >
            <span className="jf-region-card__icon">
              {tile.isAllTile ? <Globe2 size={24} color="currentColor" /> : <RegionIcon code={tile.code} color="currentColor" size={34} />}
            </span>
            <span className="ui-card__title jf-region-card__title">{tile.name}</span>
            {typeof tile.moduleCount === "number" && (
              <span className="ui-badge ui-badge--sm">{tile.moduleCount} module{tile.moduleCount === 1 ? "" : "s"}</span>
            )}
          </button>
        ))}
      </div>

      <OrbitFooter />
    </div>
  );
}
