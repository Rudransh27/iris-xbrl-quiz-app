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
          <p style={{ margin: 0 }}>No modules assigned yet.</p>
        </div>
      ) : (
        <div className="orbit-ml-grid orbit-ml-grid--fixed">
          {cards.map((card, i) => (
            <ModuleLabCard key={card.id} card={card} index={i} onClick={() => onOpenModule(card.module)} />
          ))}
        </div>
      )}
    </div>
  );
}
