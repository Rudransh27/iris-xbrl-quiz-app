// src/components/OrbitDashboard/ModulesLabsSection.jsx
import React, { useMemo, useState } from "react";
import { Search } from "react-bootstrap-icons";
import ModuleLabCard from "./ModuleLabCard";

// No standalone Lab entity exists in the backend (only Module does), so this
// stays hand-authored rather than an API call. Content matches what was
// previously a side list on the old ModuleTrail page — carried over here
// rather than invented, since it's real curated program content. Swap for a
// real api.getLabs() call once a Lab model/route ships; the card shape below
// is what that response should match.
const LABS = [
  { id: "lab-product", title: "Product Lab", cadence: "Weekly", status: "Not Started", points: 50, takeaway: "Use the product like a customer." },
  { id: "lab-domain", title: "Domain Lab", cadence: "Bi-weekly", status: "Coming Soon", points: 50, takeaway: "Finance and AI fluency — guest-led sessions." },
  { id: "lab-deal", title: "Deal Lab", cadence: "Monthly", status: "Coming Soon", points: 50, takeaway: "One deal deep-dived. Patterns extracted." },
  { id: "lab-build", title: "Build Lab", cadence: "Monthly", status: "Coming Soon", points: 50, takeaway: "Half-day prototype sprints." },
].map((lab) => ({ ...lab, imageUrl: "", durationLabel: lab.cadence }));

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
  title = "Modules & Labs",
  subtitle = null,
  showSearch = false,
}) {
  const [tab, setTab] = useState("learn");
  const [search, setSearch] = useState("");

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
      // Real backend values (added alongside pointsReward) — the estimate
      // formula below only ever runs as a defensive fallback for modules
      // fetched through a path that hasn't been updated to include them.
      durationLabel: mod.estimatedTime
        ? `~${mod.estimatedTime} min`
        : estimateDuration(total || mod.topicCount || 4),
      status,
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: showSearch ? 26 : 18, fontWeight: 800, color: "var(--orbit-text-heading)" }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--orbit-text-muted)" }}>{subtitle}</p>
          )}
        </div>
        <div className="orbit-toggle">
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

      {showSearch && (
        <div className="orbit-learn-search">
          <Search size={14} />
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

      {loading ? (
        <div className="orbit-ml-grid">
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
        <p style={{ marginTop: 20, color: "var(--orbit-text-muted)", fontSize: 13, fontWeight: 600 }}>
          {search
            ? `No ${tab === "learn" ? "modules" : "labs"} match "${search}".`
            : tab === "learn" ? "No modules assigned yet." : "No labs available yet."}
        </p>
      ) : (
        <div className="orbit-ml-grid">
          {cards.map((card) => (
            <ModuleLabCard
              key={card.id}
              card={card}
              onClick={tab === "learn" ? () => onOpenModule(card.module) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
