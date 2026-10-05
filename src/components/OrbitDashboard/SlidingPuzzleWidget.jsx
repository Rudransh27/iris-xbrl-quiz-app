// src/components/OrbitDashboard/SlidingPuzzleWidget.jsx
import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { ArrowClockwise } from "react-bootstrap-icons";
import { useThemeTokens, CHART_SERIES } from "../ui";
import "./SlidingPuzzleWidget.css";

const GRID_SIZE = 3;
const BLANK_ID = GRID_SIZE * GRID_SIZE - 1;
const WIDGET_SIZE = 210; // px — compact footprint, divides evenly into 3 tiles

// Per-tile modifier class — kept for markup stability; the stylesheet renders
// every tile in the single Orbit accent tint (numbers carry the puzzle).
const ACCENTS = ["rose", "pink", "mint", "teal", "sky", "lavender", "lilac"];

const solvedOrder = () => Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);

const isAdjacent = (aIndex, bIndex) => {
  const aRow = Math.floor(aIndex / GRID_SIZE), aCol = aIndex % GRID_SIZE;
  const bRow = Math.floor(bIndex / GRID_SIZE), bCol = bIndex % GRID_SIZE;
  return Math.abs(aRow - bRow) + Math.abs(aCol - bCol) === 1;
};

// Scrambles by walking the blank tile through random valid slides from the
// solved state — guarantees the result is always solvable (a fully random
// shuffle of a sliding puzzle is only solvable half the time).
const scramble = (steps = 80) => {
  const order = solvedOrder();
  let blankPos = order.indexOf(BLANK_ID);
  for (let i = 0; i < steps; i++) {
    const neighbors = [];
    for (let pos = 0; pos < order.length; pos++) {
      if (isAdjacent(pos, blankPos)) neighbors.push(pos);
    }
    const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];
    [order[blankPos], order[swapWith]] = [order[swapWith], order[blankPos]];
    blankPos = swapWith;
  }
  return order;
};

export default function SlidingPuzzleWidget() {
  const [order, setOrder] = useState(() => scramble());
  const [solved, setSolved] = useState(false);
  const [moves, setMoves] = useState(0);
  // Theme-resolved category colours for the confetti burst (canvas needs strings).
  const tokens = useThemeTokens();
  const confettiColors = CHART_SERIES.map((name) => tokens[name]).filter(Boolean);

  const handleTileClick = useCallback(
    (clickedPos) => {
      if (solved) return;
      setOrder((prev) => {
        const blankPos = prev.indexOf(BLANK_ID);
        if (!isAdjacent(clickedPos, blankPos)) return prev;
        const next = [...prev];
        [next[blankPos], next[clickedPos]] = [next[clickedPos], next[blankPos]];
        setMoves((m) => m + 1);
        if (next.every((id, i) => id === i)) setSolved(true);
        return next;
      });
    },
    [solved]
  );

  const handleReshuffle = () => {
    setOrder(scramble());
    setSolved(false);
    setMoves(0);
  };

  return (
    <div className={`orbit-puzzle ${solved ? "orbit-puzzle--solved" : ""}`}>
      <div className="orbit-puzzle__header">
        <div className="orbit-card__head orbit-puzzle__heading">
          <span className="ui-eyebrow">Unwind</span>
          <h3 className="orbit-card__title">Daily Break Room</h3>
        </div>
        {solved ? (
          <span className="orbit-puzzle__solved-badge">Solved! ✨</span>
        ) : (
          <button className="orbit-puzzle__reshuffle" onClick={handleReshuffle} title="Reshuffle">
            <ArrowClockwise size={14} />
          </button>
        )}
      </div>
      <span className="orbit-puzzle__moves">Moves: {moves}</span>

      <div className="orbit-puzzle__grid">
        {order.map((id, pos) =>
          id === BLANK_ID ? (
            <div key={id} className="orbit-puzzle__blank" />
          ) : (
            <motion.div
              key={id}
              layout
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={`orbit-puzzle__tile orbit-puzzle__tile--${ACCENTS[id % ACCENTS.length]}`}
              onClick={() => handleTileClick(pos)}
            >
              {id + 1}
            </motion.div>
          )
        )}

        {solved && (
          <Confetti
            width={WIDGET_SIZE}
            height={WIDGET_SIZE}
            numberOfPieces={60}
            recycle={false}
            gravity={0.25}
            colors={confettiColors.length ? confettiColors : undefined}
          />
        )}
      </div>

      <div className="orbit-puzzle__caption">Align the constellation · order 1–8</div>
    </div>
  );
}
