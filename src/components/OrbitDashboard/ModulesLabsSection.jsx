// src/components/OrbitDashboard/ModulesLabsSection.jsx
import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Globe2, FlaskFill, ArrowRepeat, Compass } from "react-bootstrap-icons";
import ModuleLabCard from "./ModuleLabCard";

// No standalone Lab entity exists in the backend (only Module does), so this
// stays hand-authored rather than an API call — real, curated program
// content (not placeholder filler). Swap for a real api.getLabs() call once
// a Lab model/route ships; the card shape below is what that response
// should match. Each lab carries its own fixed thumb/icon (unlike real
// modules, which rotate through a generic palette by position) since these
// are specific, individually-authored missions, not an arbitrary list.
const LABS = [
  {
    id: "lab-xbrl-tag",
    title: "Lab: Build Your First XBRL Tag",
    status: "In Progress",
    pct: 30,
    points: 150,
    cadence: "~40 min",
    takeaway: "Hands-on sandbox — tag a sample filing and validate it live.",
    thumbGradient: "linear-gradient(135deg, #7a6cc9, #4b8fb0)",
    thumbIcon: FlaskFill,
  },
  {
    id: "lab-reconciliation",
    title: "Lab: Reconciliation Challenge",
    status: "Not Started",
    pct: 0,
    points: 120,
    cadence: "~25 min",
    takeaway: "Race the clock to reconcile a broken ledger and score Lightyear.",
    thumbGradient: "linear-gradient(135deg, #c9557c, #b06cc9)",
    thumbIcon: ArrowRepeat,
  },
  {
    id: "lab-taxonomy-explorer",
    title: "Lab: Taxonomy Explorer",
    status: "Completed",
    pct: 100,
    points: 90,
    cadence: "~35 min",
    takeaway: "Navigate a real taxonomy tree and answer live checkpoints.",
    thumbGradient: "linear-gradient(135deg, #3f9e79, #4b8fb0)",
    thumbIcon: Compass,
  },
].map((lab) => ({ ...lab, imageUrl: "", durationLabel: lab.cadence, hasTopics: false }));

const estimateDuration = (total) => `~${Math.max(5, Math.ceil(total * 1.5))} min`;

const matchesSearch = (card, term) => {
  if (!term) return true;
  const haystack = `${card.title} ${card.takeaway}`.toLowerCase();
  return haystack.includes(term.trim().toLowerCase());
};

export default function ModulesLabsSection({
  modules,
  getModuleProgress,
  onOpenModule,
  loading = false,
  showSearch = false,
}) {
  // Seeds from ?search=... so following a search from the Home hero
  // (HomeHero.jsx navigates to /orbit/modules?search=<term>) lands here
  // already filtered, instead of silently dropping the term.
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState("learn");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");

  // Built once per `modules` change, independent of the active tab or search
  // term — so switching tabs never re-derives data, and the search filter
  // below just narrows whichever list is already in memory.
  const learnCards = useMemo(() => modules.map((mod) => {
    const { total, done, pct } = getModuleProgress(mod);
    const status = total > 0 && pct === 100 ? "Completed" : pct > 0 ? "In Progress" : "Not Started";
    const rawDescription = (mod.description || "").trim();
    return {
      id: mod._id || mod.id,
      module: mod,
      title: mod.title || "Untitled Module",
      imageUrl: mod.imageUrl,
      // Real backend values — the estimate formula is only a defensive
      // fallback for modules fetched through an older/unwired path.
      durationLabel: mod.estimatedTime
        ? `~${mod.estimatedTime} min`
        : estimateDuration(total || mod.topicCount || 4),
      status,
      pct,
      hasTopics: mod.hasTopics !== false,
      points: mod.pointsReward ?? Math.max(50, (total || 0) * 10),
      takeaway: rawDescription
        ? rawDescription.length > 100 ? `${rawDescription.slice(0, 98)}…` : rawDescription
        : "Complete this module to unlock its key takeaways.",
    };
  }), [modules, getModuleProgress]);

  // Filtering is plain Array#filter over whichever dataset is active — no
  // separate "filtered learn" / "filtered labs" state to keep in sync, just
  // one `search` string applied at render time to the tab currently showing.
  const activeCards = tab === "learn" ? learnCards : LABS;
  const cards = useMemo(
    () => activeCards.filter((card) => matchesSearch(card, search)),
    [activeCards, search]
  );

  return (
    <div>
      <div className="orbit-ml-toolbar">
        {showSearch && (
          <div className="orbit-learn-search orbit-learn-search--big">
            <Search size={16} />
            <input
              type="text"
              placeholder={`Search ${tab === "learn" ? "modules" : "labs"}…`}
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
            className={`orbit-toggle__btn ${tab === "learn" ? "orbit-toggle__btn--active" : ""}`}
            onClick={() => setTab("learn")}
          >
            Learn
          </button>
          <button
            className={`orbit-toggle__btn ${tab === "labs" ? "orbit-toggle__btn--active" : ""}`}
            onClick={() => setTab("labs")}
          >
            Labs
          </button>
        </div>
      </div>

      {!loading && (
        <p className="orbit-ml-results-count">
          {cards.length} result{cards.length !== 1 ? "s" : ""}
        </p>
      )}

      {loading ? (
        <div className="orbit-ml-grid orbit-ml-grid--fixed">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="orbit-ml-card orbit-ml-card--skeleton" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="orbit-ml-card__thumb" />
              <div className="orbit-ml-card__body">
                <div className="orbit-skel-line" style={{ width: "40%" }} />
                <div className="orbit-skel-line" style={{ width: "85%", height: 16 }} />
                <div className="orbit-skel-line" style={{ width: "60%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="orbit-ml-empty">
          <Globe2 size={26} />
          <p style={{ margin: 0 }}>
            {search
              ? `No ${tab === "learn" ? "modules" : "labs"} match "${search}".`
              : tab === "learn" ? "No modules assigned yet." : "No labs available yet."}
          </p>
        </div>
      ) : (
        <div className="orbit-ml-grid orbit-ml-grid--fixed">
          {cards.map((card, i) => (
            <ModuleLabCard
              key={card.id}
              card={card}
              index={i}
              onClick={tab === "learn" ? () => onOpenModule(card.module) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
