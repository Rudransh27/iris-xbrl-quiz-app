// src/pages/ModuleJourney.jsx
// The journey view. Two mounts:
//   /orbit/paths/:pathId — a Path (Learn → Tag → Path): its modules in the
//       Path's own order, lock state from the server, plus Pre-check / Post-
//       check stops when the Path has an assessment.
//   /orbit/tags/:categoryId/region/:regionId — the legacy Tag -> Region view
//       ("all" = no region filter), used until Paths are published.
// Renders
// the same real navigation/lock/progress logic ModuleTrail.jsx uses, just
// laid out as a generated wavy path with numbered nodes instead of a grid —
// the layout scales to any module count, unlike the mockup's fixed 3-node
// example.
import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe2, LockFill, Check2, Rocket } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import api from "../admin/services/api";
import OrbitFooter from "../components/OrbitDashboard/OrbitFooter";
import { setCurrentModule } from "../components/OrbitDashboard/currentModuleStorage";
import { orbitSfx } from "../components/OrbitDashboard/orbitSfx";
import { buildTagSuffix } from "../utils/tagReturnPath";
import AuthContext from "../context/AuthContext";
import "../components/OrbitDashboard/OrbitDashboard.css";
import "../components/OrbitDashboard/TagCard.css";
import "../components/OrbitDashboard/JourneyFlow.css";
import "../components/OrbitDashboard/PathFlow.css";

// ---- Generated snake-curve path geometry --------------------------------
// A sine wave banks 1-2 nodes at a time near each crest/trough (where it's
// changing slowest) and crosses center fastest at the zero points — that's
// what actually reads as a winding "snake" path rather than a straight line
// with a wobble, so long as the amplitude is generous enough to be obvious.
const VIEW_WIDTH = 380;
const CENTER_X = VIEW_WIDTH / 2;
const AMPLITUDE = 118;
const NODE_GAP_Y = 156;
const TOP_PAD = 54;
const NODE_R = 33;
// The bottom margin has to be bigger than TOP_PAD: a node's label can wrap to
// 2-3 lines, and that text sits below the node with nothing after it to push
// the canvas taller (overflow:visible content doesn't grow its box for layout
// purposes) — a symmetric top/bottom pad left the last label overflowing past
// the canvas's own bottom edge, straight into the footer that follows it.
const BOTTOM_PAD = 132;

function buildLayout(count) {
  const nodes = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: CENTER_X + AMPLITUDE * Math.sin(i * 1.05),
      y: TOP_PAD + i * NODE_GAP_Y,
    });
  }
  const segments = nodes.slice(1).map((n, idx) => {
    const prev = nodes[idx];
    const midY = (prev.y + n.y) / 2;
    return { d: `M ${prev.x} ${prev.y} C ${prev.x} ${midY}, ${n.x} ${midY}, ${n.x} ${n.y}` };
  });
  const height = TOP_PAD + BOTTOM_PAD + (count > 0 ? (count - 1) * NODE_GAP_Y : 0);
  return { nodes, segments, height };
}

// Deterministic PRNG (no Math.random) so the starfield doesn't reshuffle on
// every re-render/progress update — same module count always draws the same sky.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Full-bleed decorative starfield, sized to the path's actual height so stars
// spread across however long the journey ends up being, not just a fixed strip.
function buildStars(height) {
  const rand = mulberry32(1337);
  const count = Math.max(18, Math.min(46, Math.round(height / 22)));
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: rand() * 100,
    top: rand() * 100,
    size: 1.6 + rand() * 2.4,
    delay: rand() * 5,
    duration: 2.6 + rand() * 2.6,
  }));
}

