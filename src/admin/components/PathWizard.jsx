// src/admin/components/PathWizard.jsx
// Create / edit one Learning Path as five plain steps on one page:
//   ① Basics ② Modules ③ Who sees it ④ Pre/Post ⑤ Review & Publish
// Step ① creates the path as a draft, so nothing is lost; every later step
// saves when you continue. The server enforces every rule — this page just
// makes them visible (the Review step lists exactly what's missing).
import React, { useEffect, useMemo, useState } from "react";
import { Button, Spinner, Alert, Form, Row, Col, Badge, InputGroup, Table } from "react-bootstrap";
import {
  GripVertical, PlusCircle, XCircle, Search, ArrowRepeat, LockFill, CheckCircleFill,
  ExclamationTriangleFill, BoxArrowUpRight, ArrowLeft,
} from "react-bootstrap-icons";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../services/api";

const STEPS = ["Basics", "Modules", "Who sees it", "Pre/Post", "Review & Publish"];
const DIFF_BADGE = { easy: "success", medium: "primary", hard: "danger" };
const idOf = (v) => (v && v._id ? v._id : v || "").toString();

function SortableRow({ module, position, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module._id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="d-flex align-items-center gap-2 p-2 mb-1 border rounded-3 bg-white">
      <span {...attributes} {...listeners} style={{ cursor: "grab", touchAction: "none" }} className="text-muted d-flex" aria-label="Drag to reorder"><GripVertical size={16} /></span>
      <span className="badge bg-secondary" style={{ minWidth: 26 }}>{position}</span>
      <span className="flex-grow-1 small">{module.title}</span>
      <Button size="sm" variant="link" className="text-danger p-0" onClick={() => onRemove(module._id)} aria-label={`Remove ${module.title}`}><XCircle /></Button>
    </div>
  );
}

function Stepper({ step, setStep, canJump }) {
  return (
    <div className="d-flex flex-wrap gap-2 mb-4">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <button key={label} type="button" disabled={!canJump}
            onClick={() => canJump && setStep(n)}
            className={`btn btn-sm rounded-pill ${active ? "btn-primary" : done ? "btn-outline-primary" : "btn-outline-secondary"}`}>
            {done ? "✓" : n} {label}
          </button>
        );
      })}
    </div>
  );
}

