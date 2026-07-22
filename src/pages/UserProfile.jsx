// src/pages/UserProfile.jsx
// Redesigned Profile page — see build spec discussed with the user.
// Data logic preserved from the previous version (avatar upload/presets,
// XP/level, sandbox review submissions, department/team lookup); adds
// real backend-backed gamification (badges, Your Orbit tier, streak strip,
// leaderboard rank) via api.getMyGamification()/getDepartmentLeaderboard().
import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import AuthContext from "../context/AuthContext";
import api from "../admin/services/api";
import { useNavigate } from "react-router-dom";
import ChangePasswordModal from "../components/ChangePasswordModal";
import {
  PiArrowLeft, PiCameraFill, PiPencilSimpleFill, PiUploadSimpleFill,
  PiSealCheckFill, PiShieldCheckFill, PiCalendarBlankFill, PiCirclesThreeFill,
  PiLockKeyFill, PiSignOutFill, PiLightningFill, PiRocketLaunchFill, PiStackFill,
  PiMedalFill, PiTrophyFill, PiTestTubeFill, PiSparkleFill, PiEnvelopeSimpleFill,
  PiBuildingsFill, PiUsersThreeFill, PiFlaskFill, PiCaretDown, PiChatCircleTextFill,
  PiListChecksFill, PiTextAaFill,
} from "react-icons/pi";
import "./UserProfile.css";

// ── Avatar presets ────────────────────────────────────────────────────────────
const AVATAR_LIST = [
  { id: "dev",       name: "Full-Stack Engineer", emoji: "💻", color: "#7c6ef7" },
  { id: "xbrl",     name: "XBRL Architect",       emoji: "📊", color: "#10b981" },
  { id: "regtech",  name: "RegTech Lead",          emoji: "🏢", color: "#f59e0b" },
  { id: "validator",name: "Validation Expert",     emoji: "⚡", color: "#8b5cf6" },
];

const BADGE_ICONS = {
  first_launch:  PiRocketLaunchFill,
  streak_5:      PiCalendarBlankFill,
  sharp_shooter: PiTestTubeFill,
  idea_spark:    PiSparkleFill,
  module_master: PiStackFill,
  top_10:        PiTrophyFill,
};

