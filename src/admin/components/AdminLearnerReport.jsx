// src/admin/components/AdminLearnerReport.jsx
// Learner Report. A list of learners (one row each) → click one for their
// full report: Pre/Post per learning path, the in-module score of every
// module (questions right on the FIRST try) with question-by-question
// detail, progress and time. A learner's Pre/Post check can be reset here.
// The server scopes everything to the admin's own department (a Superadmin
// sees everyone and can pick a department).
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Download, Search, ChevronRight, ChevronDown, CheckCircleFill, XCircleFill,
  ArrowCounterclockwise, ExclamationTriangleFill, InfoCircle,
} from "react-bootstrap-icons";
import api from "../services/api";
import AuthContext from "../../context/AuthContext";
import { Avatar, Badge, Button, Callout, EmptyState, Field, Loading, Modal, ProgressBar, Select, Textarea } from "../../components/ui";
import "./AdminLearnerReport.css";

const DEFAULT_LOW = 60;
const TYPE_LABEL = { quiz: "Quiz", code: "Code task", html_sandbox: "Interactive" };
const MODULE_STATUS = {
  completed: { label: "Completed", tone: "success" },
  in_progress: { label: "In progress", tone: "accent" },
  not_started: { label: "Not started", tone: null },
};
const PATH_STATUS_TONE = { Complete: "success", "Post-check due": "warning", "In progress": "accent", "Not started": null };
const CHECK_NAME = { pre: "Pre-check", post: "Post-check" };

const fmtTime = (s) => {
  if (!s) return "—";
  const m = Math.round(s / 60);
  if (m < 1) return "<1m";
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
};
const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
};
const toneOf = (p, low) => (p === null || p === undefined ? null : p >= 80 ? "success" : p >= low ? "warning" : "danger");

function ScoreBadge({ percent, low }) {
  if (percent === null || percent === undefined) return <span className="lr-muted">—</span>;
  return <Badge tone={toneOf(percent, low)}>{percent}%</Badge>;
}

function Delta({ value }) {
  if (value === null || value === undefined) return <span className="lr-muted">—</span>;
  const cls = value > 0 ? "lr-delta lr-delta--up" : value < 0 ? "lr-delta lr-delta--down" : "lr-delta";
  return <span className={cls}>{value > 0 ? `+${value}` : value}</span>;
}

function Kpi({ value, label, hint, tone }) {
  return (
    <div className={`lr-kpi${tone ? ` lr-kpi--${tone}` : ""}`}>
      <span className="lr-kpi__value">{value}</span>
      <span className="lr-kpi__label">{label}</span>
      {hint && <span className="lr-kpi__hint">{hint}</span>}
    </div>
  );
}

// Clickable table row: mouse and keyboard.
const rowProps = (onActivate) => ({
  tabIndex: 0,
  role: "button",
  onClick: onActivate,
  onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onActivate(); } },
});

/* ═══════════════════════════ Roster ═══════════════════════════ */