export default function PathWizard({ pathId: initialPathId, initialStep, defaultCategoryId, onClose, onOpenBank }) {
  const [pathId, setPathId] = useState(initialPathId || null);
  const [step, setStep] = useState(initialPathId && initialStep ? initialStep : 1);
  const [path, setPath] = useState(null);
  const [tags, setTags] = useState([]);
  const [library, setLibrary] = useState([]);
  const [regions, setRegions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(null); // test summary
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Editable fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId || "");
  const [newTagName, setNewTagName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState([]);
  const [sequentialUnlock, setSequentialUnlock] = useState(true);
  const [search, setSearch] = useState("");
  const [onlyThisTag, setOnlyThisTag] = useState(true);
  const [audienceMode, setAudienceMode] = useState("everyone");
  const [audience, setAudience] = useState({ regions: [], departments: [], teams: [] });
  const [assessmentOn, setAssessmentOn] = useState(false);
  const [perModule, setPerModule] = useState(2);

  const hydrate = (p, lib) => {
    setPath(p);
    setName(p.name || "");
    setCategoryId(idOf(p.categoryId));
    setDescription(p.description || "");
    setSequentialUnlock(p.sequentialUnlock !== false);
    const a = { regions: (p.audience?.regions || []).map(idOf), departments: (p.audience?.departments || []).map(idOf), teams: (p.audience?.teams || []).map(idOf) };
    setAudience(a);
    setAudienceMode(a.regions.length || a.departments.length || a.teams.length ? "some" : "everyone");
    setAssessmentOn(!!p.assessment?.enabled);
    setPerModule(p.assessment?.questionsPerModule || 2);
    const byId = new Map((lib || library).map((m) => [idOf(m._id), m]));
    setSelected((p.moduleIds || []).map((id) => byId.get(idOf(id))).filter(Boolean));
  };

  const loadForm = async (id = pathId) => {
    if (!id) return;
    try { setForm((await api.getPathForm(id)).data); } catch (err) { setError(err.message || "Failed to load the test."); }
  };

  useEffect(() => {
    (async () => {
      try {
        const [tagRes, mods, regs, depts] = await Promise.all([
          api.getCategories(), api.getModules(), api.getRegions().catch(() => ({ data: [] })), api.getDepartments().catch(() => []),
        ]);
        const lib = Array.isArray(mods) ? mods : [];
        setTags(tagRes?.data || []);
        setLibrary(lib);
        setRegions((regs?.data || []).filter((r) => !r.isDefault));
        setDepartments(Array.isArray(depts) ? depts : []);
        if (initialPathId) {
          const list = (await api.getAdminPaths()).data || [];
          const p = list.find((x) => x._id === initialPathId);
          if (p) hydrate(p, lib);
          await loadForm(initialPathId);
        } else if (!defaultCategoryId && tagRes?.data?.length) {
          setCategoryId(tagRes.data[0]._id);
        }
      } catch (err) {
        setError(err.message || "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPathId]);

  const run = async (fn, okMsg) => {
    setBusy(true); setError(""); setNotice("");
    try { const r = await fn(); if (okMsg) setNotice(okMsg); return r; }
    catch (err) { setError(err.message || "That didn't work."); return null; }
    finally { setBusy(false); }
  };

  const saveFields = async (fields) => {
    if (!pathId) {
      const res = await api.createPath({ categoryId, ...fields });
      setPathId(res.data._id);
      setPath(res.data);
      return res.data;
    }
    const res = await api.updatePath(pathId, fields);
    setPath(res.data);
    return res.data;
  };

  // ---------------- step actions ----------------
  const continueBasics = () => run(async () => {
    let tagId = categoryId;
    if (tagId === "__new") {
      if (!newTagName.trim()) throw new Error("Give the new tag a name.");
      const created = await api.createCategory({ name: newTagName.trim(), visibility: "Global", departments: [], targetTeams: [] });
      tagId = created?.data?._id || created?._id;
      setTags((t) => [...t, created?.data || created]);
      setCategoryId(tagId);
    }
    if (!name.trim()) throw new Error("Give the path a name.");
    await saveFields({ name: name.trim(), description, categoryId: tagId });
    setStep(2);
  });

  const continueModules = () => run(async () => {
    await saveFields({ moduleIds: selected.map((m) => m._id), sequentialUnlock });
    await loadForm();
    setStep(3);
  });

  const continueAudience = () => run(async () => {
    await saveFields({ audience: audienceMode === "everyone" ? { regions: [], departments: [], teams: [] } : audience });
    await loadForm();
    setStep(4);
  });

  // Generating also stores "questions per module" on the path.
  const generate = () => run(async () => {
    setForm((await api.generatePathForm(pathId, perModule)).data);
  }, "Test generated. Check the questions, swap any you don't like, then lock it.");

  const swap = (kind, questionId) => run(async () => setForm((await api.swapPathFormQuestion(pathId, kind, questionId)).data));
  const lock = () => run(async () => setForm((await api.lockPathForm(pathId)).data), "Test locked — this is what learners will take.");

  const continueAssessment = () => run(async () => {
    await saveFields({ assessment: { enabled: assessmentOn, questionsPerModule: perModule } });
    setStep(5);
  });

  const publish = (published) => run(async () => {
    const res = await api.publishPath(pathId, published);
    setPath(res.data);
  }, published ? "Published — learners in the audience can see it now." : "Unpublished — learners no longer see it.");

  // ---------------- derived ----------------
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const selectedIds = useMemo(() => selected.map((m) => m._id), [selected]);
  const available = useMemo(() => {
    const term = search.trim().toLowerCase();
    const tag = categoryId === "__new" ? "" : categoryId;
    return library
      .filter((m) => !selectedIds.includes(m._id))
      .filter((m) => !onlyThisTag || !tag || idOf(m.categoryId) === tag)
      .filter((m) => !term || (m.title || "").toLowerCase().includes(term))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [library, selectedIds, search, onlyThisTag, categoryId]);
  const teams = useMemo(() => departments.filter((d) => audience.departments.includes(idOf(d._id)))
    .flatMap((d) => (d.teams || []).map((t) => ({ ...t, deptName: d.name }))), [departments, audience.departments]);
  const toggle = (key, id) => setAudience((p) => ({
    ...p, [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id], ...(key === "departments" ? { teams: [] } : {}),
  }));
  const nameOf = (list, id) => list.find((x) => idOf(x._id) === id)?.name || "";
  const audienceText = audienceMode === "everyone" ? "Everyone" : [
    audience.regions.map((id) => nameOf(regions, id)).join(", "),
    audience.departments.map((id) => nameOf(departments, id)).join(", "),
    audience.teams.length ? `${audience.teams.length} team(s)` : "",
  ].filter(Boolean).join(" · ") || "Nobody selected yet";

  const testLocked = form?.form?.status === "locked";
  const checklist = [
    { ok: !!name.trim(), text: `Name: ${name || "—"}` },
    { ok: selected.length > 0, text: selected.length ? `${selected.length} module${selected.length === 1 ? "" : "s"}, ${sequentialUnlock ? "in order" : "open in any order"}` : "Add at least one module" },
    { ok: audienceMode === "everyone" || audienceText !== "Nobody selected yet", text: `Who sees it: ${audienceText}` },
    !assessmentOn
      ? { ok: true, text: "Pre/Post check: off" }
      : form?.activeVersion
        ? { ok: true, text: `Pre/Post check: test v${form.activeVersion} locked (${form.perModule} per module)${form.form?.status === "draft" ? ` — v${form.form.version} is still a draft` : ""}` }
        : { ok: false, text: "Pre/Post check is on: generate and lock the test (step 4)" },
  ];
  const ready = checklist.every((c) => c.ok);

  if (loading) return <div className="text-center py-5"><Spinner size="sm" /></div>;

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Button size="sm" variant="outline-secondary" onClick={onClose}><ArrowLeft className="me-1" /> All paths</Button>
        <h4 className="fw-bold m-0">{pathId ? name || "Edit path" : "New learning path"}</h4>
        {path?.status && <Badge bg={path.status === "published" ? "success" : "secondary"}>{path.status}</Badge>}
      </div>
      <Stepper step={step} setStep={setStep} canJump={!!pathId} />
      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
      {notice && <Alert variant="success" className="py-2 small">{notice}</Alert>}

      {step === 1 && (
        <div style={{ maxWidth: 640 }}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Path name</Form.Label>
            <Form.Control value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="e.g. Financial Reporting – India" autoFocus />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Tag (where it shows on the Learn page)</Form.Label>
            <Form.Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {tags.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              <option value="__new">+ New tag…</option>
            </Form.Select>
            {categoryId === "__new" && (
              <Form.Control className="mt-2" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="New tag name, e.g. Compliance" />
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Description (shown to learners)</Form.Label>
            <Form.Control as="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Form.Group>
          <Button onClick={continueBasics} disabled={busy || !name.trim()}>{busy ? <Spinner size="sm" /> : pathId ? "Save & continue →" : "Create draft & continue →"}</Button>
        </div>
      )}

      {step === 2 && (
        <>
          <Row className="g-3">
            <Col md={6}>
              <div className="small fw-semibold mb-1">Module library</div>
              <InputGroup size="sm" className="mb-1">
                <InputGroup.Text><Search /></InputGroup.Text>
                <Form.Control placeholder="Search modules…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </InputGroup>
              <Form.Check type="checkbox" id="wiz-only-tag" className="small mb-2" label="Only modules with this path's tag"
                checked={onlyThisTag} onChange={(e) => setOnlyThisTag(e.target.checked)} />
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {available.length === 0 && <div className="text-muted small py-2">No more modules{onlyThisTag ? " with this tag — untick the box to see all" : ""}.</div>}
                {available.map((m) => (
                  <div key={m._id} className="d-flex align-items-center gap-2 p-2 mb-1 border rounded-3">
                    <span className="flex-grow-1 small">{m.title}</span>
                    <Button size="sm" variant="outline-primary" onClick={() => setSelected((p) => [...p, m])}><PlusCircle className="me-1" /> Add</Button>
                  </div>
                ))}
              </div>
            </Col>
            <Col md={6}>
              <div className="small fw-semibold mb-1">Your path — drag to set the order</div>
              {selected.length === 0 ? <div className="text-muted small border rounded-3 p-3">Add modules from the library.</div> : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
                  if (!over || active.id === over.id) return;
                  setSelected((p) => arrayMove(p, p.findIndex((m) => m._id === active.id), p.findIndex((m) => m._id === over.id)));
                }}>
                  <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
                    {selected.map((m, i) => <SortableRow key={m._id} module={m} position={i + 1} onRemove={(id) => setSelected((p) => p.filter((x) => x._id !== id))} />)}
                  </SortableContext>
                </DndContext>
              )}
              <Form.Check type="switch" id="wiz-seq" className="small mt-3" label="Unlock in order (each module opens when the previous one is done)"
                checked={sequentialUnlock} onChange={(e) => setSequentialUnlock(e.target.checked)} />
            </Col>
          </Row>
          <div className="mt-3"><Button onClick={continueModules} disabled={busy}>{busy ? <Spinner size="sm" /> : "Save & continue →"}</Button></div>
        </>
      )}

      {step === 3 && (
        <div style={{ maxWidth: 820 }}>
          <Form.Check type="radio" id="aud-everyone" name="aud" className="mb-1" label={<span><strong>Everyone</strong> can see this path</span>}
            checked={audienceMode === "everyone"} onChange={() => setAudienceMode("everyone")} />
          <Form.Check type="radio" id="aud-some" name="aud" className="mb-3" label={<span><strong>Only</strong> some learners</span>}
            checked={audienceMode === "some"} onChange={() => setAudienceMode("some")} />
          {audienceMode === "some" && (
            <div className="border rounded-3 p-3 bg-light">
              <p className="small text-muted mb-2">A learner sees the path if they match every list you tick something in. Their region, department and team come from their profile.</p>
              {[["Regions", "regions", regions], ["Departments", "departments", departments]].map(([label, key, list]) => (
                <div className="mb-3" key={key}>
                  <div className="small fw-semibold mb-1">{label}</div>
                  <div className="d-flex flex-wrap gap-2">
                    {list.map((x) => {
                      const on = audience[key].includes(idOf(x._id));
                      return <Button key={x._id} size="sm" variant={on ? "primary" : "outline-secondary"} className="rounded-pill" onClick={() => toggle(key, idOf(x._id))}>{on ? "✓ " : ""}{x.name}</Button>;
                    })}
                  </div>
                </div>
              ))}
              {teams.length > 0 && (
                <div>
                  <div className="small fw-semibold mb-1">Teams (optional)</div>
                  <div className="d-flex flex-wrap gap-2">
                    {teams.map((t) => {
                      const on = audience.teams.includes(idOf(t._id));
                      return <Button key={t._id} size="sm" variant={on ? "primary" : "outline-secondary"} className="rounded-pill" onClick={() => toggle("teams", idOf(t._id))}>{on ? "✓ " : ""}{t.name} ({t.deptName})</Button>;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="mt-3"><Button onClick={continueAudience} disabled={busy}>{busy ? <Spinner size="sm" /> : "Save & continue →"}</Button></div>
        </div>
      )}

      {step === 4 && (
        <>
          <Form.Check type="switch" id="wiz-assess" className="mb-2" label={<strong>Pre-check before the first module and Post-check after the last</strong>}
            checked={assessmentOn} onChange={(e) => setAssessmentOn(e.target.checked)} />
          {!assessmentOn ? <p className="small text-muted">Off — learners go straight to the modules.</p> : (
            <>
              <p className="small text-muted mb-2">
                The Pre-check and Post-check are built from each module's <strong>question bank</strong>: different questions, same difficulty, every module covered equally.
              </p>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="small fw-semibold">Questions per module in each check</span>
                <Form.Select size="sm" style={{ width: 80 }} value={perModule} onChange={(e) => setPerModule(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </Form.Select>
                <span className="small text-muted">→ {perModule * selected.length} questions in each check</span>
              </div>
              <Table size="sm" responsive className="align-middle small">
                <thead><tr><th>Module</th><th>Bank (active)</th><th>Needs</th><th></th></tr></thead>
                <tbody>
                  {(form?.modules || []).map((m) => {
                    const need = perModule * 2;
                    const ok = m.activeCount >= need;
                    return (
                      <tr key={idOf(m.moduleId)}>
                        <td>{m.title}</td>
                        <td>
                          {m.activeCount} <span className="text-muted">({m.byDifficulty.easy}E · {m.byDifficulty.medium}M · {m.byDifficulty.hard}H)</span>
                          {m.draftCount > 0 && <Badge bg="info" className="ms-1">{m.draftCount} to review</Badge>}
                        </td>
                        <td>{ok ? <span className="text-success"><CheckCircleFill /> {need}</span> : <span className="text-warning"><ExclamationTriangleFill /> {need} — add {need - m.activeCount}</span>}</td>
                        <td className="text-end">
                          {onOpenBank && <Button size="sm" variant="link" onClick={() => onOpenBank(idOf(m.moduleId), pathId)}>Open bank <BoxArrowUpRight /></Button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <Button variant="primary" onClick={generate} disabled={busy}>
                  <ArrowRepeat className="me-1" /> {form?.form ? (testLocked ? "Make a new version" : "Generate again") : "Generate Pre & Post"}
                </Button>
                {form?.form && !testLocked && (
                  <Button variant="success" onClick={lock} disabled={busy || form.problems.length > 0}><LockFill className="me-1" /> Lock this test</Button>
                )}
                {form?.activeVersion && <Badge bg="success" className="align-self-center">Learners take v{form.activeVersion}</Badge>}
              </div>
              {form?.form && form.problems.length > 0 && (
                <Alert variant="warning" className="py-2 small"><ul className="mb-0 ps-3">{form.problems.map((p) => <li key={p}>{p}</li>)}</ul></Alert>
              )}

              {form?.form && (
                <Row className="g-3">
                  {["pre", "post"].map((kind) => (
                    <Col md={6} key={kind}>
                      <div className="fw-semibold mb-2">
                        {kind === "pre" ? "Pre-check" : "Post-check"} <span className="text-muted small">v{form.form.version} · {form.form.status}</span>
                      </div>
                      {form.form[kind].map((q, i) => (
                        <div key={q._id} className="border rounded-3 p-2 mb-2 small bg-white d-flex gap-2">
                          <span className="text-muted">{i + 1}.</span>
                          <div className="flex-grow-1">
                            <div className="fw-semibold">{q.question}</div>
                            <div className="text-muted">✓ {q.options[q.correctIndex]}</div>
                            <div className="mt-1"><Badge bg={DIFF_BADGE[q.difficulty]}>{q.difficulty}</Badge> <span className="text-muted">{q.moduleTitle}</span></div>
                          </div>
                          {!testLocked && (
                            <Button size="sm" variant="outline-secondary" disabled={busy} title="Swap for another question from the same module" onClick={() => swap(kind, q._id)}>
                              <ArrowRepeat />
                            </Button>
                          )}
                        </div>
                      ))}
                    </Col>
                  ))}
                </Row>
              )}
            </>
          )}
          <div className="mt-3"><Button onClick={continueAssessment} disabled={busy}>{busy ? <Spinner size="sm" /> : "Save & continue →"}</Button></div>
        </>
      )}

      {step === 5 && (
        <div style={{ maxWidth: 720 }}>
          <ul className="list-unstyled">
            {checklist.map((c) => (
              <li key={c.text} className="mb-2 d-flex gap-2 align-items-start">
                {c.ok ? <CheckCircleFill className="text-success mt-1" /> : <ExclamationTriangleFill className="text-warning mt-1" />}
                <span>{c.text}</span>
              </li>
            ))}
          </ul>
          <div className="d-flex flex-wrap gap-2">
            <Button variant="outline-secondary" onClick={() => window.open(`/orbit/paths/${pathId}`, "_blank", "noopener")}>
              Preview as learner <BoxArrowUpRight className="ms-1" />
            </Button>
            <Button variant="outline-secondary" onClick={onClose}>Done for now</Button>
            {path?.status === "published" ? (
              <Button variant="warning" onClick={() => publish(false)} disabled={busy}>Unpublish</Button>
            ) : (
              <Button variant="success" onClick={() => publish(true)} disabled={busy || !ready}>{busy ? <Spinner size="sm" /> : "Publish"}</Button>
            )}
          </div>
          {!ready && <p className="small text-muted mt-2">Fix the items marked ⚠ to publish. You can come back any time — the path is saved as a draft.</p>}
        </div>
      )}
    </div>
  );
}
