// src/components/OrbitDashboard/RingedPlanetIcon.jsx
// A small ringed-planet glyph (react-bootstrap-icons has no Saturn/planet-
// with-rings icon) — drawn to match that library's conventions so it drops
// in anywhere a bootstrap-icon would go: `size`/`color` props, monochrome
// `currentColor` fill/stroke (recolorable via CSS, unlike an emoji).
import React from "react";

export default function RingedPlanetIcon({ size = 16, color = "currentColor", className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="7" cy="8" r="3.6" fill={color} />
      <ellipse
        cx="8"
        cy="8.6"
        rx="7"
        ry="2.1"
        transform="rotate(-18 8 8.6)"
        stroke={color}
        strokeWidth="1.1"
      />
    </svg>
  );
}
