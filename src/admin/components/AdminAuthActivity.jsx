// src/admin/components/AdminAuthActivity.jsx
// Sign-in activity: who signed in and how (Microsoft SSO or email +
// password), failed attempts, sign-outs and ended sessions — separate from
// learning activity. Never shows passwords, tokens or Microsoft account
// data. Department admins see their own department; a superadmin sees
// everyone, plus IP addresses. A user's active sessions can be ended here.
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Download, Search, PersonLinesFill, BoxArrowRight } from "react-bootstrap-icons";
import api from "../services/api";
import AuthContext from "../../context/AuthContext";
import { Badge, Button, Callout, EmptyState, Loading, Modal, Select } from "../../components/ui";
import "./AdminLearnerReport.css";
import "./AdminAuthActivity.css";

const EVENT_LABEL = {
  LOGIN_SUCCESS: "Login",
  LOGIN_FAILED: "Failed login",
  LOGOUT: "Logout",
  SESSION_EXPIRED: "Session expired",
  SESSION_REVOKED: "Session ended",
  PASSWORD_RESET_REQUESTED: "Password reset requested",
  PASSWORD_RESET: "Password reset",
  PASSWORD_CHANGED: "Password changed",
  ACCOUNT_CREATED: "Account created",
  ACCOUNT_LINKED: "Microsoft account linked",
};
const REASON_LABEL = {
  bad_password: "Wrong password",
  unknown_account: "No account with this email",
  locked: "Account locked (too many attempts)",
  unverified: "Email not verified yet",
  sso_only: "Account uses Microsoft sign-in",
  cancelled: "Cancelled at Microsoft",
  provider_error: "Microsoft returned an error",
  state_mismatch: "Sign-in link expired or reused",
  profile_missing: "Microsoft sent no email",
  wrong_tenant: "Account from another organisation",
  not_member: "Guest account",
  domain_denied: "Email domain not allowed",
  identity_conflict: "Email linked to another Microsoft account",
  session_failed: "Session could not start",
  idle: "Inactivity",
  revoked: "Ended by an admin",
  password_changed: "Password was changed",
  password_reset: "Password was reset",
  replaced: "Newer sign-in",
};
// Event filter → API params (an SSO login is a Login with method SSO).
const EVENT_FILTERS = [
  { key: "", label: "All events" },
  { key: "logins", label: "Logins", params: { type: "LOGIN_SUCCESS" } },
  { key: "failed", label: "Failed logins", params: { type: "LOGIN_FAILED" } },
  { key: "sso", label: "SSO logins", params: { type: "LOGIN_SUCCESS", method: "SSO" } },
  { key: "sso_fail", label: "SSO failures", params: { type: "LOGIN_FAILED", method: "SSO" } },
  { key: "logout", label: "Logouts", params: { type: "LOGOUT" } },
  { key: "expired", label: "Sessions expired", params: { type: "SESSION_EXPIRED" } },
  { key: "revoked", label: "Sessions ended", params: { type: "SESSION_REVOKED" } },
  { key: "pw_changed", label: "Password changed", params: { type: "PASSWORD_CHANGED" } },
  { key: "pw_reset", label: "Password reset", params: { type: "PASSWORD_RESET" } },
];
const RANGES = [
  { key: "24h", label: "Last 24 hours", ms: 24 * 3600e3 },
  { key: "7d", label: "Last 7 days", ms: 7 * 24 * 3600e3 },
  { key: "30d", label: "Last 30 days", ms: 30 * 24 * 3600e3 },
  { key: "90d", label: "Last 90 days", ms: 90 * 24 * 3600e3 },
  { key: "all", label: "All time", ms: null },
];
const PAGE = 50;

