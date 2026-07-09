// src/components/OrbitDashboard/ModuleLabCard.jsx
import React from "react";
import { BookHalf, ClockHistory, StarFill } from "react-bootstrap-icons";

const STATUS_CLASS = {
  "Not Started": "orbit-ml-card__status--notstarted",
  "In Progress": "orbit-ml-card__status--inprogress",
  Completed: "orbit-ml-card__status--completed",
  "Coming Soon": "orbit-ml-card__status--soon",
};

// card: { id, title, imageUrl, durationLabel, status, points, takeaway }
export default function ModuleLabCard({ card, onClick }) {
  const clickable = typeof onClick === "function";

  return (
    <div
      className={`orbit-ml-card ${clickable ? "orbit-ml-card--clickable" : ""}`}
      onClick={clickable ? onClick : undefined}
    >
      <div
        className="orbit-ml-card__thumb"
        style={card.imageUrl ? { backgroundImage: `url(${card.imageUrl})` } : undefined}
      >
        {!card.imageUrl && <BookHalf size={26} />}
      </div>
      <div className="orbit-ml-card__body">
        <span className={`orbit-ml-card__status ${STATUS_CLASS[card.status] || STATUS_CLASS["Not Started"]}`}>
          {card.status}
        </span>
        <h4 className="orbit-ml-card__title">{card.title}</h4>
        <div className="orbit-ml-card__meta-row">
          <span><ClockHistory size={11} /> {card.durationLabel}</span>
          <span><StarFill size={11} color="var(--amber-glow)" /> {card.points} pts</span>
        </div>
        <p className="orbit-ml-card__takeaway">
          <span className="orbit-ml-card__takeaway-label">Key Takeaway</span>
          {card.takeaway}
        </p>
      </div>
    </div>
  );
}
