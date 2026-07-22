// src/components/ModuleCardEach.jsx
import React from "react";
import "./ModuleCardEach.css";
import { Terminal, CodeSquare, Activity, Globe2, PlayFill, CheckCircleFill } from "react-bootstrap-icons";

// Soft-rainbow pastel palette — position-cycled from parent
const PALETTE = [
  {
    bg:         "var(--pastel-modules)",
    border:     "var(--pastel-modules-border)",
    label:      "var(--pastel-modules-text)",
    accent:     "#8b5cf6",
    accentBg:   "rgba(139,92,246,0.09)",
    accentRing: "rgba(139,92,246,0.22)",
    bar:        "linear-gradient(90deg,#8b5cf6,#a78bfa)",
  },
  {
    bg:         "var(--pastel-reads)",
    border:     "var(--pastel-reads-border)",
    label:      "var(--pastel-reads-text)",
    accent:     "#0ea5e9",
    accentBg:   "rgba(14,165,233,0.09)",
    accentRing: "rgba(14,165,233,0.22)",
    bar:        "linear-gradient(90deg,#0ea5e9,#38bdf8)",
  },
  {
    bg:         "var(--pastel-pink)",
    border:     "var(--pastel-pink-border)",
    label:      "var(--pastel-pink-text)",
    accent:     "#db2777",
    accentBg:   "rgba(244,63,94,0.08)",
    accentRing: "rgba(219,39,119,0.22)",
    bar:        "linear-gradient(90deg,#db2777,#f472b6)",
  },
  {
    bg:         "var(--pastel-streak)",
    border:     "var(--pastel-streak-border)",
    label:      "var(--pastel-streak-text)",
    accent:     "#f59e0b",
    accentBg:   "rgba(245,158,11,0.09)",
    accentRing: "rgba(245,158,11,0.22)",
    bar:        "linear-gradient(90deg,#f59e0b,#fbbf24)",
  },
];

const getDepartmentIcon = (code) => {
  switch ((code || "").toLowerCase()) {
    case "ifile":  return <Terminal   size={14} />;
    case "ideal":  return <CodeSquare size={14} />;
    case "carbon": return <Activity   size={14} />;
    default:       return <Globe2     size={14} />;
  }
};