// Rotating pastel-rainbow accent per badge — same rotation convention as the
// dashboard calendar's --orbit-rose/pink/mint/teal/sky/lavender cells.
const BADGE_ACCENTS = {
  first_launch:  "rose",
  streak_5:      "pink",
  sharp_shooter: "mint",
  idea_spark:    "teal",
  module_master: "sky",
  top_10:        "lavender",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const maskEmail = (email) => {
  if (!email || typeof email !== "string") return "–";
  const [username, domain] = email.split("@");
  if (!domain) return email;
  const visible = username.substring(0, 2);
  const masked = "*".repeat(Math.max(0, username.length - 2));
  return `${visible}${masked}@${domain}`;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function UserProfile() {
  const { user, logout, refreshUser, loading: authLoading } = useContext(AuthContext);
  const [stats,           setStats]           = useState(null);
  const [loadingStats,    setLoadingStats]    = useState(true);
  const [depts,           setDepts]           = useState([]);
  const [isEditing,       setIsEditing]       = useState(false);
  const [selectedAvatar,  setSelectedAvatar]  = useState("dev");
  const [avatarPreview,   setAvatarPreview]   = useState("");
  const [isUpdating,      setIsUpdating]      = useState(false);
  const [sandboxResults,  setSandboxResults]  = useState([]);
  const [sandboxLoading,  setSandboxLoading]  = useState(false);
  const [expandedCard,    setExpandedCard]    = useState(null);
  const [gamification,    setGamification]    = useState(null);
  const [leaderboard,     setLeaderboard]     = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const bio = localStorage.getItem("orbit_profile_bio") || "";

  const syncTelemetry = useCallback(async () => {
    if (!user) return;
    try {
      if (typeof refreshUser === "function") await refreshUser();
      const data = await api.getUserProgress();
      setStats(data);
    } catch (e) {
      console.error(e.message);
    } finally {
      setLoadingStats(false);
    }
  }, [refreshUser, user?.id]);

  useEffect(() => {
    const fetchDepts = async () => {
      try { const d = await api.getDepartments(); setDepts(d || []); } catch {}
    };
    if (!authLoading && user) {
      fetchDepts();
      syncTelemetry();
      setSandboxLoading(true);
      api.getMySandboxResults()
        .then(d => setSandboxResults(d?.sandboxResults || []))
        .catch(() => setSandboxResults([]))
        .finally(() => setSandboxLoading(false));
      api.getMyGamification()
        .then(res => setGamification(res?.data || null))
        .catch(() => setGamification(null));
      api.getDepartmentLeaderboard()
        .then(res => setLeaderboard(res || null))
        .catch(() => setLeaderboard(null));
    }
  }, [authLoading, user?.id, syncTelemetry]);

  useEffect(() => {
    const onFocus = () => syncTelemetry();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [syncTelemetry]);

  useEffect(() => {
    if (user) {
      setSelectedAvatar(user.avatarId || "dev");
      setAvatarPreview(user.avatarId === "custom" ? user.avatarUrl || "" : "");
    }
  }, [user?.avatarId, user?.avatarUrl]);

  useEffect(() => {
    if (!authLoading && !loadingStats && !user) navigate("/login");
  }, [user, authLoading, loadingStats, navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUpdating(true);
    try {
      const url = await api.uploadImage(file);
      await api.updateProfile({ username: user.username, avatarId: "custom", avatarUrl: url });
      setAvatarPreview(url);
      setSelectedAvatar("custom");
      await refreshUser();
    } catch (err) { console.error(err.message); }
    finally { setIsUpdating(false); }
  };

  const handleSelectPreset = async (id) => {
    setIsUpdating(true);
    try {
      await api.updateProfile({ username: user.username, avatarId: id, avatarUrl: id === "custom" ? avatarPreview : "" });
      setSelectedAvatar(id);
      await refreshUser();
      setIsEditing(false);
    } catch (err) { console.error(err.message); }
    finally { setIsUpdating(false); }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || loadingStats) {
    return (
      <div style={{
        minHeight: "60vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "14px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          border: "3px solid var(--orbit-border)",
          borderTopColor: "var(--orbit-brand)",
          animation: "orbit-spin 0.85s linear infinite",
        }} />
        <p style={{ fontSize: "13px", color: "var(--orbit-text-muted)", fontWeight: "600", margin: 0 }}>
          Syncing profile…
        </p>
      </div>
    );
  }
  if (!user) return null;

  // ── Score engine: compute MCQ vs Descriptive separately ──────────────────
  // Every MCQ/true_false question is worth a fixed 5 points; every other type
  // (text, code, or anything else) is admin-graded and worth up to 10 points
  // — a question's own reported points/maxPoints is an unreliable, frequently
  // inconsistent placeholder set by whoever authored the sandbox HTML.
  const QUIZ_QUESTION_POINTS = 5;
  const DESCRIPTIVE_QUESTION_POINTS = 10;
  const computeScores = (questions) => {
    const qs    = questions || [];
    const mcqQs = qs.filter(q => q.type === "mcq" || q.type === "true_false");
    const descQs = qs.filter(q => q.type !== "mcq" && q.type !== "true_false");
    return {
      autoScore: mcqQs.filter(q => q.isCorrect).length * QUIZ_QUESTION_POINTS,
      autoMax:   mcqQs.length * QUIZ_QUESTION_POINTS,
      descMax:   descQs.length * DESCRIPTIVE_QUESTION_POINTS,
      mcqCount:  mcqQs.length,
      descCount: descQs.length,
    };
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const xpPerLevel       = 500;
  const currentLevel     = Math.floor((user.xp || 0) / xpPerLevel) + 1;
  const isAdmin          = user.role === "admin" || user.role === "superadmin";

  const deptDoc          = depts.find(d => d._id === user.department || d.code === user.department);
  const deptLabel        = deptDoc?.name || "General Operations";
  const teamLabel        = deptDoc?.teams?.find(t => t._id === user.team)?.name || "General Assignment";

  const activeAvatar     = AVATAR_LIST.find(a => a.id === (user.avatarId || "dev")) || AVATAR_LIST[0];
  const hasCustom        = Boolean(user.avatarUrl && user.avatarId === "custom");
  const avatarSrc        = hasCustom ? user.avatarUrl : (selectedAvatar === "custom" ? avatarPreview : null);

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "Recently";

  const canChangePassword = user.authProvider !== "microsoft";
  const badges       = gamification?.badges || [];
  const badgesEarned = badges.filter(b => b.unlocked).length;
  const orbitTier    = gamification?.orbitTier || null;
  const last7Days    = gamification?.last7Days || [];
  const myRank       = leaderboard?.myRank ?? null;

  return (
    <div className="up-page">
      <div className="up-header-card">
        {/* ═══════════════════ COVER BANNER ═══════════════════════════════ */}
        <div className="up-banner">
          {[
            { size: 220, top: "-50px", right: "-50px", op: 0.22 },
            { size: 110, top: "16px",  right: "24px",  op: 0.32 },
            { size: 150, bottom: "-50px", left: "-40px", op: 0.18 },
          ].map((r, i) => (
            <div key={i} aria-hidden="true" className="up-banner__ring" style={{
              top: r.top, right: r.right, bottom: r.bottom, left: r.left,
              width: r.size, height: r.size, animationDelay: `${i * 1.5}s`,
            }} />
          ))}
          <button className="up-back-btn" onClick={() => navigate(-1)}>
            <PiArrowLeft size={13} /> Back
          </button>
          <span className="up-role-badge">
            {user.role === "superadmin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Member"}
          </span>
        </div>

        {/* ── Avatar + identity row ───────────────────────────────────────── */}
        <div className="up-header-body">
          <div className="up-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
            <div className="up-avatar" style={{
              background: avatarSrc
                ? `url(${avatarSrc}) center/cover no-repeat`
                : `linear-gradient(135deg, ${activeAvatar.color}, #7c3aed)`,
            }}>
              {!avatarSrc && <span className="up-avatar__emoji">{isUpdating ? "⏳" : activeAvatar.emoji}</span>}
              <div className="up-avatar__cam-overlay">
                <PiCameraFill size={15} />
                <span>Edit Photo</span>
              </div>
            </div>
          </div>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />

          <div className="up-identity">
            <div className="up-name-row">
              <h1 className="up-name">{user.username || "Orbiter"}</h1>
              {isAdmin && (
                <span className="up-pill up-pill--role">
                  <PiShieldCheckFill size={11} /> {user.role === "superadmin" ? "Superadmin" : "Admin"}
                </span>
              )}
              {user.isVerified && (
                <span className="up-pill up-pill--verified">
                  <PiSealCheckFill size={11} /> Verified
                </span>
              )}
            </div>

            {bio ? (
              <p className="up-bio">"{bio}"</p>
            ) : (
              <p className="up-bio up-bio--empty">No bio yet — add one during onboarding</p>
            )}

            <div className="up-meta-row">
              <span><PiCirclesThreeFill size={12} /> {activeAvatar.name}</span>
              <span><PiCalendarBlankFill size={12} /> Joined {joinDate}</span>
            </div>
          </div>

          <div className="up-header-actions">
            <button className="up-btn" onClick={() => setIsEditing(!isEditing)}>
              <PiPencilSimpleFill size={13} /> {isEditing ? "Close" : "Edit Profile"}
            </button>
            {canChangePassword && (
              <button className="up-btn" onClick={() => setShowPasswordModal(true)}>
                <PiLockKeyFill size={13} /> Change Password
              </button>
            )}
            <button className="up-btn up-btn--danger" onClick={handleLogout}>
              <PiSignOutFill size={13} /> Log Out
            </button>
          </div>
        </div>

        {/* ── Avatar preset editor (collapsible) ──────────────────────────── */}
        {isEditing && (
          <div className="up-editor">
            <p className="up-editor__title">Choose Specialty Track</p>
            <div className="up-preset-grid">
              {AVATAR_LIST.map((av) => (
                <div
                  key={av.id}
                  className={`up-preset-card ${selectedAvatar === av.id ? "up-preset-card--active" : ""}`}
                  onClick={() => handleSelectPreset(av.id)}
                >
                  <div className="up-preset-card__emoji">{av.emoji}</div>
                  <div className="up-preset-card__label">{av.name}</div>
                </div>
              ))}
            </div>
            <button className="up-upload-btn" onClick={() => fileInputRef.current?.click()}>
              <PiUploadSimpleFill size={14} /> Upload Custom Photo
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════ YOUR STATS ═════════════════════════════════════ */}
      <div className="up-card">
        <div className="up-card__head">
          <p className="up-card__title"><PiLightningFill size={14} /> Your Stats</p>
          {myRank && (
            <span className="up-rank-pill">
              <PiTrophyFill size={12} /> #{myRank} in {deptLabel} dept this month
            </span>
          )}
        </div>
        <div className="up-stats-grid">
          {[
            { icon: PiLightningFill,     label: "Plasma",           value: user.xp || 0,     accent: "lavender" },
            { icon: PiRocketLaunchFill,  label: "Day Streak",       value: user?.streak || 0, accent: "pink" },
            { icon: PiStackFill,         label: "Modules Mastered", value: stats?.completedModulesCount ?? 0, accent: "teal" },
            { icon: PiMedalFill,         label: "Badges Earned",    value: badgesEarned,     accent: "sky" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`up-stat-tile up-stat-tile--${s.accent}`}>
                <div className="up-stat-tile__icon"><Icon size={19} /></div>
                <div className="up-stat-tile__value">{s.value}</div>
                <div className="up-stat-tile__label">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════ YOUR ORBIT ═════════════════════════════════════ */}
      {orbitTier && (
        <div className="up-card">
          <div className="up-card__head">
            <p className="up-card__title"><PiCirclesThreeFill size={14} /> Your Orbit · three orbits to clear</p>
          </div>
          <div className="up-orbit-list">
            {orbitTier.tiers.map((tier) => {
              const isCurrent = tier.status === "current";
              const isLocked  = tier.status === "locked";
              const pct = isCurrent && orbitTier.xpForNextTier
                ? Math.min((orbitTier.xpIntoTier / orbitTier.xpForNextTier) * 100, 100)
                : isCurrent ? 100 : 0;
              return (
                <div key={tier.key} className={`up-orbit-tier ${isCurrent ? "up-orbit-tier--current" : ""} ${isLocked ? "up-orbit-tier--locked" : ""}`}>
                  <div className="up-orbit-tier__badge">{tier.order}</div>
                  <div className="up-orbit-tier__body">
                    <div className="up-orbit-tier__top">
                      <span className="up-orbit-tier__title">{tier.label}</span>
                      <span className="up-orbit-tier__status">
                        {isCurrent ? "Your Orbit" : isLocked ? "Locked" : "Cleared"}
                      </span>
                    </div>
                    <p className="up-orbit-tier__desc">{tier.desc || tierDescription(tier.key)}</p>
                    {isCurrent && (
                      <>
                        <div className="up-orbit-tier__rail">
                          <div className="up-orbit-tier__fill" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="up-orbit-tier__xp-label">
                          {orbitTier.xpForNextTier
                            ? `${orbitTier.xpIntoTier} / ${orbitTier.xpForNextTier} Plasma`
                            : `${orbitTier.xpIntoTier} Plasma · top orbit`}
                        </p>
                      </>
                    )}
                    {isLocked && (
                      <p className="up-orbit-tier__xp-label">
                        Unlocks when {tier.order + 1 <= 3 ? `Orbit ${tier.order + 1}` : "the previous orbit"} is cleared.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════ STREAK + ACHIEVEMENTS ══════════════════════════ */}
      <div className="up-two-col">
        <div className="up-card">
          <div className="up-card__head">
            <p className="up-card__title"><PiRocketLaunchFill size={14} /> Streak</p>
          </div>
          <p className="up-streak-count">{user?.streak || 0}<span>day streak</span></p>
          <div className="up-streak-strip">
            {last7Days.length > 0 ? last7Days.map((d, i) => (
              <div key={d.date} className={`up-streak-day ${d.active ? "up-streak-day--done" : ""}`}>
                <span className="up-streak-day__label">{DAY_LABELS[i]}</span>
                <span className="up-streak-day__dot">{d.active ? <PiSealCheckFill size={13} /> : ""}</span>
              </div>
            )) : DAY_LABELS.map((label) => (
              <div key={label} className="up-streak-day">
                <span className="up-streak-day__label">{label}</span>
                <span className="up-streak-day__dot" />
              </div>
            ))}
          </div>
        </div>

        <div className="up-card">
          <div className="up-card__head">
            <p className="up-card__title"><PiMedalFill size={14} /> Achievements</p>
            <span className="up-rank-pill">{badgesEarned} of {badges.length || 6} unlocked</span>
          </div>
          <div className="up-badge-grid">
            {(badges.length ? badges : Object.keys(BADGE_ICONS).map(key => ({ key, label: key, unlocked: false }))).map((b) => {
              const Icon = BADGE_ICONS[b.key] || PiMedalFill;
              const accentClass = b.unlocked ? `up-badge-tile--${BADGE_ACCENTS[b.key] || "lavender"}` : "up-badge-tile--locked";
              return (
                <div key={b.key} className={`up-badge-tile ${accentClass}`}>
                  <div className="up-badge-tile__icon"><Icon size={18} /></div>
                  <div className="up-badge-tile__label">{b.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════ ACCOUNT DETAILS ═════════════════════════════════ */}
      <div className="up-card">
        <div className="up-card__head">
          <p className="up-card__title"><PiEnvelopeSimpleFill size={14} /> Account Details</p>
        </div>
        <div className="up-info-grid">
          {[
            { icon: PiEnvelopeSimpleFill, label: "Email",           value: maskEmail(user?.email) },
            { icon: PiBuildingsFill,      label: "Department",      value: deptLabel },
            { icon: PiUsersThreeFill,     label: "Team",            value: teamLabel },
            { icon: PiCirclesThreeFill,   label: "Specialty Track", value: activeAvatar.name },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="up-info-tile">
                <div className="up-info-tile__icon"><Icon size={15} /></div>
                <div style={{ minWidth: 0 }}>
                  <p className="up-info-tile__label">{item.label}</p>
                  <p className="up-info-tile__value">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════ SANDBOX REVIEWS ═════════════════════════════════ */}
      <div className="up-card">
        <div className="up-card__head">
          <p className="up-card__title"><PiFlaskFill size={14} /> Sandbox Reviews</p>
          {sandboxResults.length > 0 && (
            <span className="up-rank-pill">{sandboxResults.length} submission{sandboxResults.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {sandboxLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--orbit-text-muted)", fontSize: "13px" }}>
            Loading submissions…
          </div>
        ) : sandboxResults.length === 0 ? (
          <div className="up-empty-state">
            <span className="up-empty-state__icon"><PiFlaskFill size={30} /></span>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", maxWidth: "280px" }}>
              No sandbox submissions yet. Complete a sandbox card to see your results here.
            </p>
          </div>
        ) : (
          <div className="up-sandbox-list">
            {sandboxResults.map((card, i) => {
              const { autoScore, autoMax, descMax, mcqCount, descCount } = computeScores(card.questions);
              const adminScore    = card.adminScore    ?? null;
              const adminFeedback = card.adminFeedback || "";
              const totalMax      = autoMax + descMax;
              const totalScore    = autoScore + (adminScore || 0);
              const isExpanded    = expandedCard === i;
              const isGraded      = adminScore !== null;

              return (
                <div key={i} className={`up-sandbox-card ${isGraded ? "up-sandbox-card--graded" : ""}`}>
                  <div className="up-sandbox-card__header" onClick={() => setExpandedCard(isExpanded ? null : i)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span className="up-sandbox-card__title">{card.cardTitle || "Untitled Card"}</span>
                        {isGraded ? (
                          <span className="up-pill up-pill--verified"><PiSealCheckFill size={10} /> Graded</span>
                        ) : descCount > 0 ? (
                          <span className="up-pill up-pill--pending">Pending Review</span>
                        ) : null}
                      </div>
                      <div className="up-sandbox-card__module">{card.moduleTitle || ""}</div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      {mcqCount > 0 && (
                        <span className="up-score-chip up-score-chip--mcq"><PiListChecksFill size={11} /> {autoScore}/{autoMax}</span>
                      )}
                      {descCount > 0 && (
                        <span className={`up-score-chip ${isGraded ? "up-score-chip--desc-graded" : "up-score-chip--desc"}`}>
                          <PiTextAaFill size={11} /> {isGraded ? `${adminScore}/${descMax}` : `?/${descMax}`}
                        </span>
                      )}
                      {totalMax > 0 && <span className="up-score-chip up-score-chip--total">{totalScore}/{totalMax}</span>}
                      <PiCaretDown size={14} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", color: "var(--orbit-text-muted)" }} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="up-sandbox-card__detail">
                      {adminFeedback && (
                        <div className="up-feedback-banner">
                          <p className="up-feedback-banner__label"><PiChatCircleTextFill size={11} style={{ display: "inline", marginRight: 4 }} />Admin Feedback</p>
                          <p className="up-feedback-banner__text">{adminFeedback}</p>
                        </div>
                      )}

                      {(card.questions || []).length > 0 ? (
                        card.questions.map((q, qi) => {
                          const isDesc = q.type === "text" || q.type === "code";
                          return (
                            <div key={qi} className="up-question">
                              <div className="up-question__head">
                                <span className={`up-question__type ${isDesc ? "up-question__type--desc" : "up-question__type--mcq"}`}>
                                  {q.type === "true_false" ? "T/F" : q.type || "MCQ"}
                                </span>
                                <p className="up-question__text">{q.questionText || `Question ${qi + 1}`}</p>
                                {!isDesc && (
                                  <span className={`up-question__correctness ${q.isCorrect ? "up-question__correctness--right" : "up-question__correctness--wrong"}`}>
                                    {q.isCorrect ? "Correct" : "Incorrect"}
                                    {q.maxPoints ? ` · ${q.points || 0}/${q.maxPoints}` : ""}
                                  </span>
                                )}
                              </div>
                              {isDesc && q.userAnswer && (
                                <div className="up-question__answer">
                                  <p className="up-question__answer-label">Your Response</p>
                                  <pre className="up-question__answer-text" style={{ fontFamily: q.type === "code" ? "'Fira Code', 'Courier New', monospace" : "inherit" }}>
                                    {q.userAnswer}
                                  </pre>
                                </div>
                              )}
                              {isDesc && q.maxPoints && (
                                <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--orbit-text-muted)", fontWeight: "600" }}>
                                  Worth {q.maxPoints} point{q.maxPoints !== 1 ? "s" : ""} · admin graded
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ margin: "14px 0 0", fontSize: "12px", color: "var(--orbit-text-muted)", textAlign: "center" }}>
                          No detailed question breakdown available.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}

function tierDescription(key) {
  if (key === "practitioner") return "Master the present — what IRIS does, who we compete with, how the market works.";
  if (key === "strategist")   return "See the gaps. Shape what comes next. Competitive depth, deal patterns, market white space.";
  if (key === "architect")    return "Build what isn't yet. Agentic AI, white-space scans, product specs that go to leadership.";
  return "";
}
