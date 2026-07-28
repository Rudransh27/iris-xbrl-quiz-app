// src/admin/components/AdminOverviewGrid.jsx
import React, { useState, useEffect } from "react";
import { Row, Col, Card, Spinner } from "react-bootstrap";
import {
  ArrowUpShort, BarChartLine, Check, TrophyFill, Lightbulb, JournalCheck,
} from "react-bootstrap-icons";
import api from "../services/api";

function dayLabel(dateKey) {
  // dateKey is "YYYY-MM-DD" — render as a short weekday label.
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

// 📥 Real module/topic/card counts still come from the analytics prop
// (computed by Dashboard1.jsx's deep telemetry scan). The daily-reads,
// ideas-inbox, and top-team sections below used to be 100% hardcoded
// placeholder content — this component now self-fetches real data for
// them on mount, the same pattern AdminPlatformAnalytics.jsx/
// AdminUserAnalytics.jsx already use, reusing endpoints built earlier this
// session that had no UI consumer at all (getAdminTeamStats) or were only
// wired into SuperAdminDashboard.jsx (getDailyReadParticipation).
export default function AdminOverviewGrid({ analytics, onNavigate }) {

  // Safe extraction of real backend counters calculated by deep telemetry scans
  const totalMembers = analytics?.totalUsers ?? 0;
  const activeModules = analytics?.totalModules ?? 0;
  const totalTopics = analytics?.totalTopics ?? 0;
  const totalCards = analytics?.totalCards ?? 0;
  const interactiveAssets = analytics?.interactiveAssets ?? 0;

  const [readDays, setReadDays] = useState(null);
  const [ideas, setIdeas] = useState(null);
  const [topTeam, setTopTeam] = useState(null);
  const [supplementalError, setSupplementalError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [readsRes, ideasRes, teamsRes] = await Promise.allSettled([
          api.getDailyReadParticipation(),
          api.getCouncilBoard(),
          api.getAdminTeamStats(),
        ]);
        if (cancelled) return;

        if (readsRes.status === 'fulfilled' && readsRes.value?.success) {
          setReadDays(readsRes.value.days || []);
        }

        if (ideasRes.status === 'fulfilled') {
          const list = ideasRes.value?.data || ideasRes.value || [];
          setIdeas(Array.isArray(list) ? list : []);
        }

        if (teamsRes.status === 'fulfilled' && teamsRes.value?.success) {
          const teams = teamsRes.value.teams || [];
          const best = [...teams].sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0))[0] || null;
          setTopTeam(best);
        }
      } catch (err) {
        console.error('Overview supplemental data fetch failed:', err.message);
        if (!cancelled) setSupplementalError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const sevenDayReadTotal = readDays ? readDays.reduce((sum, d) => sum + (d.count || 0), 0) : null;
  const pendingIdeas = ideas ? ideas.filter(i => i.status === 'submitted') : null;
  const mostRecentIdea = ideas && ideas.length > 0
    ? [...ideas].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;

  return (
    <div className="animate-fade-in text-start w-100" style={{ paddingBottom: "24px" }}>

      {/* 📊 1. METRICS ROW */}
      <Row className="g-3 row-cols-1 row-cols-sm-2 row-cols-md-4 mb-4">
        <Col>
          <Card className="p-3 border-0 rounded-3 shadow-sm h-100" style={{ backgroundColor: "var(--bg-tactile-cards)", borderBottom: "4px solid var(--border-tactile)" }}>
            <div className="text-muted text-uppercase font-monospace" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Total Members</div>
            <h2 className="fw-bold my-1" style={{ color: "var(--text-primary)" }}>{totalMembers}</h2>
            <div className="font-monospace text-success" style={{ fontSize: "11px" }}>
              <ArrowUpShort size={16} /> Live Directory
            </div>
          </Card>
        </Col>

        {/* Real 7-day daily-read check-in count (was a fake totalMembers*0.64 formula) */}
        <Col>
          <Card className="p-3 border-0 rounded-3 shadow-sm h-100" style={{ backgroundColor: "var(--bg-tactile-cards)", borderBottom: "4px solid var(--border-tactile)" }}>
            <div className="text-muted text-uppercase font-monospace" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Daily Read Check-ins</div>
            <h2 className="fw-bold my-1" style={{ color: "var(--text-primary)" }}>
              {sevenDayReadTotal === null ? <Spinner animation="border" size="sm" /> : sevenDayReadTotal}
            </h2>
            <div className="font-monospace text-muted" style={{ fontSize: "11px" }}>Last 7 days</div>
          </Card>
        </Col>

        <Col>
          <Card className="p-3 border-0 rounded-3 shadow-sm h-100" style={{ backgroundColor: "var(--bg-tactile-cards)", borderBottom: "4px solid var(--border-tactile)" }}>
            <div className="text-muted text-uppercase font-monospace" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Modules In Orbit</div>
            <h2 className="fw-bold my-1" style={{ color: "var(--text-primary)" }}>{activeModules}</h2>
            <div className="font-monospace text-warning" style={{ fontSize: "11px" }}>{totalTopics} topic nodes mapped</div>
          </Card>
        </Col>

        <Col>
          <Card className="p-3 border-0 rounded-3 shadow-sm h-100" style={{ backgroundColor: "var(--bg-tactile-cards)", borderBottom: "4px solid var(--border-tactile)" }}>
            <div className="text-muted text-uppercase font-monospace" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Content Blocks</div>
            <h2 className="fw-bold my-1" style={{ color: "var(--text-primary)" }}>{totalCards}</h2>
            <div className="font-monospace text-success" style={{ fontSize: "11px" }}>
              {interactiveAssets} Interactive Tasks
            </div>
          </Card>
        </Col>
      </Row>

      {/* 🧠 2. DAILY READS + IDEAS INBOX + TOP TEAM */}
      <Row className="g-4">
        {/* Daily Reads — real 7-day participation trend (was two invented headline/percentage rows) */}
        <Col lg={4}>
          <Card className="p-4 h-100 border-0 rounded-4 shadow-sm" style={{ backgroundColor: "var(--bg-tactile-cards)", border: "2px solid var(--border-tactile)" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0" style={{ fontSize: "15px" }}>Daily Reads</h5>
              <span className="badge bg-success bg-opacity-10 text-success font-monospace border border-success border-opacity-25 rounded-3 px-2 py-1">Live</span>
            </div>

            <div className="text-muted font-monospace mb-2" style={{ fontSize: "11px", textTransform: "uppercase" }}>Check-ins — Last 7 Days</div>
            {readDays === null ? (
              <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
            ) : (
              <div className="d-flex flex-column gap-1.5">
                {readDays.map((d) => (
                  <div key={d.date} className="d-flex justify-content-between align-items-center py-2 border-bottom border-opacity-25" style={{ fontSize: "13px" }}>
                    <span className="text-secondary">{dayLabel(d.date)}</span>
                    <span className="badge bg-primary bg-opacity-10 text-primary font-monospace rounded-3">{d.count} check-in{d.count === 1 ? '' : 's'}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => onNavigate("daily-reads")} className="btn btn-light btn-sm w-100 mt-3 font-monospace fw-bold border" style={{ backgroundColor: "var(--bg-global-canvas)" }}>
              + Schedule New Read
            </button>
          </Card>
        </Col>

        {/* Ideas Inbox — real pending count + most recent real idea (was one hardcoded fake entry) */}
        <Col lg={4}>
          <Card className="p-4 h-100 border-0 rounded-4 shadow-sm" style={{ backgroundColor: "var(--bg-tactile-cards)", border: "2px solid var(--border-tactile)" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0" style={{ fontSize: "15px" }}>Ideas Inbox</h5>
              {pendingIdeas !== null && (
                <span className="badge text-danger font-monospace px-2 py-1 rounded-3" style={{ backgroundColor: "rgba(220,90,48,0.1)", color: "#9a3412" }}>
                  {pendingIdeas.length} pending
                </span>
              )}
            </div>

            {ideas === null ? (
              <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
            ) : mostRecentIdea ? (
              <div className="p-3 rounded-3 border bg-opacity-25" style={{ backgroundColor: "var(--bg-global-canvas)", borderBottom: "3px solid var(--border-tactile)" }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-purple bg-purple bg-opacity-10" style={{ width: "24px", height: "24px", fontSize: "10px", color: "#7C3AED" }}>
                      {(mostRecentIdea.userName || "??").substring(0, 2).toUpperCase()}
                    </div>
                    <span className="fw-bold" style={{ fontSize: "12.5px" }}>{mostRecentIdea.userName}</span>
                  </div>
                  <span className="badge bg-warning text-dark font-monospace text-capitalize" style={{ fontSize: "10px" }}>{mostRecentIdea.status}</span>
                </div>
                <div className="fw-bold mb-1" style={{ fontSize: "13px", color: "var(--text-primary)" }}>{mostRecentIdea.title}</div>
                <p className="text-secondary m-0 mb-2" style={{ fontSize: "12px", lineHeight: "1.4" }}>{(mostRecentIdea.details || '').slice(0, 90)}{(mostRecentIdea.details || '').length > 90 ? '…' : ''}</p>
                <button className="btn btn-dark btn-sm py-1 font-monospace" onClick={() => onNavigate("ideas-review")} style={{ fontSize: '11px' }}>
                  <Check size={14} /> View Queue
                </button>
              </div>
            ) : (
              <div className="text-center text-muted py-4" style={{ fontSize: "13px" }}>No ideas submitted yet.</div>
            )}
          </Card>
        </Col>

        {/* Top Team — new, real: getAdminTeamStats had zero frontend consumer before this */}
        <Col lg={4}>
          <Card className="p-4 h-100 border-0 rounded-4 shadow-sm" style={{ backgroundColor: "var(--bg-tactile-cards)", border: "2px solid var(--border-tactile)" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0" style={{ fontSize: "15px" }}>Top Team</h5>
              <TrophyFill size={16} color="#d4a017" />
            </div>

            {topTeam === null ? (
              supplementalError
                ? <div className="text-center text-muted py-4" style={{ fontSize: "13px" }}>No team data yet.</div>
                : <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
            ) : (
              <>
                <h4 className="fw-bold mb-1" style={{ color: "var(--text-primary)" }}>{topTeam.name}</h4>
                <div className="font-monospace text-muted mb-3" style={{ fontSize: "11px" }}>{(topTeam.code || '').toUpperCase()}</div>
                <div className="d-flex justify-content-between py-2 border-bottom border-opacity-25" style={{ fontSize: "13px" }}>
                  <span className="text-secondary">Total Lightyears</span>
                  <strong style={{ color: "var(--text-primary)" }}>{(topTeam.totalXp || 0).toLocaleString()}</strong>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom border-opacity-25" style={{ fontSize: "13px" }}>
                  <span className="text-secondary">Avg / Member</span>
                  <strong style={{ color: "var(--text-primary)" }}>{topTeam.avgXp || 0}</strong>
                </div>
                {topTeam.topEarner && (
                  <div className="d-flex justify-content-between py-2" style={{ fontSize: "13px" }}>
                    <span className="text-secondary">Top Earner</span>
                    <strong style={{ color: "var(--text-primary)" }}>{topTeam.topEarner.username}</strong>
                  </div>
                )}
                <button onClick={() => onNavigate("create-team")} className="btn btn-light btn-sm w-100 mt-2 font-monospace fw-bold border" style={{ backgroundColor: "var(--bg-global-canvas)" }}>
                  View Team Hub
                </button>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
