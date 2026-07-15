// src/admin/components/AdminProgressDashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Progress Dashboard — one row per (user, module). Standard modules show
// read-only % complete / status / time spent; HTML Sandbox modules add a
// grading status chip plus CSV export/import actions (reusing the existing
// per-module CSV export + the new per-module CSV import endpoint).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";

function formatTime(seconds) {
  const s = Number(seconds) || 0;
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  if (mins < 60) return `${mins}m ${s % 60}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

const STATUS_STYLES = {
  Completed:           { bg: "var(--pastel-progress)", border: "var(--pastel-progress-border)", text: "var(--pastel-progress-text)" },
  "In Progress":        { bg: "var(--pastel-quiz)",     border: "var(--pastel-quiz-border)",     text: "var(--pastel-quiz-text)" },
  "Pending Evaluation": { bg: "var(--pastel-streak)",   border: "var(--pastel-streak-border)",   text: "var(--pastel-streak-text)" },
  Evaluated:            { bg: "var(--pastel-progress)", border: "var(--pastel-progress-border)", text: "var(--pastel-progress-text)" },
};

function StatusChip({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["In Progress"];
  return (
    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: s.bg, border: `1px solid ${s.border}`, color: s.text, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

const TYPE_FILTERS = [
  ["all", "All"],
  ["standard", "Standard"],
  ["html_sandbox", "HTML Sandbox"],
];

export default function AdminProgressDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [exportingId, setExportingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRefs = useRef({});

  const loadRows = () => {
    setLoading(true);
    setError("");
    api.getAdminModuleProgressTable()
      .then(res => setRows(res?.rows || []))
      .catch(e => setError(e.message || "Failed to load progress table."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRows(); }, []);

  const filteredRows = rows.filter(r => {
    if (typeFilter !== "all" && r.moduleType !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.username?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.moduleTitle?.toLowerCase().includes(q);
  });

  const handleExportCsv = async (row) => {
    setExportingId(row.moduleId);
    try {
      await api.exportModuleSubmissionsCsv(row.moduleId);
    } catch (e) {
      setError(e.message || "CSV export failed.");
    } finally {
      setExportingId(null);
    }
  };

  const handleUploadClick = (moduleId) => {
    fileInputRefs.current[moduleId]?.click();
  };

  const handleUploadFile = async (moduleId, file) => {
    if (!file) return;
    if (!file.name.match(/\.csv$/i)) {
      setError("Please upload a .csv file.");
      return;
    }
    setUploadingId(moduleId);
    try {
      const result = await api.importModuleGradesCsv(moduleId, file);
      const updated = result?.results?.filter(r => r.status === "updated").length || 0;
      if (updated === 0) {
        setError("No matching submissions were updated — check the CSV's User ID/Card ID columns weren't altered.");
      }
      loadRows();
    } catch (e) {
      setError(e.message || "CSV import failed.");
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--orbit-text-muted)", fontSize: "14px" }}>Loading progress dashboard…</div>;
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "var(--orbit-text-body)" }}>

      <div style={{ marginBottom: "22px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "-0.4px", color: "var(--orbit-text-heading)", margin: "0 0 4px" }}>
          Progress Dashboard
        </h2>
        <p style={{ fontSize: "13px", color: "var(--orbit-text-muted)", margin: 0 }}>
          Every learner's progress across every module — grade HTML Sandbox submissions directly from this table.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: "18px", padding: "10px 14px", borderRadius: "10px", background: "var(--pastel-quiz)", border: "1px solid var(--pastel-quiz-border)", color: "var(--pastel-quiz-text)", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {error}
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "inherit", lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", opacity: 0.45, pointerEvents: "none" }}>🔍</span>
          <input
            type="text" placeholder="Search by user or module…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 30px", background: "var(--orbit-canvas)", border: "1.5px solid var(--orbit-border)", borderRadius: "10px", fontSize: "12.5px", color: "var(--orbit-text-body)", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {TYPE_FILTERS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              style={{
                padding: "7px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", cursor: "pointer",
                border: `1.5px solid ${typeFilter === key ? "var(--orbit-brand)" : "var(--orbit-border)"}`,
                background: typeFilter === key ? "var(--orbit-brand-muted)" : "var(--orbit-surface)",
                color: typeFilter === key ? "var(--orbit-brand)" : "var(--orbit-text-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--orbit-surface)", border: "1.5px solid var(--orbit-border)", borderRadius: "18px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "var(--orbit-canvas)", borderBottom: "1.5px solid var(--orbit-border)" }}>
                {["User", "Module", "Type", "Progress", "Status", "Time Spent", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: "800", color: "var(--orbit-text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "36px", textAlign: "center", color: "var(--orbit-text-muted)", fontSize: "13px" }}>
                    {rows.length === 0 ? "No progress recorded yet." : "No rows match your filters."}
                  </td>
                </tr>
              ) : filteredRows.map(row => {
                const isSandbox = row.moduleType === "html_sandbox";
                const rowKey = `${row.userId}::${row.moduleId}`;
                return (
                  <tr key={rowKey} style={{ borderBottom: "1px solid var(--orbit-border)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: "700", color: "var(--orbit-text-heading)" }}>{row.username}</div>
                      <div style={{ fontSize: "11px", color: "var(--orbit-text-muted)" }}>{row.email}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "600" }}>{row.moduleTitle}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: isSandbox ? "var(--orbit-brand)" : "var(--orbit-text-muted)" }}>
                        {isSandbox ? "HTML Sandbox" : "Standard"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", minWidth: "140px" }}>
                      {!isSandbox ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "7px", borderRadius: "6px", background: "var(--orbit-border)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${row.percent}%`, background: "var(--orbit-brand)", borderRadius: "6px" }} />
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--orbit-text-muted)" }}>{row.percent}%</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--orbit-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}><StatusChip status={row.status} /></td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--orbit-text-muted)", whiteSpace: "nowrap" }}>{formatTime(row.timeSpentSeconds)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {!isSandbox ? (
                        <span style={{ fontSize: "11px", color: "var(--orbit-text-muted)" }}>—</span>
                      ) : (
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleExportCsv(row)}
                            disabled={exportingId === row.moduleId}
                            style={{
                              padding: "6px 12px", background: "var(--orbit-brand)", color: "#fff", border: "none",
                              borderRadius: "8px", fontSize: "11px", fontWeight: "700",
                              cursor: exportingId === row.moduleId ? "not-allowed" : "pointer",
                            }}
                          >
                            {exportingId === row.moduleId ? "⏳ …" : "⬇️ Download CSV"}
                          </button>
                          <button
                            onClick={() => handleUploadClick(row.moduleId)}
                            disabled={uploadingId === row.moduleId}
                            style={{
                              padding: "6px 12px", background: "var(--orbit-surface)", color: "var(--orbit-brand)",
                              border: "1.5px solid var(--orbit-brand)", borderRadius: "8px", fontSize: "11px", fontWeight: "700",
                              cursor: uploadingId === row.moduleId ? "not-allowed" : "pointer",
                            }}
                          >
                            {uploadingId === row.moduleId ? "Uploading…" : "⬆️ Upload Evaluated CSV"}
                          </button>
                          <input
                            ref={el => { fileInputRefs.current[row.moduleId] = el; }}
                            type="file" accept=".csv" style={{ display: "none" }}
                            onChange={e => { const f = e.target.files[0]; e.target.value = ""; handleUploadFile(row.moduleId, f); }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--orbit-text-muted)", textAlign: "right" }}>
        {filteredRows.length} / {rows.length} rows
      </div>
    </div>
  );
}