function Roster({ onOpen }) {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === "superadmin";
  const ownDept = user?.department?._id || user?.department || "";
  const [filters, setFilters] = useState({ departmentId: "", teamId: "", regionId: "" });
  const [search, setSearch] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [rows, setRows] = useState([]);
  const [low, setLow] = useState(DEFAULT_LOW);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isSuperAdmin) api.getDepartments().then((d) => setDepartments(Array.isArray(d) ? d : d?.data || [])).catch(() => {});
    api.getRegions().then((r) => setRegions((r?.data || []).filter((x) => !x.isDefault))).catch(() => {});
  }, [isSuperAdmin]);

  const teamDept = isSuperAdmin ? filters.departmentId : ownDept;
  useEffect(() => {
    if (!teamDept) { setTeams([]); return; }
    api.getTeams(teamDept).then((t) => setTeams(Array.isArray(t) ? t : t?.data || [])).catch(() => setTeams([]));
  }, [teamDept]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    api.getLearnerRoster(filters)
      .then((r) => { if (!cancelled) { setRows(r?.data || []); setLow(r?.lowScore || DEFAULT_LOW); } })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load learners."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => (!attentionOnly || r.needsAttention)
      && (!q || [r.username, r.email, r.team].some((v) => (v || "").toLowerCase().includes(q))));
  }, [rows, search, attentionOnly]);

  const kpis = useMemo(() => {
    const monthAgo = Date.now() - 30 * 24 * 3600 * 1000;
    const scored = shown.filter((r) => r.score.percent !== null);
    return {
      active: shown.filter((r) => r.lastActive && +new Date(r.lastActive) >= monthAgo).length,
      avg: scored.length ? Math.round(scored.reduce((s, r) => s + r.score.percent, 0) / scored.length) : null,
      attention: shown.filter((r) => r.needsAttention).length,
      pending: shown.reduce((s, r) => s + (r.writtenPending || 0), 0),
    };
  }, [shown]);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, ...(key === "departmentId" ? { teamId: "" } : {}) }));
  const csv = async () => {
    try { await api.downloadLearnerCsv(null, filters, "learner-report.csv"); }
    catch (err) { setError(err.message || "CSV export failed."); }
  };

  return (
    <div className="lr">
      <header className="lr-head">
        <div>
          <span className="ui-eyebrow">Reports</span>
          <h2 className="ui-h2">Learner Report</h2>
          <p className="lr-lead">
            Click a learner to see their Pre/Post checks, how they did inside each module, and their progress.
            {isSuperAdmin ? "" : " Showing learners in your department."}
          </p>
        </div>
        <Button size="sm" icon={<Download size={14} />} onClick={csv} disabled={!rows.length}>Export CSV</Button>
      </header>

      <div className="lr-filters">
        <div className="ui-input-group lr-filters__search">
          <Search size={14} />
          <input className="ui-input" type="search" placeholder="Search name, email or team" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search learners" />
        </div>
        {isSuperAdmin && (
          <Select value={filters.departmentId} onChange={(e) => setFilter("departmentId", e.target.value)} aria-label="Department">
            <option value="">All departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </Select>
        )}
        <Select value={filters.teamId} onChange={(e) => setFilter("teamId", e.target.value)} aria-label="Team" disabled={!teams.length}>
          <option value="">{teams.length ? "All teams" : isSuperAdmin && !filters.departmentId ? "Pick a department for teams" : "No teams"}</option>
          {teams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </Select>
        {regions.length > 0 && (
          <Select value={filters.regionId} onChange={(e) => setFilter("regionId", e.target.value)} aria-label="Region">
            <option value="">All regions</option>
            {regions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </Select>
        )}
        <label className="lr-toggle">
          <input type="checkbox" checked={attentionOnly} onChange={(e) => setAttentionOnly(e.target.checked)} />
          Needs attention only
        </label>
      </div>

      {error && <Callout tone="danger">{error}</Callout>}

      <div className="lr-kpis">
        <Kpi value={shown.length} label="Learners" hint={`${kpis.active} active in the last 30 days`} />
        <Kpi value={kpis.avg === null ? "—" : `${kpis.avg}%`} label="Avg in-module score" hint="right on the first try" tone={toneOf(kpis.avg, low)} />
        <Kpi value={kpis.attention} label="Need attention" hint={`in-module score below ${low}%`} tone={kpis.attention ? "danger" : null} />
        <Kpi value={kpis.pending} label="Written answers" hint="waiting to be graded" tone={kpis.pending ? "warning" : null} />
      </div>

      {loading ? <Loading label="Loading learners…" /> : shown.length === 0 ? (
        <EmptyState title={rows.length ? "No learner matches" : "No learners yet"}>
          {rows.length ? "Try a different search or filter." : "Learners appear here once they've signed up and verified their email."}
        </EmptyState>
      ) : (
        <div className="ui-table-wrap">
          <table className="ui-table lr-table">
            <thead>
              <tr>
                <th>Learner</th><th>Team</th><th>Modules</th><th>In-module score</th><th>Pre → Post</th>
                <th className="is-num">Time</th><th>Last active</th><th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.userId} className="lr-row" {...rowProps(() => onOpen(r.userId))}>
                  <td>
                    <div className="lr-who">
                      <Avatar name={r.username} size="sm" />
                      <div className="lr-who__text">
                        <span className="lr-who__name">{r.username}</span>
                        <span className="lr-who__sub">{r.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{r.team || <span className="lr-muted">—</span>}{isSuperAdmin && r.department ? <div className="lr-sub">{r.department}</div> : null}</td>
                  <td>
                    <span className="lr-strong">{r.modulesCompleted}</span> done
                    <div className="lr-sub">{r.modulesStarted} started</div>
                  </td>
                  <td>
                    <ScoreBadge percent={r.score.percent} low={low} />
                    {r.score.answered > 0 && <div className="lr-sub">{r.score.correct}/{r.score.answered} right first time</div>}
                  </td>
                  <td>{r.preAvg === null && r.postAvg === null ? <span className="lr-muted">—</span> : (
                    <span className="lr-prepost">{r.preAvg === null ? "—" : `${r.preAvg}%`} <span aria-hidden>→</span> {r.postAvg === null ? "—" : `${r.postAvg}%`}</span>
                  )}</td>
                  <td className="is-num">{fmtTime(r.timeSeconds)}</td>
                  <td>{fmtDate(r.lastActive)}</td>
                  <td className="lr-chev"><ChevronRight size={14} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════ One learner ═══════════════════════════ */

function Verdict({ q }) {
  if (q.basis === "recorded") {
    return (
      <span className="lr-verdict lr-verdict--recorded" title="Saved before first-try tracking started — this is their final answer">
        {q.latest ? <CheckCircleFill size={13} /> : <XCircleFill size={13} />} {q.latest ? "Right" : "Wrong"} <span className="lr-sub">(final)</span>
      </span>
    );
  }
  return (
    <span className={`lr-verdict ${q.first ? "lr-verdict--ok" : "lr-verdict--bad"}`}>
      {q.first ? <CheckCircleFill size={13} /> : <XCircleFill size={13} />} {q.first ? "Right" : "Wrong"}
      {!q.first && q.latest && <span className="lr-sub"> · fixed later</span>}
    </span>
  );
}

function ModuleQuestions({ state }) {
  if (!state || state.loading) return <div className="lr-qwrap"><Loading label="Loading answers…" /></div>;
  if (state.error) return <div className="lr-qwrap"><Callout tone="danger">{state.error}</Callout></div>;
  const { cards, unanswered } = state.data;
  if (!cards.length) return <div className="lr-qwrap"><p className="ui-small">No answers in this module yet.</p></div>;
  return (
    <div className="lr-qwrap">
      {cards.map((card) => (
        <div key={card.cardId} className="lr-qcard">
          <div className="lr-qcard__head">
            <span className="lr-strong">{card.title}</span>
            <Badge size="sm" outline>{TYPE_LABEL[card.type] || card.type}</Badge>
            {card.topic && <span className="lr-sub">{card.topic}</span>}
          </div>
          {card.questions.length > 0 && (
            <div className="lr-qtable-wrap">
              <table className="lr-qtable">
                <thead><tr><th>Question</th><th>First try</th><th className="is-num">Tries</th><th>Their answer</th><th>Correct answer</th></tr></thead>
                <tbody>
                  {card.questions.map((q) => (
                    <tr key={q.id}>
                      <td className="lr-qtext">{q.text || <span className="lr-muted">—</span>}</td>
                      <td><Verdict q={q} /></td>
                      <td className="is-num">{q.tries || "—"}</td>
                      <td className="lr-qans">{q.answer || <span className="lr-muted">{card.type === "code" ? "code" : "—"}</span>}</td>
                      <td className="lr-qans">{q.correct || <span className="lr-muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {card.written && (
            <div className="lr-written">
              <div className="lr-written__head">
                <span className="lr-strong">Written answers</span>
                {card.written.pending
                  ? <Badge tone="warning" size="sm">Waiting to be graded</Badge>
                  : <Badge tone="success" size="sm">Graded {card.written.score}/{card.written.max}</Badge>}
              </div>
              {card.written.feedback && <p className="lr-written__feedback">“{card.written.feedback}”</p>}
              {card.written.answers.map((w) => (
                <div key={w.id} className="lr-written__item">
                  <p className="lr-written__q">{w.text}</p>
                  <p className="lr-written__a">{w.answer || <span className="lr-muted">No answer</span>}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {unanswered > 0 && <p className="ui-small">{unanswered} more question card{unanswered === 1 ? "" : "s"} in this module not answered yet.</p>}
    </div>
  );
}

function PreCell({ p }) {
  if (p.pre) return <span>{p.pre.percent}% <span className="lr-sub">{fmtDate(p.pre.takenAt)}</span></span>;
  if (p.preState === "reset") return <Badge tone="warning" size="sm">Reset · retake due</Badge>;
  if (p.preState === "skipped") return <span className="lr-muted" title="They had started the path before its Pre-check existed">Skipped</span>;
  if (p.preState === "due") return <span className="lr-muted">Not taken</span>;
  return <span className="lr-muted">No check</span>;
}
function PostCell({ p }) {
  if (p.post) return <span>{p.post.percent}% <span className="lr-sub">{fmtDate(p.post.takenAt)}</span></span>;
  if (p.postState === "reset") return <Badge tone="warning" size="sm">Reset · retake due</Badge>;
  if (p.postState === "open") return <span className="lr-muted">Ready to take</span>;
  if (p.postState === "locked") return <span className="lr-muted">After all modules</span>;
  return <span className="lr-muted">No check</span>;
}

function ResetModal({ target, learner, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!target) return null;
  const { path, kind } = target;
  const attempt = path[kind];
  const submit = async () => {
    setBusy(true); setError("");
    try {
      await api.resetAssessmentAttempt(path.pathId, learner._id, kind, reason);
      onDone();
    } catch (err) {
      setError(err.message || "Reset failed.");
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={`Reset ${CHECK_NAME[kind]}?`}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={submit} loading={busy}>Reset {CHECK_NAME[kind]}</Button>
        </>
      )}
    >
      <p className="lr-modal__who"><span className="lr-strong">{learner.username}</span> · {path.name}</p>
      <ul className="lr-modal__list">
        <li>Their {CHECK_NAME[kind]} score ({attempt?.percent}%) is removed. It stays in this learner's reset history.</li>
        {kind === "pre"
          ? <li>They'll take the Pre-check again before they can continue this path.</li>
          : <li>They can take the Post-check again straight away.</li>}
        {kind === "post" && <li>Lightyears already earned are kept. The retake doesn't earn more.</li>}
      </ul>
      <Field label="Reason (optional)" htmlFor="lr-reset-reason" help="Saved with the reset, for your records.">
        <Textarea id="lr-reset-reason" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Submitted by mistake" />
      </Field>
      {error && <Callout tone="danger">{error}</Callout>}
    </Modal>
  );
}

function LearnerDetail({ userId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(() => new Set());
  const [details, setDetails] = useState({});
  const [resetTarget, setResetTarget] = useState(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    setLoading(true); setError("");
    return api.getLearnerReport(userId)
      .then((r) => setData(r?.data || null))
      .catch((err) => setError(err.message || "Failed to load this learner."))
      .finally(() => setLoading(false));
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const toggleModule = (moduleId) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
    if (!details[moduleId]) {
      setDetails((d) => ({ ...d, [moduleId]: { loading: true } }));
      api.getLearnerModuleDetail(userId, moduleId)
        .then((r) => setDetails((d) => ({ ...d, [moduleId]: { data: r.data } })))
        .catch((err) => setDetails((d) => ({ ...d, [moduleId]: { error: err.message || "Failed to load answers." } })));
    }
  };

  const csv = async () => {
    try { await api.downloadLearnerCsv(userId, {}, `learner-${(data?.user?.username || "report").replace(/[^\w-]+/g, "_")}.csv`); }
    catch (err) { setError(err.message || "CSV export failed."); }
  };

  const back = <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={onBack}>All learners</Button>;
  if (loading && !data) return <div className="lr">{back}<Loading label="Loading report…" /></div>;
  if (error && !data) return <div className="lr">{back}<Callout tone="danger">{error}</Callout></div>;
  if (!data) return null;

  const { user: u, summary: s, paths, modules, resets } = data;
  const low = s.lowScore || DEFAULT_LOW;
  const meta = [u.department, u.team, u.regions.join(", ")].filter(Boolean).join(" · ");

  return (
    <div className="lr">
      <div className="lr-topbar">
        {back}
        <Button size="sm" icon={<Download size={14} />} onClick={csv}>Export CSV</Button>
      </div>

      <section className="lr-person">
        <Avatar name={u.username} size="lg" />
        <div className="lr-person__text">
          <h2 className="ui-h2">{u.username}</h2>
          <p className="lr-person__email">{u.email}</p>
          <p className="lr-person__meta">{meta ? `${meta} · ` : ""}Joined {fmtDate(u.joinedAt)} · Last active {fmtDate(s.lastActive)}</p>
          <p className="lr-person__meta">
            Last sign-in {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}
            {u.lastLoginMethod ? ` · ${u.lastLoginMethod === "SSO" ? "Microsoft SSO" : "Email & password"}` : ""}
          </p>
        </div>
      </section>

      <div className="lr-kpis lr-kpis--5">
        <Kpi
          value={s.score.percent === null ? "—" : `${s.score.percent}%`}
          label="In-module score"
          hint={s.score.answered ? `${s.score.correct} of ${s.score.answered} right first time` : "No answers yet"}
          tone={toneOf(s.score.percent, low)}
        />
        <Kpi value={`${s.modulesCompleted}/${s.modulesTotal}`} label="Modules completed" hint={`${s.modulesStarted} started`} />
        <Kpi
          value={s.avgImprovement === null ? "—" : `${s.avgImprovement > 0 ? "+" : ""}${s.avgImprovement}`}
          label="Pre → Post improvement"
          hint={s.checksPaired ? `points, over ${s.checksPaired} path${s.checksPaired === 1 ? "" : "s"}` : "needs both checks on a path"}
          tone={s.avgImprovement > 0 ? "success" : s.avgImprovement < 0 ? "danger" : null}
        />
        <Kpi value={fmtTime(s.timeSeconds)} label="Time in modules" />
        <Kpi value={(u.xp || 0).toLocaleString()} label="Lightyears" />
      </div>

      <Callout tone="info" icon={<InfoCircle size={16} />}>
        <strong>In-module score</strong> = questions answered right on the <strong>first try</strong> (quizzes, code tasks and the
        auto-marked questions inside interactive modules). Learners may retry until they're right, so the first try shows what they knew.
        Written answers are graded by an admin and shown separately.
        {s.score.recorded > 0 && ` ${s.score.recorded} answer${s.score.recorded === 1 ? " was" : "s were"} saved before first-try tracking started; for those, their final answer is used (marked "final").`}
      </Callout>
      {(s.needsAttention > 0 || s.written.pending > 0) && (
        <Callout tone="warning" icon={<ExclamationTriangleFill size={15} />}>
          {s.needsAttention > 0 && <span>{s.needsAttention} module{s.needsAttention === 1 ? "" : "s"} below {low}% in-module score. </span>}
          {s.written.pending > 0 && <span>{s.written.pending} written answer{s.written.pending === 1 ? " is" : "s are"} waiting to be graded (User Analytics).</span>}
        </Callout>
      )}
      {notice && <Callout tone="success">{notice}</Callout>}
      {error && <Callout tone="danger">{error}</Callout>}

      <section className="lr-block">
        <div className="lr-block__head">
          <h3 className="ui-h3">Learning paths</h3>
          <p className="ui-small">Result = Post-check score, or the in-module score when the path has no Post-check yet.</p>
        </div>
        {paths.length === 0 ? <EmptyState title="Not in any learning path yet" /> : (
          <div className="ui-table-wrap">
            <table className="ui-table lr-table">
              <thead>
                <tr><th>Path</th><th>Modules</th><th>Pre-check</th><th>Post-check</th><th>Improvement</th><th>Result</th><th>Status</th><th aria-label="Actions" /></tr>
              </thead>
              <tbody>
                {paths.map((p) => (
                  <tr key={p.pathId}>
                    <td>
                      <span className="lr-strong">{p.name}</span>
                      <div className="lr-sub">{p.tag}{!p.published ? " · unpublished" : ""}{!p.assessmentEnabled && (p.pre || p.post) ? " · check switched off" : ""}</div>
                    </td>
                    <td className="lr-progress-cell">
                      <ProgressBar value={p.modulesCompleted} max={p.modulesTotal || 1} size="sm" tone={p.modulesTotal && p.modulesCompleted >= p.modulesTotal ? "success" : undefined} label={`${p.name} progress`} />
                      <span className="lr-sub">{p.modulesCompleted}/{p.modulesTotal}</span>
                    </td>
                    <td><PreCell p={p} /></td>
                    <td><PostCell p={p} /></td>
                    <td><Delta value={p.improvement} /></td>
                    <td>
                      {p.outcome ? (
                        <>
                          <ScoreBadge percent={p.outcome.percent} low={low} />
                          <div className="lr-sub">{p.outcome.source === "post" ? "Post-check" : "In-module"}</div>
                        </>
                      ) : <span className="lr-muted">—</span>}
                    </td>
                    <td>{PATH_STATUS_TONE[p.status] ? <Badge tone={PATH_STATUS_TONE[p.status]} size="sm">{p.status}</Badge> : <span className="lr-muted">{p.status}</span>}</td>
                    <td className="lr-actions">
                      {p.canReset.post && (
                        <Button variant="ghost" size="sm" icon={<ArrowCounterclockwise size={13} />} onClick={() => setResetTarget({ path: p, kind: "post" })}>Reset Post</Button>
                      )}
                      {p.canReset.pre && (
                        <Button variant="ghost" size="sm" icon={<ArrowCounterclockwise size={13} />} onClick={() => setResetTarget({ path: p, kind: "pre" })}>Reset Pre</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="lr-block">
        <div className="lr-block__head">
          <h3 className="ui-h3">Modules</h3>
          <p className="ui-small">Click a module to see every question: right or wrong on the first try, how many tries, and their answer.</p>
        </div>
        {modules.length === 0 ? <EmptyState title="No modules yet" /> : (
          <div className="ui-table-wrap">
            <table className="ui-table lr-table">
              <thead>
                <tr><th aria-label="Expand" /><th>Module</th><th>Status</th><th>Progress</th><th>In-module score</th><th>Written</th><th className="is-num">Time</th><th>Last active</th></tr>
              </thead>
              <tbody>
                {modules.map((m) => {
                  const isOpen = open.has(m.moduleId);
                  const st = MODULE_STATUS[m.status];
                  const canOpen = m.score.answered > 0 || m.written.questions > 0;
                  return (
                    <React.Fragment key={m.moduleId}>
                      <tr className={`lr-row${canOpen ? "" : " lr-row--static"}${isOpen ? " is-open" : ""}`} {...(canOpen ? rowProps(() => toggleModule(m.moduleId)) : {})} aria-expanded={canOpen ? isOpen : undefined}>
                        <td className="lr-chev">{canOpen ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}</td>
                        <td>
                          <span className="lr-strong">{m.title}</span>
                          <div className="lr-sub">{[m.tag, m.resets ? `reset ${m.resets}×` : ""].filter(Boolean).join(" · ")}</div>
                        </td>
                        <td>{st.tone ? <Badge tone={st.tone} size="sm">{st.label}</Badge> : <span className="lr-muted">{st.label}</span>}</td>
                        <td className="lr-progress-cell">
                          <ProgressBar value={m.progress.percent} size="sm" tone={m.status === "completed" ? "success" : undefined} label={`${m.title} progress`} />
                          <span className="lr-sub">{m.progress.percent}%</span>
                        </td>
                        <td>
                          <ScoreBadge percent={m.score.percent} low={low} />
                          {m.score.answered > 0 && <div className="lr-sub">{m.score.correct}/{m.score.answered} right first time</div>}
                        </td>
                        <td>
                          {m.written.questions === 0 ? <span className="lr-muted">—</span>
                            : m.written.pending ? <Badge tone="warning" size="sm">{m.written.pending} to grade</Badge>
                              : <span>{m.written.score}/{m.written.max}</span>}
                        </td>
                        <td className="is-num">{fmtTime(m.timeSeconds)}</td>
                        <td>{fmtDate(m.lastActive)}</td>
                      </tr>
                      {isOpen && (
                        <tr className="lr-detail-row">
                          <td colSpan={8}><ModuleQuestions state={details[m.moduleId]} /></td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {resets.length > 0 && (
        <section className="lr-block">
          <div className="lr-block__head"><h3 className="ui-h3">Reset history</h3></div>
          <ul className="lr-history">
            {resets.map((r) => (
              <li key={r._id}>
                <span className="lr-strong">{CHECK_NAME[r.kind]}</span> on {r.path || "a path"} reset by {r.resetBy || "an admin"} on {fmtDate(r.createdAt)}
                {r.previous?.percent !== undefined && <> · was {r.previous.percent}%</>}
                {" · "}{r.status === "retaken" ? `retaken ${fmtDate(r.retakenAt)}` : "retake pending"}
                {r.reason && <div className="lr-sub">“{r.reason}”</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ResetModal
        target={resetTarget}
        learner={u}
        onClose={() => setResetTarget(null)}
        onDone={() => {
          const t = resetTarget;
          setResetTarget(null);
          setNotice(`${CHECK_NAME[t.kind]} reset for ${t.path.name}. ${u.username} can take it again.`);
          load();
        }}
      />
    </div>
  );
}

/* ═══════════════════════════ Shell ═══════════════════════════ */

export default function AdminLearnerReport({ initialUserId = "" }) {
  const [userId, setUserId] = useState(initialUserId);
  useEffect(() => { setUserId(initialUserId); }, [initialUserId]);
  // The roster stays mounted while a learner is open, so "All learners"
  // returns to the same filters and search.
  return (
    <>
      <div hidden={!!userId}><Roster onOpen={setUserId} /></div>
      {userId && <LearnerDetail key={userId} userId={userId} onBack={() => setUserId("")} />}
    </>
  );
}
