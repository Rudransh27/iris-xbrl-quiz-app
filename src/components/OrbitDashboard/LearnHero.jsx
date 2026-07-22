// src/components/OrbitDashboard/LearnHero.jsx
// Plain, centered, big-bold heading — same pattern as the redesigned public
// Home hero (HomeHero.jsx) and the shared SectionHeader used on Progress/
// Ideas/Leaderboard, so the whole app reads as one consistent typographic
// language instead of a card/gradient banner. Same title/subtitle/stats text
// as before, just restyled.
import React from "react";
import { BookHalf, CheckCircleFill } from "react-bootstrap-icons";
import { PiShootingStarFill } from "react-icons/pi";
import "./LearnHero.css";

export default function LearnHero({ moduleCount = 0, inProgressCount = 0, plasmaEarned = 0 }) {
  return (
    <div className="learn-strip">
      <span className="learn-strip__eyebrow">Learn</span>
      <h1 className="learn-strip__title">Fuel Your Orbit</h1>
      <p className="learn-strip__subtitle">
        Modules build knowledge. Labs build practice. Complete missions to earn Lightyear and climb the ranks.
      </p>

      <div className="learn-strip__stats">
        <div className="learn-strip__stat learn-strip__stat--teal">
          <BookHalf size={13} />
          <span className="learn-strip__stat-num">{moduleCount}</span>
          <span className="learn-strip__stat-label">Modules</span>
        </div>
        <div className="learn-strip__stat learn-strip__stat--pink">
          <CheckCircleFill size={13} />
          <span className="learn-strip__stat-num">{inProgressCount}/{moduleCount}</span>
          <span className="learn-strip__stat-label">In Progress</span>
        </div>
        <div className="learn-strip__stat learn-strip__stat--lavender">
          <PiShootingStarFill size={13} />
          <span className="learn-strip__stat-num">{plasmaEarned.toLocaleString()}</span>
          <span className="learn-strip__stat-label">Lightyear</span>
        </div>
      </div>
    </div>
  );
}
