// src/components/OrbitDashboard/SuggestIdeaCard.jsx
import React from "react";
import { LightbulbFill, StarFill, ArrowRight } from "react-bootstrap-icons";

export default function SuggestIdeaCard({ onClick }) {
  return (
    <div className="orbit-idea-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="orbit-idea-card__glow" aria-hidden="true" />

      <div className="orbit-idea-card__top">
        <div className="orbit-idea-card__icon">
          <LightbulbFill size={22} />
        </div>
        <span className="orbit-idea-card__badge">
          <StarFill size={10} /> Earns Lightyear
        </span>
      </div>

      <h3 className="orbit-idea-card__title">Suggest Your Idea</h3>
      <p className="orbit-idea-card__subtext">
        Got something lingering in your mind? Drop it here — we're listening.
      </p>

      <button type="button" className="orbit-idea-card__cta" onClick={onClick}>
        Go to Idea Submission <ArrowRight size={13} />
      </button>
    </div>
  );
}
