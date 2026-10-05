// src/pages/ModuleJourney.jsx
// The journey view. Two mounts:
//   /orbit/paths/:pathId — a Path (Learn → Tag → Path): its modules in the
//       Path's own order, lock state from the server, plus Pre-check / Post-
//       check stops when the Path has an assessment.
//   /orbit/tags/:categoryId/region/:regionId — the legacy Tag -> Region view
//       ("all" = no region filter), used until Paths are published.
// Renders
// the same real navigation/lock/progress logic ModuleTrail.jsx uses, laid
// out as a curved "snake" trail of numbered nodes (01, 02, …) with each
// step's card on alternating sides — scales to any module count.
import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe2, LockFill, Check2, Rocket, ChevronRight, ClipboardCheck } from "react-bootstrap-icons";
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
import { safeId, safeIdOrToken } from "../utils/safeNav";

// Status → ui-badge tone for each step.
const STATUS_TONE = {
  Completed: "ui-badge--success",
  "In Progress": "ui-badge--accent",
  Locked: "",
  "Not Started": "ui-badge--outline",
};

// S-curve between two node centres: leave and arrive vertically, so
// consecutive segments join smoothly into one continuous snake.
function snakeSegment(a, b) {
  // Handles longer than half the gap give the bend a rounder, snakier S.
  const k = Math.max((b.y - a.y) * 0.9, 48);
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + k}, ${b.x} ${b.y - k}, ${b.x} ${b.y}`;
}

// The curved trail behind the nodes. Decorative only (pointer-events: none
// in CSS) so it can never sit between the cursor and a node. A segment is
// drawn solid in the accent once the step it leaves is done; the rest is a
// dotted path still to travel.
function SnakeTrail({ trail, cards }) {
  const { w, h, points } = trail;
  if (!w || points.length < 2 || points.some((p) => !p)) return null;
  const segments = points.slice(1).map((b, i) => ({ d: snakeSegment(points[i], b), done: cards[i]?.pct === 100 }));
  return (
    <svg className="jf-snake__trail" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      {segments.map((seg, i) => <path key={`t${i}`} d={seg.d} className="jf-snake__track" />)}
      {segments.map((seg, i) => (!seg.done ? <path key={`o${i}`} d={seg.d} className="jf-snake__todo" /> : (
        <motion.path
          key={`d${i}`}
          d={seg.d}
          className="jf-snake__done"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.15 + 0.12 * i, duration: 0.45, ease: "easeInOut" }}
        />
      )))}
    </svg>
  );
}

export default function ModuleJourney() {
  const params = useParams();
  const categoryId = safeId(params.categoryId);
  const regionId = safeIdOrToken(params.regionId, "all");
  const pathId = safeId(params.pathId);
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

  // Snake trail: measure each node's centre (relative to the snake
  // container) after layout and on every resize, then draw the curve through
  // them. Rows only fade in (no transform), so the measurements are final.
  const snakeRef = useRef(null);
  const nodeRefs = useRef([]);
  const [trail, setTrail] = useState({ w: 0, h: 0, points: [] });
  useLayoutEffect(() => {
    const el = snakeRef.current;
    if (!el) return undefined;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const points = nodeRefs.current.slice(0, cards.length).map((n) => {
        if (!n) return null;
        const r = n.getBoundingClientRect();
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
      });
      setTrail({ w: box.width, h: box.height, points });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cards, loading]);

  const inProgressCount = cards.filter((c) => c.pct > 0 && c.pct < 100).length;
  const doneCount = cards.filter((c) => c.pct === 100).length;
  const overallPct = cards.length ? Math.round((doneCount / cards.length) * 100) : 0;
  const crumbCurrent = isPathMode ? (pathData?.name || "…") : isAllRegions ? "All Regions" : (region?.name || "…");

  return (
    <div className="ui-page jf-page">
      <nav className="jf-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={() => navigate("/orbit/tags")}>Learn</button>
        <ChevronRight size={11} className="jf-breadcrumb__sep" aria-hidden="true" />
        <button type="button" onClick={() => navigate(isPathMode ? (category?._id ? `/orbit/tags/${category._id}` : "/orbit/tags") : `/orbit/tags/${categoryId}`, { state: { stayOnList: true } })}>{category?.name || "…"}</button>
        <ChevronRight size={11} className="jf-breadcrumb__sep" aria-hidden="true" />
        <span className="jf-breadcrumb__current">{crumbCurrent}</span>
      </nav>

      <header className="ui-page-header jf-header">
        <div className="ui-page-header__text">
          <span className="ui-eyebrow">{category?.name || "Learning path"}</span>
          <h1 className="ui-h1">{crumbCurrent}</h1>
          {isPathMode && pathData?.description && <p className="ui-lead">{pathData.description}</p>}
        </div>
      </header>

      {!loading && (
        <div className="jf-summary ui-card">
          <div className="jf-stat-row">
            <span className="ui-chip jf-stat-pill">
              <span className="jf-dot jf-dot--modules" /> {modules.length} module{modules.length === 1 ? "" : "s"}
            </span>
            <span className="ui-chip jf-stat-pill">
              <span className="jf-dot jf-dot--progress" /> {inProgressCount} in progress
            </span>
            <span className="ui-chip jf-stat-pill">
              <span className="jf-dot jf-dot--xp" /> {user?.xp ?? 0} Lightyears
            </span>
          </div>
          {cards.length > 0 && (
            <div className="jf-summary__progress">
              <div className="jf-summary__labels">
                <span>{doneCount} of {cards.length} complete</span>
                <span className="ui-num">{overallPct}%</span>
              </div>
              <div className={`ui-progress${overallPct === 100 ? " ui-progress--success" : ""}`}>
                <div className="ui-progress__bar" style={{ width: `${overallPct}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="jf-snake jf-snake--skeleton" aria-hidden="true">
          <ol className="jf-snake__list">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className={`jf-snake__row jf-snake__row--${i % 2 ? "r" : "l"}`}>
                <span className="ui-skeleton jf-snake__node" />
                <span className="ui-card jf-snake__card">
                  <span className="ui-skeleton jf-skel-line" />
                  <span className="ui-skeleton jf-skel-line jf-skel-line--short" />
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : cards.length === 0 ? (
        <div className="ui-empty jf-region-empty">
          <span className="ui-icon-tile ui-icon-tile--neutral ui-icon-tile--lg"><Globe2 size={22} /></span>
          <p className="ui-empty__title">No modules here yet.</p>
        </div>
      ) : (
        <>
          <div className="jf-mission-start">
            <span className="jf-mission-start__emoji" aria-hidden="true">🧑‍🚀</span>
            <span className="jf-mission-start__label">MISSION START</span>
          </div>

          <div className="jf-snake" ref={snakeRef}>
            <SnakeTrail trail={trail} cards={cards} />
            <ol className="jf-snake__list">
              {cards.map((card, i) => {
                const isCurrent = i === currentIndex;
                const isDone = card.pct === 100;
                const isBursting = burstIds.has(card.module._id);
                const isShaking = shakeId === card.module._id;
                const inProgress = card.pct > 0 && card.pct < 100;
                const state = card.locked ? "locked" : isDone ? "done" : isCurrent ? "current" : "open";
                const onActivate = () => (card.kind ? handleCheckClick(card) : handleModuleClick(card.module));
                const onHover = () => { if (!card.locked) orbitSfx.hover(); };

                const stepNumber = card.kind
                  ? (card.kind === "pre" ? "PRE" : "POST")
                  : String(cards[0]?.kind === "pre" ? i : i + 1).padStart(2, "0");
                const hint = card.kind === "pre"
                  ? (isDone ? "Starting point recorded" : "Records where you start — not graded")
                  : card.kind === "post"
                    ? (card.locked ? "Unlocks when every module is done" : isDone ? "Compare with your Pre-check" : "See how much you've learned")
                    : null;

                return (
                  <motion.li
                    key={card.module._id}
                    className={`jf-snake__row jf-snake__row--${i % 2 ? "r" : "l"} jf-snake__row--${state}${card.kind ? " jf-snake__row--check" : ""}${isShaking ? " jf-snake__row--shake" : ""}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 * i, duration: 0.3, ease: "easeOut" }}
                  >
                    {/* The node is a second, pointer-only hit target for the
                        same action; the card next to it is the accessible button. */}
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-hidden="true"
                      className="jf-snake__node"
                      ref={(el) => { nodeRefs.current[i] = el; }}
                      onClick={onActivate}
                      onMouseEnter={onHover}
                    >
                      {isDone ? <Check2 size={24} />
                        : card.locked ? <LockFill size={15} />
                        : card.kind ? <ClipboardCheck size={20} />
                        : <span className="jf-snake__num ui-num">{stepNumber}</span>}
                      {isBursting && (
                        <>
                          <span className="jf-node__spark jf-node__spark--1">✦</span>
                          <span className="jf-node__spark jf-node__spark--2">✦</span>
                          <span className="jf-node__spark jf-node__spark--3">✦</span>
                          <span className="jf-node__spark jf-node__spark--4">✦</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="ui-card jf-snake__card"
                      onClick={onActivate}
                      onMouseEnter={onHover}
                      aria-label={`${card.title} — ${isCurrent ? "up next" : card.status}`}
                    >
                      <span className="jf-snake__badges">
                        <span className={`ui-index${isCurrent ? " ui-index--active" : ""}`}>{stepNumber}</span>
                        {isCurrent ? (
                          <span className="ui-badge ui-badge--sm ui-badge--solid jf-node-flag">
                            <Rocket size={10} /> {card.pct > 0 ? "CONTINUE" : "START"}
                          </span>
                        ) : (
                          <span className={`ui-badge ui-badge--sm ${STATUS_TONE[card.status] ?? ""}`}>
                            {card.locked && <LockFill size={9} />}
                            {isDone && <Check2 size={11} />}
                            {card.status}
                          </span>
                        )}
                      </span>
                      <span className={`jf-snake__title ui-clamp-2${card.kind ? " jf-node-label--check" : ""}`}>{card.title}</span>
                      {hint && <span className="jf-snake__hint">{hint}</span>}
                      {inProgress && (
                        <span className="jf-snake__progress">
                          <span className="ui-progress ui-progress--sm">
                            <span className="ui-progress__bar" style={{ width: `${card.pct}%` }} />
                          </span>
                          <span className="jf-snake__pct ui-num">{card.pct}%</span>
                        </span>
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </ol>
          </div>

          {overallPct === 100 && (
            <div className="jf-finish">
              <span aria-hidden="true">🏁</span> Path complete — nice work!
            </div>
          )}
        </>
      )}

      <OrbitFooter />
    </div>
  );
}
