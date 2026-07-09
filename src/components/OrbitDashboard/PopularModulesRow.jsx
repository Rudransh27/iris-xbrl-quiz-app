// src/components/OrbitDashboard/PopularModulesRow.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "react-bootstrap-icons";
import ModuleLabCard from "./ModuleLabCard";

const estimateDuration = (total) => `~${Math.max(5, Math.ceil(total * 1.5))} min`;

// Curated replacement for the old full-listing dump: only admin-flagged
// `isPopular` modules render here (capped at 4), matching the exact card
// shape ModulesLabsSection already builds for ModuleLabCard — no new card UI.
export default function PopularModulesRow({ modules, getModuleProgress, onOpenModule }) {
  const cards = useMemo(() => {
    return modules
      .filter((mod) => mod.isPopular)
      .slice(0, 4)
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
          points: mod.pointsReward ?? Math.max(50, (total || 0) * 10),
          takeaway: rawDescription
            ? rawDescription.length > 100 ? `${rawDescription.slice(0, 98)}…` : rawDescription
            : "Complete this module to unlock its key takeaways.",
        };
      });
  }, [modules, getModuleProgress]);

  if (cards.length === 0) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--orbit-text-heading)" }}>
          Featured Paths
        </h2>
        <Link
          to="/orbit/modules"
          style={{ fontSize: 12.5, fontWeight: 700, color: "var(--amber-glow-dark)", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}
        >
          View all in Learn <ArrowRight size={11} />
        </Link>
      </div>

      <div className="orbit-ml-grid">
        {cards.map((card) => (
          <ModuleLabCard key={card.id} card={card} onClick={() => onOpenModule(card.module)} />
        ))}
      </div>
    </div>
  );
}
