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
import AccountSecurityModal from "../components/AccountSecurityModal";
import {
  PiArrowLeft, PiCameraFill, PiPencilSimpleFill, PiUploadSimpleFill,
  PiSealCheckFill, PiShieldCheckFill, PiCalendarBlankFill, PiCirclesThreeFill,
  PiLockKeyFill, PiSignOutFill, PiLightningFill, PiRocketLaunchFill, PiStackFill,
  PiMedalFill, PiTrophyFill, PiTestTubeFill, PiSparkleFill, PiEnvelopeSimpleFill,
  PiBuildingsFill, PiUsersThreeFill, PiFlaskFill, PiCaretDown, PiChatCircleTextFill,
  PiListChecksFill, PiTextAaFill, PiShootingStarFill, PiSignInFill,
} from "react-icons/pi";
import "./UserProfile.css";

// ── Avatar presets ────────────────────────────────────────────────────────────
const AVATAR_LIST = [
  { id: "dev",       name: "Full-Stack Engineer", emoji: "💻" },
  { id: "xbrl",     name: "XBRL Architect",       emoji: "📊" },
  { id: "regtech",  name: "RegTech Lead",          emoji: "🏢" },
  { id: "validator",name: "Validation Expert",     emoji: "⚡" },
];

const BADGE_ICONS = {
  first_launch:  PiRocketLaunchFill,
  streak_5:      PiCalendarBlankFill,
  sharp_shooter: PiTestTubeFill,
  idea_spark:    PiSparkleFill,
  module_master: PiStackFill,
  top_10:        PiTrophyFill,
};

