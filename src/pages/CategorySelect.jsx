// src/pages/CategorySelect.jsx
import React, { useState, useEffect, useMemo, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TagFill, CollectionFill, Search, Globe2, JournalBookmarkFill } from "react-bootstrap-icons";
import api from "../admin/services/api";
import TagCard from "../components/OrbitDashboard/TagCard";
import LabsComingSoon from "../components/OrbitDashboard/LabsComingSoon";
import ComingSoonPanel from "../components/OrbitDashboard/ComingSoonPanel";
import OrbitFooter from "../components/OrbitDashboard/OrbitFooter";
import "../components/OrbitDashboard/OrbitDashboard.css";
import "../components/OrbitDashboard/LearnHero.css";
import "../components/OrbitDashboard/TagCard.css";

// Learn page landing: pick a tag, then see the modules inside it
// (ModuleTrail.jsx, filtered). Same visual system as the module grid
// (learn-strip hero + orbit-ml-card grid) so this reads as one page, not a
// bolted-on screen. Module counts come from the same RBAC-filtered
// workspace-curriculum call the module grid itself uses — a tag with
// modules this learner can't see simply counts lower, never leaks anything.
export default function CategorySelect() {
  const [categories, setCategories] = useState([]);
  const [moduleCounts, setModuleCounts] = useState({});
  const [totalModules, setTotalModules] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  // Labs is an app-wide announcement, not tied to any one category — it
  // lives here, one level up from the per-category module lists, instead of
  // being repeated inside every single category (where it used to sit).
  // Playbooks doesn't exist yet (no backend entity, no route) — it's a
  // "coming soon" placeholder tab so the concept is visible while it's built.
  const [view, setView] = useState("categories");
  const navigate = useNavigate();

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, moduleRes] = await Promise.all([
          api.getCategories(),
          api.getWorkspaceCurriculum().catch(() => null),
        ]);
        setCategories(catRes?.data || []);

        const mods = moduleRes?.success ? moduleRes.data : moduleRes;
        const modsArr = Array.isArray(mods) ? mods : [];
        setTotalModules(modsArr.length);
        const counts = {};
        modsArr.forEach((m) => {
          const id = (m.categoryId || "").toString();
          if (!id) return;
          counts[id] = (counts[id] || 0) + 1;
        });
        setModuleCounts(counts);
      } catch (err) {
        setError(err.message || "Failed to load categories.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories
      .filter((c) => !term || c.name.toLowerCase().includes(term))
      .map((c) => ({ ...c, moduleCount: moduleCounts[c._id] || 0 }));
  }, [categories, moduleCounts, search]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 28px 32px" }}>
        <div className="tagcard-grid">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="orbit-ml-card orbit-ml-card--skeleton"
              style={{
                minHeight: 78, borderRadius: 16, animationDelay: `${i * 0.06}s`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 6px",
              }}
            >
              <div className="orbit-skel-line" style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0 }} />
              <div className="orbit-skel-line" style={{ width: "70%", height: 9 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 28px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="learn-strip">
        <span className="learn-strip__eyebrow">Learn</span>
        <h1 className="learn-strip__title">Fuel Your Orbit</h1>
        <p className="learn-strip__subtitle">
          Every module lives under one category. Pick a category to see what's inside, or browse everything at once.
        </p>

        <div className="learn-strip__stats">
          <div className="learn-strip__stat learn-strip__stat--teal">
            <TagFill size={13} />
            <span className="learn-strip__stat-num">{categories.length}</span>
            <span className="learn-strip__stat-label">Categories</span>
          </div>
          <div className="learn-strip__stat learn-strip__stat--lavender">
            <CollectionFill size={13} />
            <span className="learn-strip__stat-num">{totalModules}</span>
            <span className="learn-strip__stat-label">Modules</span>
          </div>
        </div>
      </div>

      <div className="orbit-ml-toolbar">
        {view === "categories" && (
          <div className="orbit-learn-search orbit-learn-search--big">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="orbit-learn-search__clear" onClick={() => setSearch("")}>
                Clear
              </button>
            )}
          </div>
        )}
        <div className="orbit-toggle orbit-toggle--pill">
          <button
            className={`orbit-toggle__btn ${view === "categories" ? "orbit-toggle__btn--active" : ""}`}
            onClick={() => setView("categories")}
          >
            Categories
          </button>
          <button
            className={`orbit-toggle__btn ${view === "labs" ? "orbit-toggle__btn--active" : ""}`}
            onClick={() => setView("labs")}
          >
            Labs
          </button>
          <button
            className={`orbit-toggle__btn ${view === "playbooks" ? "orbit-toggle__btn--active" : ""}`}
            onClick={() => setView("playbooks")}
          >
            Playbooks
          </button>
        </div>
      </div>

      {error && <p className="text-danger">{error}</p>}

      {view === "labs" ? (
        <LabsComingSoon />
      ) : view === "playbooks" ? (
        <ComingSoonPanel
          icon={<JournalBookmarkFill size={26} />}
          title="Playbooks — Coming Soon"
          description="Step-by-step playbooks for real scenarios are on the way. Check back soon."
        />
      ) : (
        <>
          {!loading && (
            <p className="orbit-ml-results-count">
              {filteredCategories.length} categor{filteredCategories.length !== 1 ? "ies" : "y"}
            </p>
          )}

          {filteredCategories.length === 0 ? (
            <div className="orbit-ml-empty">
              <Globe2 size={26} />
              <p style={{ margin: 0 }}>
                {search ? `No categories match "${search}".` : "No categories have been configured yet."}
              </p>
            </div>
          ) : (
            <div className="tagcard-grid">
              {filteredCategories.map((cat, i) => (
                <TagCard key={cat._id} tag={cat} index={i} onClick={() => navigate(`/orbit/tags/${cat._id}`)} />
              ))}
            </div>
          )}
        </>
      )}

      <OrbitFooter />
    </div>
  );
}
