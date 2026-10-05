// src/pages/CategorySelect.jsx
// The Learn page (/orbit/tags): search + a grid of small square Tag tiles.
// A tile opens that Tag's Paths (PathSelect, which opens a single Path
// directly). Search matches Tag names and descriptions and the names of the
// Paths inside each Tag, so typing a Path's name finds its Tag.
// Tags come from /learn/tags, already scoped to the learner's region /
// department / team on the server. Until any Path is published the page
// falls back to the old category list (Tag → Region → modules).
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, XLg, JournalBookmarkFill, Compass } from "react-bootstrap-icons";
import api from "../admin/services/api";
import TagCard from "../components/OrbitDashboard/TagCard";
import LabsComingSoon from "../components/OrbitDashboard/LabsComingSoon";
import ComingSoonPanel from "../components/OrbitDashboard/ComingSoonPanel";
import OrbitFooter from "../components/OrbitDashboard/OrbitFooter";
import "../components/OrbitDashboard/OrbitDashboard.css";
import "../components/OrbitDashboard/TagCard.css";
import "../components/OrbitDashboard/LearnHome.css";

const TABS = [["explore", "Explore"], ["labs", "Labs"], ["playbooks", "Playbooks"]];

export default function CategorySelect() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: "", tags: [], pathNames: {} });
  const [query, setQuery] = useState("");
  // Labs is an app-wide announcement and Playbooks a placeholder — both
  // live here, one level above the Tags.
  const [view, setView] = useState("explore");
  const searchRef = useRef(null);

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const learn = await api.getLearnTags().catch(() => null);
        if (cancelled) return;
        if (learn?.pathsEnabled) {
          // Path names per Tag, only for search.
          const pathNames = {};
          (learn.paths || []).forEach((p) => {
            const k = String(p.categoryId);
            pathNames[k] = `${pathNames[k] || ""} ${p.name || ""}`;
          });
          setState({ loading: false, error: "", tags: learn.data || [], pathNames });
          return;
        }
        // Legacy: no Path published yet — every category, with module counts.
        const [catRes, moduleRes] = await Promise.all([api.getCategories(), api.getWorkspaceCurriculum().catch(() => null)]);
        const mods = moduleRes?.success ? moduleRes.data : moduleRes;
        const counts = {};
        (Array.isArray(mods) ? mods : []).forEach((m) => {
          const id = (m.categoryId || "").toString();
          if (id) counts[id] = (counts[id] || 0) + 1;
        });
        const tags = (catRes?.data || []).map((c) => ({ ...c, moduleCount: counts[c._id] || 0 }));
        if (!cancelled) setState({ loading: false, error: "", tags, pathNames: {} });
      } catch (err) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: err.message || "Failed to load categories." }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const term = query.trim().toLowerCase();
  const visibleTags = useMemo(() => {
    const list = state.tags.map((t, index) => ({ tag: t, index })); // index keeps each Tag's colour/icon stable
    if (!term) return list;
    return list.filter(({ tag }) =>
      [tag.name, tag.description, state.pathNames[String(tag._id)]].some((v) => (v || "").toLowerCase().includes(term)));
  }, [state.tags, state.pathNames, term]);

  if (state.loading) {
    return (
      <div className="ui-page learn" aria-busy="true">
        <div className="ui-skeleton learn-skel learn-skel--title" />
        <div className="tagcard-grid">
          {[...Array(10)].map((_, i) => <div key={i} className="ui-skeleton tagcard tagcard--skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page learn">
      <header className="ui-page-header">
        <div className="ui-page-header__text">
          <span className="ui-eyebrow">Learn</span>
          <h1 className="ui-h1">Fuel Your Orbit</h1>
          <p className="ui-lead">Pick a category to see the learning paths inside it.</p>
        </div>
      </header>

      <div className="learn-toolbar">
        {view === "explore" && (
          <label className="learn-search">
            <Search size={15} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              className="learn-search__input"
              placeholder="Search categories and paths"
              aria-label="Search categories and paths"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
            />
            {query && (
              <button type="button" className="learn-search__clear" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="Clear search">
                <XLg size={11} />
              </button>
            )}
          </label>
        )}
        {/* Always pinned right, so switching tabs never moves them. */}
        <div className="ui-tabs learn-toolbar__tabs" role="tablist" aria-label="Learn sections">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={view === key} className={`ui-tab ${view === key ? "is-active" : ""}`} onClick={() => setView(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {state.error && <div className="ui-callout ui-callout--danger" role="alert">{state.error}</div>}

      {view === "labs" ? (
        <LabsComingSoon />
      ) : view === "playbooks" ? (
        <ComingSoonPanel
          icon={<JournalBookmarkFill size={26} />}
          title="Playbooks — Coming Soon"
          description="Step-by-step playbooks for real scenarios are on the way. Check back soon."
        />
      ) : visibleTags.length === 0 ? (
        <div className="ui-empty learn-empty">
          <span className="ui-icon-tile ui-icon-tile--neutral ui-icon-tile--lg"><Compass size={22} /></span>
          <p className="ui-empty__title">{term ? `Nothing matches "${query.trim()}"` : "No categories for you yet."}</p>
          {term && <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setQuery("")}>Clear search</button>}
        </div>
      ) : (
        <div className="tagcard-grid" aria-live="polite">
          {visibleTags.map(({ tag, index }) => (
            <TagCard key={tag._id} tag={tag} index={index} onClick={() => navigate(`/orbit/tags/${tag._id}`)} />
          ))}
        </div>
      )}

      <OrbitFooter />
    </div>
  );
}
