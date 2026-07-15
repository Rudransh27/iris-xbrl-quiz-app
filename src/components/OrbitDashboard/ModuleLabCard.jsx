// src/components/OrbitDashboard/ModuleLabCard.jsx
import React from "react";
import { BookHalf, ClockHistory, ArrowRight, LightningCharge } from "react-bootstrap-icons";

const STATUS_CLASS = {
  "Not Started": "orbit-ml-card__status--notstarted",
  "In Progress": "orbit-ml-card__status--inprogress",
  Completed: "orbit-ml-card__status--completed",
  "Coming Soon": "orbit-ml-card__status--soon",
};

// card: { id, title, imageUrl, description/takeaway, durationLabel, status,
//         pct, points, hasTopics }
export default function ModuleLabCard({ card, onClick }) {
  const clickable = typeof onClick === "function";
  const pct = Math.max(0, Math.min(100, card.pct || 0));
  const isCompleted = card.status === "Completed";
  const isInProgress = !isCompleted && pct > 0;

  // Real, non-fabricated classification — derived from the module's actual
  // topic structure, not an invented "tags" field (Module schema has none).
  const typeLabel = card.hasTopics === false ? "Quick Module" : "Multi-Topic";

  return (
    <div
      className={`orbit-ml-card ${clickable ? "orbit-ml-card--clickable" : ""}`}
      onClick={clickable ? onClick : undefined}
    >
      <div
        className="orbit-ml-card__thumb"
        style={card.imageUrl ? { backgroundImage: `url(${card.imageUrl})` } : undefined}
      >
        {!card.imageUrl && <BookHalf size={26} />}
        <span className={`orbit-ml-card__status ${STATUS_CLASS[card.status] || STATUS_CLASS["Not Started"]}`}>
          {card.status}
        </span>
      </div>

      <div className="orbit-ml-card__body">
        <div className="orbit-ml-card__pill-row">
          <span className="orbit-ml-card__pill">Module</span>
          <span className="orbit-ml-card__pill">{typeLabel}</span>
        </div>

        <h4 className="orbit-ml-card__title">{card.title}</h4>
        <p className="orbit-ml-card__description">{card.takeaway}</p>

        {isInProgress && (
          <div className="orbit-ml-card__progress">
            <div className="orbit-ml-card__progress-track">
              <div className="orbit-ml-card__progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="orbit-ml-card__progress-label">{pct}% Completed</span>
          </div>
        )}

        <div className="orbit-ml-card__bottom-row">
          <div className="orbit-ml-card__meta-cluster">
            <span className="orbit-ml-card__time">
              <ClockHistory size={14} /> {card.durationLabel}
            </span>
            {card.points > 0 && (
              <span className="orbit-ml-card__plasma" title={`Earn ${card.points} Plasma on completion`}>
                <LightningCharge size={12} /> +{card.points} Plasma
              </span>
            )}
          </div>
          <button
            type="button"
            className="orbit-ml-card__go-btn"
            onClick={clickable ? (e) => { e.stopPropagation(); onClick(); } : undefined}
            aria-label={`Open ${card.title}`}
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