const fmtWhen = (d) => (d ? new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—");

function MethodBadge({ method, provider }) {
  if (method === "SSO") return <Badge tone="sky" size="sm">SSO{provider === "microsoft" ? " · Microsoft" : ""}</Badge>;
  if (method === "LOCAL") return <Badge size="sm" outline>Password</Badge>;
  return <span className="lr-muted">—</span>;
}

function SessionsModal({ user, isSuperAdmin, canEnd, onClose, onEnded, onOpenLearner }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    setError("");
    api.getUserSessions(user._id).then((r) => setData(r.data)).catch((err) => setError(err.message || "Failed to load sessions."));
  }, [user._id]);
  useEffect(() => { load(); }, [load]);

  const endAll = async () => {
    setBusy(true); setError("");
    try {
      await api.revokeUserSessions(user._id);
      setConfirming(false);
      load();
      onEnded();
    } catch (err) {
      setError(err.message || "Could not end the sessions.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={`Sessions · ${user.username}`}
      footer={(
        <>
          {onOpenLearner && <Button variant="ghost" icon={<PersonLinesFill size={14} />} onClick={() => onOpenLearner(user._id)}>Learner report</Button>}
          <Button variant="secondary" onClick={onClose} disabled={busy}>Close</Button>
        </>
      )}
    >
      {error && <Callout tone="danger">{error}</Callout>}
      {!data ? <Loading label="Loading sessions…" /> : (
        <div className="aa-sessions">
          <p className="aa-sessions__line">
            <span className="lr-strong">Last sign-in:</span> {fmtWhen(data.lastLoginAt)}
            {data.lastLoginMethod && <> · <MethodBadge method={data.lastLoginMethod} provider={data.lastLoginProvider} /></>}
          </p>
          <p className="aa-sessions__line">
            <span className="lr-strong">Ways to sign in:</span>{" "}
            {data.signInMethods.length ? data.signInMethods.map((m) => (m === "microsoft" ? "Microsoft SSO" : m === "local" ? "Email & password" : m)).join(", ") : "—"}
          </p>
          <h3 className="ui-h4 aa-sessions__head">Signed in on {data.sessions.length} device{data.sessions.length === 1 ? "" : "s"}</h3>
          {data.sessions.length === 0 ? <p className="ui-small">No active sessions.</p> : (
            <ul className="aa-sessions__list">
              {data.sessions.map((s) => (
                <li key={s.ref}>
                  <div>
                    <span className="lr-strong">{s.device || "Unknown device"}</span>{s.current && <Badge tone="accent" size="sm">This session</Badge>}
                    <div className="lr-sub">
                      {s.method ? <MethodBadge method={s.method} provider={s.provider} /> : "Signed in before tracking"} · since {fmtWhen(s.startedAt)} · last active {fmtWhen(s.lastSeenAt)}
                      {isSuperAdmin && s.ip ? ` · ${s.ip}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {canEnd && data.sessions.length > 0 && (
            confirming ? (
              <Callout tone="warning">
                <p className="aa-confirm">End all {data.sessions.length} session{data.sessions.length === 1 ? "" : "s"}? {user.username} will have to sign in again on every device. Their Microsoft account is not affected.</p>
                <div className="aa-confirm__actions">
                  <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy}>Cancel</Button>
                  <Button variant="danger" size="sm" loading={busy} onClick={endAll}>End sessions</Button>
                </div>
              </Callout>
            ) : (
              <Button variant="danger" size="sm" icon={<BoxArrowRight size={14} />} onClick={() => setConfirming(true)}>End all sessions</Button>
            )
          )}
        </div>
      )}
    </Modal>
  );
}

export default function AdminAuthActivity({ onOpenLearner }) {
  const { user: me } = useContext(AuthContext);
  const isSuperAdmin = me?.role === "superadmin";
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [eventKey, setEventKey] = useState("");
  const [range, setRange] = useState("7d");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionsFor, setSessionsFor] = useState(null);

  // Search waits for typing to pause.
  useEffect(() => { const t = setTimeout(() => setQ(search.trim()), 300); return () => clearTimeout(t); }, [search]);

  const params = useMemo(() => {
    const r = RANGES.find((x) => x.key === range);
    const ev = EVENT_FILTERS.find((x) => x.key === eventKey);
    return { q, ...(ev?.params || {}), ...(r?.ms ? { from: new Date(Date.now() - r.ms).toISOString() } : {}) };
  }, [q, eventKey, range]);

  const load = useCallback((pageNo) => {
    setLoading(true); setError("");
    return api.getAuthEvents({ ...params, page: pageNo, limit: PAGE })
      .then((r) => {
        setRows((prev) => (pageNo === 1 ? r.data : [...prev, ...r.data]));
        setTotal(r.total); setSummary(r.summary); setPage(pageNo);
      })
      .catch((err) => setError(err.message || "Failed to load sign-in activity."))
      .finally(() => setLoading(false));
  }, [params]);
  useEffect(() => { load(1); }, [load]);

  const csv = async () => {
    try { await api.downloadAuthEventsCsv(params); }
    catch (err) { setError(err.message || "CSV export failed."); }
  };

  return (
    <div className="lr">
      <header className="lr-head">
        <div>
          <span className="ui-eyebrow">Security</span>
          <h2 className="ui-h2">Sign-in Activity</h2>
          <p className="lr-lead">
            Logins, failed attempts, sign-outs and ended sessions, with how each person signed in.
            Kept separate from learning activity. {isSuperAdmin ? "" : "Showing your department."}
          </p>
        </div>
        <Button size="sm" icon={<Download size={14} />} onClick={csv} disabled={!total}>Export CSV</Button>
      </header>

      <div className="lr-filters">
        <div className="ui-input-group lr-filters__search">
          <Search size={14} />
          <input className="ui-input" type="search" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
        </div>
        <Select value={eventKey} onChange={(e) => setEventKey(e.target.value)} aria-label="Event">
          {EVENT_FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </Select>
        <Select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Time range">
          {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </Select>
      </div>

      {error && <Callout tone="danger">{error}</Callout>}

      {summary && (
        <div className="lr-kpis">
          <div className="lr-kpi"><span className="lr-kpi__value">{summary.ssoLogins}</span><span className="lr-kpi__label">SSO logins</span><span className="lr-kpi__hint">Microsoft</span></div>
          <div className="lr-kpi"><span className="lr-kpi__value">{summary.localLogins}</span><span className="lr-kpi__label">Password logins</span><span className="lr-kpi__hint">email & password</span></div>
          <div className={`lr-kpi${summary.failed ? " lr-kpi--danger" : ""}`}><span className="lr-kpi__value">{summary.failed}</span><span className="lr-kpi__label">Failed</span><span className="lr-kpi__hint">logins and other failed steps</span></div>
          <div className="lr-kpi"><span className="lr-kpi__value">{summary.total}</span><span className="lr-kpi__label">Events</span><span className="lr-kpi__hint">in this view</span></div>
        </div>
      )}

      {loading && !rows.length ? <Loading label="Loading sign-in activity…" /> : rows.length === 0 ? (
        <EmptyState title="No sign-in activity">Nothing matches these filters. Try a longer time range.</EmptyState>
      ) : (
        <div className="ui-table-wrap">
          <table className="ui-table lr-table">
            <thead>
              <tr>
                <th>Time</th><th>User</th><th>Method</th><th>Event</th><th>Result</th><th>Device</th>
                {isSuperAdmin && <th>IP</th>}
                <th aria-label="Sessions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="aa-time">{fmtWhen(r.at)}</td>
                  <td>
                    <span className="lr-strong">{r.user?.username || <span className="lr-muted">Unknown</span>}</span>
                    <div className="lr-sub">{r.email || ""}</div>
                  </td>
                  <td><MethodBadge method={r.method} provider={r.provider} /></td>
                  <td>
                    {EVENT_LABEL[r.type] || r.type}
                    {r.actor && <div className="lr-sub">by {r.actor}</div>}
                  </td>
                  <td>
                    {r.success ? <Badge tone="success" size="sm">Success</Badge> : <Badge tone="danger" size="sm">Failed</Badge>}
                    {r.reason && <div className="lr-sub">{REASON_LABEL[r.reason] || r.reason}</div>}
                  </td>
                  <td>{r.device || <span className="lr-muted">—</span>}</td>
                  {isSuperAdmin && <td className="aa-ip">{r.ip || "—"}</td>}
                  <td className="lr-actions">
                    {r.user && <Button variant="ghost" size="sm" onClick={() => setSessionsFor(r.user)}>Sessions</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length < total && (
        <div className="aa-more">
          <Button variant="secondary" size="sm" loading={loading} onClick={() => load(page + 1)}>Load more ({total - rows.length} left)</Button>
        </div>
      )}

      {sessionsFor && (
        <SessionsModal
          user={sessionsFor}
          isSuperAdmin={isSuperAdmin}
          canEnd={isSuperAdmin || String(sessionsFor._id) !== String(me?.id)}
          onClose={() => setSessionsFor(null)}
          onEnded={() => load(1)}
          onOpenLearner={onOpenLearner ? (id) => { setSessionsFor(null); onOpenLearner(id); } : null}
        />
      )}
    </div>
  );
}
