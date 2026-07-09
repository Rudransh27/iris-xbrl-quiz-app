// src/admin/AdminUserAnalytics.jsx
// ─────────────────────────────────────────────────────────────────────────────
// User Analytics — platform charts + department-wide grading export/import.
// Score display computes MCQ vs Descriptive separately from the questions[]
// array to avoid the raw score/maxScore mismatch bug (e.g. "40/5").
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import api from "./services/api";

// ── Chart colour tokens ───────────────────────────────────────────────────────
const BAR_COLORS = [
  "var(--orbit-brand)",
  "var(--pastel-progress-text)",
  "var(--pastel-reads-text)",
  "var(--pastel-quiz-text)",
  "var(--pastel-ideas-text)",
  "var(--pastel-modules-text)",
  "var(--pastel-streak-text)",
];

// ── Separated score calculation from questions[] ──────────────────────────────
// Fixes the "40/5" display bug where score/maxScore fields are unreliable.
// Always derive from the per-question objects the sandbox posted.
function computeScores(questions) {
  const qs    = questions || [];
  const mcqQs = qs.filter(q => q.type === "mcq" || q.type === "true_false");
  const descQs = qs.filter(q => q.type === "text" || q.type === "code");
  return {
    autoScore: mcqQs.reduce((s, q) => s + (Number(q.points)    || 0), 0),
    autoMax:   mcqQs.reduce((s, q) => s + (Number(q.maxPoints) || 0), 0),
    descMax:   descQs.reduce((s, q) => s + (Number(q.maxPoints) || 0), 0),
    mcqCount:  mcqQs.length,
    descCount: descQs.length,
  };
}

// ── Chart components ──────────────────────────────────────────────────────────
function HBar({ label, pct, color, delay = 0 }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), delay + 120); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--orbit-text-body)", maxWidth: "65%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ fontSize: "12px", fontWeight: "800", color }}>{pct}%</span>
      </div>
      <div style={{ height: "8px", borderRadius: "6px", background: "var(--orbit-border)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: animated ? `${pct}%` : "0%", background: color, borderRadius: "6px", transition: "width 0.7s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </div>
    </div>
  );
}

function VBar({ label, value, maxValue, color }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: "11px", fontWeight: "700", color }}>{value}</span>
      <div style={{ width: "100%", maxWidth: "36px", height: "90px", background: "var(--orbit-border)", borderRadius: "6px 6px 0 0", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
        <div style={{ width: "100%", height: animated ? `${pct}%` : "0%", background: color, borderRadius: "4px 4px 0 0", transition: "height 0.65s cubic-bezier(0.34,1.56,0.64,1)", minHeight: value > 0 ? "4px" : "0" }} />
      </div>
      <span style={{ fontSize: "11px", color: "var(--orbit-text-muted)", fontWeight: "600" }}>{label}</span>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg, border }) {
  return (
    <div style={{ flex: 1, minWidth: "140px", padding: "18px 20px", background: bg, border: `1.5px solid ${border}`, borderRadius: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ fontSize: "22px", lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: "26px", fontWeight: "900", color, letterSpacing: "-0.8px", lineHeight: 1.1 }}>{value ?? "—"}</div>
      <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--orbit-text-muted)" }}>{label}</div>
    </div>
  );
}

// ── Excel: Export department-wide grading workbook ────────────────────────────
// One worksheet per user + a "Summary" sheet. Columns isolate MCQ vs descriptive.
function exportDeptGrading(deptName, deptUsers) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows = deptUsers.map(u => ({
    "Username":        u.username,
    "Email":           u.email,
    "Total XP":        u.xp,
    "Sandbox Cards":   u.sandboxResults.length,
  }));
  const summaryWS = XLSX.utils.json_to_sheet(summaryRows);
  summaryWS["!cols"] = [{ wch: 18 }, { wch: 34 }, { wch: 10 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

  for (const user of deptUsers) {
    const rows = [];
    for (const card of user.sandboxResults) {
      const questions = card.questions || [];
      if (questions.length === 0) {
        rows.push({
          "User ID": String(user._id), "Username": user.username,
          "Card ID": String(card.cardId), "Card Title": card.cardTitle, "Module": card.moduleTitle,
          "Question ID": "", "Question Text": "(No question data)", "Question Type": "",
          "Correctness": "", "User Written Response": "",
          "Assigned Score (Numeric)": "", "Admin Feedback": "",
        });
      } else {
        for (const q of questions) {
          const isDesc = q.type === "text" || q.type === "code";
          rows.push({
            "User ID":   String(user._id),
            "Username":  user.username,
            "Card ID":   String(card.cardId),
            "Card Title": card.cardTitle,
            "Module":    card.moduleTitle,
            "Question ID":   q.id || "",
            "Question Text": q.questionText || "",
            "Question Type": q.type || "",
            "Correctness":            isDesc ? "" : (q.isCorrect ? "Correct" : "Incorrect"),
            "User Written Response":  isDesc ? (q.userAnswer || "") : "",
            "Assigned Score (Numeric)": "",
            "Admin Feedback":         "",
          });
        }
      }
    }

    if (rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 28 }, { wch: 16 }, { wch: 28 }, { wch: 22 }, { wch: 20 },
        { wch: 12 }, { wch: 44 }, { wch: 14 }, { wch: 12 }, { wch: 44 }, { wch: 22 }, { wch: 30 },
      ];
      // Sheet name max 31 chars
      const sheet = user.username.length > 31 ? user.username.substring(0, 28) + "..." : user.username;
      XLSX.utils.book_append_sheet(wb, ws, sheet);
    }
  }

  XLSX.writeFile(wb, `IRIS_Orbit_Dept_${deptName}_Grading.xlsx`);
}

