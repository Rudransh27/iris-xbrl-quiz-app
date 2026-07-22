// src/components/OrbitDashboard/ModuleLabCard.jsx
import React from "react";
import {
  BookHalf, ClockHistory, ArrowRight, LightningCharge,
  LeafFill, CpuFill, Diagram3, SignpostSplit, ShieldCheck,
} from "react-bootstrap-icons";

const STATUS_CLASS = {
  "Not Started": "orbit-ml-card__status--notstarted",
  "In Progress": "orbit-ml-card__status--inprogress",
  Completed: "orbit-ml-card__status--completed",
  "Coming Soon": "orbit-ml-card__status--soon",
};

// Displayed status text — "Not Started"/"Coming Soon" both read as "New"
// (the spec's exact wording); "In Progress"/"Completed" pass through as-is.
const STATUS_LABEL = {
  "Not Started": "New",
  "Coming Soon": "New",
};

// Rotating pastel-rainbow thumbnail (gradient + a themed icon), assigned by
// a card's position in its list — NOT tied to any specific module's title,
// since real modules are arbitrary backend data, not the spec's illustrative
// sample titles. Gradients are the exact recipes from the Learn page spec.
const MODULE_THUMB_PALETTE = [
  { gradient: "linear-gradient(135deg, #7a6cc9, #4b6fb0)", Icon: BookHalf },
  { gradient: "linear-gradient(135deg, #3f9e79, #4b8fb0)", Icon: LeafFill },
  { gradient: "linear-gradient(135deg, #b06cc9, #c9557c)", Icon: CpuFill },
  { gradient: "linear-gradient(135deg, #4b6fb0, #6c8fd9)", Icon: Diagram3 },
  { gradient: "linear-gradient(135deg, #7a6cc9, #c76ca8)", Icon: SignpostSplit },
  { gradient: "linear-gradient(135deg, #3f9e79, #6c9fd9)", Icon: ShieldCheck },
];

// card: { id, title, imageUrl, description/takeaway, durationLabel, status,
//         pct, points, hasTopics }
export default function ModuleLabCard({ card, index = 0, onClick }) {
  const clickable = typeof onClick === "function";
  const pct = Math.max(0, Math.min(100, card.pct || 0));
  const isCompleted = card.status === "Completed";
  const isInProgress = !isCompleted && pct > 0;
  const statusLabel = STATUS_LABEL[card.status] || card.status;

  // Real, non-fabricated classification — derived from the module's actual
  // topic structure, not an invented "tags" field (Module schema has none).
  const typeLabel = card.hasTopics === false ? "Quick Module" : "Multi-Topic";

  // Individually-authored cards (e.g. Labs) can pin their own thumb via
  // `thumbGradient`/`thumbIcon`; anything else (real modules, arbitrary
  // backend data) rotates through the generic palette by list position.
  const theme = MODULE_THUMB_PALETTE[index % MODULE_THUMB_PALETTE.length];
  const thumbGradient = card.thumbGradient || theme.gradient;
  const ThemeIcon = card.thumbIcon || theme.Icon;

  return (
    <div
      className={`orbit-ml-card ${clickable ? "orbit-ml-card--clickable" : ""}`}
      onClick={clickable ? onClick : undefined}
    >
      <div
        className="orbit-ml-card__thumb"
        style={card.imageUrl ? { backgroundImage: `url(${card.imageUrl})` } : { backgroundImage: thumbGradient }}
      >
        {!card.imageUrl && <ThemeIcon size={28} />}
        <span className={`orbit-ml-card__status ${STATUS_CLASS[card.status] || STATUS_CLASS["Not Started"]}`}>
          {statusLabel}
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
