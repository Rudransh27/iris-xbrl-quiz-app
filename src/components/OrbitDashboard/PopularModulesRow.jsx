// src/components/OrbitDashboard/PopularModulesRow.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "react-bootstrap-icons";
import ModuleLabCard from "./ModuleLabCard";

const estimateDuration = (total) => `~${Math.max(5, Math.ceil(total * 1.5))} min`;

// Curated replacement for the old full-listing dump: only admin-flagged
// `isPopular` modules render here (capped at 5), matching the exact card
// shape ModulesLabsSection already builds for ModuleLabCard — no new card UI.
export default function PopularModulesRow({ modules, getModuleProgress, onOpenModule }) {
  const cards = useMemo(() => {
    return modules
      .filter((mod) => mod.isPopular)
      .slice(0, 5)
      .map((mod) => {
        const { total, pct } = getModuleProgress(mod);
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
      });
  }, [modules, getModuleProgress]);

  if (cards.length === 0) return null;

  return (
    <div className="mlc-row">
      <div className="orbit-section-head">
        <div className="orbit-section-head__text">
          <span className="ui-eyebrow">Learn</span>
          <h2 className="orbit-section-head__title">Featured Modules</h2>
        </div>
        <div className="orbit-section-head__actions">
          <Link to="/orbit/modules" className="ui-btn ui-btn--link ui-btn--sm">
            View all in Learn <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="mlc-grid">
        {cards.map((card, i) => (
          <ModuleLabCard key={card.id} card={card} index={i} onClick={() => onOpenModule(card.module)} />
        ))}
      </div>
    </div>
  );
}
