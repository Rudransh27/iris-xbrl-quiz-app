// src/components/ModuleCardEach.jsx
import React from "react";
import "./ModuleCardEach.css";
import { Terminal, CodeSquare, Activity, Globe2, PlayFill, CheckCircleFill } from "react-bootstrap-icons";

// Module art — the --grad-m1..m6 tokens, position-cycled from parent.
const ART = ["var(--grad-m1)", "var(--grad-m3)", "var(--grad-m2)", "var(--grad-m5)", "var(--grad-m4)", "var(--grad-m6)"];

const getDepartmentIcon = (code) => {
  switch ((code || "").toLowerCase()) {
    case "ifile":  return <Terminal   size={14} />;
    case "ideal":  return <CodeSquare size={14} />;
    case "carbon": return <Activity   size={14} />;
    default:       return <Globe2     size={14} />;
  }
};

export default function ModuleCardEach({
  title,
  description,
  department,
  onClick,
  isButtonVisible,
  buttonText,
  onButtonClick,
  // progress props — optional, supplied by ModuleTrail when available
  done       = 0,
  total      = 0,
  pct        = 0,
  paletteIndex = 0,
}) {
  const deptCode  = department && typeof department === "object"
    ? (department.code  || "global")
    : (department || "global");
  const deptName  = department && typeof department === "object"
    ? (department.name  || "Global Track")
    : "Global Track";

  const art         = ART[paletteIndex % ART.length];
  const isCompleted = total > 0 && pct === 100;
  const isInProgress= pct > 0 && !isCompleted;
  const xpEarned    = done  * 10;
  const xpTotal     = total * 10;
  const safeTitle   = (title  || "Untitled Module").replace(/�/g, "").trim();
  const shortLabel  = safeTitle.length > 26 ? safeTitle.slice(0, 24) + "…" : safeTitle;

  return (
    <div className={`ui-card${onClick ? " ui-card--interactive" : ""} mce-card`} onClick={onClick}>
      {/* Media: module art + department glyph */}
      <div className="ui-card__media mce-card__media" style={{ "--mce-art": art }} aria-hidden="true">
        <span className="mce-card__art">{getDepartmentIcon(deptCode)}</span>
      </div>

      {/* Row: dept icon + name · status badge */}
      <div className="mce-card__row">
        <span className="ui-eyebrow ui-eyebrow--caps ui-eyebrow--plain mce-card__dept">
          {getDepartmentIcon(deptCode)}
          {deptName.toUpperCase()}
        </span>

        {total > 0 && (
          <span className={`ui-badge ui-badge--sm ${isCompleted ? "ui-badge--success" : isInProgress ? "ui-badge--accent" : "ui-badge--outline"}`}>
            {isCompleted ? "Done" : isInProgress ? "In Progress" : "New"}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="ui-card__title ui-clamp-2 mce-card__title">
        {safeTitle}
      </div>

      {/* Description */}
      {description && (
        <div className="ui-clamp-2 mce-card__desc">
          {description}
        </div>
      )}

      {/* Progress track — shown when data is available */}
      {total > 0 && (
        <div className="mce-card__progress">
          <div className="mce-card__progress-label">
            {shortLabel}: {pct}% Complete{total > 0 ? ` — ${xpEarned}/${xpTotal} Lightyears Earned` : ""}
          </div>
          <div className={`ui-progress${isCompleted ? " ui-progress--success" : ""}`}>
            <div className="ui-progress__bar" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* CTA */}
      {isButtonVisible ? (
        <button
          type="button"
          className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg mce-card__cta"
          onClick={(e) => { e.stopPropagation(); onButtonClick(); }}
        >
          {buttonText}
        </button>
      ) : (
        <button
          type="button"
          className={`ui-btn ${isCompleted ? "ui-btn--secondary" : "ui-btn--soft"} ui-btn--block mce-card__cta`}
          onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
        >
          {isCompleted  && <CheckCircleFill size={12} />}
          {isInProgress && <PlayFill        size={12} />}
          {isCompleted ? "Review Module" : isInProgress ? `Continue · ${pct}%` : "Start Learning →"}
        </button>
      )}
    </div>
  );
}
