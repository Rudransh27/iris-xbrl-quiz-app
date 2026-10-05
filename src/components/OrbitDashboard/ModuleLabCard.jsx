// src/components/OrbitDashboard/ModuleLabCard.jsx
import React from "react";
import {
  BookHalf, ClockHistory, ArrowRight, LockFill,
  LeafFill, CpuFill, Diagram3, SignpostSplit, ShieldCheck,
} from "react-bootstrap-icons";
import { PiShootingStarFill } from "react-icons/pi";
import "./ModuleLabCard.css";

// Badge tone per status (ui-badge modifiers from src/styles/ui.css).
const STATUS_CLASS = {
  "Not Started": "ui-badge--outline",
  "In Progress": "ui-badge--accent",
  Completed: "ui-badge--success",
  "Coming Soon": "ui-badge--outline",
  Locked: "ui-badge--outline",
};

// Displayed status text — "Not Started"/"Coming Soon" both read as "New"
// (the spec's exact wording); "In Progress"/"Completed" pass through as-is.
const STATUS_LABEL = {
  "Not Started": "New",
  "Coming Soon": "New",
};

// Rotating module art (token gradient + a themed icon), assigned by a card's
// position in its list — NOT tied to any specific module's title, since real
// modules are arbitrary backend data. Gradients are the --grad-m1..m6 module
// art tokens (src/index.css), so they follow light/dark automatically.
const MODULE_THUMB_PALETTE = [
  { gradient: "var(--grad-m1)", Icon: BookHalf },
  { gradient: "var(--grad-m3)", Icon: LeafFill },
  { gradient: "var(--grad-m2)", Icon: CpuFill },
  { gradient: "var(--grad-m5)", Icon: Diagram3 },
  { gradient: "var(--grad-m4)", Icon: SignpostSplit },
  { gradient: "var(--grad-m6)", Icon: ShieldCheck },
];

// card: { id, title, imageUrl, description/takeaway, durationLabel, status,
//         pct, points, hasTopics }
export default function ModuleLabCard({ card, index = 0, onClick }) {
  const isLocked = !!card.locked;
  const clickable = typeof onClick === "function" && !isLocked;
  const pct = Math.max(0, Math.min(100, card.pct || 0));
  const isCompleted = card.status === "Completed";
  const isInProgress = !isCompleted && pct > 0;
  const displayStatus = isLocked ? "Locked" : card.status;
  const statusLabel = isLocked ? "Locked" : (STATUS_LABEL[card.status] || card.status);

  // Real, non-fabricated classification — derived from the module's actual
  // topic structure, not an invented "tags" field (Module schema has none).
  const typeLabel = card.hasTopics === false ? "Quick Module" : "Multi-Topic";

  // Individually-authored cards (e.g. Labs) can pin their own thumb via
  // `thumbGradient`/`thumbIcon`; anything else (real modules, arbitrary
  // backend data) rotates through the generic palette by list position.
  const theme = MODULE_THUMB_PALETTE[index % MODULE_THUMB_PALETTE.length];
  const thumbGradient = card.thumbGradient || theme.gradient;
  const ThemeIcon = card.thumbIcon || theme.Icon;

  // One module-card anatomy everywhere (Learn grid, Home "Featured Modules"):
  // media (art + optional image) → badges → title → 2-line description →
  // footer (duration · Lightyears · arrow). The gradient+icon art always
  // renders underneath; a real image paints over it, so a missing/broken
  // imageUrl never leaves an empty grey block.
  return (
    <div
      className={`ui-card mlc${clickable ? " ui-card--interactive" : ""}${isLocked ? " mlc--locked" : ""}`}
      onClick={clickable ? onClick : undefined}
      aria-disabled={isLocked}
    >
      <div className="ui-card__media mlc__media" style={{ "--mlc-art": thumbGradient }}>
        <span className="mlc__art" aria-hidden="true"><ThemeIcon size={28} /></span>
        {card.imageUrl && (
          <span className="mlc__img" style={{ backgroundImage: `url(${card.imageUrl})` }} aria-hidden="true" />
        )}
        {isLocked && (
          <div className="mlc__lock-overlay" aria-hidden="true">
            <LockFill size={20} />
          </div>
        )}
        <span className={`ui-badge ui-badge--sm mlc__status ${STATUS_CLASS[displayStatus] || STATUS_CLASS["Not Started"]}`}>
          {isLocked && <LockFill size={10} />}
          {statusLabel}
        </span>
      </div>

      <div className="mlc__badges">
        <span className="ui-badge ui-badge--sm">Module</span>
        <span className="ui-badge ui-badge--sm">{typeLabel}</span>
      </div>

      <h4 className="ui-card__title ui-clamp-2 mlc__title">{card.title}</h4>
      <p className="ui-clamp-2 mlc__desc">{card.takeaway}</p>

      {isLocked ? (
        <p className="mlc__lock-hint"><LockFill size={11} /> Complete the previous module to unlock</p>
      ) : isInProgress && (
        <div className="mlc__progress">
          <div className="ui-progress ui-progress--sm">
            <div className="ui-progress__bar" style={{ width: `${pct}%` }} />
          </div>
          <span className="mlc__progress-label">{pct}% Completed</span>
        </div>
      )}

      <div className="ui-card__foot mlc__foot">
        <span className="mlc__time">
          <ClockHistory size={14} /> {card.durationLabel}
        </span>
        {card.points > 0 && (
          <span className="ui-badge ui-badge--accent mlc__xp" title={`Earn ${card.points} Lightyears on completion`}>
            <PiShootingStarFill size={12} /> +{card.points} Lightyears
          </span>
        )}
        <button
          type="button"
          className="ui-btn ui-btn--soft ui-btn--icon ui-btn--sm mlc__go"
          onClick={clickable ? (e) => { e.stopPropagation(); onClick(); } : undefined}
          disabled={isLocked}
          aria-label={isLocked ? `${card.title} is locked` : `Open ${card.title}`}
        >
          {isLocked ? <LockFill size={14} /> : <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
