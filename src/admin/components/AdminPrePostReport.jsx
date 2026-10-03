// src/admin/components/AdminPrePostReport.jsx
// Pre/Post report for Paths that have a Pre/Post check. One row per Path
// (started / Pre done / Post done / averages / improvement); click a Path
// for one row per learner. CSV export at both levels. The server scopes the
// learners to the admin's own department (a Superadmin can pick one).
import React, { useContext, useEffect, useState } from "react";
import { Table, Spinner, Alert, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { Download, ArrowLeft, ClipboardCheck } from "react-bootstrap-icons";
import api from "../services/api";
import AuthContext from "../../context/AuthContext";

const pctCell = (v) => (v === null || v === undefined ? <span className="text-muted">—</span> : `${v}%`);
const deltaCell = (v) => {
  if (v === null || v === undefined) return <span className="text-muted">—</span>;
  const color = v > 0 ? "#0f7a4c" : v < 0 ? "#c0392b" : undefined;
  return <span style={{ color, fontWeight: 700 }}>{v > 0 ? `+${v}` : v}</span>;
};

export default function AdminPrePostReport() {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === "superadmin";
  const [tags, setTags] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ categoryId: "", departmentId: "" });
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null); // { path, summary, data }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getCategories().then((r) => setTags(r?.data || [])).catch(() => {});
    if (isSuperAdmin) api.getDepartments().then((d) => setDepartments(Array.isArray(d) ? d : [])).catch(() => {});
  }, [isSuperAdmin]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    api.getPrePostReport(filters)
      .then((r) => { if (!cancelled) setRows(r?.data || []); })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load the report."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const openPath = async (pathId) => {
    setLoading(true); setError("");
    try {
      const r = await api.getPrePostPathReport(pathId, { departmentId: filters.departmentId });
      setDetail(r);
    } catch (err) {
      setError(err.message || "Failed to load this path.");
    } finally {
      setLoading(false);
    }
  };

  const csv = async (pathId) => {
    try { await api.downloadPrePostCsv(pathId, { categoryId: pathId ? "" : filters.categoryId, departmentId: filters.departmentId }); }
    catch (err) { setError(err.message || "CSV export failed."); }
  };

  return (
    <div>
      <h4 className="fw-bold mb-1 d-flex align-items-center gap-2"><ClipboardCheck size={20} /> Pre/Post Report</h4>
      <p className="text-muted small">
        For paths with a Pre/Post check. <strong>Pre</strong> is the learner's starting score (never graded),
        <strong> Post</strong> is their score after the last module, and <strong>improvement</strong> is averaged over learners who took both.
        "No baseline" = started the path before its Pre-check existed. {isSuperAdmin ? "" : "Showing learners in your department."}
      </p>
      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

      {detail ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <Button size="sm" variant="outline-secondary" onClick={() => setDetail(null)}><ArrowLeft className="me-1" /> All paths</Button>
            <Button size="sm" variant="outline-primary" onClick={() => csv(detail.path._id)}><Download className="me-1" /> CSV</Button>
          </div>
          <h5 className="fw-bold">{detail.path.name}</h5>
          <p className="small text-muted mb-2">
            {detail.summary.started} started · Pre avg {pctCell(detail.summary.preAvg)} · Post avg {pctCell(detail.summary.postAvg)} ·
            Avg improvement {deltaCell(detail.summary.improvementAvg)} ({detail.summary.pairedCount} with both)
          </p>
          <Table size="sm" hover responsive>
            <thead>
              <tr><th>Name</th><th>Department</th><th>Pre</th><th>Post</th><th>Improvement</th><th>Modules</th><th>Status</th></tr>
            </thead>
            <tbody>
              {detail.data.map((l) => (
                <tr key={l.userId}>
                  <td><div className="fw-semibold small">{l.username}</div><div className="text-muted" style={{ fontSize: 11 }}>{l.email}</div></td>
                  <td className="small">{l.department}{l.team ? ` · ${l.team}` : ""}</td>
                  <td>{l.noBaseline ? <Badge bg="light" text="dark">No baseline</Badge> : pctCell(l.prePercent)}</td>
                  <td>{pctCell(l.postPercent)}</td>
                  <td>{deltaCell(l.improvement)}</td>
                  <td className="small">{l.modulesCompleted}/{l.modulesTotal}</td>
                  <td className="small">{l.status}</td>
                </tr>
              ))}
              {detail.data.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-3">Nobody has started this path yet.</td></tr>}
            </tbody>
          </Table>

          {detail.byModule?.length > 0 && (
            <>
              <h6 className="fw-bold mt-4">By module</h6>
              <p className="small text-muted mb-1">How learners did on each module's questions — a small gain points to a module worth improving.</p>
              <Table size="sm" responsive>
                <thead><tr><th>Module</th><th>Pre</th><th>Post</th><th>Change</th></tr></thead>
                <tbody>
                  {detail.byModule.map((m) => (
                    <tr key={m.moduleId}>
                      <td className="small">{m.title}</td>
                      <td>{pctCell(m.prePercent)}</td>
                      <td>{pctCell(m.postPercent)}</td>
                      <td>{deltaCell(m.prePercent !== null && m.postPercent !== null ? m.postPercent - m.prePercent : null)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}

          {detail.byQuestion?.length > 0 && (
            <>
              <h6 className="fw-bold mt-4">By question (lowest first)</h6>
              <Table size="sm" responsive>
                <thead><tr><th>Check</th><th>Question</th><th>Module</th><th>Difficulty</th><th>Answered</th><th>Right</th></tr></thead>
                <tbody>
                  {detail.byQuestion.map((q) => (
                    <tr key={`${q.kind}:${q.questionId}`}>
                      <td><Badge bg={q.kind === "pre" ? "secondary" : "primary"}>{q.kind === "pre" ? "Pre" : "Post"}</Badge></td>
                      <td className="small">{q.question}</td>
                      <td className="small">{q.module}</td>
                      <td className="small">{q.difficulty}</td>
                      <td>{q.answered}</td>
                      <td style={{ fontWeight: 700, color: q.correctPercent < 50 ? "#c0392b" : undefined }}>{q.correctPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </>
      ) : (
        <>
          <Row className="g-2 mb-2 align-items-end">
            <Col md={4}>
              <Form.Label className="small fw-semibold">Tag</Form.Label>
              <Form.Select size="sm" value={filters.categoryId} onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}>
                <option value="">All tags</option>
                {tags.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </Form.Select>
            </Col>
            {isSuperAdmin && (
              <Col md={4}>
                <Form.Label className="small fw-semibold">Department</Form.Label>
                <Form.Select size="sm" value={filters.departmentId} onChange={(e) => setFilters((f) => ({ ...f, departmentId: e.target.value }))}>
                  <option value="">All departments</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </Form.Select>
              </Col>
            )}
            <Col className="text-end">
              <Button size="sm" variant="outline-primary" onClick={() => csv(null)} disabled={!rows.length}><Download className="me-1" /> CSV</Button>
            </Col>
          </Row>
          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
          ) : (
            <Table size="sm" hover responsive>
              <thead>
                <tr><th>Path</th><th>Started</th><th>Pre done</th><th>Post done</th><th>Completed</th><th>Pre avg</th><th>Post avg</th><th>Improvement</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.pathId} style={{ cursor: "pointer" }} onClick={() => openPath(r.pathId)}>
                    <td>
                      <div className="fw-semibold small">{r.path}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{r.tag}{r.status !== "published" ? " · draft" : ""}</div>
                    </td>
                    <td>{r.started}</td>
                    <td>{r.preDone}</td>
                    <td>{r.postDone}</td>
                    <td>{r.completedPath}</td>
                    <td>{pctCell(r.preAvg)}</td>
                    <td>{pctCell(r.postAvg)}</td>
                    <td>{deltaCell(r.improvementAvg)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-muted py-3">No paths with a Pre/Post check yet. Turn it on in Tags → Paths → Details.</td></tr>
                )}
              </tbody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
