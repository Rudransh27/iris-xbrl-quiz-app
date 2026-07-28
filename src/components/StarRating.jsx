// src/components/StarRating.jsx
import React, { useState } from 'react';
import { Star, StarFill, StarHalf } from 'react-bootstrap-icons';

// Two modes in one component so the learner submit form and every
// read-only review display (learner review list, admin review modal,
// Curriculum Map badge) all render stars identically.
//
// - interactive: click a star to set `value` (1-5); calls onChange.
// - display-only (default): renders `value` as filled/half/empty stars,
//   supports fractional averages (e.g. 4.3) via a half-star.
export default function StarRating({ value = 0, onChange, interactive = false, size = 16, color = '#ffbe0b' }) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = interactive && hoverValue > 0 ? hoverValue : value;

  return (
    <span
      className="d-inline-flex align-items-center"
      style={{ gap: 2 }}
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
            style={{
              color,
              cursor: interactive ? 'pointer' : 'default',
              lineHeight: 0,
            }}
          >
            <Icon size={size} />
          </span>
        );
      })}
    </span>
  );
}
