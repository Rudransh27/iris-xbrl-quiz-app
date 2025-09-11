// src/components/ModuleCardEach.jsx

import React, { useState, useEffect } from "react";
import "./ModuleCardEach.css";

// Array of cute and diverse smilies to be displayed when an image is missing
const smilies = [
  "(˘▾˘)",
  "ʕ•ᴥ•ʔ",
  "(◕‿◕) ",
  "(✿◠‿◠)",
  "(o˘◡˘o)",
  "^o,o^"
];

export default function ModuleCardEach({
  title,
  description,
  imageUrl,
  department,
  onClick,
  isButtonVisible,
  buttonText,
  onButtonClick,
}) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    // Check if the imageUrl is an empty string or null
    if (!imageUrl || imageUrl.trim() === "") {
      setImageLoadFailed(true);
    }
  }, [imageUrl]);

  const handleImageError = () => {
    setImageLoadFailed(true);
  };

  // Function to get a random smiley
  const getRandomSmiley = () => {
    const randomIndex = Math.floor(Math.random() * smilies.length);
    return smilies[randomIndex];
  };

  return (
    <div className={`module-card ${department.toLowerCase()}`} onClick={onClick}>
      <div className="module-card__image-container">
        {imageLoadFailed ? (
          <div className="module-card__no-image-overlay">
            <span>{getRandomSmiley()}</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={title}
            className="module-card__image"
            onError={handleImageError}
          />
        )}
      </div>
      <div className="module-card__content">
        <span className={`module-card__badge ${department.toLowerCase()}`}>{department}</span>
        <h3 className="module-card__title">{title}</h3>
        <p className="module-card__description">{description}</p>
        {isButtonVisible && (
          <button className="module-card__button" onClick={onButtonClick}>
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}