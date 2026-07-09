// src/components/TopicCard.jsx
import React, { useState } from "react";
import { Check2Circle, LockFill, TicketDetailedFill, ClockHistory, StarFill } from "react-bootstrap-icons";
import "./TopicCard.css";

const smilies = ["(˃ᴗ˂)", "(˘▾˘)", "ʕ•ᴥ•ʔ", "(◕‿◕)", "(✿◠‿◠)", "(o˘◡˘o)"];

export default function TopicCard({
  image,
  title,
  description,
  status,
  progress,
  estimatedTime,
  pointsReward,
  onClick,
}) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [smiley] = useState(() => smilies[Math.floor(Math.random() * smilies.length)]);

  const cardsCovered = progress?.cardsCovered || 0;
  const totalCards = progress?.totalCards || 0;
  const percentage = totalCards > 0 ? Math.round((cardsCovered / totalCards) * 100) : 0;

  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const hasNoImage = !image || image.trim() === "" || imageLoadFailed;

  // Distinct from the existing PASSED/LOCKED/START pill (which drives the
  // lock/theme state) — this is a separate at-a-glance progress badge.
  const statusBadgeLabel = isLocked
    ? null
    : cardsCovered === 0
    ? "Not Started"
    : cardsCovered < totalCards
    ? "In Progress"
    : "Completed";

  return (
    <div
      className={`duo-topic-glass-card status-${status}`}
      onClick={isLocked ? undefined : onClick}
      tabIndex={isLocked ? -1 : 0}
      aria-disabled={isLocked}
    >
      {/* 🌟 Playful Glossy Reflection Sheet Overlay */}
      <div className="duo-card-shine"></div>

      {/* ================= LEFT VISUAL PORTAL ================= */}
      <div className="duo-media-block-left">
        {hasNoImage ? (
          <div className="duo-smiley-placeholder">
            <span>{smiley}</span>
          </div>
        ) : (
          <img
            src={image}
            alt={title}
            className="duo-topic-thumbnail"
            onError={() => setImageLoadFailed(true)}
          />
        )}
        
        {isLocked && (
          <div className="duo-lock-screen-overlay">
            <LockFill size={16} className="duo-lock-icon" />
          </div>
        )}

        <div className="duo-status-mini-pill">
          {isCompleted ? "PASSED" : isLocked ? "LOCKED" : "START"}
        </div>
      </div>

      {/* ================= RIGHT METRIC DATA BLOCK ================= */}
      <div className="duo-content-block-right">
        <div className="duo-card-header-meta">
          <h3 className="duo-card-main-title">{title}</h3>
          {isCompleted ? (
            <Check2Circle className="duo-success-checkmark-vector" size={18} />
          ) : (
            <TicketDetailedFill size={14} className="duo-deco-icon" />
          )}
        </div>
        
        <p className="duo-card-main-description">{description}</p>

        {/* Premium meta row: status badge + duration + points reward */}
        <div className="duo-card-meta-badges-row">
          {statusBadgeLabel && (
            <span className={`duo-status-badge duo-status-badge--${statusBadgeLabel.toLowerCase().replace(" ", "-")}`}>
              {statusBadgeLabel}
            </span>
          )}
          {!!estimatedTime && (
            <span className="duo-meta-badge">
              <ClockHistory size={11} /> ~{estimatedTime} min
            </span>
          )}
          {!!pointsReward && (
            <span className="duo-meta-badge duo-meta-badge--points">
              <StarFill size={11} /> +{pointsReward} pts
            </span>
          )}
        </div>

        {/* Real-Time Linear Progress Bar Gauge Component */}
        {!isLocked && totalCards > 0 && (
          <div className="duo-card-progress-container">
            <div className="duo-progress-labels-row">
              <span>PROGRESS</span>
              <span>{cardsCovered}/{totalCards} NODES</span>
            </div>
            <div className="duo-rail-base-track">
              <div 
                className="duo-fill-beam-progress" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}