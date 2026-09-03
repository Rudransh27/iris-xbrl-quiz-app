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

export default function RegionSelect() {
  const { categoryId } = useParams();
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
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 28px 32px" }}>
        <div className="jf-region-grid">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="orbit-ml-card orbit-ml-card--skeleton"
              style={{
                minHeight: 108, width: 116, borderRadius: 16, animationDelay: `${i * 0.06}s`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, padding: "16px 8px",
              }}
            >
              <div className="orbit-skel-line" style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0 }} />
              <div className="orbit-skel-line" style={{ width: "70%", height: 10 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 28px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
      <button type="button" className="rs-back-btn" onClick={() => navigate("/orbit/tags")}>
        <ArrowLeft size={15} /> Back to Categories
      </button>

      <div className="rs-heading">
        <span className="rs-heading__eyebrow">{category?.name || "…"}</span>
        <h1 className="rs-heading__title">Choose Your Region</h1>
        <p className="rs-heading__desc">
          This category offers different modules depending on region. Pick yours to see the right path.
        </p>
      </div>

      {error && <p className="text-danger" style={{ textAlign: "center" }}>{error}</p>}

      <div className="jf-region-grid">
        {(tiles || []).map((tile) => (
          <button
            type="button"
            key={tile._id}
            className="jf-region-card"
            style={{ "--jf-region-color": tile.isAllTile ? "var(--orbit-brand)" : (tile.color || "#6366f1") }}
            onClick={() => navigate(`/orbit/tags/${categoryId}/region/${tile._id}`)}
          >
            <div className="jf-region-card__icon">
              {tile.isAllTile ? <Globe2 size={26} color="#ffffff" /> : <RegionIcon code={tile.code} color="#ffffff" size={34} />}
            </div>
            <span className="jf-region-card__title">{tile.name}</span>
          </button>
        ))}
      </div>

      <OrbitFooter />
    </div>
  );
}
