// src/components/QuizPlayerHeader.jsx
import React from 'react';
import { XLg, ShieldShaded, Trophy, ArrowRepeat, BookmarkStarFill } from 'react-bootstrap-icons';
import './QuizPlayerHeader.css';

export default function QuizPlayerHeader({ currentIndex, totalLength, topicXP, chances, onExit, reviewMode, onReset, resetScopeLabel = 'Module' }) {
  // Pure progress ratio evaluation logic. currentIndex is 0-based, so "cards
  // reached so far" is currentIndex + 1 — using currentIndex alone (the old
  // bug) meant the bar could never visually reach 100% while any card was on
  // screen. Clamped to 100 to guard against any float overshoot.
  const progressPercent = totalLength > 0 ? Math.min(100, ((currentIndex + 1) / totalLength) * 100) : 0;

  return (
    <div className="quiz-top-player-header-shell">
      <div className="quiz-header-alignment-container">
        
        {/* ❌ Minimalist Exit Trigger */}
        <button type="button" className="quiz-header-exit-trigger" onClick={onExit} title="Exit Track">
          <XLg size={16} />
        </button>

        {/* 🔄 REATTEMPT: learner self-service reset — clones the exit
            trigger's icon-button pattern, placed right next to it. */}
        {onReset && (
          <button
            type="button"
            className="quiz-header-reset-trigger"
            onClick={onReset}
            title={`Reset/Reattempt this ${resetScopeLabel}`}
          >
            <ArrowRepeat size={15} />
          </button>
        )}

        {/* 📊 DYNAMIC PROGRESS ENGINE RAIL */}
        <div className="quiz-header-progress-viewport">
          <div className="quiz-header-progress-base-rail">
            <div
              className="quiz-header-progress-fluid-beam"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            />
          </div>
          <span className="quiz-header-step-counter">
            {currentIndex + 1} / {totalLength} NODES
          </span>
        </div>
        
        {/* 💫 XP TRACKER CLUSTER */}
        <div className="quiz-header-stat-capsule xp-node-tint" aria-label={`You have ${topicXP} Plasma`}>
          <Trophy size={14} className="stat-vector-icon text-gold-accent" />
          <span className="quiz-stat-count-string">{topicXP} <span className="stat-lbl-dim">Plasma</span></span>
        </div>
        
        {/* ❤️ LIFE CHANCES TRACKER CLUSTER — meaningless once a module/topic
            is already fully complete (no more retries to spend), so a
            Review pill takes its place instead. */}
        {reviewMode ? (
          <div className="quiz-header-stat-capsule review-node-tint" aria-label="Review Mode — already completed">
            <BookmarkStarFill size={14} className="stat-vector-icon" />
            <span className="quiz-stat-count-string"><span className="stat-lbl-dim">REVIEW</span></span>
          </div>
        ) : (
          <div className="quiz-header-stat-capsule life-node-tint" aria-label={`You have ${chances} chances left`}>
            <ShieldShaded size={14} className="stat-vector-icon text-red-accent" />
            <span className="quiz-stat-count-string">{chances} <span className="stat-lbl-dim">LIVES</span></span>
          </div>
        )}

      </div>
    </div>
  );
}