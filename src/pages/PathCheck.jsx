// src/pages/PathCheck.jsx
// The Pre-check / Post-check of a Path: /orbit/paths/:pathId/check/:kind.
//  • Pre: one attempt, graded on the server, no score shown — it only records
//    the learner's starting point before the first module.
//  • Post: one attempt once every module is done; shows the score, how much
//    the learner improved since the Pre-check, and the correct answers.
// Correct answers never reach the browser before submission.
import React, { useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckLg, ClipboardCheck } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import api from "../admin/services/api";
import AuthContext from "../context/AuthContext";
import OrbitFooter from "../components/OrbitDashboard/OrbitFooter";
import "../components/OrbitDashboard/OrbitDashboard.css";
import "../components/OrbitDashboard/PathFlow.css";
import { safeId } from "../utils/safeNav";

const LETTERS = "ABCDEFGH";

function Review({ review }) {
  return (
    <div className="ui-card ui-card--roomy pc-panel">
      <h2 className="ui-h3 pc-panel__title">Your answers</h2>
      {review.map((q, i) => (
        <div className="pc-q" key={q.questionId}>
          <p className="pc-q__text"><span className="ui-index pc-q__num">{String(i + 1).padStart(2, "0")}</span>{q.question}</p>
          {q.options.map((opt, oi) => {
            let cls = "pc-opt";
            if (oi === q.correctIndex) cls += " pc-opt--correct";
            else if (oi === q.selectedOption) cls += " pc-opt--wrong";
            return (
              <button type="button" key={oi} className={cls} disabled>
                <span className="pc-opt__key">{LETTERS[oi]}</span>
                <span>{opt}{oi === q.selectedOption ? "  ← your answer" : ""}</span>
              </button>
            );
          })}
          {q.selectedOption === null && <p className="pc-explain">You didn't answer this one.</p>}
          {q.explanation && <p className="pc-explain">💡 {q.explanation}</p>}
        </div>
      ))}
    </div>
  );
}

function PostResult({ result }) {
  const improved = result.improvement;
  return (
    <div className="ui-card ui-card--roomy pc-panel pc-result">
      <span className="ui-eyebrow">Post-check result</span>
      <div className="pc-result__score">{result.percent}%</div>
      <p className="pc-result__line">{result.score} of {result.maxScore} correct</p>
      {result.prePercent !== null && result.prePercent !== undefined ? (
        <p className="pc-result__line">
          You went from <strong>{result.prePercent}%</strong> to <strong>{result.percent}%</strong>
          {improved > 0 ? ` — up ${improved} points. Great progress!` : improved === 0 ? " — the same as your Pre-check." : "."}
        </p>
      ) : (
        <p className="pc-result__line">You had started this path before the Pre-check existed, so there's no starting score to compare with.</p>
      )}
      {result.xpChange > 0 && <span className="ui-badge ui-badge--lg ui-badge--accent pc-result__xp">+{result.xpChange} Lightyears earned</span>}
    </div>
  );
}

export default function PathCheck() {
  const params = useParams();
  const pathId = safeId(params.pathId);
  const kind = params.kind === "post" ? "post" : "pre";
  const navigate = useNavigate();
  const { addUserXP } = useContext(AuthContext);
  const [load, setLoad] = useState({ loading: true, error: "", data: null });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // { kind:'pre' } | post result
  const label = kind === "post" ? "Post-check" : "Pre-check";

  useLayoutEffect(() => { window.scrollTo(0, 0); }, [done]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getPathCheck(pathId, kind);
        if (cancelled) return;
        // Post already taken → show the stored result instead.
        if (kind === "post" && !res.data.available) {
          const r = await api.getPathCheckResult(pathId).catch(() => null);
          if (!cancelled && r?.data?.postDone) { setDone(r.data); setLoad({ loading: false, error: "", data: res.data }); return; }
        }
        setLoad({ loading: false, error: "", data: res.data });
      } catch (err) {
        if (!cancelled) setLoad({ loading: false, error: err.message || "Could not load this check.", data: null });
      }
    })();
    return () => { cancelled = true; };
  }, [pathId, kind]);

  const questions = useMemo(() => load.data?.questions || [], [load.data]);
  const answeredCount = Object.keys(answers).length;

  const submit = async () => {
    const missing = questions.length - answeredCount;
    if (missing > 0) {
      const confirm = await Swal.fire({
        icon: "question",
        title: `${missing} question${missing === 1 ? "" : "s"} unanswered`,
        text: "Unanswered questions count as wrong. You can only submit once.",
        showCancelButton: true, confirmButtonText: "Submit anyway", cancelButtonText: "Keep answering",
      });
      if (!confirm.isConfirmed) return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitPathCheck(pathId, kind, questions.map((q) => ({
        questionId: q._id, selectedOption: answers[q._id] ?? null,
      })));
      if (res.data?.xpChange) addUserXP(res.data.xpChange);
      setDone(res.data);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Not submitted", text: err.message || "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const backToPath = () => navigate(`/orbit/paths/${pathId}`);
  const pathName = load.data?.path?.name || done?.path?.name || "";

  return (
    <div className="ui-page ui-page--narrow pf-wrap pf-narrow">
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm pf-back" onClick={backToPath}>
        <ArrowLeft size={15} /> Back to {pathName || "the path"}
      </button>

      <header className="ui-page-header ui-page-header--center pc-header">
        <div className="ui-page-header__text">
          {pathName && <span className="ui-eyebrow">{pathName}</span>}
          <h1 className="ui-h1">{label}</h1>
        </div>
      </header>

      {load.loading && <div className="ui-card pc-panel pc-panel--skeleton ui-skeleton" aria-hidden="true" />}
      {load.error && <div className="ui-empty pf-empty">{load.error}</div>}

      {done && done.kind === "pre" && (
        <div className="ui-card ui-card--roomy pc-panel pc-result">
          <span className="ui-icon-tile ui-icon-tile--green ui-icon-tile--lg pc-result__icon" aria-hidden="true">
            <CheckLg size={26} />
          </span>
          <p className="pc-result__line"><strong>Thanks — your starting point is recorded.</strong></p>
          <p className="pc-result__line">This isn't graded. After the last module you'll take the Post-check and see how much you've learned.</p>
          <div className="pc-actions pc-actions--center">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--lg pc-btn" onClick={backToPath}>Start the first module →</button>
          </div>
        </div>
      )}

      {done && done.kind === "post" && done.postDone !== false && (
        <>
          <PostResult result={done} />
          {Array.isArray(done.review) && <Review review={done.review} />}
          <div className="pc-actions pc-actions--center">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--lg pc-btn" onClick={backToPath}>Back to the path</button>
          </div>
        </>
      )}

      {!done && load.data && !load.data.available && (
        <div className="ui-empty pf-empty">
          <span className="ui-icon-tile ui-icon-tile--neutral ui-icon-tile--lg" aria-hidden="true"><ClipboardCheck size={22} /></span>
          <p className="ui-empty__title">{load.data.reason}</p>
          <div className="pc-actions pc-actions--center">
            <button type="button" className="ui-btn ui-btn--secondary pc-btn pc-btn--ghost" onClick={backToPath}>Back to the path</button>
          </div>
        </div>
      )}

      {!done && load.data?.available && (
        <div className="ui-card ui-card--roomy ui-card--raised pc-panel">
          <div className="pc-intro">
            <p>
              {kind === "pre"
                ? "Before you start, answer these questions so we can see where you're starting from. It isn't graded and you won't see a score now — just answer honestly."
                : "You've finished every module. Answer the same questions again to see how much you've learned."}
            </p>
            <p className="pc-intro__note">You can submit only once.</p>
            <div className="pc-progress-row">
              <div className="ui-progress">
                <div className="ui-progress__bar" style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }} />
              </div>
              <span className="pc-progress ui-num">{answeredCount} of {questions.length} answered</span>
            </div>
          </div>
          {questions.map((q, i) => (
            <div className="pc-q" key={q._id} role="radiogroup" aria-label={`Question ${i + 1}`}>
              <p className="pc-q__text"><span className="ui-index pc-q__num">{String(i + 1).padStart(2, "0")}</span>{q.question}</p>
              {/* Options arrive shuffled; each keeps its original index `i`,
                  which is what gets submitted. */}
              {q.options.map((opt, oi) => (
                <button
                  type="button" key={opt.i} role="radio" aria-checked={answers[q._id] === opt.i}
                  className={`pc-opt${answers[q._id] === opt.i ? " pc-opt--selected" : ""}`}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q._id]: opt.i }))}
                >
                  <span className="pc-opt__key">{LETTERS[oi]}</span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
          ))}
          <div className="pc-actions">
            <button type="button" className="ui-btn ui-btn--ghost pc-btn pc-btn--ghost" onClick={backToPath} disabled={submitting}>Not now</button>
            <button type="button" className="ui-btn ui-btn--primary pc-btn" onClick={submit} disabled={submitting || questions.length === 0}>
              {submitting ? "Submitting…" : `Submit ${label}`}
            </button>
          </div>
        </div>
      )}

      <OrbitFooter />
    </div>
  );
}
