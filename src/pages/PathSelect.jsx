// src/pages/PathSelect.jsx
// Learn → Tag → **Path**. Mounted at /orbit/tags/:categoryId. Lists the Paths
// in this Tag that are meant for the learner (their region / department /
// team are applied on the server — nobody picks a region). A Tag with exactly
// one Path for this learner skips this screen and opens the Path directly.
// Until any Path is published, falls back to the old region picker.
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CollectionFill, ClipboardCheck, CheckCircleFill } from "react-bootstrap-icons";
import api from "../admin/services/api";
import RegionSelect from "./RegionSelect";
import OrbitFooter from "../components/OrbitDashboard/OrbitFooter";
import "../components/OrbitDashboard/OrbitDashboard.css";
import "../components/OrbitDashboard/PathFlow.css";

function ctaFor(p) {
  if (p.percent === 100 && (!p.assessment?.enabled || p.assessment.postDone)) return "Review";
  if (p.assessment?.enabled && p.assessment.preRequired) return "Start with the Pre-check";
  if (p.assessment?.postUnlocked) return "Take the Post-check";
  return p.completedCount > 0 ? "Continue" : "Start";
}

export default function PathSelect() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
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
        if (list.length === 1) { navigate(`/orbit/paths/${list[0]._id}`, { replace: true }); return; }
        setState({ loading: false, legacy: false, category: res.category, paths: list, error: "" });
      } catch (err) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: err.message || "Failed to load paths." }));
      }
    })();
    return () => { cancelled = true; };
  }, [categoryId, navigate]);

  if (state.legacy) return <RegionSelect />;

  if (state.loading) {
    return (
      <div className="pf-wrap">
        <div className="pf-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="orbit-ml-card orbit-ml-card--skeleton" style={{ height: 150, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pf-wrap">
      <button type="button" className="pf-back" onClick={() => navigate("/orbit/tags")}>
        <ArrowLeft size={15} /> Back to Categories
      </button>

      <div>
        <span className="pf-heading__eyebrow">{state.category?.name || "…"}</span>
        <h1 className="pf-heading__title">Choose a learning path</h1>
        <p className="pf-heading__desc">
          {state.category?.description || "Each path is a set of modules in order. Your progress in a module counts in every path that includes it."}
        </p>
      </div>

      {state.error && <p className="pc-error">{state.error}</p>}

      {state.paths.length === 0 && !state.error ? (
        <div className="pf-empty">No paths here for you yet.</div>
      ) : (
        <div className="pf-grid">
          {state.paths.map((p) => (
            <button type="button" key={p._id} className="pf-card" onClick={() => navigate(`/orbit/paths/${p._id}`)}>
              <h2 className="pf-card__name">{p.name}</h2>
              {p.description && <p className="pf-card__desc">{p.description}</p>}
              <div className="pf-card__meta">
                <span className="pf-chip"><CollectionFill size={11} /> {p.moduleCount} module{p.moduleCount === 1 ? "" : "s"}</span>
                {p.assessment?.enabled && (
                  <span className={`pf-chip ${p.assessment.postDone ? "pf-chip--done" : "pf-chip--brand"}`}>
                    <ClipboardCheck size={11} /> Pre/Post check
                  </span>
                )}
                {p.percent === 100 && <span className="pf-chip pf-chip--done"><CheckCircleFill size={11} /> Completed</span>}
              </div>
              <div className="pf-progress" aria-label={`${p.percent}% complete`}>
                <div className="pf-progress__bar" style={{ width: `${p.percent}%` }} />
              </div>
              <div className="pf-card__foot">
                <span>{p.completedCount} of {p.moduleCount} done</span>
                <span className="pf-card__cta">{ctaFor(p)} →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <OrbitFooter />
    </div>
  );
}
