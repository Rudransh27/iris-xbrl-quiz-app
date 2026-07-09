// src/pages/UserProfile.jsx
// ─────────────────────────────────────────────────────────────────────────────
// World-class modern profile page. Zero React Bootstrap.
// Data logic preserved; JSX fully redesigned.
// Shows: avatar (upload), bio (orbit_profile_bio), level, XP, streak, stats.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import AuthContext from "../context/AuthContext";
import api from "../admin/services/api";
import { useNavigate } from "react-router-dom";

// ── Avatar presets ────────────────────────────────────────────────────────────
const AVATAR_LIST = [
  { id: "dev",       name: "Full-Stack Engineer", emoji: "💻", color: "#7c6ef7" },
  { id: "xbrl",     name: "XBRL Architect",       emoji: "📊", color: "#10b981" },
  { id: "regtech",  name: "RegTech Lead",          emoji: "🏢", color: "#f59e0b" },
  { id: "validator",name: "Validation Expert",     emoji: "⚡", color: "#8b5cf6" },
];

const maskEmail = (email) => {
  if (!email || typeof email !== "string") return "–";
  const [username, domain] = email.split("@");
  if (!domain) return email;
  const visible = username.substring(0, 2);
  const masked = "*".repeat(Math.max(0, username.length - 2));
  return `${visible}${masked}@${domain}`;
};

