// src/components/TopicCard.jsx

import React, { useState, useEffect } from "react";
import "./TopicCard.css";

// Array of cute and diverse smilies
const smilies = [
  "ʕ•ᴥ•ʔ",
  "(˃ᴗ˂)",
  "(˘▾˘)",
  "ʕ•ᴥ•ʔ",
  "(◕‿◕) ",
  "(✿◠‿◠)",
  "(o˘◡˘o)",
  "^o,o^"
];

export default function TopicCard({
  image,
  title,
  description,
  status,
  onClick, // This prop is used for navigation
}) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    if (!image || image.trim() === "") {
      setImageLoadFailed(true);
    }
  }, [image]);

  const handleImageError = () => {
    setImageLoadFailed(true);
  };

  const getRandomSmiley = () => {
    const randomIndex = Math.floor(Math.random() * smilies.length);
    return smilies[randomIndex];
  };

  return (
    <div
      className={`topic-card-horizontal ${status}`}
      // Only call the onClick prop if the card is not locked
      onClick={status === "locked" ? undefined : onClick}
      tabIndex={status === "locked" ? -1 : 0}
      aria-disabled={status === "locked"}
      role={status === "locked" ? "button" : undefined}
    >
      <div className="topic-card-img-wrap">
        {imageLoadFailed ? (
          <div className="topic-card-img-placeholder">
            <span>{getRandomSmiley()}</span>
          </div>
        ) : (
          <img
            src={image}
            alt={title}
            className="topic-card-img"
            onError={handleImageError}
          />
        )}
        {status === "locked" && (
          <div className="topic-card-overlay">
            <span className="topic-card-overlay-lock" role="img" aria-label="locked">🔒</span>
          </div>
        )}
      </div>
      <div className="topic-card-text">
        <h3 className="topic-card-title">{title}</h3>
        <p className="topic-card-description">{description}</p>
      </div>
    </div>
  );
}