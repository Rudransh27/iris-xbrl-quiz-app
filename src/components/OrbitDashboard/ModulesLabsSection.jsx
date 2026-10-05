// src/components/OrbitDashboard/ModulesLabsSection.jsx
import React, { useMemo } from "react";
import { Globe2 } from "react-bootstrap-icons";
import ModuleLabCard from "./ModuleLabCard";

const estimateDuration = (total) => `~${Math.max(5, Math.ceil(total * 1.5))} min`;

export default function ModulesLabsSection({
  modules,
  getModuleProgress,
  onOpenModule,
  loading = false,
}) {
  const cards = useMemo(() => modules.map((mod) => {
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
      // 🔒 Sequential module lock — comes straight from the backend
      // (workspace-curriculum), which is the actual enforcement authority;
      // this only drives the card's visual/click-disabled state.
      locked: !!mod.locked,
      hasTopics: mod.hasTopics !== false,
      points: mod.pointsReward ?? Math.max(50, (total || 0) * 10),
      takeaway: rawDescription
        ? rawDescription.length > 100 ? `${rawDescription.slice(0, 98)}…` : rawDescription
        : "Complete this module to unlock its key takeaways.",
    };
  }), [modules, getModuleProgress]);

  return (
    <div>
      {loading ? (
        <div className="mlc-grid mlc-grid--fixed">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ui-card mlc mlc--skeleton" aria-hidden="true">
              <div className="ui-card__media mlc__media ui-skeleton" />
              <div className="ui-skeleton mlc__skel mlc__skel--sm" />
              <div className="ui-skeleton mlc__skel mlc__skel--lg" />
              <div className="ui-skeleton mlc__skel mlc__skel--md" />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="ui-empty">
          <span className="ui-icon-tile ui-icon-tile--neutral ui-icon-tile--lg"><Globe2 size={22} /></span>
          <p className="ui-empty__title">No modules assigned yet.</p>
        </div>
      ) : (
        <div className="mlc-grid mlc-grid--fixed">
          {cards.map((card, i) => (
            <ModuleLabCard key={card.id} card={card} index={i} onClick={() => onOpenModule(card.module)} />
          ))}
        </div>
      )}
    </div>
  );
}
