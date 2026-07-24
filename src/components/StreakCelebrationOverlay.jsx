// src/components/StreakCelebrationOverlay.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { motion, AnimatePresence } from "framer-motion";
import { BookHalf, TrophyFill, LightbulbFill, StarFill, XLg } from "react-bootstrap-icons";
import AuthContext from "../context/AuthContext";
import "./StreakCelebrationOverlay.css";

const ACTION_META = {
  daily_read:      { icon: BookHalf,      label: "Today's Read Complete" },
  module_progress: { icon: TrophyFill,    label: "Module Complete" },
  idea_submission: { icon: LightbulbFill, label: "Idea Submitted" },
};

const MOTIVATION_LINES = [
  "Consistency beats intensity — keep the streak alive!",
  "Small steps, big orbit. See you tomorrow!",
  "One day at a time — that's how streaks are built.",
  "You showed up today. That's the whole game.",
  "Momentum is a habit. You just fed yours.",
];

const AUTO_DISMISS_MS = 4000;
const STREAK_TICK_DELAY_MS = 600;

// Non-blocking — no full-screen backdrop, no click-catcher behind the card,
// so whatever the user was doing (reading, the quiz page, the ideas form)
// stays fully interactive underneath this.
export default function StreakCelebrationOverlay() {
  const { celebration, dismissCelebration } = useContext(AuthContext);
  const { width, height } = useWindowSize();
  const [showNewStreak, setShowNewStreak] = useState(false);

  const message = useMemo(() => {
    if (!celebration) return "";
    return MOTIVATION_LINES[Math.floor(Math.random() * MOTIVATION_LINES.length)];
  }, [celebration]);

  useEffect(() => {
    if (!celebration) return;
    setShowNewStreak(false);
    const tickTimer = setTimeout(() => setShowNewStreak(true), STREAK_TICK_DELAY_MS);
    const dismissTimer = setTimeout(() => dismissCelebration(), AUTO_DISMISS_MS);
    return () => {
      clearTimeout(tickTimer);
      clearTimeout(dismissTimer);
    };
  }, [celebration, dismissCelebration]);

  if (!celebration) return null;

  const meta = ACTION_META[celebration.actionType] || ACTION_META.module_progress;
  const Icon = meta.icon;
  const streakValue = showNewStreak ? celebration.newStreak : celebration.previousStreak;

  return (
    <>
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={160}
        gravity={0.15}
        colors={["#7c6ef7", "#ffbe0b", "#58cc02", "#ff006e"]}
        className="streak-celebration-confetti"
      />
      <div className="streak-celebration-card" role="status">
        <button
          type="button"
          className="streak-celebration-close"
          onClick={dismissCelebration}
          aria-label="Dismiss"
        >
          <XLg size={12} />
        </button>

        <div className="streak-celebration-icon-wrap">
          <Icon size={22} />
        </div>

        <div className="streak-celebration-label">{meta.label}</div>

        <div className="streak-celebration-points">
          <StarFill size={13} />
          <span>+{celebration.points} Lightyear</span>
        </div>

        <div className="streak-celebration-streak-row">
          <span className="streak-celebration-streak-caption">Streak</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={streakValue}
              className="streak-celebration-streak-num"
              initial={{ scale: 0.5, opacity: 0, y: -6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {streakValue}
            </motion.span>
          </AnimatePresence>
        </div>

        <p className="streak-celebration-message">{message}</p>
      </div>
    </>
  );
}
