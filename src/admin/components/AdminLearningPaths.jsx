// src/admin/components/AdminLearningPaths.jsx
// All Learning Paths, grouped by tag, with one-click publish/edit/duplicate.
// "+ New path" and "Edit" open the step-by-step PathWizard on the same page.
import React, { useCallback, useEffect, useState } from "react";
import { Button, Badge, Spinner, Alert, Form, Table } from "react-bootstrap";
import { PlusCircle, PencilSquare, Files, Trash, SignpostSplit, ArrowUp, ArrowDown } from "react-bootstrap-icons";
import api from "../services/api";
import PathWizard from "./PathWizard";

const idOf = (v) => (v && v._id ? v._id : v || "").toString();

function testLabel(p) {
  if (!p.assessment?.enabled) return <span className="text-muted">Off</span>;
  if (p.test?.lockedVersion) return <Badge bg="success">v{p.test.lockedVersion} locked</Badge>;
  if (p.test?.latestVersion) return <Badge bg="warning" text="dark">draft — lock it</Badge>;
  return <Badge bg="warning" text="dark">not generated</Badge>;
}

export default function AdminLearningPaths({ initialCategoryId, wizardState, setWizardState, onOpenBank }) {
  const [tags, setTags] = useState([]);
  const [paths, setPaths] = useState([]);
  const [tagFilter, setTagFilter] = useState(initialCategoryId || "");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([api.getCategories(), api.getAdminPaths()]);
      setTags(t?.data || []);
      setPaths(p?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load paths.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { if (!wizardState) load(); }, [wizardState, load]);

  const run = async (id, fn, msg) => {
    setBusyId(id); setError(""); setNotice("");
    try { await fn(); if (msg) setNotice(msg); await load(); } catch (err) { setError(err.message || "That didn't work."); } finally { setBusyId(null); }
  };

  if (wizardState) {
    return (
      <PathWizard
        key={wizardState.pathId || "new"}
        pathId={wizardState.pathId}
        initialStep={wizardState.step}
        defaultCategoryId={tagFilter || undefined}
        onClose={() => setWizardState(null)}
        onOpenBank={onOpenBank}
      />
    );
  }

  const shownTags = tags.filter((t) => !tagFilter || t._id === tagFilter);
  const audienceText = (p) => {
    const a = p.audience || {};
    const parts = [];
    if (a.regions?.length) parts.push(`${a.regions.length} region${a.regions.length > 1 ? "s" : ""}`);
    if (a.departments?.length) parts.push(`${a.departments.length} dept${a.departments.length > 1 ? "s" : ""}`);
    if (a.teams?.length) parts.push(`${a.teams.length} team${a.teams.length > 1 ? "s" : ""}`);
    return parts.join(" · ") || "Everyone";
  };
  const move = (list, index, delta, categoryId) => {
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    run("reorder", () => api.reorderPaths(categoryId, next.map((p) => p._id)));
  };

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-1">
        <SignpostSplit size={20} />
        <h4 className="fw-bold m-0">Learning Paths</h4>
        <Button className="ms-auto" onClick={() => setWizardState({ pathId: null })}><PlusCircle className="me-1" /> New path</Button>
      </div>
      <p className="text-muted small">
        Learners go Learn → Tag → Path → modules. Only <strong>published</strong> paths are visible, and only to their audience.
      </p>
      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
      {notice && <Alert variant="success" className="py-2 small">{notice}</Alert>}
      <Form.Select size="sm" style={{ maxWidth: 260 }} className="mb-3" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
        <option value="">All tags</option>
        {tags.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
      </Form.Select>

      {loading ? <div className="text-center py-5"><Spinner size="sm" /></div> : shownTags.map((tag) => {
        const list = paths.filter((p) => idOf(p.categoryId) === tag._id);
        if (!list.length && !tagFilter) return null;
        return (
          <div key={tag._id} className="mb-4">
            <div className="fw-bold mb-2">{tag.name}</div>
            {list.length === 0 ? (
              <div className="text-muted small border rounded-3 p-3">No paths in this tag yet.</div>
            ) : (
              <Table size="sm" hover responsive className="align-middle">
                <thead><tr><th>Path</th><th>Modules</th><th>Who sees it</th><th>Pre/Post</th><th>Status</th><th style={{ width: 260 }} /></tr></thead>
                <tbody>
                  {list.map((p, i) => (
                    <tr key={p._id}>
                      <td>
                        <button type="button" className="btn btn-link p-0 fw-semibold text-start" onClick={() => setWizardState({ pathId: p._id })}>{p.name}</button>
                        <div className="text-muted" style={{ fontSize: 11 }}>{(p.modules || []).map((m) => m.title).join(" → ")}</div>
                      </td>
                      <td>{(p.moduleIds || []).length}</td>
                      <td className="small">{audienceText(p)}</td>
                      <td className="small">{testLabel(p)}</td>
                      <td><Badge bg={p.status === "published" ? "success" : "secondary"}>{p.status}</Badge></td>
                      <td className="text-end text-nowrap">
                        <Button size="sm" variant="outline-secondary" className="me-1" disabled={i === 0 || !!busyId} onClick={() => move(list, i, -1, tag._id)} aria-label="Move up"><ArrowUp /></Button>
                        <Button size="sm" variant="outline-secondary" className="me-1" disabled={i === list.length - 1 || !!busyId} onClick={() => move(list, i, 1, tag._id)} aria-label="Move down"><ArrowDown /></Button>
                        <Button size="sm" variant={p.status === "published" ? "outline-warning" : "outline-success"} className="me-1" disabled={busyId === p._id}
                          onClick={() => run(p._id, () => api.publishPath(p._id, p.status !== "published"), p.status === "published" ? "Unpublished." : "Published.")}>
                          {busyId === p._id ? <Spinner size="sm" /> : p.status === "published" ? "Unpublish" : "Publish"}
                        </Button>
                        <Button size="sm" variant="outline-primary" className="me-1" onClick={() => setWizardState({ pathId: p._id })} aria-label="Edit"><PencilSquare /></Button>
                        <Button size="sm" variant="outline-secondary" className="me-1" disabled={!!busyId} title="Duplicate (e.g. for a region version)"
                          onClick={() => run(p._id, () => api.duplicatePath(p._id), "Duplicated as a draft.")} aria-label="Duplicate"><Files /></Button>
                        <Button size="sm" variant="outline-danger" disabled={!!busyId} aria-label="Delete"
                          onClick={() => window.confirm(`Delete path "${p.name}"? Learners' module progress is kept.`) && run(p._id, () => api.deletePath(p._id), "Deleted.")}>
                          <Trash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        );
      })}
    </div>
  );
}
