// src/components/OrbitDashboard/SectionHeader.jsx
// Shared plain-canvas page heading (icon + big bold title + muted subtitle,
// no card/gradient) used at the top of Progress, Ideas & R&D, and
// Leaderboard — the same typographic language as the Home hero and the
// Learn page heading, so every section starts with a consistent, clean title
// instead of some pages having no heading at all.
import React from "react";
import "./SectionHeader.css";

export default function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="orbit-section-header">
      {Icon && (
        <span className="orbit-section-header__icon">
          <Icon size={20} />
        </span>
      )}
      <div>
        <h1 className="orbit-section-header__title">{title}</h1>
        {subtitle && <p className="orbit-section-header__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
