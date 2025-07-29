import React from "react";
import "./MovieTicketCard.css"; // Ensure this path is correct

export default function MovieTicketCard({
  image,
  title,
  status, // "locked", "unlocked", "current", "done"
  // background, // REMOVE THIS PROP - background will be handled by CSS variables
  onClick,
}) {
  return (
    <div
      className={`topic-card-horizontal ${status}`} // Renamed class for clarity
      // REMOVED: style={{ background: background || "#23283b" }}
      onClick={status === "locked" ? undefined : onClick}
      tabIndex={status === "locked" ? -1 : 0}
      aria-disabled={status === "locked"}
    >
      {/* Image Left (40%) */}
      <div className="topic-card-img-wrap"> {/* Renamed class */}
        <img src={image} alt={title} className="topic-card-img" /> {/* Renamed class */}
        {status === "locked" && (
          <div className="topic-card-overlay"> {/* Renamed class */}
            <span className="topic-card-overlay-lock" role="img" aria-label="locked">🔒</span> {/* Renamed class */}
          </div>
        )}
      </div>
      {/* Text Right (60%) */}
      <div className="topic-card-text"> {/* Renamed class */}
        <span className="topic-card-title">{title}</span> {/* Renamed class */}
      </div>
    </div>
  );
}