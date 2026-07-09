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

// ─── per-question breakdown inside a sandbox card ───────────────────────────
function QuestionBreakdown({ questions }) {
  if (!questions || questions.length === 0) {
    return (
      <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
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
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '11px 14px',
            }}
          >
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              {/* icon */}
              {isMcq ? (
                q.isCorrect ? (
                  <CheckCircleFill size={15} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
                ) : (
                  <XCircleFill size={15} color="#dc2626" style={{ marginTop: 2, flexShrink: 0 }} />
                )
              ) : (
                <DashCircle size={15} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
              )}

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8', marginRight: 5 }}>Q{idx + 1}.</span>
                  {q.questionText}
                </div>

                {isMcq && (
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12 }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Answered: </span>
                      <span style={{ fontWeight: 700, color: q.isCorrect ? '#16a34a' : '#dc2626' }}>
                        {q.userAnswer || '(no answer)'}
                      </span>
                    </div>
                    {!q.isCorrect && q.correctAnswer && (
                      <div>
                        <span style={{ color: '#64748b' }}>Correct: </span>
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>{q.correctAnswer}</span>
                      </div>
                    )}
                    <div style={{ color: '#94a3b8' }}>
                      {q.points}/{q.maxPoints} pts
                    </div>
                  </div>
                )}

                {isText && (
                  <div
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      padding: '8px 10px',
                      fontSize: 12.5,
                      color: '#334155',
                      whiteSpace: 'pre-wrap',
                      marginTop: 4,
                      lineHeight: 1.6,
                    }}
                  >
                    {q.userAnswer ? q.userAnswer : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Left blank</span>
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

  const xpColor = (xp) => xp >= 200 ? '#16a34a' : xp >= 80 ? '#d97706' : '#64748b';
  const initial = (name) => (name || 'U')[0].toUpperCase();

  // ── LEFT: user list ─────────────────────────────────────────────────────
  const UserListPanel = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid #e2e8f0' }}>
        <p style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', margin: '0 0 10px' }}>
          All Users <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>({users.length})</span>
        </p>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, dept…"
            style={{ width: '100%', padding: '7px 10px 7px 28px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12.5, outline: 'none', color: '#0f172a' }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loadingList ? (
          <div className="text-center p-4"><Spinner size="sm" /></div>
        ) : listError ? (
          <div style={{ padding: 16, margin: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12.5, color: '#dc2626', lineHeight: 1.6 }}>
            <strong>Error loading users:</strong><br />{listError}
            <br /><br />
            <span style={{ color: '#64748b' }}>Restart the backend server and refresh this page.</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 24, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>No users found</div>
        ) : filtered.map((u, i) => {
          const isActive = selectedUser?._id === u._id;
          return (
            <div
              key={u._id}
              onClick={() => handleSelect(u)}
              style={{
                padding: '11px 16px',
                borderBottom: '1px solid #f1f5f9',
                borderLeft: isActive ? '3px solid #0f256e' : '3px solid transparent',
                background: isActive ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isActive ? '#0f256e' : '#e2e8f0',
                  color: isActive ? '#fff' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {initial(u.username)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.username}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.department || u.email}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: xpColor(u.xp) }}>{u.xp} XP</div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{u.cardsCompleted} cards</div>
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
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: '#94a3b8' }}>
          <PersonFill size={38} />
          <div style={{ fontSize: 13.5 }}>Select a user to view their analytics</div>
        </div>
      );
    }
    if (loadingDetail) {
      return <div className="text-center p-5 mt-4"><Spinner animation="border" style={{ color: '#0f256e' }} /></div>;
    }
    if (!detail) {
      return <div style={{ padding: 24, color: '#dc2626', fontSize: 13 }}>Failed to load analytics for this user.</div>;
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
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg,#0f256e 0%,#1d4ed8 100%)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
              {initial(user.username)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15.5, color: '#fff' }}>{user.username}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>{user.email}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{user.xp} XP</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                Joined {new Date(user.joinedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* ── stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#e2e8f0', flexShrink: 0 }}>
          {[
            { label: 'Cards Done',     value: overview.totalCardsCompleted },
            { label: 'Topics Done',    value: overview.totalTopicsCompleted },
            { label: 'Quiz Accuracy',  value: overview.quizAccuracy !== null ? `${overview.quizAccuracy}%` : 'N/A' },
            { label: 'Sandbox Cards',  value: overview.sandboxCardsAttempted },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', padding: '13px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f256e' }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── tab bar ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
          {TABS.map(({ k, label }) => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              style={{
                padding: '10px 18px', border: 'none', background: 'none',
                fontWeight: 600, fontSize: 12.5,
                color: activeTab === k ? '#0f256e' : '#64748b',
                borderBottom: activeTab === k ? '2px solid #0f256e' : '2px solid transparent',
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
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
                No sandbox cards attempted yet.
              </div>
            ) : sandboxResults.map((r, idx) => {
              const isOpen = expandedIdx === idx;
              const pct = r.percentage;
              const pctColor = pct === null ? '#94a3b8' : pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';

              return (
                <div key={idx} style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
                  {/* card header row */}
                  <div
                    onClick={() => setExpandedIdx(isOpen ? null : idx)}
                    style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: isOpen ? '#f0f9ff' : '#fff', transition: 'background 0.15s' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f172a' }}>{r.cardTitle}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                        {r.timesAttempted}× attempted · Last: {new Date(r.lastAttempted).toLocaleDateString()}
                        {r.questions?.length > 0 && ` · ${r.questions.length} questions`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: pctColor }}>{r.score}/{r.maxScore}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{pct !== null ? `${pct}%` : '—'}</div>
                    </div>
                    {pct !== null && (
                      <div style={{ width: 5, height: 38, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ width: '100%', height: `${pct}%`, background: pctColor, marginTop: `${100 - pct}%`, transition: 'height 0.4s' }} />
                      </div>
                    )}
                    {isOpen ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
                  </div>

                  {/* expanded question breakdown */}
                  {isOpen && (
                    <div style={{ padding: '4px 18px 16px', borderTop: '1px solid #e2e8f0', background: '#fafcff' }}>
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
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 22px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>
                Multiple-Choice & Code Cards
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
                {[
                  { label: 'Attempted',  value: overview.quizCardsAttempted, color: '#0f256e' },
                  { label: 'Correct',    value: overview.quizCorrect,        color: '#16a34a' },
                  { label: 'Incorrect',  value: overview.quizCardsAttempted - overview.quizCorrect, color: '#dc2626' },
                  { label: 'Accuracy',   value: overview.quizAccuracy !== null ? `${overview.quizAccuracy}%` : 'N/A',
                    color: overview.quizAccuracy >= 70 ? '#16a34a' : '#d97706' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
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
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
                No topics started yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topicProgress.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.isCompleted ? '#16a34a' : '#d97706', flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 12.5, color: '#334155' }}>
                      {t.isCompleted ? 'Completed' : 'In progress'}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f256e' }}>{t.bestXP} XP</div>
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
      <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
        <UserListPanel />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
        <DetailPanel />
      </div>
    </div>
  );
}
