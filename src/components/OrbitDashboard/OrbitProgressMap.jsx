// src/components/OrbitDashboard/OrbitProgressMap.jsx
import React, { useMemo } from "react";
import { LockFill, LightbulbFill, RocketTakeoffFill, CheckLg } from "react-bootstrap-icons";
import "./OrbitProgressMap.css";

// Total plasma to fully clear all three orbits and reach the Knowledge Core.
// Split into even thirds across the three orbit transitions.
const ORBIT_TARGET = 10000;
const ORBIT_STEP = ORBIT_TARGET / 3;

// Each orbit gets its own hue from the dashboard's pastel-rainbow accent
// set (index.css --orbit-rose/mint/lavender etc.) — same family used by the
// Home dashboard's calendar/checklist/puzzle, so the orbit map reads as
// part of the same redesigned visual system. Raw hex (not var()) since SVG
// stroke/fill attribute support for CSS custom properties is inconsistent
// across browsers, and these particular tokens are identical in both
// themes anyway (no theme-conditional value to lose by inlining them).
// trackRgba is the same hue as the ring itself at low opacity — not a
// generic neutral gray — so the "empty" part of every ring stays visibly
// readable against both the light and dark canvas (a near-white/near-black
// neutral token washed out completely in light mode; a tinted version of the
// ring's own color never does).
const ORBIT_DEFS = [
  {
    key: "orbit3",
    ordinal: 3,
    label: "Orbit 3",
    name: "Practitioner",
    ceil: ORBIT_STEP,
    r: 96,
    gradId: "opmGradRose",
    stops: ["#ffb3c7", "#ff9ecf"],
    solid: "#ff9ecf",
    trackRgba: "rgba(255, 158, 207, 0.18)",
    desc: "Master the present — what IRIS does, who we compete with, how the market works.",
  },
  {
    key: "orbit2",
    ordinal: 2,
    label: "Orbit 2",
    name: "Strategist",
    ceil: ORBIT_STEP * 2,
    r: 66,
    gradId: "opmGradMint",
    stops: ["#a8e6cf", "#8fe0d8"],
    solid: "#8fe0d8",
    trackRgba: "rgba(143, 224, 216, 0.18)",
    desc: "See the gaps. Shape what comes next. Competitive depth, deal patterns, market white space.",
  },
  {
    key: "orbit1",
    ordinal: 1,
    label: "Orbit 1",
    name: "Architect",
    ceil: ORBIT_TARGET,
    r: 36,
    gradId: "opmGradLavender",
    stops: ["#c9b8ff", "#a9d6ff"],
    solid: "#a9d6ff",
    trackRgba: "rgba(169, 214, 255, 0.18)",
    desc: "Build what isn't yet. Agentic AI, white-space scans, product specs that go to leadership.",
  },
];

