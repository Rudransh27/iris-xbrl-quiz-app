import React from "react";
import { PlayFill, Collection, LightningChargeFill, CheckLg } from "react-bootstrap-icons";

// Progress ring geometry (viewBox 72×72)
const R = 30;
const C = 2 * Math.PI * R;

function ProgressRing({ pct, showIcon, done }) {
  const offset = C * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div className="orbit-resume__ring" role="img" aria-label={`${pct}% complete`}>
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle className="orbit-resume__track" cx="36" cy="36" r={R} />
        <circle
          className="orbit-resume__arc"
          cx="36"
          cy="36"
          r={R}
          style={{ "--ring-c": C, strokeDasharray: C, strokeDashoffset: offset }}
        />
      </svg>
      <span className="orbit-resume__ring-label">
        {done ? <CheckLg size={22} /> : showIcon ? <PlayFill size={22} /> : `${pct}%`}
      </span>
    </div>
  );
}

export default function CurrentModuleCard({ module, progress, onResume }) {
  if (!module) {
    return (
      <div className="orbit-resume orbit-resume--empty">
        <ProgressRing pct={0} showIcon />
        <div className="orbit-resume__body">
          <span className="ui-eyebrow">Current module</span>
          <div className="orbit-resume__title">No module assigned yet</div>
          <p className="orbit-resume__hint">Check back once your learning path is set up.</p>
        </div>
        <span className="orbit-resume__glow" aria-hidden="true" />
      </div>
    );
  }

  const { total, done, pct } = progress;
  const inProgress = done > 0 && done < total;
  const completed = total > 0 && done >= total;
  const points = module.pointsReward ?? Math.max(50, total * 10);

  return (
    <div className={`orbit-resume ${completed ? "orbit-resume--done" : ""}`}>
      <ProgressRing pct={pct || 0} showIcon={!inProgress && !completed} done={completed} />

      <div className="orbit-resume__body">
        <span className="ui-eyebrow">
          {inProgress ? "Resume where you left off" : completed ? "Module completed" : "Current module"}
        </span>
        <div className="orbit-resume__title">{module.title}</div>
        <div className="orbit-resume__meta">
          <span className="orbit-resume__chip">
            <Collection size={12} /> {module.topicCount || 0} segments
          </span>
          <span className="orbit-resume__chip orbit-resume__chip--accent">
            <LightningChargeFill size={12} /> +{points} pts
          </span>
        </div>
      </div>

      <button className="orbit-resume__cta ui-btn ui-btn--primary ui-btn--sm" onClick={onResume}>
        <PlayFill size={13} />
        {completed ? "Review Module" : inProgress ? `Continue · ${pct}%` : "Start Module"}
      </button>

      <span className="orbit-resume__glow" aria-hidden="true" />
    </div>
  );
}
