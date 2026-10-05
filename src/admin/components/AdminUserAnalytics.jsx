// src/admin/components/AdminUserAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { Spinner, ProgressBar } from 'react-bootstrap';
import {
  PersonFill,
  CheckCircleFill,
  XCircleFill,
  ChevronDown,
  ChevronRight,
  Search,
  DashCircle,
} from 'react-bootstrap-icons';
import api from '../services/api';

// ─── accurate score computation from questions[] ────────────────────────────
// 🎯 CANONICAL POINT RULES (not trusted from the payload): a question's own
// reported points/maxPoints is set by whoever authored the sandbox HTML and
// is frequently left at an inconsistent placeholder value (the platform's
// documented contract even shows `maxPoints: 1` as its example) — summing
// those produced nonsense fractions like "5/5 (5 questions)" or
// "50/4 (admin graded)". Every MCQ/true_false question is worth a fixed 5
// points; every other type (text, code, or anything else) is admin-graded
// and worth up to 10 points — counted here, never summed from the payload.
const QUIZ_QUESTION_POINTS = 5;
const DESCRIPTIVE_QUESTION_POINTS = 10;

function computeScores(questions) {
  const qs    = questions || [];
  const mcqQs = qs.filter(q => q.type === 'mcq' || q.type === 'true_false');
  // Everything that isn't auto-gradable MCQ — text, code, or any other/
  // unrecognized type — is a single admin-graded bucket, each worth up to 10.
  const descQs = qs.filter(q => q.type !== 'mcq' && q.type !== 'true_false');
  return {
    autoScore: mcqQs.filter(q => q.isCorrect).length * QUIZ_QUESTION_POINTS,
    autoMax:   mcqQs.length * QUIZ_QUESTION_POINTS,
    descMax:   descQs.length * DESCRIPTIVE_QUESTION_POINTS,
    mcqCount:  mcqQs.length,
    descCount: descQs.length,
  };
}

