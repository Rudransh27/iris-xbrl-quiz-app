// src/components/OrbitDashboard/SuggestIdeaCard.jsx
import React from "react";
import { Lightbulb, ArrowRight } from "react-bootstrap-icons";

export default function SuggestIdeaCard({ onClick }) {
  return (
    <div className="orbit-idea-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="orbit-idea-card__icon">
        <Lightbulb size={20} />
      </div>
      <h3 className="orbit-idea-card__title">Suggest Your Idea</h3>
      <p className="orbit-idea-card__subtext">
        Got something lingering in your mind? Drop it here — we're listening.
      </p>
      <span className="orbit-idea-card__cta">
        Go to Idea Submission <ArrowRight size={13} />
      </span>
    </div>
  );
}
