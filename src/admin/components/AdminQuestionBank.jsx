// src/admin/components/AdminQuestionBank.jsx
// The module question bank — where Pre/Post questions are written, imported
// from Excel, or drafted by AI and approved. Learning Paths build their fixed
// Pre/Post tests from these questions.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Row, Col, Button, Badge, Spinner, Alert, Form, InputGroup, Modal, Table, ButtonGroup } from "react-bootstrap";
import { Search, PlusCircle, Stars, Upload, Download, Trash, CheckCircle, PencilSquare, QuestionCircle } from "react-bootstrap-icons";
import * as XLSX from "xlsx";
import api from "../services/api";
import QuestionEditor from "./QuestionEditor";

const DIFF_BADGE = { easy: "success", medium: "primary", hard: "danger" };
const TEMPLATE_HEADERS = ["Module", "Question", "A", "B", "C", "D", "E", "F", "Correct", "Explanation", "Difficulty"];
const LETTERS = "ABCDEF";
// AI drafting is off until after launch (needs the Anthropic SDK + API key on
// the server). Set VITE_AI_QUESTION_DRAFTS=true to show the button.
const AI_DRAFTS_ENABLED = import.meta.env.VITE_AI_QUESTION_DRAFTS === "true";

function downloadWorkbook(sheets, filename) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows, headers }) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows, { header: headers }), name));
  XLSX.writeFile(wb, filename);
}

