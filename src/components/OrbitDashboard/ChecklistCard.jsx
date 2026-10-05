// src/components/OrbitDashboard/ChecklistCard.jsx
import React from "react";
import { CheckLg, RocketTakeoffFill } from "react-bootstrap-icons";

// Items are status rows, not manual toggles: `done` is always derived from a
// real system event (see DashboardHome / DailyReadReader / IdeasAndRD).
// Clicking a row still navigates to that section — it just never marks the
// row done by itself. Each item also carries a `hint` describing what
// actually checks it off.
//
// The "module" slot (index 1) additionally carries `widgetModule`/`progress`/
// `isHotModule` and renders as a richer interactive active-progress widget
// instead of a plain checkbox row.
const ROW_TINT = { read: "mint", module: "pink", idea: "sky" };

export default function ChecklistCard({ items }) {
  const anyDone = items.some((item) => item.done);

  return (
    <div className="orbit-card orbit-checklist-card">
      <div className="orbit-card__head">
        <span className="ui-eyebrow">Daily missions</span>
        <h3 className="orbit-card__title">Knock, knock! What's your move today?</h3>
      </div>
      <div className="orbit-checklist ui-list">
        {items.map((item, index) => {
          const tint = ROW_TINT[item.key] || "mint";
          const statusBadge = (
            <span className={`orbit-checklist__status ui-badge ui-badge--sm ${item.done ? "ui-badge--success" : "ui-badge--outline"}`}>
              {item.done ? "Done" : "To do"}
            </span>
          );

          if (item.key === "module" && item.widgetModule) {
            return (
              <div
                key={item.key}
                className={`orbit-checklist__item orbit-checklist__item--${tint} orbit-checklist__item--module ${item.done ? "orbit-checklist__item--done" : ""} ui-list-item ui-list-item--interactive`}
                onClick={item.action}
              >
                <span className={`orbit-checklist__bullet ui-index ${item.done ? "orbit-checklist__bullet--done" : ""}`}>
                  {item.done ? <CheckLg size={12} /> : String(index + 1).padStart(2, "0")}
                </span>
                <div className="orbit-checklist__module-widget">
                  <div className="orbit-checklist__module-widget-top">
                    <p className={`orbit-checklist__label ${item.done ? "orbit-checklist__label--done" : ""}`}>
                      {item.isHotModule && <RocketTakeoffFill size={12} className="orbit-checklist__hot-icon" />}
                      {item.widgetModule.title}
                    </p>
                  </div>
                  <div className="orbit-checklist__module-progress-track ui-progress ui-progress--sm">
                    <div
                      className="orbit-checklist__module-progress-fill ui-progress__bar"
                      style={{ width: `${item.progress?.pct || 0}%` }}
                    />
                  </div>
                  <span className="orbit-checklist__hint">{item.hint}</span>
                </div>
                {statusBadge}
              </div>
            );
          }

          return (
            <div
              key={item.key}
              className={`orbit-checklist__item orbit-checklist__item--${tint} ${item.done ? "orbit-checklist__item--done" : ""} ui-list-item ui-list-item--interactive`}
              onClick={item.action}
            >
              <span className={`orbit-checklist__bullet ui-index ${item.done ? "orbit-checklist__bullet--done" : ""}`}>
                {item.done ? <CheckLg size={12} /> : String(index + 1).padStart(2, "0")}
              </span>
              <p className={`orbit-checklist__label ${item.done ? "orbit-checklist__label--done" : ""}`}>
                {item.label}
                {item.hint && <span className="orbit-checklist__hint">{item.hint}</span>}
              </p>
              {statusBadge}
            </div>
          );
        })}
      </div>
      <p className="orbit-checklist__footnote">
        {anyDone
          ? "Nice — today already counts toward your consistency streak! \u{1F680}"
          : "Complete any one of Today's Read, Module Progress, or an Idea Submission to keep your streak alive."}
      </p>
    </div>
  );
}
