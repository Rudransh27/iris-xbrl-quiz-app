// src/components/StarRating.jsx
import React, { useState } from 'react';
import { Star, StarFill, StarHalf } from 'react-bootstrap-icons';
import './StarRating.css';

// Two modes in one component so the learner submit form and every
// read-only review display (learner review list, admin review modal,
// Curriculum Map badge) all render stars identically.
//
// - interactive: click a star to set `value` (1-5); calls onChange.
// - display-only (default): renders `value` as filled/half/empty stars,
//   supports fractional averages (e.g. 4.3) via a half-star.
// `color` is optional — by default stars use the theme's amber token (StarRating.css).
export default function StarRating({ value = 0, onChange, interactive = false, size = 16, color }) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = interactive && hoverValue > 0 ? hoverValue : value;

  return (
    <span
      className={`star-rating${interactive ? ' star-rating--interactive' : ''}`}
      onMouseLeave={() => interactive && setHoverValue(0)}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const filled = displayValue >= starIndex;
        const half = !filled && displayValue >= starIndex - 0.5;
        const Icon = filled ? StarFill : half ? StarHalf : Star;

        return (
          <span
            key={starIndex}
            role={interactive ? 'button' : undefined}
            aria-label={interactive ? `Rate ${starIndex} star${starIndex > 1 ? 's' : ''}` : undefined}
            onClick={interactive ? () => onChange?.(starIndex) : undefined}
            onMouseEnter={interactive ? () => setHoverValue(starIndex) : undefined}
            className="star-rating__star"
            style={color ? { color } : undefined}
          >
            <Icon size={size} />
          </span>
        );
      })}
    </span>
  );
}