function ImportModal({ modules, onClose, onDone }) {
  const [rows, setRows] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const readFile = async (file) => {
    setError(""); setPreview(null);
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const sheet = wb.Sheets[wb.SheetNames.find((n) => n.toLowerCase() === "questions") || wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      setRows(parsed);
      setBusy(true);
      setPreview(await api.importBankQuestions(parsed, true));
    } catch (err) {
      setError(err.message || "Couldn't read that file.");
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    setBusy(true); setError("");
    try {
      const res = await api.importBankQuestions(rows, false);
      onDone(`${res.imported} question${res.imported === 1 ? "" : "s"} imported${res.errors.length ? ` · ${res.errors.length} row(s) skipped` : ""}.`);
    } catch (err) {
      setError(err.message || "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show onHide={onClose} size="lg" centered scrollable>
      <Modal.Header closeButton><Modal.Title className="fs-6">Import questions from Excel</Modal.Title></Modal.Header>
      <Modal.Body>
        <ol className="small text-muted ps-3">
          <li>Download the template, fill one row per question (Module = the module's exact name, Correct = A–F).</li>
          <li>Upload it here — you'll see what will be imported and any problems before anything is saved.</li>
        </ol>
        <Button size="sm" variant="outline-secondary" className="mb-3" onClick={() => downloadWorkbook([
          { name: "Questions", headers: TEMPLATE_HEADERS, rows: [{ Module: modules[0]?.title || "Module name", Question: "What does an ERP system record?", A: "Business transactions", B: "XBRL filings", C: "Taxonomy labels", D: "Board minutes", Correct: "A", Explanation: "The ERP is the system of record for transactions.", Difficulty: "easy" }] },
          { name: "Modules", headers: ["Module"], rows: modules.map((m) => ({ Module: m.title })) },
        ], "question-bank-template.xlsx")}>
          <Download className="me-1" /> Download template
        </Button>
        <Form.Control type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
        {error && <Alert variant="danger" className="mt-3 py-2 small">{error}</Alert>}
        {busy && !preview && <div className="text-center py-3"><Spinner size="sm" /></div>}
        {preview && (
          <div className="mt-3">
            <Alert variant={preview.errors.length ? "warning" : "success"} className="py-2 small">
              {preview.valid} of {preview.total} rows are ready to import.
              {preview.errors.length > 0 && ` ${preview.errors.length} row(s) have problems and will be skipped:`}
            </Alert>
            {preview.errors.length > 0 && (
              <Table size="sm" bordered className="small">
                <thead><tr><th>Row</th><th>Module</th><th>Problem</th></tr></thead>
                <tbody>
                  {preview.errors.slice(0, 50).map((e) => (
                    <tr key={e.row}><td>{e.row}</td><td>{e.module}</td><td>{e.errors.join(" ")}</td></tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="primary" onClick={commit} disabled={busy || !preview || preview.valid === 0}>
          {busy && preview ? <Spinner size="sm" /> : `Import ${preview?.valid || 0} question${preview?.valid === 1 ? "" : "s"}`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default function AdminQuestionBank({ initialModuleId, onBack }) {
  const [modules, setModules] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(initialModuleId || "");
  const [questions, setQuestions] = useState([]);
  const [tab, setTab] = useState("active");
  const [editing, setEditing] = useState(null); // question id | "new" | null
  const [aiCount, setAiCount] = useState(6);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const listTopRef = useRef(null);

  const loadModules = useCallback(async () => {
    try {
      const res = await api.getBankModules();
      setModules(res?.data || []);
      if (!selectedId && res?.data?.length) setSelectedId(res.data[0]._id);
    } catch (err) {
      setError(err.message || "Failed to load modules.");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);
  useEffect(() => { loadModules(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuestions = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await api.getBankQuestions(selectedId);
      setQuestions(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load questions.");
    }
  }, [selectedId]);
  useEffect(() => { setEditing(null); loadQuestions(); }, [loadQuestions]);

  const refresh = async () => { await Promise.all([loadQuestions(), loadModules()]); };
  const selected = modules.find((m) => m._id === selectedId);
  const counts = useMemo(() => ({
    active: questions.filter((q) => q.status === "active").length,
    draft: questions.filter((q) => q.status === "draft").length,
    retired: questions.filter((q) => q.status === "retired").length,
  }), [questions]);
  const shown = questions.filter((q) => q.status === tab);
  const visibleModules = modules.filter((m) => !search.trim() || m.title.toLowerCase().includes(search.trim().toLowerCase()));

  const run = async (fn, okMsg) => {
    setBusy(true); setError(""); setNotice("");
    try { const r = await fn(); if (okMsg) setNotice(typeof okMsg === "function" ? okMsg(r) : okMsg); await refresh(); }
    catch (err) { setError(err.message || "That didn't work."); }
    finally { setBusy(false); }
  };

  const save = (data, id) => run(async () => {
    if (id) await api.updateBankQuestion(id, data);
    else await api.createBankQuestion(selectedId, data);
    setEditing(null);
  }, id ? "Question saved." : "Question added.");

  const exportModule = () => downloadWorkbook([{
    name: "Questions",
    headers: TEMPLATE_HEADERS,
    rows: questions.filter((q) => q.status !== "retired").map((q) => {
      const row = { Module: selected?.title || "", Question: q.question, Correct: LETTERS[q.correctIndex], Explanation: q.explanation || "", Difficulty: q.difficulty };
      q.options.forEach((o, i) => { row[LETTERS[i]] = o; });
      return row;
    }),
  }], `${(selected?.title || "module").replace(/[^\w-]+/g, "_")}-questions.xlsx`);

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-1">
        <QuestionCircle size={20} />
        <h4 className="fw-bold m-0">Question Bank</h4>
        {onBack && <Button size="sm" variant="link" className="ms-auto" onClick={onBack}>← Back to the path</Button>}
      </div>
      <p className="text-muted small">
        Each module has its own Pre/Post questions (separate from the quizzes inside the module). Learning Paths build
        their Pre-check and Post-check from these. Aim for at least <strong>4 active questions per module</strong> with a mix of difficulties.
      </p>
      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
      {notice && <Alert variant="success" className="py-2 small">{notice}</Alert>}

      {loading ? <div className="text-center py-5"><Spinner size="sm" /></div> : (
        <Row className="g-3">
          <Col md={4} lg={3}>
            <InputGroup size="sm" className="mb-2">
              <InputGroup.Text><Search /></InputGroup.Text>
              <Form.Control placeholder="Find a module…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
            <div style={{ maxHeight: 560, overflowY: "auto" }} className="border rounded-3">
              {visibleModules.map((m) => {
                const enough = m.bank.active >= 4;
                return (
                  <button
                    type="button" key={m._id}
                    className={`w-100 text-start border-0 border-bottom px-3 py-2 small ${m._id === selectedId ? "bg-primary-subtle fw-semibold" : "bg-white"}`}
                    onClick={() => setSelectedId(m._id)}
                  >
                    <div className="text-truncate">{m.title}</div>
                    <div className="d-flex gap-1 mt-1">
                      <Badge bg={enough ? "success" : m.bank.active ? "warning" : "secondary"} text={enough ? undefined : "dark"}>{m.bank.active} active</Badge>
                      {m.bank.draft > 0 && <Badge bg="info">{m.bank.draft} to review</Badge>}
                    </div>
                  </button>
                );
              })}
            </div>
            <Button size="sm" variant="outline-primary" className="w-100 mt-2" onClick={() => setImporting(true)}>
              <Upload className="me-1" /> Import from Excel
            </Button>
          </Col>

          <Col md={8} lg={9}>
            {!selected ? <div className="text-muted small">Pick a module.</div> : (
              <>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2" ref={listTopRef}>
                  <h5 className="fw-bold m-0 me-2">{selected.title}</h5>
                  <Badge bg="success">{selected.bank.easy} easy</Badge>
                  <Badge bg="primary">{selected.bank.medium} medium</Badge>
                  <Badge bg="danger">{selected.bank.hard} hard</Badge>
                </div>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <Button size="sm" variant="primary" onClick={() => { setTab("active"); setEditing("new"); }} disabled={busy}><PlusCircle className="me-1" /> Add question</Button>
                  {AI_DRAFTS_ENABLED && <InputGroup size="sm" style={{ width: "auto" }}>
                    <Button variant="outline-primary" disabled={busy}
                      onClick={() => run(() => api.aiDraftBankQuestions(selectedId, aiCount), (r) => { setTab("draft"); return `AI drafted ${r.created} question${r.created === 1 ? "" : "s"} — review them under "To review" and approve the good ones.`; })}>
                      {busy ? <Spinner size="sm" /> : <><Stars className="me-1" /> Draft with AI</>}
                    </Button>
                    <Form.Select value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))} style={{ maxWidth: 80 }} aria-label="How many to draft">
                      {[4, 6, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                    </Form.Select>
                  </InputGroup>}
                  <Button size="sm" variant="outline-secondary" onClick={exportModule} disabled={!questions.length}><Download className="me-1" /> Export to Excel</Button>
                </div>

                <ButtonGroup size="sm" className="mb-2">
                  {[["active", "Active"], ["draft", "To review"], ["retired", "Retired"]].map(([k, label]) => (
                    <Button key={k} variant={tab === k ? "dark" : "outline-dark"} onClick={() => setTab(k)}>{label} ({counts[k]})</Button>
                  ))}
                </ButtonGroup>

                {tab === "draft" && counts.draft > 0 && (
                  <Alert variant="info" className="py-2 small">Drafts aren't used in any test until approved. Check each one — edit if needed — then approve.</Alert>
                )}
                {editing === "new" && <QuestionEditor saving={busy} onSave={(d) => save(d, null)} onCancel={() => setEditing(null)} />}

                {shown.length === 0 && editing !== "new" && (
                  <div className="text-muted small border rounded-3 p-3 text-center">
                    {tab === "active" ? (AI_DRAFTS_ENABLED ? "No questions yet — add one, import from Excel, or draft with AI." : "No questions yet — add one or import from Excel.") : tab === "draft" ? "Nothing to review." : "No retired questions."}
                  </div>
                )}
                {shown.map((q) => (editing === q._id ? (
                  <QuestionEditor key={q._id} initial={q} saving={busy} onSave={(d) => save(d, q._id)} onCancel={() => setEditing(null)} />
                ) : (
                  <div key={q._id} className="border rounded-3 p-2 mb-2 d-flex gap-2 align-items-start bg-white">
                    <Badge bg={DIFF_BADGE[q.difficulty]} className="mt-1">{q.difficulty}</Badge>
                    <div className="flex-grow-1 small">
                      <div className="fw-semibold">{q.question}</div>
                      <div className="text-muted">✓ {q.options[q.correctIndex]} · {q.options.length} options{q.source === "ai" ? " · AI draft" : q.source === "import" ? " · imported" : ""}</div>
                      {q.stats?.answered > 0 && (
                        <div className="text-muted">Answered {q.stats.answered}× · {Math.round((q.stats.correct / q.stats.answered) * 100)}% right</div>
                      )}
                    </div>
                    {q.status === "draft" && (
                      <Button size="sm" variant="outline-success" disabled={busy} onClick={() => run(() => api.approveBankQuestion(q._id), "Approved — it can now be used in tests.")}>
                        <CheckCircle className="me-1" /> Approve
                      </Button>
                    )}
                    {q.status === "retired" ? (
                      <Button size="sm" variant="outline-secondary" disabled={busy} onClick={() => run(() => api.updateBankQuestion(q._id, { status: "active" }), "Restored.")}>Restore</Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline-secondary" onClick={() => setEditing(q._id)} aria-label="Edit"><PencilSquare /></Button>
                        <Button size="sm" variant="outline-danger" disabled={busy} aria-label="Delete"
                          onClick={() => window.confirm("Delete this question? If a test already used it, it's retired instead (past results keep it).")
                            && run(() => api.deleteBankQuestion(q._id), (r) => r.message || "Deleted.")}>
                          <Trash />
                        </Button>
                      </>
                    )}
                  </div>
                )))}
              </>
            )}
          </Col>
        </Row>
      )}

      {importing && (
        <ImportModal
          modules={modules}
          onClose={() => setImporting(false)}
          onDone={(msg) => { setImporting(false); setError(""); setNotice(msg); refresh(); }}
        />
      )}
    </div>
  );
}
