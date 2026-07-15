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

  return (
    <div
      className={`topic-card topic-card--${statusKey}`}
      onClick={isLocked ? undefined : onClick}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-disabled={isLocked}
      onKeyDown={(e) => {
        if (!isLocked && (e.key === "Enter" || e.key === " ")) onClick?.();
      }}
    >
      {/* Top block — badge/title/meta/status. Grouped as one flex child so
          the footer below can be pinned to the card's bottom edge via
          justify-content: space-between, regardless of how much text this
          block ends up wrapping to. */}
      <div className="topic-card__top">
        <div className="topic-card__heading-row">
          <span className="topic-card__type-badge">✦ {typeLabel}</span>

          {/* Minimal status indicators — no bulky colored blocks. "Not
              started" shows nothing at all, the quietest possible default. */}
          {isLocked && (
            <span className="topic-card__status topic-card__status--locked" aria-label="Locked">
              <LockFill size={11} />
            </span>
          )}
          {isCompleted && (
            <span className="topic-card__status topic-card__status--completed" aria-label="Completed">
              <CheckLg size={12} />
            </span>
          )}
          {inProgress && (
            <span className="topic-card__status topic-card__status--in-progress">
              In Progress
            </span>
          )}
        </div>

        <h3 className="topic-card__title">{title}</h3>
        {description && <p className="topic-card__description">{description}</p>}

        <div className="topic-card__meta-row">
          {!!estimatedTime && (
            <span className="topic-card__meta-item">
              <ClockHistory size={11} /> {estimatedTime} min
            </span>
          )}
          {!!pointsReward && (
            <span className="topic-card__meta-item topic-card__meta-item--xp">
              <StarFill size={11} /> +{pointsReward} Plasma
            </span>
          )}
        </div>
      </div>

      {/* Footer block — always the last flex child, so space-between pins
          it flush to the bottom of every card in a row, aligned or not. */}
      <div className="topic-card__footer">
        {!isLocked && totalCards > 0 && (
          <div className="topic-card__progress-track" aria-hidden="true">
            <div className="topic-card__progress-fill" style={{ width: `${percentage}%` }} />
          </div>
        )}

        <button
          type="button"
          className="topic-card__cta"
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
