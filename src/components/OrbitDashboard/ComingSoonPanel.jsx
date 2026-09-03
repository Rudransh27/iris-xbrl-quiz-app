// src/components/OrbitDashboard/ComingSoonPanel.jsx
// Generic centered "this section isn't built yet" placeholder — used by the
// Learn page's Playbooks tab today; any future not-yet-launched tab can
// reuse it instead of re-inventing an empty state.
import React from "react";

export default function ComingSoonPanel({ icon, title, description }) {
  return (
    <div className="orbit-coming-soon">
      <div className="orbit-coming-soon__icon">{icon}</div>
      <h3 className="orbit-coming-soon__title">{title}</h3>
      {description && <p className="orbit-coming-soon__desc">{description}</p>}
    </div>
  );
}
