// src/components/OrbitDashboard/TagCard.jsx
import React from "react";
import { tagTheme } from "./tagTheme";
import "./TagCard.css";

// tag: { _id, name, description?, moduleCount?, pathCount? } — a small
// square tile: tinted icon, name, one meta line, and a large faint
// watermark of the icon in the corner that turns on hover. The description is the
// native tooltip so every tile is the same size. The per-tag icon/colour
// (tagTheme, indexed) keeps tags distinct.
export default function TagCard({ tag, index = 0, onClick }) {
  const theme = tagTheme(index);
  const moduleCount = typeof tag.moduleCount === "number" ? tag.moduleCount : null;
  const meta = moduleCount !== null ? `${moduleCount} module${moduleCount === 1 ? "" : "s"}` : "";

  return (
    <button
      type="button"
      className={`ui-card tagcard tagcard--${theme.tone}`}
      onClick={onClick}
      title={tag.description || tag.name}
    >
      {/* Oversized, faint copy of the icon — decoration only. */}
      <span className="tagcard__mark" aria-hidden="true"><theme.Icon /></span>
      <span className="tagcard__icon" aria-hidden="true">
        <theme.Icon size={18} />
      </span>
      {tag.pathCount > 1 && <span className="tagcard__paths ui-num">{tag.pathCount} paths</span>}
      <span className="tagcard__title ui-clamp-2">{tag.name}</span>
      {meta && <span className="tagcard__meta ui-num">{meta}</span>}
    </button>
  );
}