// ── Inject hover-dependent CSS once ──────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("orbit-profile-v2")) {
  const s = document.createElement("style");
  s.id = "orbit-profile-v2";
  s.textContent = `
    .op-avatar-wrap   { cursor: pointer; position: relative; flex-shrink: 0; }
    .op-cam-overlay   {
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(0,0,0,0.42);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.2s;
      color: #fff; font-size: 11px; font-weight: 700; gap: 3px;
      pointer-events: none;
    }
    .op-avatar-wrap:hover .op-cam-overlay { opacity: 1; }
    .op-stat-chip  { transition: transform 0.14s, box-shadow 0.14s; }
    .op-stat-chip:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,110,247,0.18); }
    .op-preset-card { transition: all 0.15s; cursor: pointer; }
    .op-preset-card:hover  { border-color: var(--orbit-brand) !important; background: var(--orbit-brand-muted) !important; }
    .op-info-row   { padding: 13px 0; border-bottom: 1px solid var(--orbit-border); }
    .op-info-row:last-child { border-bottom: none; }
    .op-back-btn   {
      background: rgba(255,255,255,0.22); border: 1.5px solid rgba(255,255,255,0.4);
      color: #fff; padding: 6px 14px; border-radius: 8px; font-size: 12px;
      font-weight: 700; cursor: pointer; font-family: inherit;
      transition: background 0.15s;
    }
    .op-back-btn:hover { background: rgba(255,255,255,0.36); }
    .op-edit-btn {
      background: var(--orbit-surface); border: 1.5px solid var(--orbit-border);
      color: var(--orbit-text-body); padding: 8px 16px; border-radius: 10px;
      font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
      display: flex; align-items: center; gap: 6px;
      transition: border-color 0.15s, background 0.15s;
    }
    .op-edit-btn:hover { border-color: var(--orbit-brand); background: var(--orbit-brand-muted); color: var(--orbit-brand); }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function UserProfile() {
  const { user, refreshUser, loading: authLoading } = useContext(AuthContext);
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
  const computeScores = (questions) => {
    const qs     = questions || [];
    const mcqQs  = qs.filter(q => q.type === "mcq" || q.type === "true_false");
    const descQs = qs.filter(q => q.type === "text" || q.type === "code");
    return {
      autoScore: mcqQs.reduce((s, q) => s + (Number(q.points)    || 0), 0),
      autoMax:   mcqQs.reduce((s, q) => s + (Number(q.maxPoints) || 0), 0),
      descMax:   descQs.reduce((s, q) => s + (Number(q.maxPoints) || 0), 0),
      mcqCount:  mcqQs.length,
      descCount: descQs.length,
    };
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const xpPerLevel       = 500;
  const currentLevel     = Math.floor((user.xp || 0) / xpPerLevel) + 1;
  const currentLevelXP   = (user.xp || 0) % xpPerLevel;
  const progressPct      = Math.min((currentLevelXP / xpPerLevel) * 100, 100);
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

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "var(--orbit-text-body)", minHeight: "100%" }}>

      {/* ═══════════════════ COVER BANNER ═══════════════════════════════════ */}
      <div style={{
        height: "200px", position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #e7c6ff 0%, #c4b5fd 35%, #a78bfa 65%, #8b5cf6 100%)",
      }}>
        {/* Decorative rings on banner */}
        {[
          { size: 260, top: "-60px", right: "-60px", op: 0.22 },
          { size: 130, top: "20px",  right: "30px",  op: 0.32 },
          { size: 180, bottom: "-60px", left: "-50px", op: 0.18 },
          { size: 80,  top: "50px",  left: "120px",  op: 0.28 },
        ].map((r, i) => (
          <div key={i} aria-hidden="true" style={{
            position: "absolute",
            top: r.top, right: r.right, bottom: r.bottom, left: r.left,
            width: r.size, height: r.size, borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.35)", opacity: r.op,
            pointerEvents: "none",
            animation: `auth-ring-pulse ${8 + i * 2}s ease-in-out infinite`,
          }} />
        ))}

        {/* Back button */}
        <div style={{ position: "absolute", top: "16px", left: "20px" }}>
          <button className="op-back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        {/* Role badge on banner */}
        <div style={{ position: "absolute", top: "16px", right: "20px" }}>
          <span style={{
            background: "rgba(255,255,255,0.24)",
            border: "1.5px solid rgba(255,255,255,0.42)",
            color: "#fff", fontSize: "10px", fontWeight: "800",
            letterSpacing: "1.2px", textTransform: "uppercase",
            padding: "5px 14px", borderRadius: "var(--radius-full)",
            backdropFilter: "blur(8px)",
          }}>
            {user.role === "superadmin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Member"}
          </span>
        </div>
      </div>

      {/* ═══════════════════ MAIN CONTENT ════════════════════════════════════ */}
      <div style={{ padding: "0 28px 48px", maxWidth: "880px", margin: "0 auto" }}>

        {/* ── Avatar + identity row ───────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "flex-end", gap: "20px",
          marginTop: "-52px", marginBottom: "28px", flexWrap: "wrap",
        }}>
          {/* Avatar */}
          <div className="op-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
            <div style={{
              width: "100px", height: "100px", borderRadius: "50%",
              background: avatarSrc
                ? `url(${avatarSrc}) center/cover no-repeat`
                : `linear-gradient(135deg, ${activeAvatar.color}, #7c3aed)`,
              border: "4px solid var(--orbit-surface)",
              boxShadow: "0 4px 24px rgba(124,110,247,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", overflow: "hidden",
            }}>
              {!avatarSrc && (
                <span style={{ fontSize: "34px", lineHeight: 1 }}>
                  {isUpdating ? "⏳" : activeAvatar.emoji}
                </span>
              )}
              <div className="op-cam-overlay">
                <span style={{ fontSize: "16px" }}>📷</span>
                <span>Edit Photo</span>
              </div>
            </div>
          </div>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />

          {/* Name + badges */}
          <div style={{ flex: 1, minWidth: "200px", paddingBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px", flexWrap: "wrap" }}>
              <h1 style={{
                fontSize: "clamp(22px, 3.2vw, 28px)", fontWeight: "900",
                color: "var(--orbit-text-heading)", margin: 0, letterSpacing: "-0.5px",
                fontFamily: "'Georgia', 'Palatino', serif",
              }}>
                {user.username || "Orbiter"}
              </h1>
              {isAdmin && (
                <span style={{
                  fontSize: "10px", fontWeight: "800", letterSpacing: "0.8px",
                  textTransform: "uppercase", padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--pastel-modules)", color: "var(--pastel-modules-text)",
                  border: "1px solid var(--pastel-modules-border)",
                }}>🛡 {user.role === "superadmin" ? "Superadmin" : "Admin"}</span>
              )}
              {user.isVerified && (
                <span style={{
                  fontSize: "10px", fontWeight: "800", padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--pastel-progress)", color: "var(--pastel-progress-text)",
                  border: "1px solid var(--pastel-progress-border)",
                }}>✓ Verified</span>
              )}
            </div>

            {/* Bio / 3-word description from onboarding */}
            {bio ? (
              <p style={{
                fontSize: "14px", color: "var(--orbit-brand)", fontWeight: "600",
                margin: "0 0 4px", fontStyle: "italic",
                letterSpacing: "0.1px",
              }}>
                "{bio}"
              </p>
            ) : (
              <p style={{
                fontSize: "13px", color: "var(--orbit-text-muted)", margin: "0 0 4px", fontStyle: "italic",
              }}>
                No bio yet — add one during onboarding
              </p>
            )}

            <p style={{ fontSize: "12.5px", color: "var(--orbit-text-muted)", margin: 0, fontWeight: "500" }}>
              {activeAvatar.name} · Level {currentLevel} · Joined {joinDate}
            </p>
          </div>

          {/* Edit profile button */}
          <button className="op-edit-btn" onClick={() => setIsEditing(!isEditing)}>
            ✏ {isEditing ? "Close" : "Edit Profile"}
          </button>
        </div>

        {/* ── Avatar preset editor (collapsible) ──────────────────────────── */}
        {isEditing && (
          <div style={{
            background: "var(--orbit-surface)",
            border: "1.5px solid var(--orbit-border)",
            borderRadius: "20px", padding: "24px",
            marginBottom: "28px",
            animation: "auth-fade-up 0.28s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: "800", color: "var(--orbit-text-heading)", letterSpacing: "0.2px" }}>
              Choose Specialty Track
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px", marginBottom: "16px" }}>
              {AVATAR_LIST.map((av) => (
                <div
                  key={av.id}
                  className="op-preset-card"
                  onClick={() => handleSelectPreset(av.id)}
                  style={{
                    padding: "16px 10px", borderRadius: "14px", textAlign: "center",
                    border: `1.5px solid ${selectedAvatar === av.id ? "var(--orbit-brand)" : "var(--orbit-border)"}`,
                    background: selectedAvatar === av.id ? "var(--orbit-brand-muted)" : "var(--orbit-surface-subtle)",
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "7px" }}>{av.emoji}</div>
                  <div style={{
                    fontSize: "11.5px", fontWeight: "700", color: "var(--orbit-text-body)", lineHeight: 1.3,
                    ...(selectedAvatar === av.id ? { color: "var(--orbit-brand)" } : {}),
                  }}>
                    {av.name}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => fileInputRef.current?.click()} style={{
              width: "100%", padding: "12px",
              background: "none", border: "1.5px dashed var(--orbit-border)",
              borderRadius: "12px", color: "var(--orbit-text-muted)",
              fontSize: "13px", fontWeight: "600", cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
              fontFamily: "inherit",
            }}>
              📷 Upload Custom Photo
            </button>
          </div>
        )}

        {/* ── Stats chips row ──────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          {[
            { icon: "⚡", label: "Total XP",     value: user.xp || 0,              bg: "var(--orbit-xp-bg)",      border: "var(--orbit-xp-border)",      color: "var(--orbit-xp-text)" },
            { icon: "🏆", label: "Level",         value: currentLevel,               bg: "var(--pastel-modules)",   border: "var(--pastel-modules-border)", color: "var(--pastel-modules-text)" },
            { icon: "🔥", label: "Day Streak",    value: user?.streak || 0,          bg: "var(--pastel-streak)",    border: "var(--pastel-streak-border)",  color: "var(--pastel-streak-text)" },
            { icon: "🃏", label: "Cards Done",    value: stats?.completedCardsCount  ?? "–", bg: "var(--pastel-reads)",  border: "var(--pastel-reads-border)",   color: "var(--pastel-reads-text)" },
            { icon: "📚", label: "Topics Mastered",value: stats?.completedTopicsCount ?? "–", bg: "var(--pastel-progress)", border: "var(--pastel-progress-border)", color: "var(--pastel-progress-text)" },
            { icon: "🎯", label: "Modules Cleared",value: stats?.completedModulesCount ?? "–", bg: "var(--orbit-brand-muted)", border: "var(--orbit-brand)", color: "var(--orbit-brand)" },
          ].map((s, i) => (
            <div key={i} className="op-stat-chip" style={{
              padding: "18px 14px", borderRadius: "16px", textAlign: "center",
              background: s.bg, border: `1.5px solid ${s.border}`,
            }}>
              <div style={{ fontSize: "22px", lineHeight: 1, marginBottom: "5px" }}>{s.icon}</div>
              <div style={{ fontSize: "24px", fontWeight: "900", color: s.color, lineHeight: 1, letterSpacing: "-0.5px" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "10.5px", fontWeight: "600", color: "var(--orbit-text-muted)", marginTop: "4px" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── XP Progress bar ─────────────────────────────────────────────── */}
        <div style={{
          background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)",
          borderRadius: "20px", padding: "24px 26px", marginBottom: "20px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "var(--orbit-text-heading)" }}>
                Level {currentLevel} → Level {currentLevel + 1}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--orbit-text-muted)", marginTop: "2px" }}>
                {currentLevelXP} / {xpPerLevel} XP to next milestone
              </p>
            </div>
            <span style={{
              fontSize: "13px", fontWeight: "800", padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              background: "linear-gradient(135deg, #e7c6ff, #c4b5fd)",
              color: "#6d28d9", border: "1px solid #c4b5fd",
            }}>
              {Math.round(progressPct)}% complete
            </span>
          </div>

          {/* Progress rail */}
          <div style={{ height: "12px", borderRadius: "8px", background: "var(--orbit-border)", overflow: "hidden", position: "relative" }}>
            <div style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #e7c6ff 0%, #a78bfa 50%, #7c3aed 100%)",
              borderRadius: "8px",
              transition: "width 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: "0 0 12px rgba(167,139,250,0.5)",
            }} />
          </div>

          {/* Level milestones */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--orbit-text-muted)", fontWeight: "700" }}>Lv {currentLevel}</span>
            <span style={{ fontSize: "11px", color: "var(--orbit-text-muted)", fontWeight: "700" }}>Lv {currentLevel + 1}</span>
          </div>
        </div>

        {/* ── Info + Learning two-column grid ─────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          {/* Account details */}
          <div style={{
            background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)",
            borderRadius: "20px", padding: "24px 24px",
          }}>
            <p style={{ margin: "0 0 16px", fontSize: "12px", fontWeight: "800", color: "var(--orbit-text-heading)", letterSpacing: "0.6px", textTransform: "uppercase" }}>
              Account Details
            </p>

            {[
              { icon: "✉",  bg: "var(--orbit-brand-muted)",    label: "Email",      value: maskEmail(user?.email) },
              { icon: "🏢", bg: "var(--pastel-modules)",        label: "Department", value: deptLabel },
              { icon: "👥", bg: "var(--pastel-reads)",          label: "Team",       value: teamLabel },
              { icon: "🗓",  bg: "var(--pastel-progress)",      label: "Member Since",value: joinDate },
            ].map((item, i) => (
              <div key={i} className="op-info-row" style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{
                  width: "38px", height: "38px", borderRadius: "10px",
                  background: item.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "17px", flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "10px", fontWeight: "700", color: "var(--orbit-text-muted)", textTransform: "uppercase", letterSpacing: "0.7px" }}>
                    {item.label}
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "var(--orbit-text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Learning progress */}
          <div style={{
            background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)",
            borderRadius: "20px", padding: "24px 24px",
          }}>
            <p style={{ margin: "0 0 16px", fontSize: "12px", fontWeight: "800", color: "var(--orbit-text-heading)", letterSpacing: "0.6px", textTransform: "uppercase" }}>
              Learning Journey
            </p>

            {[
              { icon: "🃏", label: "Cards Completed",  value: stats?.completedCardsCount  ?? 0, color: "var(--orbit-brand)",           bg: "var(--orbit-brand-muted)" },
              { icon: "📚", label: "Topics Mastered",   value: stats?.completedTopicsCount  ?? 0, color: "var(--pastel-progress-text)",  bg: "var(--pastel-progress)" },
              { icon: "🏆", label: "Modules Cleared",   value: stats?.completedModulesCount ?? 0, color: "var(--pastel-modules-text)",   bg: "var(--pastel-modules)" },
            ].map((item, i) => (
              <div key={i} className="op-info-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "10px",
                    background: item.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px",
                  }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--orbit-text-body)" }}>
                    {item.label}
                  </span>
                </div>
                <span style={{ fontSize: "26px", fontWeight: "900", color: item.color, letterSpacing: "-0.5px" }}>
                  {item.value}
                </span>
              </div>
            ))}

            {/* Motivation from onboarding */}
            {localStorage.getItem("orbit_motivation") && (
              <div style={{
                marginTop: "16px", padding: "12px 14px",
                background: "linear-gradient(135deg, rgba(231,198,255,0.35), rgba(196,181,253,0.2))",
                borderRadius: "12px", border: "1px solid rgba(196,181,253,0.4)",
              }}>
                <p style={{ margin: 0, fontSize: "11px", fontWeight: "700", color: "var(--orbit-text-muted)", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.7px" }}>
                  Your motivation
                </p>
                <p style={{ margin: 0, fontSize: "12.5px", fontWeight: "600", color: "var(--orbit-brand)" }}>
                  {localStorage.getItem("orbit_motivation") === "product" && "🎯 Understand the product deeply"}
                  {localStorage.getItem("orbit_motivation") === "sharp"   && "🔥 Stay sharp as AI evolves"}
                  {localStorage.getItem("orbit_motivation") === "ideas"   && "💡 Get ideas to actually land"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ══ Sandbox Reviews Section ══════════════════════════════════════════ */}
        <div style={{ marginTop: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--orbit-text-heading)", margin: 0, textTransform: "uppercase", letterSpacing: "0.6px" }}>
              🔬 Sandbox Reviews
            </h3>
            <div style={{ flex: 1, height: "1.5px", background: "var(--orbit-border)" }} />
            {sandboxResults.length > 0 && (
              <span style={{
                fontSize: "11px", fontWeight: "700",
                background: "var(--orbit-brand-muted)", border: "1px solid var(--orbit-brand)",
                color: "var(--orbit-brand)", padding: "3px 10px", borderRadius: "var(--radius-full)",
              }}>
                {sandboxResults.length} submission{sandboxResults.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p style={{ fontSize: "12px", color: "var(--orbit-text-muted)", margin: "0 0 18px" }}>
            Read-only view of your submitted sandbox responses, auto-graded MCQ results, and admin feedback.
          </p>

          {sandboxLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--orbit-text-muted)", fontSize: "13px" }}>
              Loading submissions…
            </div>
          ) : sandboxResults.length === 0 ? (
            <div style={{
              background: "var(--orbit-surface)", border: "2px dashed var(--orbit-border)",
              borderRadius: "20px", padding: "48px 24px",
              textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
            }}>
              <span style={{ fontSize: "36px", opacity: 0.3 }}>🧪</span>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "var(--orbit-text-muted)", maxWidth: "280px" }}>
                No sandbox submissions yet. Complete a sandbox card to see your results here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {sandboxResults.map((card, i) => {
                const { autoScore, autoMax, descMax, mcqCount, descCount } = computeScores(card.questions);
                const adminScore    = card.adminScore    ?? null;
                const adminFeedback = card.adminFeedback || "";
                const totalMax      = autoMax + descMax;
                const totalScore    = autoScore + (adminScore || 0);
                const isExpanded    = expandedCard === i;
                const isGraded      = adminScore !== null;

                return (
                  <div key={i} style={{
                    background: "var(--orbit-surface)",
                    border: `1.5px solid ${isGraded ? "var(--orbit-brand)" : "var(--orbit-border)"}`,
                    borderRadius: "20px", overflow: "hidden",
                    boxShadow: isGraded ? "0 0 0 1px rgba(124,110,247,0.15)" : "none",
                    transition: "box-shadow 0.2s",
                  }}>
                    {/* Card header */}
                    <div
                      onClick={() => setExpandedCard(isExpanded ? null : i)}
                      style={{
                        padding: "18px 22px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap",
                        background: isGraded ? "linear-gradient(135deg, rgba(124,110,247,0.07), rgba(124,110,247,0.03))" : "transparent",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--orbit-text-heading)" }}>
                            {card.cardTitle || "Untitled Card"}
                          </span>
                          {isGraded ? (
                            <span style={{
                              fontSize: "10px", fontWeight: "800", padding: "2px 8px",
                              borderRadius: "var(--radius-full)",
                              background: "var(--pastel-progress)", color: "var(--pastel-progress-text)",
                              border: "1px solid var(--pastel-progress-border)",
                            }}>✓ Graded</span>
                          ) : descCount > 0 ? (
                            <span style={{
                              fontSize: "10px", fontWeight: "800", padding: "2px 8px",
                              borderRadius: "var(--radius-full)",
                              background: "var(--pastel-quiz)", color: "var(--pastel-quiz-text)",
                              border: "1px solid var(--pastel-quiz-border)",
                            }}>⏳ Pending Review</span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--orbit-text-muted)" }}>
                          {card.moduleTitle || ""}
                        </div>
                      </div>

                      {/* Score summary chips */}
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                        {mcqCount > 0 && (
                          <div style={{
                            padding: "6px 12px", borderRadius: "10px",
                            background: "var(--orbit-brand-muted)", border: "1px solid var(--orbit-brand)",
                            fontSize: "12px", fontWeight: "800", color: "var(--orbit-brand)",
                            display: "flex", alignItems: "center", gap: "5px",
                          }}>
                            <span style={{ fontSize: "10px", fontWeight: "600", color: "var(--orbit-text-muted)" }}>MCQ</span>
                            {autoScore}/{autoMax}
                          </div>
                        )}
                        {descCount > 0 && (
                          <div style={{
                            padding: "6px 12px", borderRadius: "10px",
                            background: isGraded ? "var(--pastel-progress)" : "var(--orbit-canvas)",
                            border: `1px solid ${isGraded ? "var(--pastel-progress-border)" : "var(--orbit-border)"}`,
                            fontSize: "12px", fontWeight: "800",
                            color: isGraded ? "var(--pastel-progress-text)" : "var(--orbit-text-muted)",
                            display: "flex", alignItems: "center", gap: "5px",
                          }}>
                            <span style={{ fontSize: "10px", fontWeight: "600" }}>Descriptive</span>
                            {isGraded ? `${adminScore}/${descMax}` : `?/${descMax}`}
                          </div>
                        )}
                        {totalMax > 0 && (
                          <div style={{
                            padding: "6px 14px", borderRadius: "10px",
                            background: "var(--orbit-canvas)", border: "1.5px solid var(--orbit-border)",
                            fontSize: "13px", fontWeight: "900",
                            color: "var(--orbit-text-heading)",
                          }}>
                            {totalScore}/{totalMax}
                          </div>
                        )}
                        <span style={{ fontSize: "16px", color: "var(--orbit-text-muted)", transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                          ▾
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ padding: "0 22px 20px", borderTop: "1.5px solid var(--orbit-border)" }}>

                        {/* Admin feedback banner */}
                        {adminFeedback && (
                          <div style={{
                            margin: "16px 0 14px",
                            padding: "14px 16px",
                            background: "linear-gradient(135deg, rgba(124,110,247,0.10), rgba(124,110,247,0.05))",
                            borderRadius: "12px", borderLeft: "3px solid var(--orbit-brand)",
                          }}>
                            <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: "800", color: "var(--orbit-brand)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                              Admin Feedback
                            </p>
                            <p style={{ margin: 0, fontSize: "13px", color: "var(--orbit-text-body)", lineHeight: 1.6, fontStyle: "italic" }}>
                              💬 {adminFeedback}
                            </p>
                          </div>
                        )}

                        {/* Per-question breakdown */}
                        {(card.questions || []).length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                            {card.questions.map((q, qi) => {
                              const isDesc = q.type === "text" || q.type === "code";
                              return (
                                <div key={qi} style={{
                                  padding: "12px 14px", borderRadius: "12px",
                                  background: "var(--orbit-canvas)", border: "1px solid var(--orbit-border)",
                                }}>
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: isDesc ? "8px" : "0" }}>
                                    {/* Type badge */}
                                    <span style={{
                                      flexShrink: 0, fontSize: "10px", fontWeight: "800", padding: "2px 8px",
                                      borderRadius: "6px", marginTop: "2px",
                                      background: isDesc ? "var(--pastel-reads)" : "var(--pastel-modules)",
                                      color: isDesc ? "var(--pastel-reads-text)" : "var(--pastel-modules-text)",
                                      border: `1px solid ${isDesc ? "var(--pastel-reads-border)" : "var(--pastel-modules-border)"}`,
                                      textTransform: "uppercase", letterSpacing: "0.5px",
                                    }}>
                                      {q.type === "true_false" ? "T/F" : q.type || "MCQ"}
                                    </span>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ margin: "0 0 4px", fontSize: "12.5px", fontWeight: "600", color: "var(--orbit-text-body)", lineHeight: 1.5 }}>
                                        {q.questionText || `Question ${qi + 1}`}
                                      </p>
                                    </div>

                                    {/* Score or correctness badge */}
                                    {!isDesc && (
                                      <span style={{
                                        flexShrink: 0, fontSize: "11px", fontWeight: "800",
                                        padding: "3px 10px", borderRadius: "8px",
                                        background: q.isCorrect ? "var(--pastel-progress)" : "var(--pastel-quiz)",
                                        color: q.isCorrect ? "var(--pastel-progress-text)" : "var(--pastel-quiz-text)",
                                        border: `1px solid ${q.isCorrect ? "var(--pastel-progress-border)" : "var(--pastel-quiz-border)"}`,
                                      }}>
                                        {q.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                                        {q.maxPoints ? ` · ${q.points || 0}/${q.maxPoints}` : ""}
                                      </span>
                                    )}
                                  </div>

                                  {/* Descriptive: user written response */}
                                  {isDesc && q.userAnswer && (
                                    <div style={{
                                      marginTop: "6px", padding: "10px 12px",
                                      background: "var(--orbit-surface)", borderRadius: "8px",
                                      border: "1px solid var(--orbit-border)",
                                    }}>
                                      <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: "700", color: "var(--orbit-text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                                        Your Response
                                      </p>
                                      <pre style={{
                                        margin: 0, fontSize: "12px", color: "var(--orbit-text-body)",
                                        whiteSpace: "pre-wrap", wordBreak: "break-word",
                                        lineHeight: 1.6, fontFamily: q.type === "code" ? "'Fira Code', 'Courier New', monospace" : "inherit",
                                      }}>
                                        {q.userAnswer}
                                      </pre>
                                    </div>
                                  )}

                                  {/* Max points indicator for descriptive */}
                                  {isDesc && q.maxPoints && (
                                    <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--orbit-text-muted)", fontWeight: "600" }}>
                                      Worth {q.maxPoints} point{q.maxPoints !== 1 ? "s" : ""} · admin graded
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
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

      </div>
    </div>
  );
}
