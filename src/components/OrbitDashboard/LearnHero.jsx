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
    <header className="ui-page-header learn-strip">
      <div className="ui-page-header__text">
        <span className="ui-eyebrow">Learn</span>
        <h1 className="ui-h1">Fuel Your Orbit</h1>
        <p className="ui-lead">
          Modules build knowledge. Labs build practice. Complete missions to earn Lightyears and climb the ranks.
        </p>
      </div>

      <div className="ui-page-header__actions learn-strip__stats">
        <span className="ui-chip learn-strip__stat">
          <BookHalf size={13} />
          <strong className="ui-num">{moduleCount}</strong>
          Modules
        </span>
        <span className="ui-chip learn-strip__stat">
          <CheckCircleFill size={13} />
          <strong className="ui-num">{inProgressCount}/{moduleCount}</strong>
          In Progress
        </span>
        <span className="ui-chip learn-strip__stat">
          <PiShootingStarFill size={13} />
          <strong className="ui-num">{plasmaEarned.toLocaleString()}</strong>
          Lightyears
        </span>
      </div>
    </header>
  );
}