export default function ModuleJourney() {
  const { categoryId, regionId, pathId } = useParams();
  const isPathMode = !!pathId;
  const isAllRegions = regionId === "all";
  const [pathData, setPathData] = useState(null);
  const [category, setCategory] = useState(null);
  const [region, setRegion] = useState(null);
  const [modules, setModules] = useState([]);
  const [correctCardIds, setCorrectCardIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [burstIds, setBurstIds] = useState(() => new Set());
  const [shakeId, setShakeId] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const prevPctRef = useRef(null);

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (isPathMode) return;
    api.getCategory(categoryId).then((res) => setCategory(res?.data || null)).catch(() => setCategory(null));
  }, [categoryId, isPathMode]);

  useEffect(() => {
    if (isPathMode) return;
    if (isAllRegions) { setRegion(null); return; }
    api.getRegion(regionId).then((res) => setRegion(res?.data || null)).catch(() => setRegion(null));
  }, [regionId, isAllRegions, isPathMode]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [modulesData, progressData] = await Promise.all([
          isPathMode
            ? api.getLearnPath(pathId)
            : api.getWorkspaceCurriculum(categoryId, isAllRegions ? undefined : regionId),
          api.getUserProgress().catch(() => null),
        ]);
        if (isPathMode) {
          const data = modulesData?.data || null;
          setPathData(data);
          setCategory(data?.category || null);
          setModules(Array.isArray(data?.modules) ? data.modules : []);
        } else {
          const mods = modulesData?.success ? modulesData.data : modulesData;
          setModules(Array.isArray(mods) ? mods : []);
        }

        if (progressData) {
          const pData = progressData?.data ?? progressData;
          const ids = Array.isArray(pData?.correctCardIds) ? pData.correctCardIds : [];
          setCorrectCardIds(ids.map((id) => id.toString()));
        }
      } catch (err) {
        console.error("ModuleJourney fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryId, regionId, isAllRegions, isPathMode, pathId]);

  // Same live-progress DOM event ModuleTrail listens to — keeps node state
  // fresh right after finishing a card without a manual refresh.
  useEffect(() => {
    const handleLiveProgress = async () => {
      try {
        if (isPathMode) {
          const fresh = await api.getLearnPath(pathId).catch(() => null);
          if (fresh?.data) { setPathData(fresh.data); setModules(fresh.data.modules || []); }
        }
        const progressData = await api.getUserProgress();
        const pData = progressData?.data ?? progressData;
        const ids = Array.isArray(pData?.correctCardIds) ? pData.correctCardIds : [];
        setCorrectCardIds(ids.map((id) => id.toString()));
      } catch (_) {}
    };
    window.addEventListener("orbit:module-progress", handleLiveProgress);
    return () => window.removeEventListener("orbit:module-progress", handleLiveProgress);
  }, [isPathMode, pathId]);

  const getModuleProgress = (mod) => {
    const total = mod.totalCardCount || 0;
    const allIds = (mod.allCardIds || []).map((id) => id.toString());
    const done = allIds.length > 0 ? allIds.filter((id) => correctCardIds.includes(id)).length : 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  };

  const handleCheckClick = (card) => {
    const a = pathData?.assessment || {};
    if (card.locked) {
      orbitSfx.locked(); setShakeId(card.module._id);
      Swal.fire({ toast: true, position: "top-end", icon: "info", showConfirmButton: false, timer: 2400,
        title: "Post-check locked", text: "Finish every module in this path first." });
      return;
    }
    if (card.kind === "pre" && a.noBaseline) {
      Swal.fire({ toast: true, position: "top-end", icon: "info", showConfirmButton: false, timer: 2600,
        title: "Pre-check skipped", text: "You had already started this path before the check was added." });
      return;
    }
    orbitSfx.select();
    navigate(`/orbit/paths/${pathId}/check/${card.kind}`);
  };

  const handleModuleClick = (module) => {
    if (module.locked) {
      orbitSfx.locked(); setShakeId(module._id);
      if (isPathMode && pathData?.assessment?.preRequired) {
        Swal.fire({ toast: true, position: "top-end", icon: "info", showConfirmButton: false, timer: 2400,
          title: "Start with the Pre-check", text: "It records your starting point before the first module." });
      }
      return;
    } // real gate is server-side; this is defense in depth
    orbitSfx.select();
    setCurrentModule(user?._id, { moduleId: module._id });
    // Carries the region alongside the tag so finishing/exiting this module
    // returns to THIS exact journey path, not just the tag's region-picker
    // one level up — see src/utils/tagReturnPath.js.
    const tagSuffix = isPathMode ? buildTagSuffix(null, null, pathId) : buildTagSuffix(categoryId, regionId);
    if (module.hasTopics === false) navigate(`/quiz/${module._id}/undefined${tagSuffix}`);
    else navigate(`/orbit/modules/${module._id}/topics${tagSuffix}`);
  };

  useEffect(() => {
    if (!shakeId) return;
    const t = setTimeout(() => setShakeId(null), 420);
    return () => clearTimeout(t);
  }, [shakeId]);

  const cards = useMemo(() => {
    const moduleCards = modules.map((mod) => {
      let { pct } = getModuleProgress(mod);
      // In a Path the server's completion flag (the same one the lock uses)
      // decides "done"; correct-answer % only fills the ring until then.
      if (isPathMode) pct = mod.completed ? 100 : Math.min(pct, 99);
      const status = pct === 100 ? "Completed" : pct > 0 ? "In Progress" : mod.locked ? "Locked" : "Not Started";
      return { module: mod, title: mod.title || "Untitled Module", pct, status, locked: !!mod.locked };
    });
    const a = pathData?.assessment;
    if (!isPathMode || !a?.enabled) return moduleCards;
    const preDoneOrSkipped = a.preDone || a.noBaseline;
    const pre = {
      kind: "pre", module: { _id: "__pre-check" }, locked: false,
      title: a.noBaseline ? "Pre-check (skipped)" : "Pre-check",
      pct: preDoneOrSkipped ? 100 : 0, status: preDoneOrSkipped ? "Completed" : "Not Started",
    };
    const post = {
      kind: "post", module: { _id: "__post-check" }, locked: !(a.postUnlocked || a.postDone),
      title: a.postDone && a.postPercent !== null ? `Post-check · ${a.postPercent}%` : "Post-check",
      pct: a.postDone ? 100 : 0, status: a.postDone ? "Completed" : (a.postUnlocked ? "Not Started" : "Locked"),
    };
    return [pre, ...moduleCards, post];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules, correctCardIds, pathData, isPathMode]);

  // Detect modules that just crossed into 100% so we can celebrate them —
  // but never on first load (that would fire a chime for every module the
  // learner already finished before this page ever mounted).
  useEffect(() => {
    const nextMap = new Map(cards.map((c) => [c.module._id, c.pct]));
    const prevMap = prevPctRef.current;
    if (prevMap) {
      const justCompleted = cards
        .filter((c) => c.pct === 100 && prevMap.get(c.module._id) !== 100)
        .map((c) => c.module._id);
      if (justCompleted.length > 0) {
        orbitSfx.complete();
        setBurstIds((prev) => {
          const next = new Set(prev);
          justCompleted.forEach((id) => next.add(id));
          return next;
        });
        const t = setTimeout(() => {
          setBurstIds((prev) => {
            const next = new Set(prev);
            justCompleted.forEach((id) => next.delete(id));
            return next;
          });
        }, 1400);
        prevPctRef.current = nextMap;
        return () => clearTimeout(t);
      }
    }
    prevPctRef.current = nextMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const currentIndex = useMemo(
    () => cards.findIndex((c) => !c.locked && c.pct < 100),
    [cards]
  );

  const inProgressCount = cards.filter((c) => c.pct > 0 && c.pct < 100).length;
  const layout = useMemo(() => buildLayout(cards.length), [cards.length]);
  const stars = useMemo(() => buildStars(layout.height), [layout.height]);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 28px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="jf-breadcrumb">
        <button type="button" onClick={() => navigate("/orbit/tags")}>Categories</button>
        <span className="jf-breadcrumb__sep">›</span>
        <button type="button" onClick={() => navigate(`/orbit/tags/${isPathMode ? (category?._id || "") : categoryId}`)}>{category?.name || "…"}</button>
        <span className="jf-breadcrumb__sep">›</span>
        <span className="jf-breadcrumb__current">
          {isPathMode ? (pathData?.name || "…") : isAllRegions ? "All Regions" : (region?.name || "…")}
        </span>
      </div>

      {!loading && (
        <div className="jf-stat-row">
          <span className="jf-stat-pill">
            <span className="jf-dot" style={{ background: "#3ddc97" }} /> {modules.length} module{modules.length === 1 ? "" : "s"}
          </span>
          <span className="jf-stat-pill">
            <span className="jf-dot" style={{ background: "#f27ca6" }} /> {inProgressCount} in progress
          </span>
          <span className="jf-stat-pill">
            <span className="jf-dot" style={{ background: "var(--orbit-brand)" }} /> {user?.xp ?? 0} Lightyears
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div className="orbit-ml-card orbit-ml-card--skeleton" style={{ height: 300, maxWidth: 380, margin: "0 auto" }} />
        </div>
      ) : cards.length === 0 ? (
        <div className="jf-region-empty">
          <Globe2 size={26} />
          <p style={{ margin: "8px 0 0" }}>No modules here yet.</p>
        </div>
      ) : (
        <>
          <div className="jf-mission-start">
            <span className="jf-mission-start__emoji">🧑‍🚀</span>
            <span className="jf-mission-start__label">MISSION START</span>
          </div>

          <div className="jf-path-wrap">
            <div className="jf-path-decor" aria-hidden="true">
              {stars.map((s) => (
                <span
                  key={s.id}
                  className="jf-star"
                  style={{
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    width: s.size,
                    height: s.size,
                    animationDelay: `${s.delay}s`,
                    animationDuration: `${s.duration}s`,
                  }}
                />
              ))}
              <span className="jf-planet jf-planet--ringed" />
              <span className="jf-planet jf-planet--rust" />
              <span className="jf-planet jf-planet--moon" />
              <span className="jf-comet" />
            </div>

            <div className="jf-path-canvas" style={{ maxWidth: VIEW_WIDTH, aspectRatio: `${VIEW_WIDTH} / ${layout.height}` }}>
              <svg className="jf-path-svg" viewBox={`0 0 ${VIEW_WIDTH} ${layout.height}`}>
                {layout.segments.map((seg, i) => {
                  const traveled = cards[i]?.pct === 100;
                  // Only the "traveled" segments draw themselves in — framer-motion's
                  // pathLength animation works by writing its own stroke-dasharray
                  // inline, which would stomp the dotted CSS style on future segments.
                  return traveled ? (
                    <motion.path
                      key={i}
                      d={seg.d}
                      className="jf-path-cord jf-path-cord--done"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: "easeInOut" }}
                    />
                  ) : (
                    <path key={i} d={seg.d} className="jf-path-cord" />
                  );
                })}
              </svg>

              {cards.map((card, i) => {
                const node = layout.nodes[i];
                const isCurrent = i === currentIndex;
                const isDone = card.pct === 100;
                const isBursting = burstIds.has(card.module._id);
                const isShaking = shakeId === card.module._id;
                const leftPct = (node.x / VIEW_WIDTH) * 100;
                const topPct = (node.y / layout.height) * 100;

                let bubbleClass = "jf-node__bubble";
                if (card.locked) bubbleClass += " jf-node__bubble--locked";
                else if (isDone) bubbleClass += " jf-node__bubble--done";
                else if (isCurrent) bubbleClass += " jf-node__bubble--current";
                else bubbleClass += " jf-node__bubble--open";

                return (
                  <motion.div
                    key={card.module._id}
                    className={`jf-node-wrap${isShaking ? " jf-node-wrap--shake" : ""}`}
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    initial={{ opacity: 0, scale: 0.4, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.08 * i, type: "spring", stiffness: 260, damping: 18 }}
                  >
                    {isCurrent && (
                      <span className="jf-node-flag">
                        <Rocket size={11} /> START
                      </span>
                    )}

                    <motion.button
                      type="button"
                      className={bubbleClass}
                      style={card.pct > 0 && card.pct < 100 ? { "--pct": card.pct } : undefined}
                      onClick={() => (card.kind ? handleCheckClick(card) : handleModuleClick(card.module))}
                      onMouseEnter={() => { if (!card.locked) orbitSfx.hover(); }}
                      whileHover={card.locked ? {} : { scale: 1.08 }}
                      whileTap={card.locked ? { x: [0, -4, 4, -3, 3, 0] } : { scale: 0.94 }}
                      aria-label={`${card.title} — ${card.status}`}
                      title={card.title}
                    >
                      <span className="jf-node__ring" aria-hidden="true" />
                      <span className="jf-node__face">
                        {card.locked ? (
                          <LockFill size={18} />
                        ) : isDone ? (
                          <Check2 size={22} />
                        ) : card.kind ? (
                          <span className="jf-node__number">{card.kind === "pre" ? "PRE" : "POST"}</span>
                        ) : (
                          <span className="jf-node__number">{cards[0]?.kind === "pre" ? i : i + 1}</span>
                        )}
                      </span>
                      {isBursting && (
                        <>
                          <span className="jf-node__spark jf-node__spark--1">✦</span>
                          <span className="jf-node__spark jf-node__spark--2">✦</span>
                          <span className="jf-node__spark jf-node__spark--3">✦</span>
                          <span className="jf-node__spark jf-node__spark--4">✦</span>
                        </>
                      )}
                    </motion.button>

                    <div className={`jf-node-label${card.locked ? " jf-node-label--locked" : ""}${card.kind ? " jf-node-label--check" : ""}`} title={card.title}>
                      {card.title}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <OrbitFooter />
    </div>
  );
}
