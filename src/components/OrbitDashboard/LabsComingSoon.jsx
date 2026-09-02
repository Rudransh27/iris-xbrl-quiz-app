// src/components/OrbitDashboard/LabsComingSoon.jsx
// Extracted out of ModulesLabsSection — Labs is an app-wide announcement,
// not a per-tag thing, so it belongs once on the Learn landing page
// (CategorySelect), not repeated inside every individual tag's module list.
import React from "react";
import { Link } from "react-router-dom";
import { PencilFill, Lightbulb } from "react-bootstrap-icons";

// No standalone Lab entity exists in the backend yet, and the labs program
// itself hasn't launched — this is real, curated announcement copy (not
// placeholder filler), not a filterable data grid. Swap for a real
// api.getLabs() call once a Lab model/route ships and labs actually open.
const UPCOMING_LABS = [
  { id: "product-lab", dot: "mint", title: "Product Lab", cadence: "weekly", desc: "Use the product like a customer" },
  { id: "domain-lab", dot: "sky", title: "Domain Lab", cadence: "bi-weekly", desc: "Finance and AI fluency · guest-led sessions" },
  { id: "deal-lab", dot: "amber", title: "Deal Lab", cadence: "monthly", desc: "One deal deep-dived. Patterns extracted" },
  { id: "build-lab", dot: "coral", title: "Build Lab", cadence: "monthly", desc: "Half-day prototype sprints" },
];

export default function LabsComingSoon() {
  return (
    <div className="orbit-labs-soon">
      <div className="orbit-labs-banner">
        <PencilFill size={16} />
        <div>
          <strong>Labs Opening Soon...</strong>
          <p>Four labs, each does one thing ferociously well. No sign-ups yet — teams being formed.</p>
        </div>
      </div>

      <p className="orbit-labs-label">Upcoming</p>
      <div className="orbit-labs-list">
        {UPCOMING_LABS.map((lab) => (
          <div className="orbit-labs-row" key={lab.id}>
            <span className={`orbit-labs-dot orbit-labs-dot--${lab.dot}`} />
            <div className="orbit-labs-row__body">
              <h4>
                {lab.title} <span className="orbit-labs-row__cadence">· {lab.cadence}</span>
              </h4>
              <p>{lab.desc}</p>
            </div>
            <span className="orbit-labs-soon-pill">Soon</span>
          </div>
        ))}
      </div>

      <div className="orbit-labs-tip">
        <Lightbulb size={16} />
        <p>
          You can start suggesting topics in <Link to="/orbit/ideas">Ideas</Link> now. The most upvoted topic
          in each lab gets scheduled first.
        </p>
      </div>
    </div>
  );
}
