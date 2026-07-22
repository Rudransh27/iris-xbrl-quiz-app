// src/components/OrbitDashboard/ModulesLabsSection.jsx
import React, { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Globe2, PencilFill, Lightbulb } from "react-bootstrap-icons";
import ModuleLabCard from "./ModuleLabCard";

// No standalone Lab entity exists in the backend yet, and the labs program
// itself hasn't launched — this is real, curated announcement copy (not
// placeholder filler), not a filterable data grid. Swap for a real
// api.getLabs() call once a Lab model/route ships and labs actually open.
const UPCOMING_LABS = [
  { id: "product-lab", dot: "mint", title: "Product Lab", cadence: "weekly", desc: "Use the product like a customer" },
  { id: "domain-lab", dot: "sky", title: "Domain Lab", cadence: "bi-weekly", desc: "Finance and AI fluency · guest-led sessions" },
  { id: "deal-lab", dot: "amber", title: "Deal Lab", cadence: "monthly", desc: "One deal deep-dived. Patterns extracted" },
  { id: "build-lab", dot: "coral", title: "Build Lab", cadence: "monthly", desc: "Half-day prototype sprints" },
];

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

  // Labs isn't a filterable data grid (see UPCOMING_LABS above), so search
  // only ever applies to the Learn tab's real module list.
  const cards = useMemo(
    () => learnCards.filter((card) => matchesSearch(card, search)),
    [learnCards, search]
  );

  return (
    <div>
      <div className="orbit-ml-toolbar">
        {showSearch && tab === "learn" && (
          <div className="orbit-learn-search orbit-learn-search--big">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search modules…"
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

      {tab === "labs" ? (
        <div className="orbit-labs-soon">
          <div className="orbit-labs-banner">
            <PencilFill size={16} />
            <div>
              <strong>Labs Opening Soon...</strong>
              <p>Four labs, each does one thing ferociously well. No sign-ups yet — teams being formed.</p>
            </div>
          </div>

          <p className="orbit-labs-label">Upcoming</p>
          <div className="orbit-labs-list">
            {UPCOMING_LABS.map((lab) => (
              <div className="orbit-labs-row" key={lab.id}>
                <span className={`orbit-labs-dot orbit-labs-dot--${lab.dot}`} />
                <div className="orbit-labs-row__body">
                  <h4>
                    {lab.title} <span className="orbit-labs-row__cadence">· {lab.cadence}</span>
                  </h4>
                  <p>{lab.desc}</p>
                </div>
                <span className="orbit-labs-soon-pill">Soon</span>
              </div>
            ))}
          </div>

          <div className="orbit-labs-tip">
            <Lightbulb size={16} />
            <p>
              You can start suggesting topics in <Link to="/orbit/ideas">Ideas</Link> now. The most upvoted topic
              in each lab gets scheduled first.
            </p>
          </div>
        </div>
      ) : (
        <>
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
                {search ? `No modules match "${search}".` : "No modules assigned yet."}
              </p>
            </div>
          ) : (
            <div className="orbit-ml-grid orbit-ml-grid--fixed">
              {cards.map((card, i) => (
                <ModuleLabCard key={card.id} card={card} index={i} onClick={() => onOpenModule(card.module)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