// ─── per-question breakdown inside a sandbox card ───────────────────────────
function QuestionBreakdown({ questions }) {
  if (!questions || questions.length === 0) {
    return (
      <p style={{ color: 'var(--ui-text-3)', fontSize: 13, margin: 0 }}>
        No question data — make sure the HTML card sends{' '}
        <code>textResponses.questions</code> in its postMessage.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {questions.map((q, idx) => {
        const isMcq = q.type === 'mcq' || q.type === 'true_false';
        const isText = q.type === 'text' || q.type === 'code';

        return (
          <div
            key={q.id || idx}
            style={{
              background: 'var(--ui-surface-2)',
              border: '1px solid var(--ui-border)',
              borderRadius: 8,
              padding: '11px 14px',
            }}
          >
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              {/* icon */}
              {isMcq ? (
                q.isCorrect ? (
                  <CheckCircleFill size={15} color="var(--ui-success-text)" style={{ marginTop: 2, flexShrink: 0 }} />
                ) : (
                  <XCircleFill size={15} color="var(--ui-danger-text)" style={{ marginTop: 2, flexShrink: 0 }} />
                )
              ) : (
                <DashCircle size={15} color="var(--ui-accent-text)" style={{ marginTop: 2, flexShrink: 0 }} />
              )}

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ui-text)', marginBottom: 6 }}>
                  <span style={{ color: 'var(--ui-text-3)', marginRight: 5 }}>Q{idx + 1}.</span>
                  {q.questionText}
                </div>

                {isMcq && (
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12 }}>
                    <div>
                      <span style={{ color: 'var(--ui-text-2)' }}>Answered: </span>
                      <span style={{ fontWeight: 700, color: q.isCorrect ? 'var(--ui-success-text)' : 'var(--ui-danger-text)' }}>
                        {q.userAnswer || '(no answer)'}
                      </span>
                    </div>
                    {!q.isCorrect && q.correctAnswer && (
                      <div>
                        <span style={{ color: 'var(--ui-text-2)' }}>Correct: </span>
                        <span style={{ fontWeight: 700, color: 'var(--ui-success-text)' }}>{q.correctAnswer}</span>
                      </div>
                    )}
                    <div style={{ color: 'var(--ui-text-3)' }}>
                      {q.points}/{q.maxPoints} pts
                    </div>
                  </div>
                )}

                {isText && (
                  <div
                    style={{
                      background: 'var(--ui-surface)',
                      border: '1px solid var(--ui-border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      fontSize: 12.5,
                      color: 'var(--ui-text-2)',
                      whiteSpace: 'pre-wrap',
                      marginTop: 4,
                      lineHeight: 1.6,
                    }}
                  >
                    {q.userAnswer ? q.userAnswer : (
                      <span style={{ color: 'var(--ui-text-3)', fontStyle: 'italic' }}>Left blank</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function AdminUserAnalytics() {
  const [users, setUsers]               = useState([]);
  const [loadingList, setLoadingList]   = useState(true);
  const [listError, setListError]       = useState(null);
  const [search, setSearch]             = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detail, setDetail]             = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedIdx, setExpandedIdx]   = useState(null);
  const [activeTab, setActiveTab]       = useState('sandbox');

  useEffect(() => {
    api.getAdminUsersList()
      .then(data => {
        if (data?.success) {
          setUsers(data.users);
        } else {
          setListError(data?.message || 'Server returned an error.');
        }
      })
      .catch(err => setListError(err?.message || 'Failed to load users. Check that the backend server has been restarted.'))
      .finally(() => setLoadingList(false));
  }, []);

  const handleSelect = async (user) => {
    if (selectedUser?._id === user._id) return;
    setSelectedUser(user);
    setDetail(null);
    setExpandedIdx(null);
    setActiveTab('sandbox');
    setLoadingDetail(true);
    try {
      const data = await api.getAdminUserAnalytics(user._id);
      if (data?.success) setDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = users.filter(u =>
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const xpColor = (xp) => xp >= 200 ? 'var(--ui-success)' : xp >= 80 ? 'var(--ui-warning)' : 'var(--ui-text-2)';
  const initial = (name) => (name || 'U')[0].toUpperCase();

  // ── LEFT: user list ─────────────────────────────────────────────────────
  const UserListPanel = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-surface)' }}>
      <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid var(--ui-border)' }}>
        <p style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ui-text)', margin: '0 0 10px' }}>
          All Users <span style={{ fontWeight: 400, color: 'var(--ui-text-3)', fontSize: 12 }}>({users.length})</span>
        </p>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--ui-text-3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, dept…"
            style={{ width: '100%', padding: '7px 10px 7px 28px', border: '1.5px solid var(--ui-border)', borderRadius: 8, fontSize: 12.5, outline: 'none', color: 'var(--ui-text)' }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loadingList ? (
          <div className="text-center p-4"><Spinner size="sm" /></div>
        ) : listError ? (
          <div style={{ padding: 16, margin: 12, background: 'var(--ui-danger-soft)', border: '1px solid color-mix(in srgb, var(--ui-danger) 30%, var(--ui-surface))', borderRadius: 8, fontSize: 12.5, color: 'var(--ui-danger-text)', lineHeight: 1.6 }}>
            <strong>Error loading users:</strong><br />{listError}
            <br /><br />
            <span style={{ color: 'var(--ui-text-2)' }}>Restart the backend server and refresh this page.</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--ui-text-3)', fontSize: 13, textAlign: 'center' }}>No users found</div>
        ) : filtered.map((u, i) => {
          const isActive = selectedUser?._id === u._id;
          return (
            <div
              key={u._id}
              onClick={() => handleSelect(u)}
              style={{
                padding: '11px 16px',
                borderBottom: '1px solid var(--ui-border)',
                borderLeft: isActive ? '3px solid var(--ui-accent)' : '3px solid transparent',
                background: isActive ? 'var(--ui-accent-soft)' : 'var(--ui-surface)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isActive ? 'var(--ui-accent)' : 'var(--ui-surface-3)',
                  color: isActive ? 'var(--ui-on-accent)' : 'var(--ui-text-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {initial(u.username)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--ui-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.username}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ui-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.department || u.email}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: xpColor(u.xp) }}>{u.xp} Lightyears</div>
                  <div style={{ fontSize: 11, color: 'var(--ui-text-3)' }}>{u.cardsCompleted} cards</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── RIGHT: detail panel ─────────────────────────────────────────────────
  const DetailPanel = () => {
    if (!selectedUser) {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--ui-text-3)' }}>
          <PersonFill size={38} />
          <div style={{ fontSize: 13.5 }}>Select a user to view their analytics</div>
        </div>
      );
    }
    if (loadingDetail) {
      return <div className="text-center p-5 mt-4"><Spinner animation="border" style={{ color: 'var(--ui-accent-text)' }} /></div>;
    }
    if (!detail) {
      return <div style={{ padding: 24, color: 'var(--ui-danger-text)', fontSize: 13 }}>Failed to load analytics for this user.</div>;
    }

    const { user, overview, sandboxResults, topicProgress } = detail;

    const TABS = [
      { k: 'sandbox', label: `Sandbox Results (${sandboxResults.length})` },
      { k: 'quiz',    label: 'Quiz Performance' },
      { k: 'topics',  label: `Topics (${topicProgress.length})` },
    ];

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* ── user header ── */}
        <div style={{ padding: '20px 24px', background: 'var(--ui-accent)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'color-mix(in srgb, var(--ui-on-accent) 18%, transparent)', color: 'var(--ui-on-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
              {initial(user.username)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ui-on-accent)' }}>{user.username}</div>
              <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--ui-on-accent) 72%, transparent)' }}>{user.email}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ui-on-accent)' }}>{user.xp} Lightyears</div>
              <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--ui-on-accent) 60%, transparent)' }}>
                Joined {new Date(user.joinedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* ── stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--ui-surface-3)', flexShrink: 0 }}>
          {[
            { label: 'Cards Done',     value: overview.totalCardsCompleted },
            { label: 'Topics Done',    value: overview.totalTopicsCompleted },
            { label: 'Quiz Accuracy',  value: overview.quizAccuracy !== null ? `${overview.quizAccuracy}%` : 'N/A' },
            { label: 'Sandbox Cards',  value: overview.sandboxCardsAttempted },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--ui-surface)', padding: '13px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ui-accent-text)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--ui-text-2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── tab bar ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--ui-border)', background: 'var(--ui-surface-2)', flexShrink: 0 }}>
          {TABS.map(({ k, label }) => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              style={{
                padding: '10px 18px', border: 'none', background: 'none',
                fontWeight: 600, fontSize: 12.5,
                color: activeTab === k ? 'var(--ui-accent)' : 'var(--ui-text-2)',
                borderBottom: activeTab === k ? '2px solid var(--ui-accent)' : '2px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── tab content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* SANDBOX */}
          {activeTab === 'sandbox' && (
            sandboxResults.length === 0 ? (
              <div style={{ color: 'var(--ui-text-3)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
                No sandbox cards attempted yet.
              </div>
            ) : sandboxResults.map((r, idx) => {
              const isOpen = expandedIdx === idx;

              // Recomputed total — NOT the raw r.score/r.maxScore pair (see
              // computeScores' comment for why those are unreliable).
              const { autoScore, autoMax, descMax, descCount } = computeScores(r.questions);
              const hasAdminGrade = r.adminScore !== null && r.adminScore !== undefined;
              const totalScore = autoScore + (hasAdminGrade ? r.adminScore : 0);
              const totalMax   = autoMax + descMax;
              const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null;
              const pctColor = pct === null ? 'var(--ui-text-3)' : pct >= 70 ? 'var(--ui-success)' : pct >= 40 ? 'var(--ui-warning)' : 'var(--ui-danger)';
              const pendingGrading = descCount > 0 && !hasAdminGrade;

              return (
                <div key={idx} style={{ border: '1.5px solid var(--ui-border)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
                  {/* card header row */}
                  <div
                    onClick={() => setExpandedIdx(isOpen ? null : idx)}
                    style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: isOpen ? 'var(--ui-info-soft)' : 'var(--ui-surface)', transition: 'background 0.15s' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ui-text)' }}>{r.cardTitle}</div>
                      <div style={{ fontSize: 11, color: 'var(--ui-text-3)', marginTop: 3 }}>
                        {r.timesAttempted}× attempted · Last: {new Date(r.lastAttempted).toLocaleDateString()}
                        {r.questions?.length > 0 && ` · ${r.questions.length} questions`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: pctColor }}>
                        {totalMax > 0 ? `${totalScore}/${totalMax}` : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ui-text-3)' }}>
                        {pendingGrading ? 'pending grading' : pct !== null ? `${pct}%` : '—'}
                      </div>
                    </div>
                    {pct !== null && (
                      <div style={{ width: 5, height: 38, background: 'var(--ui-surface-3)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ width: '100%', height: `${pct}%`, background: pctColor, marginTop: `${100 - pct}%`, transition: 'height 0.4s' }} />
                      </div>
                    )}
                    {isOpen ? <ChevronDown size={14} color="var(--ui-text-2)" /> : <ChevronRight size={14} color="var(--ui-text-2)" />}
                  </div>

                  {/* expanded question breakdown */}
                  {isOpen && (
                    <div style={{ padding: '4px 18px 16px', borderTop: '1px solid var(--ui-border)', background: 'var(--ui-surface-2)' }}>
                      <div style={{ paddingTop: 12 }}>
                        <QuestionBreakdown questions={r.questions} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* QUIZ */}
          {activeTab === 'quiz' && (
            <div style={{ background: 'var(--ui-surface-2)', border: '1px solid var(--ui-border)', borderRadius: 12, padding: '18px 22px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ui-text)', marginBottom: 14 }}>
                Multiple-Choice & Code Cards
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
                {[
                  { label: 'Attempted',  value: overview.quizCardsAttempted, color: 'var(--ui-accent-text)' },
                  { label: 'Correct',    value: overview.quizCorrect,        color: 'var(--ui-success-text)' },
                  { label: 'Incorrect',  value: overview.quizCardsAttempted - overview.quizCorrect, color: 'var(--ui-danger-text)' },
                  { label: 'Accuracy',   value: overview.quizAccuracy !== null ? `${overview.quizAccuracy}%` : 'N/A',
                    color: overview.quizAccuracy >= 70 ? 'var(--ui-success-text)' : 'var(--ui-warning-text)' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--ui-text-2)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {overview.quizCardsAttempted > 0 && (
                <ProgressBar
                  now={overview.quizAccuracy || 0}
                  style={{ height: 8, borderRadius: 8 }}
                  variant={overview.quizAccuracy >= 70 ? 'success' : overview.quizAccuracy >= 40 ? 'warning' : 'danger'}
                />
              )}
            </div>
          )}

          {/* TOPICS */}
          {activeTab === 'topics' && (
            topicProgress.length === 0 ? (
              <div style={{ color: 'var(--ui-text-3)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
                No topics started yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topicProgress.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--ui-surface-2)', borderRadius: 8, border: '1px solid var(--ui-border)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.isCompleted ? 'var(--ui-success)' : 'var(--ui-warning)', flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 12.5, color: 'var(--ui-text-2)' }}>
                      {t.isCompleted ? 'Completed' : 'In progress'}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ui-accent-text)' }}>{t.bestXP} Lightyears</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', overflow: 'hidden' }}>
      <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--ui-border)', overflowY: 'auto' }}>
        <UserListPanel />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--ui-surface-2)' }}>
        <DetailPanel />
      </div>
    </div>
  );
}
