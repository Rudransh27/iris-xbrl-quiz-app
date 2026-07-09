// src/components/OrbitDashboard/puzzleArtPool.js
// Daily-rotating pool of puzzle artwork. Ships with placeholder gradient art
// (no licensing risk) — swap the files under src/assets/puzzle-art/ for real
// anime art anytime; the rotation/slicing logic in SlidingPuzzleWidget never
// needs to change since it only ever indexes into this array.
import artDay0 from "../../assets/puzzle-art/day-0.svg";
import artDay1 from "../../assets/puzzle-art/day-1.svg";
import artDay2 from "../../assets/puzzle-art/day-2.svg";
import artDay3 from "../../assets/puzzle-art/day-3.svg";
import artDay4 from "../../assets/puzzle-art/day-4.svg";

export const PUZZLE_ART = [artDay0, artDay1, artDay2, artDay3, artDay4];

// Stable per-calendar-day index — no localStorage needed, just wall-clock math.
export const getTodaysArt = () => {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return PUZZLE_ART[dayIndex % PUZZLE_ART.length];
};