// Per-badge icon-tile tone (ui-icon-tile--<tone>) — only to tell badges apart;
// an empty string is the default accent tile.
const BADGE_ACCENTS = {
  first_launch:  "rose",
  streak_5:      "amber",
  sharp_shooter: "green",
  idea_spark:    "teal",
  module_master: "sky",
  top_10:        "",
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
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [regionsList,     setRegionsList]     = useState([]);
  const [savingRegions,   setSavingRegions]   = useState(false);
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
    const fetchRegions = async () => {
      try { const res = await api.getRegions(); setRegionsList(res?.data || []); } catch {}
    };
    if (!authLoading && user) {
      fetchDepts();
      fetchRegions();
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

  const userRegionIds = (user?.regions || []).map(r => (r && r._id ? r._id : r)?.toString());

  const handleToggleRegion = async (regionId) => {
    const next = userRegionIds.includes(regionId)
      ? userRegionIds.filter(id => id !== regionId)
      : [...userRegionIds, regionId];
    setSavingRegions(true);
    try {
      await api.updateProfile({ username: user.username, regions: next });
      await refreshUser();
    } catch (err) { console.error(err.message); }
    finally { setSavingRegions(false); }
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
      <div className="ui-loading">
        <span className="ui-spinner ui-spinner--lg" role="status" aria-label="Loading" />
        <span>Syncing profile…</span>
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
  const userRegionDocs   = regionsList.filter(r => userRegionIds.includes(r._id));
  const regionLabel      = userRegionDocs.length > 0 ? userRegionDocs.map(r => r.name).join(", ") : "All regions";

  const activeAvatar     = AVATAR_LIST.find(a => a.id === (user.avatarId || "dev")) || AVATAR_LIST[0];
  const hasCustom        = Boolean(user.avatarUrl && user.avatarId === "custom");
  const avatarSrc        = hasCustom ? user.avatarUrl : (selectedAvatar === "custom" ? avatarPreview : null);

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "Recently";

  // From the sign-in system (/auth/validate), never typed in by anyone.
  const SIGN_IN_LABEL = { SSO: "Microsoft SSO", LOCAL: "Email & password" };
  const lastSignIn = user.lastLoginAt
    ? `${new Date(user.lastLoginAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}${user.lastLoginMethod ? ` · ${SIGN_IN_LABEL[user.lastLoginMethod] || user.lastLoginMethod}` : ""}`
    : null;
  // Only accounts that have an IRIS Orbit password can change it — accounts
  // that sign in with Microsoft have none (and aren't given one).
  const canChangePassword = Array.isArray(user.signInMethods)
    ? user.signInMethods.includes("local")
    : user.authProvider !== "microsoft";
  const badges       = gamification?.badges || [];
  const badgesEarned = badges.filter(b => b.unlocked).length;
  const orbitTier    = gamification?.orbitTier || null;
  const last7Days    = gamification?.last7Days || [];
  const myRank       = leaderboard?.myRank ?? null;

  const roleLabel = user.role === "superadmin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Member";

  return (
    <div className="ui-page up-page">
      <div className="up-topbar">
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => navigate(-1)}>
          <PiArrowLeft size={14} /> Back
        </button>
      </div>

      <div className="ui-card up-header-card">
        {/* ── Avatar + identity row ───────────────────────────────────────── */}
        <div className="up-header-body">
          <div className="up-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
            <div
              className="ui-avatar ui-avatar--lg up-avatar"
              style={avatarSrc ? { backgroundImage: `url(${avatarSrc})` } : undefined}
            >
              {!avatarSrc && <span className="up-avatar__emoji">{isUpdating ? "⏳" : activeAvatar.emoji}</span>}
              <div className="up-avatar__cam-overlay">
                <PiCameraFill size={15} />
                <span>Edit Photo</span>
              </div>
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="up-file-input" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />

          <div className="up-identity">
            <div className="up-name-row">
              <h1 className="ui-h1 up-name">{user.username || "Orbiter"}</h1>
              <span className="ui-badge ui-badge--accent">
                {isAdmin && <PiShieldCheckFill size={12} />} {roleLabel}
              </span>
              {user.isVerified && (
                <span className="ui-badge ui-badge--success">
                  <PiSealCheckFill size={12} /> Verified
                </span>
              )}
            </div>

            {bio ? (
              <p className="up-bio">"{bio}"</p>
            ) : (
              <p className="up-bio up-bio--empty">No bio yet — add one during onboarding</p>
            )}

            <div className="up-meta-row">
              <span><PiBuildingsFill size={14} /> {deptLabel}</span>
              <span><PiCirclesThreeFill size={14} /> {activeAvatar.name}</span>
              <span><PiCalendarBlankFill size={14} /> Joined {joinDate}</span>
              {lastSignIn && <span title="Your most recent sign-in"><PiSignInFill size={14} /> Last sign-in {lastSignIn}</span>}
            </div>
          </div>

          <div className="up-header-actions">
            <button className="ui-btn ui-btn--secondary" onClick={() => setIsEditing(!isEditing)}>
              <PiPencilSimpleFill size={14} /> {isEditing ? "Close" : "Edit Profile"}
            </button>
            {canChangePassword && (
              <button className="ui-btn ui-btn--secondary" onClick={() => setShowSecurityModal(true)}>
                <PiLockKeyFill size={14} /> Change Password
              </button>
            )}
            <button className="ui-btn ui-btn--danger-soft" onClick={handleLogout}>
              <PiSignOutFill size={14} /> Log Out
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
            <button className="ui-btn ui-btn--secondary ui-btn--block" onClick={() => fileInputRef.current?.click()}>
              <PiUploadSimpleFill size={14} /> Upload Custom Photo
            </button>

            {regionsList.length > 0 && (
              <>
                <p className="up-editor__title up-editor__title--spaced">
                  Your Region(s) {savingRegions && <span className="up-saving">· saving…</span>}
                </p>
                <div className="up-region-row">
                  {regionsList.map((r) => {
                    const isSelected = userRegionIds.includes(r._id);
                    return (
                      <button
                        key={r._id}
                        type="button"
                        disabled={savingRegions}
                        onClick={() => handleToggleRegion(r._id)}
                        className={`up-preset-card up-preset-card--chip ${isSelected ? "up-preset-card--active" : ""}`}
                      >
                        <span className="up-region-dot" style={{ backgroundColor: r.color || "var(--ui-accent)" }} />
                        <span className="up-preset-card__label">{r.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="up-bio up-bio--empty up-editor__hint">
                  No region selected means you see content from every region.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════ YOUR STATS ═════════════════════════════════════ */}
      <section className="up-block">
        <div className="up-card__head">
          <p className="up-card__title"><PiLightningFill size={16} /> Your Stats</p>
          {myRank && (
            <span className="ui-badge ui-badge--accent">
              <PiTrophyFill size={12} /> #{myRank} in {deptLabel} dept this month
            </span>
          )}
        </div>
        <div className="ui-stat-strip">
          {[
            { icon: PiShootingStarFill,  label: "Lightyears",        value: user.xp || 0 },
            { icon: PiRocketLaunchFill,  label: "Day Streak",       value: user?.streak || 0 },
            { icon: PiStackFill,         label: "Modules Mastered", value: stats?.completedModulesCount ?? 0 },
            { icon: PiMedalFill,         label: "Badges Earned",    value: badgesEarned },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="ui-stat">
                <span className="ui-stat__value">{s.value}</span>
                <span className="ui-stat__label up-stat-label"><Icon size={14} /> {s.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════ YOUR ORBIT ═════════════════════════════════════ */}
      {orbitTier && (
        <section className="up-block">
          <div className="up-card__head">
            <p className="up-card__title"><PiCirclesThreeFill size={16} /> Your Orbit · three orbits to clear</p>
          </div>
          <div className="ui-list up-orbit-list">
            {orbitTier.tiers.map((tier) => {
              const isCurrent = tier.status === "current";
              const isLocked  = tier.status === "locked";
              const pct = isCurrent && orbitTier.xpForNextTier
                ? Math.min((orbitTier.xpIntoTier / orbitTier.xpForNextTier) * 100, 100)
                : isCurrent ? 100 : 0;
              return (
                <div key={tier.key} className={`ui-list-item up-orbit-tier ${isCurrent ? "up-orbit-tier--current" : ""} ${isLocked ? "up-orbit-tier--locked" : ""}`}>
                  <span className={`ui-index${isCurrent ? " ui-index--active" : ""}`}>{String(tier.order).padStart(2, "0")}</span>
                  <div className="up-orbit-tier__body">
                    <div className="up-orbit-tier__top">
                      <span className="up-orbit-tier__title">{tier.label}</span>
                      <span className={`ui-badge ui-badge--sm${isCurrent ? " ui-badge--accent" : isLocked ? "" : " ui-badge--success"}`}>
                        {isCurrent ? "Your Orbit" : isLocked ? "Locked" : "Cleared"}
                      </span>
                    </div>
                    <p className="up-orbit-tier__desc">{tier.desc || tierDescription(tier.key)}</p>
                    {isCurrent && (
                      <>
                        <div className="ui-progress">
                          <div className="ui-progress__bar" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="up-orbit-tier__xp-label">
                          {orbitTier.xpForNextTier
                            ? `${orbitTier.xpIntoTier} / ${orbitTier.xpForNextTier} Lightyears`
                            : `${orbitTier.xpIntoTier} Lightyears · top orbit`}
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
        </section>
      )}

      {/* ═══════════════════ STREAK + ACHIEVEMENTS ══════════════════════════ */}
      <div className="up-two-col">
        <section className="up-block">
          <div className="up-card__head">
            <p className="up-card__title"><PiRocketLaunchFill size={16} /> Streak</p>
          </div>
          <div className="ui-card up-block__body">
            <p className="up-streak-count">{user?.streak || 0}<span>day streak</span></p>
            <div className="up-streak-strip">
              {last7Days.length > 0 ? last7Days.map((d, i) => (
                <div key={d.date} className={`up-streak-day ${d.active ? "up-streak-day--done" : ""}`}>
                  <span className="up-streak-day__label">{DAY_LABELS[i]}</span>
                  <span className="up-streak-day__dot">{d.active ? <PiSealCheckFill size={14} /> : ""}</span>
                </div>
              )) : DAY_LABELS.map((label) => (
                <div key={label} className="up-streak-day">
                  <span className="up-streak-day__label">{label}</span>
                  <span className="up-streak-day__dot" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="up-block">
          <div className="up-card__head">
            <p className="up-card__title"><PiMedalFill size={16} /> Achievements</p>
            <span className="ui-badge ui-badge--accent">{badgesEarned} of {badges.length || 6} unlocked</span>
          </div>
          <div className="ui-card up-block__body">
            <div className="up-badge-grid">
              {(badges.length ? badges : Object.keys(BADGE_ICONS).map(key => ({ key, label: key, unlocked: false }))).map((b) => {
                const Icon = BADGE_ICONS[b.key] || PiMedalFill;
                const tone = b.unlocked ? (BADGE_ACCENTS[b.key] || "") : "neutral";
                return (
                  <div key={b.key} className={`up-badge-tile ${b.unlocked ? "" : "up-badge-tile--locked"}`}>
                    <span className={`ui-icon-tile${tone ? ` ui-icon-tile--${tone}` : ""}`}><Icon size={20} /></span>
                    <div className="up-badge-tile__label">{b.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════════════ ACCOUNT DETAILS ═════════════════════════════════ */}
      <section className="up-block">
        <div className="up-card__head">
          <p className="up-card__title"><PiEnvelopeSimpleFill size={16} /> Account Details</p>
        </div>
        <div className="ui-card">
          <div className="up-info-grid">
            {[
              { icon: PiEnvelopeSimpleFill, label: "Email",           value: maskEmail(user?.email) },
              { icon: PiBuildingsFill,      label: "Department",      value: deptLabel },
              { icon: PiUsersThreeFill,     label: "Team",            value: teamLabel },
              { icon: PiCirclesThreeFill,   label: "Region",          value: regionLabel },
              { icon: PiCirclesThreeFill,   label: "Specialty Track", value: activeAvatar.name },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="up-info-tile">
                  <span className="ui-icon-tile ui-icon-tile--sm"><Icon size={16} /></span>
                  <div className="up-info-tile__text">
                    <p className="up-info-tile__label">{item.label}</p>
                    <p className="up-info-tile__value">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ SANDBOX REVIEWS ═════════════════════════════════ */}
      <section className="up-block">
        <div className="up-card__head">
          <p className="up-card__title"><PiFlaskFill size={16} /> Sandbox Reviews</p>
          {sandboxResults.length > 0 && (
            <span className="ui-badge ui-badge--accent">{sandboxResults.length} submission{sandboxResults.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {sandboxLoading ? (
          <div className="ui-card up-sandbox-loading">
            Loading submissions…
          </div>
        ) : sandboxResults.length === 0 ? (
          <div className="ui-empty">
            <span className="ui-icon-tile ui-icon-tile--neutral ui-icon-tile--lg"><PiFlaskFill size={24} /></span>
            <p className="ui-small up-empty-text">
              No sandbox submissions yet. Complete a sandbox card to see your results here.
            </p>
          </div>
        ) : (
          <div className="ui-list up-sandbox-list">
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
                  <div className="up-sandbox-card__header ui-list-item ui-list-item--interactive" onClick={() => setExpandedCard(isExpanded ? null : i)}>
                    <div className="up-sandbox-card__main">
                      <div className="up-sandbox-card__titlerow">
                        <span className="up-sandbox-card__title">{card.cardTitle || "Untitled Card"}</span>
                        {isGraded ? (
                          <span className="ui-badge ui-badge--sm ui-badge--success"><PiSealCheckFill size={11} /> Graded</span>
                        ) : descCount > 0 ? (
                          <span className="ui-badge ui-badge--sm ui-badge--warning">Pending Review</span>
                        ) : null}
                      </div>
                      <div className="up-sandbox-card__module">{card.moduleTitle || ""}</div>
                    </div>

                    <div className="up-sandbox-card__chips">
                      {mcqCount > 0 && (
                        <span className="ui-badge ui-badge--accent"><PiListChecksFill size={12} /> {autoScore}/{autoMax}</span>
                      )}
                      {descCount > 0 && (
                        <span className={`ui-badge ${isGraded ? "ui-badge--success" : ""}`}>
                          <PiTextAaFill size={12} /> {isGraded ? `${adminScore}/${descMax}` : `?/${descMax}`}
                        </span>
                      )}
                      {totalMax > 0 && <span className="ui-badge ui-badge--outline">{totalScore}/{totalMax}</span>}
                      <PiCaretDown size={14} className="up-caret" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="up-sandbox-card__detail">
                      {adminFeedback && (
                        <div className="up-feedback-banner">
                          <p className="up-feedback-banner__label"><PiChatCircleTextFill size={12} />Admin Feedback</p>
                          <p className="up-feedback-banner__text">{adminFeedback}</p>
                        </div>
                      )}

                      {(card.questions || []).length > 0 ? (
                        card.questions.map((q, qi) => {
                          const isDesc = q.type === "text" || q.type === "code";
                          return (
                            <div key={qi} className="up-question">
                              <div className="up-question__head">
                                <span className={`ui-badge ui-badge--sm ${isDesc ? "ui-badge--info" : "ui-badge--accent"}`}>
                                  {q.type === "true_false" ? "T/F" : q.type || "MCQ"}
                                </span>
                                <p className="up-question__text">{q.questionText || `Question ${qi + 1}`}</p>
                                {!isDesc && (
                                  <span className={`ui-badge ui-badge--sm ${q.isCorrect ? "ui-badge--success" : "ui-badge--danger"}`}>
                                    {q.isCorrect ? "Correct" : "Incorrect"}
                                    {q.maxPoints ? ` · ${q.points || 0}/${q.maxPoints}` : ""}
                                  </span>
                                )}
                              </div>
                              {isDesc && q.userAnswer && (
                                <div className="up-question__answer">
                                  <p className="up-question__answer-label">Your Response</p>
                                  <pre className={`up-question__answer-text${q.type === "code" ? " up-question__answer-text--code" : ""}`}>
                                    {q.userAnswer}
                                  </pre>
                                </div>
                              )}
                              {isDesc && q.maxPoints && (
                                <p className="up-question__worth">
                                  Worth {q.maxPoints} point{q.maxPoints !== 1 ? "s" : ""} · admin graded
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="up-sandbox-card__none">
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
      </section>

      {showSecurityModal && <AccountSecurityModal onClose={() => setShowSecurityModal(false)} />}
    </div>
  );
}

function tierDescription(key) {
  if (key === "practitioner") return "Master the present — what IRIS does, who we compete with, how the market works.";
  if (key === "strategist")   return "See the gaps. Shape what comes next. Competitive depth, deal patterns, market white space.";
  if (key === "architect")    return "Build what isn't yet. Agentic AI, white-space scans, product specs that go to leadership.";
  return "";
}
