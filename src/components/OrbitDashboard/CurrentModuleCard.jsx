// src/components/OrbitDashboard/CurrentModuleCard.jsx
import React from "react";
import { PlayFill } from "react-bootstrap-icons";

export default function CurrentModuleCard({ module, progress, onResume }) {
  if (!module) {
    return (
      <div className="orbit-card orbit-card--sky">
        <div className="orbit-module-card__eyebrow">CURRENT MODULE</div>
        <div className="orbit-module-card__title">No module assigned yet</div>
        <p className="orbit-module-card__meta">Check back once your learning path is set up.</p>
      </div>
    );
  }

  const { total, done, pct } = progress;
  const inProgress = done > 0 && done < total;
  const completed = total > 0 && done >= total;

  return (
    <div className="orbit-card orbit-card--sky">
      <div className="orbit-module-card__eyebrow">
        {inProgress ? "RESUME WHERE YOU LEFT OFF" : completed ? "MODULE COMPLETED" : "CURRENT MODULE"}
      </div>
      <div className="orbit-module-card__title">{module.title}</div>
      <div className="orbit-module-card__meta">
        {module.topicCount || 0} segments · +{module.pointsReward ?? Math.max(50, total * 10)} pts
      </div>
      {total > 0 && (
        <div className="orbit-module-card__track">
          <div className="orbit-module-card__fill" style={{ width: `${pct}%` }} />
        </div>
      )}
      <button className="orbit-module-card__cta" onClick={onResume}>
        <PlayFill size={13} />
        {completed ? "Review Module" : inProgress ? `Continue · ${pct}%` : "Start Module"}
      </button>
    </div>
  );
}