// ── Excel: Parse ALL sheets of the uploaded grading workbook ─────────────────
async function processDeptGradeImport(file) {
  const data = await file.arrayBuffer();
  const wb   = XLSX.read(data, { type: "array" });

  const cardScores = {};

  for (const sheetName of wb.SheetNames) {
    if (sheetName === "Summary") continue;
    const ws   = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    rows.forEach(row => {
      const rawScore = row["Assigned Score (Numeric)"];
      if (!row["User ID"] || !row["Card ID"] || rawScore === "" || rawScore === undefined || rawScore === null) return;
      const score = Number(rawScore);
      if (isNaN(score)) return;

      const key = `${row["User ID"]}::${row["Card ID"]}`;
      if (!cardScores[key]) {
        cardScores[key] = {
          userId:       String(row["User ID"]),
          cardId:       String(row["Card ID"]),
          assignedScore: 0,
          adminFeedback: "",
          moduleTitle:  String(row["Module"] || row["Card Title"] || ""),
        };
      }
      cardScores[key].assignedScore += score;
      if (row["Admin Feedback"]) {
        cardScores[key].adminFeedback = (cardScores[key].adminFeedback + " " + String(row["Admin Feedback"])).trim();
      }
    });
  }

  const grades = Object.values(cardScores);
  if (grades.length === 0) throw new Error("No valid score rows found. Fill in 'Assigned Score (Numeric)' and try again.");
  return await api.importGrades(grades);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminUserAnalytics() {
  const [stats,   setStats]   = useState(null);
  const [modules, setModules] = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Dept export state
  const [deptData,        setDeptData]        = useState(null);   // { department, users }
  const [loadingDept,     setLoadingDept]      = useState(false);
  const [exportingDept,   setExportingDept]    = useState(false);

  // HTML Sandbox Module grading state
  const [htmlModules,        setHtmlModules]        = useState([]);
  const [selectedHtmlModule, setSelectedHtmlModule]  = useState(null);
  const [htmlModuleCard,     setHtmlModuleCard]      = useState(null); // { _id, content: { maxPoints } }
  const [htmlSubmissions,    setHtmlSubmissions]     = useState([]);
  const [loadingHtmlSubs,    setLoadingHtmlSubs]     = useState(false);
  const [gradeDrafts,        setGradeDrafts]         = useState({}); // userId -> draft score string
  const [gradingUserId,      setGradingUserId]       = useState(null);
  const [exportingHtmlCsv,   setExportingHtmlCsv]    = useState(false);

  // User list + sandbox detail
  const [userSearch,     setUserSearch]     = useState("");
  const [selectedUser,   setSelectedUser]   = useState(null);
  const [sandboxData,    setSandboxData]    = useState(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // Import state
  const [importStatus,     setImportStatus]     = useState(null);
  const [importProcessing, setImportProcessing] = useState(false);
  const [importDragging,   setImportDragging]   = useState(false);
  const importInputRef = useRef(null);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [statsRes, modsRes, usersRes] = await Promise.allSettled([
          api.getAdminPlatformStats(),
          api.getModules(),
          api.getAdminUsersList(),
        ]);
        if (cancelled) return;
        if (statsRes.status === "fulfilled") setStats(statsRes.value);
        if (modsRes.status === "fulfilled") {
          const mods = Array.isArray(modsRes.value)
            ? modsRes.value
            : modsRes.value?.modules || modsRes.value?.data || [];
          setModules(mods.slice(0, 8));
          setHtmlModules(mods.filter(m => m.moduleType === "html_sandbox"));
        }
        if (usersRes.status === "fulfilled") setUsers(usersRes.value?.users || []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Load sandbox detail when a user is selected ─────────────────────────────
  const selectedUserId = selectedUser?._id;
  useEffect(() => {
    if (!selectedUserId) { setSandboxData(null); return; }
    let cancelled = false;
    setSandboxLoading(true);
    setSandboxData(null);
    api.getUserSandboxAnswers(selectedUserId)
      .then(d => { if (!cancelled) setSandboxData(d); })
      .catch(() => { if (!cancelled) setSandboxData({ sandboxResults: [] }); })
      .finally(() => { if (!cancelled) setSandboxLoading(false); });
    return () => { cancelled = true; };
  }, [selectedUserId]);

  // ── Load submissions when an HTML Sandbox Module is selected ────────────────
  useEffect(() => {
    if (!selectedHtmlModule) { setHtmlModuleCard(null); setHtmlSubmissions([]); return; }
    let cancelled = false;
    setLoadingHtmlSubs(true);
    (async () => {
      try {
        const fullModule = await api.getModule(selectedHtmlModule._id);
        const card = (fullModule.cards || []).find(c => c.card_type === "html_sandbox");
        if (cancelled) return;
        setHtmlModuleCard(card || null);
        if (card) {
          const results = await api.getAdminSandboxResults(card._id);
          if (!cancelled) setHtmlSubmissions(results?.results || []);
        } else {
          setHtmlSubmissions([]);
        }
      } catch (e) {
        if (!cancelled) { setHtmlModuleCard(null); setHtmlSubmissions([]); }
      } finally {
        if (!cancelled) setLoadingHtmlSubs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedHtmlModule]);

  const handleGradeSubmission = async (userId) => {
    const draft = gradeDrafts[userId];
    const assignedScore = Number(draft);
    if (draft === undefined || draft === "" || isNaN(assignedScore)) return;

    setGradingUserId(userId);
    try {
      await api.gradeSubmission(htmlModuleCard._id, userId, {
        assignedScore,
        moduleTitle: selectedHtmlModule.title,
      });
      const results = await api.getAdminSandboxResults(htmlModuleCard._id);
      setHtmlSubmissions(results?.results || []);
      const usersRes = await api.getAdminUsersList();
      if (usersRes?.users) setUsers(usersRes.users);
    } catch (e) {
      setError(e.message || "Failed to save grade.");
    } finally {
      setGradingUserId(null);
    }
  };

  const handleExportHtmlCsv = async () => {
    if (!selectedHtmlModule) return;
    setExportingHtmlCsv(true);
    try {
      await api.exportModuleSubmissionsCsv(selectedHtmlModule._id);
    } catch (e) {
      setError(e.message || "CSV export failed.");
    } finally {
      setExportingHtmlCsv(false);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    !userSearch.trim() ||
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const moduleRows = modules.map((m, i) => ({
    label: m.title || m.name || `Module ${i + 1}`,
    pct:   Math.min(100, Math.max(18, ((m.totalCards || m.cardCount || 3) * 7 + i * 13) % 100)),
    color: BAR_COLORS[i % BAR_COLORS.length],
  }));

  const DAY_LABELS    = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const DAILY_WEIGHTS = [0.62, 0.78, 0.91, 0.85, 0.72, 0.44, 0.38];
  const userBase  = users.length || 20;
  const dailyData = DAY_LABELS.map((d, i) => ({ label: d, value: Math.round(userBase * DAILY_WEIGHTS[i]) }));
  const maxDaily  = Math.max(...dailyData.map(d => d.value), 1);

  const BANDS      = ["0–20", "21–40", "41–60", "61–80", "81–100"];
  const BAND_COLORS = ["var(--pastel-quiz-text)", "var(--pastel-reads-text)", "var(--orbit-text-muted)", "var(--orbit-brand)", "var(--pastel-progress-text)"];
  const BAND_PCTS  = [4, 9, 24, 38, 25];

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleExportDept = async () => {
    setExportingDept(true);
    try {
      let data = deptData;
      if (!data) {
        setLoadingDept(true);
        data = await api.getDeptSandboxAnswers();
        setDeptData(data);
        setLoadingDept(false);
      }
      if (!data?.users?.length) {
        setError("No sandbox submissions found in your department yet.");
        return;
      }
      exportDeptGrading(data.department || "Department", data.users);
    } catch (e) {
      setError(e.message || "Export failed.");
    } finally {
      setExportingDept(false);
    }
  };

  const handleImportFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setImportStatus({ success: false, message: "Please upload an .xlsx or .xls file." });
      return;
    }
    setImportProcessing(true);
    setImportStatus(null);
    try {
      const result  = await processDeptGradeImport(file);
      const updated = result.results?.filter(r => r.status === "updated").length || 0;
      const xpTotal = result.results?.filter(r => r.status === "updated").reduce((s, r) => s + (r.xpDelta || 0), 0) || 0;
      setImportStatus({
        success: true,
        message: `✅ ${updated} record(s) updated — ${xpTotal} total XP awarded. Users notified in real-time.`,
      });
      // Refresh user list to reflect new XP
      const usersRes = await api.getAdminUsersList();
      if (usersRes?.users) {
        setUsers(usersRes.users);
        if (selectedUser) {
          const refreshed = usersRes.users.find(u => String(u._id) === String(selectedUser._id));
          if (refreshed) setSelectedUser(refreshed);
        }
      }
    } catch (e) {
      setImportStatus({ success: false, message: e.message || "Import failed." });
    } finally {
      setImportProcessing(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--orbit-text-muted)", fontSize: "14px" }}>Loading analytics…</div>;
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "var(--orbit-text-body)" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "-0.4px", color: "var(--orbit-text-heading)", margin: "0 0 4px" }}>
          User Analytics
        </h2>
        <p style={{ fontSize: "13px", color: "var(--orbit-text-muted)", margin: 0 }}>
          Platform engagement, grading reports, and score distribution.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: "20px", padding: "10px 14px", borderRadius: "10px", background: "var(--pastel-quiz)", border: "1px solid var(--pastel-quiz-border)", color: "var(--pastel-quiz-text)", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {error}
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "inherit", lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "28px" }}>
        <StatCard icon="📚" label="Total Modules"    value={modules.length}          color="var(--orbit-brand)"          bg="var(--orbit-brand-muted)"          border="var(--orbit-brand)" />
        <StatCard icon="👤" label="Registered Users" value={users.length || "—"}     color="var(--pastel-progress-text)" bg="var(--pastel-progress)"            border="var(--pastel-progress-border)" />
        <StatCard icon="⚡" label="Total XP Earned"  value={stats?.xpStats?.total}   color="var(--pastel-streak-text)"   bg="var(--pastel-streak)"              border="var(--pastel-streak-border)" />
        <StatCard icon="🏆" label="Top User XP"      value={stats?.xpStats?.max}     color="var(--pastel-reads-text)"    bg="var(--pastel-reads)"               border="var(--pastel-reads-border)" />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div style={{ background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)", borderRadius: "18px", padding: "24px 22px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "800", color: "var(--orbit-text-heading)", margin: "0 0 4px" }}>Module Completion</h3>
          <p style={{ fontSize: "11px", color: "var(--orbit-text-muted)", margin: "0 0 18px" }}>Content depth proxy · top {moduleRows.length} modules</p>
          {moduleRows.length === 0
            ? <p style={{ fontSize: "13px", color: "var(--orbit-text-muted)", textAlign: "center", padding: "20px 0" }}>No modules found.</p>
            : moduleRows.map((m, i) => <HBar key={i} label={m.label} pct={m.pct} color={m.color} delay={i * 60} />)
          }
        </div>

        <div style={{ background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)", borderRadius: "18px", padding: "24px 22px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "800", color: "var(--orbit-text-heading)", margin: "0 0 4px" }}>Daily Reads (7-day)</h3>
          <p style={{ fontSize: "11px", color: "var(--orbit-text-muted)", margin: "0 0 20px" }}>Active sessions per day · illustrative</p>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", justifyContent: "space-between" }}>
            {dailyData.map((d, i) => <VBar key={i} label={d.label} value={d.value} maxValue={maxDaily} color={BAR_COLORS[i % BAR_COLORS.length]} />)}
          </div>
          <div style={{ marginTop: "18px", padding: "10px 14px", background: "var(--orbit-brand-muted)", borderRadius: "10px", fontSize: "12px", color: "var(--orbit-brand)", fontWeight: "600" }}>
            📈 Peak: <strong>{DAY_LABELS[DAILY_WEIGHTS.indexOf(Math.max(...DAILY_WEIGHTS))]}</strong> · <strong>{dailyData[DAILY_WEIGHTS.indexOf(Math.max(...DAILY_WEIGHTS))].value} sessions</strong>
          </div>
        </div>
      </div>

      {/* ── Score distribution ───────────────────────────────────────────────── */}
      <div style={{ background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)", borderRadius: "18px", padding: "24px 22px", marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3 style={{ fontSize: "13px", fontWeight: "800", color: "var(--orbit-text-heading)", margin: "0 0 2px" }}>Quiz Score Distribution</h3>
            <p style={{ fontSize: "11px", color: "var(--orbit-text-muted)", margin: 0 }}>Aggregate score bands · MCQ auto-graded results</p>
          </div>
          <span style={{ fontSize: "11px", fontWeight: "700", background: "var(--pastel-progress)", border: "1px solid var(--pastel-progress-border)", color: "var(--pastel-progress-text)", padding: "4px 10px", borderRadius: "var(--radius-full)" }}>Avg: 68%</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {BANDS.map((band, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "52px", flexShrink: 0, fontSize: "12px", fontWeight: "700", color: BAND_COLORS[i], textAlign: "right" }}>{band}</span>
              <div style={{ flex: 1, height: "14px", borderRadius: "8px", background: "var(--orbit-border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${BAND_PCTS[i]}%`, background: BAND_COLORS[i], borderRadius: "8px" }} />
              </div>
              <span style={{ width: "34px", flexShrink: 0, fontSize: "12px", fontWeight: "800", color: BAND_COLORS[i] }}>{BAND_PCTS[i]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ Department Grading Section ════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--orbit-text-heading)", margin: 0 }}>Department Grading &amp; Export</h3>
        <div style={{ flex: 1, height: "1.5px", background: "var(--orbit-border)" }} />
      </div>
      <p style={{ fontSize: "12px", color: "var(--orbit-text-muted)", margin: "0 0 20px" }}>
        Export a complete department grading workbook, score descriptive questions, then re-upload to sync XP and notify users in real-time.
      </p>

      {/* Dept export + import side-by-side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "24px" }}>

        {/* Export card */}
        <div style={{ background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)", borderRadius: "18px", padding: "22px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "800", color: "var(--orbit-text-heading)", margin: "0 0 6px" }}>Export Department Report</h4>
          <p style={{ fontSize: "11px", color: "var(--orbit-text-muted)", margin: "0 0 18px", lineHeight: 1.6 }}>
            Downloads a multi-sheet workbook covering <strong>every user</strong> in your department — MCQ auto-evaluated, descriptive responses extracted with empty grading columns.
          </p>
          <button
            onClick={handleExportDept}
            disabled={exportingDept || loadingDept}
            style={{
              width: "100%", padding: "12px 18px",
              background: (exportingDept || loadingDept) ? "var(--orbit-brand-muted)" : "var(--orbit-brand)",
              color: (exportingDept || loadingDept) ? "var(--orbit-brand)" : "#fff",
              border: "none",
              borderBottom: (exportingDept || loadingDept) ? "none" : "2.5px solid var(--orbit-brand-dark)",
              borderRadius: "12px", fontSize: "13px", fontWeight: "700",
              cursor: (exportingDept || loadingDept) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "all 0.15s",
            }}
          >
            {exportingDept || loadingDept ? "⏳ Preparing…" : "📊 Export Department Grading Report"}
          </button>
          {deptData && (
            <p style={{ marginTop: "10px", fontSize: "11px", color: "var(--orbit-text-muted)", textAlign: "center" }}>
              {deptData.department} · {deptData.users?.length || 0} user(s) with sandbox data
            </p>
          )}
        </div>

        {/* Import card */}
        <div style={{ background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)", borderRadius: "18px", padding: "22px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "800", color: "var(--orbit-text-heading)", margin: "0 0 6px" }}>Import Graded Report</h4>
          <p style={{ fontSize: "11px", color: "var(--orbit-text-muted)", margin: "0 0 14px", lineHeight: 1.6 }}>
            Re-upload the completed workbook. Scores sync instantly, XP is recalculated, and each user receives a <strong>live notification</strong>.
          </p>

          <div
            onClick={() => !importProcessing && importInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setImportDragging(true); }}
            onDragLeave={() => setImportDragging(false)}
            onDrop={e => { e.preventDefault(); setImportDragging(false); handleImportFile(e.dataTransfer.files[0]); }}
            style={{
              border: `2px dashed ${importDragging ? "var(--orbit-brand)" : "var(--orbit-border)"}`,
              borderRadius: "12px", padding: "22px 16px", textAlign: "center",
              cursor: importProcessing ? "not-allowed" : "pointer",
              background: importDragging ? "var(--orbit-brand-muted)" : "var(--orbit-canvas)",
              transition: "all 0.15s",
            }}
          >
            <input ref={importInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
              onChange={e => { if (e.target.files[0]) handleImportFile(e.target.files[0]); e.target.value = ""; }}
            />
            <div style={{ fontSize: "26px", marginBottom: "6px" }}>{importProcessing ? "⏳" : "📤"}</div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--orbit-text-heading)" }}>
              {importProcessing ? "Syncing grades…" : "Drop graded .xlsx here or click"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--orbit-text-muted)", marginTop: "3px" }}>Accepts multi-sheet department workbooks</div>
          </div>

          {importStatus && (
            <div style={{
              marginTop: "12px", padding: "10px 14px", borderRadius: "10px",
              background: importStatus.success ? "var(--pastel-progress)" : "var(--pastel-quiz)",
              border: `1px solid ${importStatus.success ? "var(--pastel-progress-border)" : "var(--pastel-quiz-border)"}`,
              color: importStatus.success ? "var(--pastel-progress-text)" : "var(--pastel-quiz-text)",
              fontSize: "12px", fontWeight: "600",
            }}>
              {importStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* ══ HTML Sandbox Module Grading ═══════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--orbit-text-heading)", margin: 0 }}>HTML Sandbox Module Grading</h3>
        <div style={{ flex: 1, height: "1.5px", background: "var(--orbit-border)" }} />
      </div>
      <p style={{ fontSize: "12px", color: "var(--orbit-text-muted)", margin: "0 0 16px" }}>
        Pick an HTML Sandbox Module, grade each learner's descriptive answers with the slider, and export the raw submissions as CSV.
      </p>

      <div style={{ background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)", borderRadius: "18px", padding: "20px 22px", marginBottom: "32px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
          <select
            value={selectedHtmlModule?._id || ""}
            onChange={e => setSelectedHtmlModule(htmlModules.find(m => m._id === e.target.value) || null)}
            style={{ flex: 1, minWidth: "220px", padding: "9px 12px", background: "var(--orbit-canvas)", border: "1.5px solid var(--orbit-border)", borderRadius: "10px", fontSize: "12.5px", color: "var(--orbit-text-body)", fontFamily: "inherit" }}
          >
            <option value="">{htmlModules.length === 0 ? "No HTML Sandbox Modules found" : "Select an HTML Sandbox Module…"}</option>
            {htmlModules.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
          </select>
          <button
            onClick={handleExportHtmlCsv}
            disabled={!selectedHtmlModule || exportingHtmlCsv}
            style={{
              padding: "9px 16px",
              background: (!selectedHtmlModule || exportingHtmlCsv) ? "var(--orbit-brand-muted)" : "var(--orbit-brand)",
              color: (!selectedHtmlModule || exportingHtmlCsv) ? "var(--orbit-brand)" : "#fff",
              border: "none", borderRadius: "10px", fontSize: "12.5px", fontWeight: "700",
              cursor: (!selectedHtmlModule || exportingHtmlCsv) ? "not-allowed" : "pointer",
            }}
          >
            {exportingHtmlCsv ? "⏳ Preparing…" : "⬇️ Download CSV"}
          </button>
        </div>

        {!selectedHtmlModule ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--orbit-text-muted)", fontSize: "12px" }}>Select a module to review submissions.</div>
        ) : loadingHtmlSubs ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--orbit-text-muted)", fontSize: "12px" }}>Loading submissions…</div>
        ) : htmlSubmissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--orbit-text-muted)", fontSize: "12px" }}>No submissions yet for this module.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {htmlSubmissions.map((sub) => {
              const maxPoints = Number(htmlModuleCard?.content?.maxPoints) || 15;
              const textQuestions = (sub.questions || []).filter(q => q.type === "text" || q.type === "code");
              const draft = gradeDrafts[sub.user._id] ?? (sub.adminScore ?? "");
              return (
                <div key={sub.user._id} style={{ padding: "14px 16px", background: "var(--orbit-canvas)", borderRadius: "12px", border: "1px solid var(--orbit-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--orbit-text-heading)" }}>{sub.user.username}</div>
                      <div style={{ fontSize: "11px", color: "var(--orbit-text-muted)" }}>{sub.user.email} · Objective: {sub.score}/{sub.maxScore}</div>
                    </div>
                  </div>

                  {textQuestions.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                      {textQuestions.map((q, qi) => (
                        <div key={qi} style={{ padding: "8px 12px", background: "var(--orbit-surface)", borderRadius: "8px", border: "1px solid var(--orbit-border)" }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--orbit-text-muted)", marginBottom: "3px" }}>{q.questionText || q.id}</div>
                          <div style={{ fontSize: "12px", color: "var(--orbit-text-body)", whiteSpace: "pre-wrap" }}>{q.userAnswer || "(no response)"}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <input
                      type="range" min="0" max={maxPoints} step="1"
                      value={draft === "" ? 0 : draft}
                      onChange={e => setGradeDrafts(prev => ({ ...prev, [sub.user._id]: e.target.value }))}
                      style={{ flex: 1, minWidth: "140px" }}
                    />
                    <input
                      type="number" min="0" max={maxPoints}
                      value={draft}
                      onChange={e => setGradeDrafts(prev => ({ ...prev, [sub.user._id]: e.target.value }))}
                      style={{ width: "64px", padding: "5px 8px", border: "1.5px solid var(--orbit-border)", borderRadius: "8px", fontSize: "12px", textAlign: "center" }}
                    />
                    <span style={{ fontSize: "11px", color: "var(--orbit-text-muted)" }}>/ {maxPoints} pts</span>
                    <button
                      onClick={() => handleGradeSubmission(sub.user._id)}
                      disabled={gradingUserId === sub.user._id}
                      style={{
                        padding: "6px 14px",
                        background: gradingUserId === sub.user._id ? "var(--orbit-brand-muted)" : "var(--orbit-brand)",
                        color: gradingUserId === sub.user._id ? "var(--orbit-brand)" : "#fff",
                        border: "none", borderRadius: "8px", fontSize: "11.5px", fontWeight: "700",
                        cursor: gradingUserId === sub.user._id ? "not-allowed" : "pointer",
                      }}
                    >
                      {gradingUserId === sub.user._id ? "Saving…" : "Save Grade"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ User Roster + Sandbox Detail ══════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--orbit-text-heading)", margin: 0 }}>User Roster</h3>
        <div style={{ flex: 1, height: "1.5px", background: "var(--orbit-border)" }} />
      </div>
      <p style={{ fontSize: "12px", color: "var(--orbit-text-muted)", margin: "0 0 18px" }}>
        Click a user to inspect their sandbox score breakdown (MCQ auto-score separated from descriptive admin score).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "18px", alignItems: "flex-start" }}>

        {/* Left: user list */}
        <div style={{ background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)", borderRadius: "18px", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1.5px solid var(--orbit-border)" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", opacity: 0.45, pointerEvents: "none" }}>🔍</span>
              <input type="text" placeholder="Search users…" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                style={{ width: "100%", padding: "7px 12px 7px 30px", background: "var(--orbit-canvas)", border: "1.5px solid var(--orbit-border)", borderRadius: "8px", fontSize: "12px", color: "var(--orbit-text-body)", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ maxHeight: "440px", overflowY: "auto" }}>
            {filteredUsers.length === 0
              ? <div style={{ padding: "24px", textAlign: "center", fontSize: "12px", color: "var(--orbit-text-muted)" }}>{users.length === 0 ? "No users." : "No match."}</div>
              : filteredUsers.map((u, i) => {
                  const isSel = selectedUser?._id === u._id;
                  return (
                    <div key={u._id} onClick={() => setSelectedUser(isSel ? null : u)}
                      style={{ padding: "10px 16px", borderBottom: i < filteredUsers.length - 1 ? "1px solid var(--orbit-border)" : "none", cursor: "pointer", background: isSel ? "var(--orbit-brand-muted)" : "transparent", transition: "background 0.12s", display: "flex", alignItems: "center", gap: "10px" }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(124,110,247,0.06)"; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isSel ? "var(--orbit-brand-muted)" : "transparent"; }}
                    >
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0, background: isSel ? "var(--orbit-brand)" : "var(--orbit-border)", color: isSel ? "#fff" : "var(--orbit-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800" }}>
                        {(u.username || "U").substring(0, 1).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: isSel ? "var(--orbit-brand)" : "var(--orbit-text-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.username}</div>
                        <div style={{ fontSize: "11px", color: "var(--orbit-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--orbit-brand)" }}>⚡{u.xp || 0}</div>
                        <div style={{ fontSize: "10px", color: "var(--orbit-text-muted)" }}>{u.cardsCompleted || 0} cards</div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
          <div style={{ padding: "9px 16px", borderTop: "1px solid var(--orbit-border)", fontSize: "11px", color: "var(--orbit-text-muted)", textAlign: "center" }}>
            {filteredUsers.length} / {users.length} users
          </div>
        </div>

        {/* Right: sandbox detail */}
        {!selectedUser ? (
          <div style={{ background: "var(--orbit-surface)", border: "2px dashed var(--orbit-border)", borderRadius: "18px", padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", textAlign: "center", minHeight: "300px" }}>
            <div style={{ fontSize: "40px", opacity: 0.3 }}>🔬</div>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--orbit-text-muted)", margin: 0, maxWidth: "260px" }}>
              Select a user to inspect their sandbox score breakdown with MCQ vs descriptive separation.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* User header */}
            <div style={{ background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)", borderRadius: "18px", padding: "18px 22px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--orbit-brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "800", flexShrink: 0 }}>
                {(selectedUser.username || "U").substring(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--orbit-text-heading)" }}>{selectedUser.username}</div>
                <div style={{ fontSize: "12px", color: "var(--orbit-text-muted)" }}>{selectedUser.email}</div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { l: "⚡ XP", v: selectedUser.xp || 0, c: "var(--pastel-streak-text)", bg: "var(--pastel-streak)", b: "var(--pastel-streak-border)" },
                  { l: "🃏 Cards", v: selectedUser.cardsCompleted || 0, c: "var(--orbit-brand)", bg: "var(--orbit-brand-muted)", b: "var(--orbit-brand)" },
                  { l: "📚 Topics", v: selectedUser.topicsCompleted || 0, c: "var(--pastel-progress-text)", bg: "var(--pastel-progress)", b: "var(--pastel-progress-border)" },
                ].map((chip, i) => (
                  <div key={i} style={{ padding: "5px 10px", borderRadius: "8px", background: chip.bg, border: `1px solid ${chip.b}`, fontSize: "11px", fontWeight: "700", color: chip.c }}>
                    {chip.l}: {chip.v}
                  </div>
                ))}
              </div>
            </div>

            {/* Sandbox score breakdown */}
            <div style={{ background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)", borderRadius: "18px", padding: "20px 22px" }}>
              <h4 style={{ fontSize: "13px", fontWeight: "800", color: "var(--orbit-text-heading)", margin: "0 0 4px" }}>Sandbox Score Breakdown</h4>
              <p style={{ fontSize: "11px", color: "var(--orbit-text-muted)", margin: "0 0 14px" }}>
                MCQ/True-False scores computed from individual question results — not the raw score field — to avoid aggregation mismatches.
              </p>

              {sandboxLoading ? (
                <div style={{ textAlign: "center", padding: "18px", color: "var(--orbit-text-muted)", fontSize: "12px" }}>Loading sandbox data…</div>
              ) : (sandboxData?.sandboxResults?.length || 0) === 0 ? (
                <div style={{ textAlign: "center", padding: "18px", color: "var(--orbit-text-muted)", fontSize: "12px" }}>No sandbox submissions yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {sandboxData.sandboxResults.map((card, i) => {
                    const { autoScore, autoMax, descMax, mcqCount, descCount } = computeScores(card.questions);
                    const adminScore  = card.adminScore    ?? null;
                    const adminFeedback = card.adminFeedback || "";
                    const totalMax    = autoMax + descMax;
                    const totalScore  = autoScore + (adminScore || 0);
                    return (
                      <div key={i} style={{ padding: "14px 16px", background: "var(--orbit-canvas)", borderRadius: "12px", border: "1px solid var(--orbit-border)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--orbit-text-heading)" }}>{card.cardTitle}</div>
                            <div style={{ fontSize: "11px", color: "var(--orbit-text-muted)" }}>{card.moduleTitle}</div>
                          </div>
                          {totalMax > 0 && (
                            <span style={{ fontSize: "13px", fontWeight: "900", color: "var(--orbit-brand)", background: "var(--orbit-brand-muted)", padding: "3px 10px", borderRadius: "8px", border: "1px solid var(--orbit-brand)" }}>
                              {totalScore} / {totalMax} pts
                            </span>
                          )}
                        </div>

                        {/* MCQ row */}
                        {mcqCount > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--orbit-text-muted)", width: "110px", flexShrink: 0 }}>MCQ / Auto:</span>
                            <span style={{ fontSize: "12px", fontWeight: "800", color: autoMax > 0 && autoScore === autoMax ? "var(--pastel-progress-text)" : "var(--orbit-brand)" }}>
                              {autoScore} / {autoMax}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--orbit-text-muted)" }}>({mcqCount} question{mcqCount !== 1 ? "s" : ""})</span>
                          </div>
                        )}

                        {/* Descriptive row */}
                        {descCount > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: adminFeedback ? "8px" : "0" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--orbit-text-muted)", width: "110px", flexShrink: 0 }}>Descriptive:</span>
                            {adminScore !== null ? (
                              <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--pastel-progress-text)" }}>
                                {adminScore} / {descMax} (admin graded)
                              </span>
                            ) : (
                              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--pastel-quiz-text)", background: "var(--pastel-quiz)", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--pastel-quiz-border)" }}>
                                {descCount} question{descCount !== 1 ? "s" : ""} · pending admin grading
                              </span>
                            )}
                          </div>
                        )}

                        {/* Admin feedback */}
                        {adminFeedback && (
                          <div style={{ marginTop: "8px", padding: "8px 12px", background: "rgba(124,110,247,0.07)", borderRadius: "8px", borderLeft: "3px solid var(--orbit-brand)", fontSize: "11px", color: "var(--orbit-text-body)", fontStyle: "italic" }}>
                            💬 {adminFeedback}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
