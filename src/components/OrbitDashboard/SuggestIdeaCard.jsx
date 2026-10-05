import React from "react";
import { LightbulbFill, StarFill, ArrowRight } from "react-bootstrap-icons";

export default function SuggestIdeaCard({ onClick }) {
  return (
    <div className="orbit-idea" onClick={onClick} role="button" tabIndex={0}>
      <div className="orbit-idea__head">
        <span className="orbit-idea__bulb" aria-hidden="true">
          <LightbulbFill size={18} />
        </span>
        <div className="orbit-idea__heading">
          <span className="ui-eyebrow orbit-idea__eyebrow">Ideas</span>
          <h3 className="orbit-idea__title">Suggest Your Idea</h3>
        </div>
      </div>

      <p className="orbit-idea__text">
        Got something lingering in your mind? Drop it here — we're listening.
      </p>

      <div className="orbit-idea__foot">
        <span className="orbit-idea__reward">
          <StarFill size={10} /> Earns Lightyears
        </span>
        <button type="button" className="orbit-idea__cta ui-btn ui-btn--sm" onClick={onClick}>
          Go to Idea Submission <ArrowRight size={13} />
        </button>
      </div>

      <LightbulbFill className="orbit-idea__watermark" size={130} aria-hidden="true" />
    </div>
  );
}