function pointOnCircle(cx, cy, r, pct) {
  const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export default function OrbitProgressMap({ xp = 0 }) {
  const { orbits, activeIndex, reachedCore, plasmaToNext, nextLabel, activeOrbit } = useMemo(() => {
    const clamped = Math.max(0, xp);
    let activeIdx = ORBIT_DEFS.findIndex((o) => clamped < o.ceil);
    const reached = activeIdx === -1;
    if (reached) activeIdx = ORBIT_DEFS.length - 1;

    const computed = ORBIT_DEFS.map((o, i) => {
      const floor = i === 0 ? 0 : ORBIT_DEFS[i - 1].ceil;
      let pct;
      let status;
      if (reached || i < activeIdx) {
        pct = 100;
        status = "complete";
      } else if (i > activeIdx) {
        pct = 0;
        status = "locked";
      } else {
        pct = Math.round(((clamped - floor) / (o.ceil - floor)) * 100);
        status = "active";
      }
      return { ...o, floor, pct, status };
    });

    const active = ORBIT_DEFS[activeIdx];
    const toNext = reached ? 0 : Math.max(0, Math.ceil(active.ceil - clamped));
    const next = reached
      ? null
      : activeIdx === ORBIT_DEFS.length - 1
      ? "the Knowledge Core"
      : `${ORBIT_DEFS[activeIdx + 1].label} · ${ORBIT_DEFS[activeIdx + 1].name}`;

    return {
      orbits: computed,
      activeIndex: activeIdx,
      reachedCore: reached,
      plasmaToNext: toNext,
      nextLabel: next,
      activeOrbit: computed[activeIdx],
    };
  }, [xp]);

  const marker = pointOnCircle(120, 120, activeOrbit.r, activeOrbit.pct);

  return (
    <div className="opm-wrap">
      <div className="opm-top">
        <div>
          <div className="opm-title">Your orbit map</div>
          <div className="opm-sub">Three orbits. You start at the edge, move toward the knowledge core.</div>
        </div>
        <div className="opm-plasma-pill">
          <RocketTakeoffFill size={12} /> {Math.round(xp).toLocaleString()} Plasma
        </div>
      </div>

      <div className="opm-you-badge">
        {reachedCore
          ? "You've reached the Knowledge Core"
          : `You are on ${activeOrbit.label} · ${activeOrbit.name}`}
      </div>

      <div className="opm-body">
        <div className="opm-visual">
          <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
            <defs>
              {ORBIT_DEFS.map((o) => (
                <linearGradient key={o.gradId} id={o.gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={o.stops[0]} />
                  <stop offset="100%" stopColor={o.stops[1]} />
                </linearGradient>
              ))}
            </defs>

            <circle className="opm-star" cx="3" cy="8" r="1" opacity="0.3" />
            <circle className="opm-star" cx="220" cy="20" r="0.8" opacity="0.2" />
            <circle className="opm-star" cx="18" cy="228" r="1" opacity="0.25" />
            <circle className="opm-star" cx="230" cy="200" r="0.7" opacity="0.2" />
            <circle className="opm-star" cx="60" cy="8" r="0.6" opacity="0.15" />
            <circle className="opm-star" cx="215" cy="230" r="0.8" opacity="0.2" />
            <circle className="opm-star" cx="6" cy="120" r="0.5" opacity="0.15" />

            {orbits.map((o) => {
              const circ = 2 * Math.PI * o.r;
              const offset = circ - (o.pct / 100) * circ;
              return (
                <g key={o.key}>
                  <circle cx="120" cy="120" r={o.r} className="opm-ring-track" stroke={o.trackRgba} />
                  {o.pct > 0 && (
                    <circle
                      cx="120"
                      cy="120"
                      r={o.r}
                      className="opm-ring-fill"
                      stroke={`url(#${o.gradId})`}
                      strokeDasharray={`${circ} ${circ}`}
                      strokeDashoffset={offset}
                      transform="rotate(-90 120 120)"
                    />
                  )}
                </g>
              );
            })}

            <g style={{ transform: `translate(${marker.x}px, ${marker.y}px)`, transformBox: "fill-box" }}>
              <circle r="10" className="opm-marker-halo" fill={activeOrbit.solid} />
              <circle r="5" className="opm-marker-dot" />
            </g>
          </svg>

          <div className="opm-center-readout">
            {reachedCore ? (
              <>
                <LightbulbFill size={22} className="opm-center-icon opm-center-icon--reached" />
                <div className="opm-center-caption">Core reached</div>
              </>
            ) : (
              <>
                <div className="opm-center-pct" style={{ color: activeOrbit.solid }}>{activeOrbit.pct}%</div>
                <div className="opm-center-caption">Orbit {activeOrbit.ordinal}</div>
              </>
            )}
          </div>
        </div>

        <div className="opm-belts">
          {orbits.map((o, i) => {
            const distance = i - activeIndex;
            const dimClass =
              o.status === "locked" ? (distance >= 2 ? "opm-belt--locked2" : "opm-belt--locked") : "";
            return (
              <div
                key={o.key}
                className={`opm-belt opm-belt--${o.status} ${dimClass}`}
                style={{ "--opm-accent": o.solid }}
              >
                <div className="opm-belt-header">
                  <div className="opm-belt-name">
                    <span className="opm-belt-badge">{o.ordinal}</span>
                    {o.label} · {o.name}
                  </div>
                  {o.status === "active" && <div className="opm-belt-tag opm-belt-tag--active">Your orbit</div>}
                  {o.status === "complete" && (
                    <div className="opm-belt-tag opm-belt-tag--complete"><CheckLg size={10} /> Cleared</div>
                  )}
                  {o.status === "locked" && (
                    <div className="opm-belt-tag opm-belt-tag--locked"><LockFill size={9} /> Locked</div>
                  )}
                </div>
                <div className="opm-belt-desc">{o.desc}</div>
                <div className="opm-progress-track">
                  <div
                    className="opm-progress-fill"
                    style={{ width: `${o.pct}%`, background: `linear-gradient(90deg, ${o.stops[0]}, ${o.stops[1]})` }}
                  />
                </div>
                <div className="opm-belt-meta">
                  {o.status === "complete" && `${Math.round(o.ceil - o.floor).toLocaleString()} plasma earned · orbit cleared`}
                  {o.status === "active" &&
                    `${Math.round(Math.max(0, xp - o.floor)).toLocaleString()} / ${Math.round(o.ceil - o.floor).toLocaleString()} plasma`}
                  {o.status === "locked" && `Unlocks when ${ORBIT_DEFS[i - 1].label} is cleared`}
                </div>
              </div>
            );
          })}

          <div className={`opm-core-callout ${reachedCore ? "opm-core-callout--reached" : ""}`}>
            <div className="opm-core-icon"><LightbulbFill size={16} /></div>
            <div>
              <div className="opm-core-title">Knowledge core</div>
              <div className="opm-core-desc">
                {reachedCore
                  ? "Reached — you've mastered every orbit."
                  : "The center all three orbits move toward. Reach it when all orbits are cleared."}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="opm-footer">
        {reachedCore
          ? "All orbits cleared — you're at the Knowledge Core."
          : `${plasmaToNext.toLocaleString()} plasma to ${nextLabel}`}
      </div>
    </div>
  );
}