export default function ModuleCardEach({
  title,
  description,
  department,
  onClick,
  isButtonVisible,
  buttonText,
  onButtonClick,
  // progress props — optional, supplied by ModuleTrail when available
  done       = 0,
  total      = 0,
  pct        = 0,
  paletteIndex = 0,
}) {
  const deptCode  = department && typeof department === "object"
    ? (department.code  || "global")
    : (department || "global");
  const deptName  = department && typeof department === "object"
    ? (department.name  || "Global Track")
    : "Global Track";

  const p           = PALETTE[paletteIndex % PALETTE.length];
  const isCompleted = total > 0 && pct === 100;
  const isInProgress= pct > 0 && !isCompleted;
  const xpEarned    = done  * 10;
  const xpTotal     = total * 10;
  const safeTitle   = (title  || "Untitled Module").replace(/�/g, "").trim();
  const shortLabel  = safeTitle.length > 26 ? safeTitle.slice(0, 24) + "…" : safeTitle;

  return (
    <div
      className="mce-card"
      onClick={onClick}
      style={{
        background:    p.bg,
        border:        `1px solid ${p.border}`,
        borderRadius:  "16px",
        overflow:      "hidden",
        cursor:        "pointer",
        display:       "flex",
        flexDirection: "column",
        width:         "100%",
        boxSizing:     "border-box",
        transition:    "transform 0.18s ease, box-shadow 0.18s ease",
      }}
    >
      {/* Thin accent stripe */}
      <div style={{
        height:     "3px",
        background: isCompleted
          ? "linear-gradient(90deg,#db2777,#f472b6)"
          : isInProgress
          ? p.bar
          : "var(--orbit-border)",
        flexShrink: 0,
        transition: "background 0.35s ease",
      }} />

      {/* Body */}
      <div style={{
        padding:       "20px 24px",
        flex:          1,
        display:       "flex",
        flexDirection: "column",
        gap:           "11px",
      }}>

        {/* Row: dept icon + name · status badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            display:    "inline-flex",
            alignItems: "center",
            gap:        "5px",
            fontSize:   "9px",
            fontWeight: "800",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color:      p.label,
            opacity:    0.65,
          }}>
            {getDepartmentIcon(deptCode)}
            {deptName.toUpperCase()}
          </span>

          {total > 0 && (
            <span style={{
              fontSize:      "9px",
              fontWeight:    "800",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              color:         isCompleted ? "#db2777" : isInProgress ? p.accent : "var(--orbit-text-muted)",
              background:    isCompleted ? "rgba(244,63,94,0.08)" : isInProgress ? p.accentBg : "var(--orbit-surface)",
              border:        `1px solid ${isCompleted ? "rgba(219,39,119,0.22)" : isInProgress ? p.accentRing : "var(--orbit-border)"}`,
              borderRadius:  "6px",
              padding:       "2px 8px",
            }}>
              {isCompleted ? "Done" : isInProgress ? "In Progress" : "New"}
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{
          fontSize:        "15px",
          fontWeight:      "700",
          color:           "var(--orbit-text-heading)",
          lineHeight:      1.35,
          letterSpacing:   "-0.2px",
          overflow:        "hidden",
          display:         "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          {safeTitle}
        </div>

        {/* Description */}
        {description && (
          <div style={{
            fontSize:        "12px",
            fontWeight:      "400",
            color:           "var(--orbit-text-muted)",
            lineHeight:      1.5,
            overflow:        "hidden",
            display:         "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {description}
          </div>
        )}

        {/* Progress track — shown when data is available */}
        {total > 0 && (
          <div style={{ marginTop: "auto" }}>
            <div style={{
              fontSize:     "10.5px",
              fontWeight:   "600",
              color:        p.label,
              marginBottom: "5px",
              opacity:      0.82,
              whiteSpace:   "nowrap",
              overflow:     "hidden",
              textOverflow: "ellipsis",
            }}>
              {shortLabel}: {pct}% Complete{total > 0 ? ` — ${xpEarned}/${xpTotal} Lightyear Earned` : ""}
            </div>
            <div style={{
              height:       "6px",
              borderRadius: "10px",
              background:   "rgba(0,0,0,0.06)",
              overflow:     "hidden",
            }}>
              <div style={{
                height:       "100%",
                width:        `${pct}%`,
                borderRadius: "10px",
                background:   isCompleted ? "linear-gradient(90deg,#db2777,#f472b6)" : p.bar,
                transition:   "width 0.55s cubic-bezier(0.22,1,0.36,1)",
              }} />
            </div>
          </div>
        )}

        {/* CTA */}
        {isButtonVisible ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onButtonClick(); }}
            style={{
              width:          "100%",
              background:     p.accentBg,
              color:          p.accent,
              border:         `1px solid ${p.accentRing}`,
              borderRadius:   "10px",
              padding:        "9px 0",
              fontSize:       "12px",
              fontWeight:     "700",
              cursor:         "pointer",
              letterSpacing:  "0.2px",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            "5px",
            }}
          >
            {buttonText}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
            style={{
              width:          "100%",
              background:     isCompleted ? "rgba(244,63,94,0.08)" : "var(--orbit-brand-muted)",
              color:          isCompleted ? "#db2777"               : "var(--orbit-brand)",
              border:         `1px solid ${isCompleted ? "rgba(219,39,119,0.22)" : "var(--orbit-border-strong)"}`,
              borderRadius:   "10px",
              padding:        "9px 0",
              fontSize:       "12px",
              fontWeight:     "700",
              cursor:         "pointer",
              letterSpacing:  "0.2px",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            "5px",
            }}
          >
            {isCompleted  && <CheckCircleFill size={11} />}
            {isInProgress && <PlayFill        size={11} />}
            {isCompleted ? "Review Module" : isInProgress ? `Continue · ${pct}%` : "Start Learning →"}
          </button>
        )}

      </div>
    </div>
  );
}
