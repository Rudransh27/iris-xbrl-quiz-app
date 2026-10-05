// src/components/TopicCard.jsx
import React from "react";
import { LockFill, CheckLg, ClockHistory, StarFill, PlayFill } from "react-bootstrap-icons";
import "./TopicCard.css";

// Tiny top-left format badge — derived from the topic's first card's real
// content type, same data source as the previous icon-based version, just
// rendered as a "✦ LABEL" tag instead of a monochrome glyph.
const LABEL_BY_CARD_TYPE = {
  knowledge: "TEXT",
  video: "VIDEO",
  quiz: "QUIZ",
  code: "LAB",
  pdf: "PDF",
  ppt: "SLIDES",
  html_sandbox: "LAB",
};

export default function TopicCard({
  title,
  description,
  status,
  progress,
  estimatedTime,
  pointsReward,
  cards,
  onClick,
  index, // optional: position in the list → "01" index pill
}) {
  const cardsCovered = progress?.cardsCovered || 0;
  const totalCards = progress?.totalCards || 0;
  const percentage = totalCards > 0 ? Math.round((cardsCovered / totalCards) * 100) : 0;

  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const inProgress = !isLocked && !isCompleted && cardsCovered > 0;

  const statusKey = isLocked ? "locked" : isCompleted ? "completed" : inProgress ? "in-progress" : "not-started";
  const typeLabel = LABEL_BY_CARD_TYPE[cards?.[0]?.card_type] || "TOPIC";

  const ctaLabel = isLocked ? "Locked" : isCompleted ? "Review" : inProgress ? "Resume" : "Start";

  const handleCtaClick = (e) => {
    e.stopPropagation(); // the whole card is also clickable — avoid double-firing
    if (!isLocked && onClick) onClick();
  };

  const ctaVariant = isCompleted ? "ui-btn--secondary" : "ui-btn--primary";

  return (
    <div
      className={`ui-card${isLocked ? "" : " ui-card--interactive"} topic-card topic-card--${statusKey}`}
      onClick={isLocked ? undefined : onClick}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-disabled={isLocked}
      onKeyDown={(e) => {
        if (!isLocked && (e.key === "Enter" || e.key === " ")) onClick?.();
      }}
    >
      {/* Top block — index/badges/title/meta. Grouped as one flex child so
          the footer below can be pinned to the card's bottom edge via
          justify-content: space-between, regardless of how much text this
          block ends up wrapping to. */}
      <div className="topic-card__top">
        <div className="topic-card__heading-row">
          {typeof index === "number" && (
            <span className={`ui-index${inProgress ? " ui-index--active" : ""}`}>{String(index + 1).padStart(2, "0")}</span>
          )}
          <span className="ui-badge ui-badge--sm topic-card__type-badge">{typeLabel}</span>

          {/* Status badges — "Not started" shows nothing at all, the
              quietest possible default. */}
          {isLocked && (
            <span className="ui-badge ui-badge--sm topic-card__status topic-card__status--locked" aria-label="Locked">
              <LockFill size={10} /> Locked
            </span>
          )}
          {isCompleted && (
            <span className="ui-badge ui-badge--sm ui-badge--success topic-card__status topic-card__status--completed" aria-label="Completed">
              <CheckLg size={11} /> Completed
            </span>
          )}
          {inProgress && (
            <span className="ui-badge ui-badge--sm ui-badge--accent topic-card__status topic-card__status--in-progress">
              In Progress
            </span>
          )}
        </div>

        <h3 className="ui-card__title ui-clamp-2 topic-card__title">{title}</h3>
        {description && <p className="ui-clamp-2 topic-card__description">{description}</p>}

        <div className="topic-card__meta-row">
          {!!estimatedTime && (
            <span className="topic-card__meta-item">
              <ClockHistory size={12} /> {estimatedTime} min
            </span>
          )}
          {!!pointsReward && (
            <span className="ui-badge ui-badge--sm ui-badge--accent topic-card__meta-item--xp">
              <StarFill size={10} /> +{pointsReward} Lightyears
            </span>
          )}
        </div>
      </div>

      {/* Footer block — always the last flex child, so space-between pins
          it flush to the bottom of every card in a row, aligned or not. */}
      <div className="topic-card__footer">
        {!isLocked && totalCards > 0 && (
          <div className="topic-card__progress-row">
            <div className={`ui-progress ui-progress--sm topic-card__progress-track${isCompleted ? " ui-progress--success" : ""}`} aria-hidden="true">
              <div className="ui-progress__bar topic-card__progress-fill" style={{ width: `${percentage}%` }} />
            </div>
            <span className="topic-card__progress-label ui-num">{cardsCovered}/{totalCards}</span>
          </div>
        )}

        <button
          type="button"
          className={`ui-btn ${ctaVariant} ui-btn--sm topic-card__cta`}
          onClick={handleCtaClick}
          disabled={isLocked}
        >
          {!isLocked && <PlayFill size={13} />}
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
