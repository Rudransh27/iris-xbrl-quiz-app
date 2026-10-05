// src/pages/PathSelect.jsx
// Learn → Tag → **Path**. Mounted at /orbit/tags/:categoryId. Lists the Paths
// in this Tag that are meant for the learner (their region / department /
// team are applied on the server — nobody picks a region). A Tag with exactly
// one Path for this learner skips this screen and opens the Path directly.
// Until any Path is published, falls back to the old region picker.
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CollectionFill, ClipboardCheck, CheckCircleFill } from "react-bootstrap-icons";
import api from "../admin/services/api";
import RegionSelect from "./RegionSelect";
import OrbitFooter from "../components/OrbitDashboard/OrbitFooter";
import "../components/OrbitDashboard/OrbitDashboard.css";
import "../components/OrbitDashboard/PathFlow.css";
import { safeId } from "../utils/safeNav";

function ctaFor(p) {
  if (p.percent === 100 && (!p.assessment?.enabled || p.assessment.postDone)) return "Review";
  if (p.assessment?.enabled && p.assessment.preRequired) return "Start with the Pre-check";
  if (p.assessment?.postUnlocked) return "Take the Post-check";
  return p.completedCount > 0 ? "Continue" : "Start";
}

export default function PathSelect() {
  const categoryId = safeId(useParams().categoryId);
  const navigate = useNavigate();
  // Coming back up from a Path (journey breadcrumb): show the list even if
  // the Tag has a single Path, instead of bouncing straight back into it.
  const stayOnList = !!useLocation().state?.stayOnList;
  const [state, setState] = useState({ loading: true, legacy: false, category: null, paths: [], error: "" });

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getLearnTagPaths(categoryId);
        if (cancelled) return;
        if (!res.pathsEnabled) { setState((s) => ({ ...s, loading: false, legacy: true })); return; }
        const list = res.data || [];
        if (list.length === 1 && !stayOnList) { navigate(`/orbit/paths/${list[0]._id}`, { replace: true }); return; }
        setState({ loading: false, legacy: false, category: res.category, paths: list, error: "" });
      } catch (err) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: err.message || "Failed to load paths." }));
      }
    })();
    return () => { cancelled = true; };
  }, [categoryId, navigate, stayOnList]);

  if (state.legacy) return <RegionSelect />;

  if (state.loading) {
    return (
      <div className="ui-page pf-wrap">
        <div className="pf-grid" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ui-card pf-card pf-card--skeleton">
              <div className="ui-skeleton pf-skel pf-skel--title" />
              <div className="ui-skeleton pf-skel" />
              <div className="ui-skeleton pf-skel pf-skel--bar" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page pf-wrap">
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm pf-back" onClick={() => navigate("/orbit/tags")}>
        <ArrowLeft size={15} /> Back to Categories
      </button>

      <header className="ui-page-header">
        <div className="ui-page-header__text">
          <span className="ui-eyebrow">{state.category?.name || "…"}</span>
          <h1 className="ui-h1">Choose a learning path</h1>
          <p className="ui-lead">
            {state.category?.description || "Each path is a set of modules in order. Your progress in a module counts in every path that includes it."}
          </p>
        </div>
        {state.paths.length > 0 && (
          <div className="ui-page-header__actions">
            <span className="ui-chip"><strong className="ui-num">{state.paths.length}</strong> paths</span>
          </div>
        )}
      </header>

      {state.error && <div className="ui-callout ui-callout--danger pc-error">{state.error}</div>}

      {state.paths.length === 0 && !state.error ? (
        <div className="ui-empty pf-empty">No paths here for you yet.</div>
      ) : (
        <div className="pf-grid">
          {state.paths.map((p, i) => (
            <button type="button" key={p._id} className="ui-card ui-card--interactive pf-card" onClick={() => navigate(`/orbit/paths/${p._id}`)}>
              <span className="pf-card__head">
                <span className="ui-index">{String(i + 1).padStart(2, "0")}</span>
                {p.percent === 100 && <span className="ui-badge ui-badge--sm ui-badge--success"><CheckCircleFill size={11} /> Completed</span>}
              </span>
              <h2 className="ui-card__title pf-card__name">{p.name}</h2>
              {p.description && <p className="ui-clamp-2 pf-card__desc">{p.description}</p>}
              <span className="pf-card__meta">
                <span className="ui-badge ui-badge--sm"><CollectionFill size={11} /> {p.moduleCount} module{p.moduleCount === 1 ? "" : "s"}</span>
                {p.assessment?.enabled && (
                  <span className={`ui-badge ui-badge--sm ${p.assessment.postDone ? "ui-badge--success" : "ui-badge--accent"}`}>
                    <ClipboardCheck size={11} /> Pre/Post check
                  </span>
                )}
              </span>
              <span className={`ui-progress pf-progress${p.percent === 100 ? " ui-progress--success" : ""}`} aria-label={`${p.percent}% complete`}>
                <span className="ui-progress__bar pf-progress__bar" style={{ width: `${p.percent}%` }} />
              </span>
              <span className="ui-card__foot pf-card__foot">
                <span className="ui-num">{p.completedCount} of {p.moduleCount} done</span>
                <span className="pf-card__cta">{ctaFor(p)} <ArrowRight size={14} /></span>
              </span>
            </button>
          ))}
        </div>
      )}

      <OrbitFooter />
    </div>
  );
}
