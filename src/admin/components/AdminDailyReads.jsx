// src/admin/components/AdminDailyReads.jsx
import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { Form, Button, Alert, Spinner, Card, Badge, ButtonGroup, Row, Col } from 'react-bootstrap';
import {
  Building,
  SendCheckFill,
  ChevronLeft,
  ChevronRight,
  PencilSquare,
  Trash3,
  Journals,
  CalendarX,
} from 'react-bootstrap-icons';
import api from '../services/api';
import AuthContext from '../../context/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import { getMonthMatrix, toDateKey, toUtcDateKey, dailyReadDateKey } from '../../components/OrbitDashboard/dashboardStorage';
import '../../components/OrbitDashboard/OrbitDashboard.css';

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const EMPTY_FORM = { title: '', content: '', imageUrl: '', referenceLink: '', tagsInput: '' };

export default function AdminDailyReadForm({ setActiveTab }) {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === 'superadmin';
  const todayKey = toUtcDateKey(new Date());

  // Department scope (superadmin only picks; a plain admin is locked server-side to their own)
  const [departmentsList, setDepartmentsList] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [fetchingDepts, setFetchingDepts] = useState(false);

  // History
  const [myReads, setMyReads] = useState([]);
  const [loadingReads, setLoadingReads] = useState(true);

  // Calendar
  const [monthCursor, setMonthCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  // Create/Edit form
  const [editingRead, setEditingRead] = useState(null); // null = create mode, object = editing
  const [formShown, setFormShown] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageSourceType, setImageSourceType] = useState('upload');
  const [imageFile, setImageFile] = useState(null);
  const imageInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [message, setMessage] = useState({ text: '', variant: '' });

  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (isSuperAdmin) {
      setFetchingDepts(true);
      api.getDepartments ? api.getDepartments()
        .then(res => {
          const list = res?.data || res || [];
          setDepartmentsList(list);
          if (list.length > 0) setSelectedDepartmentId(list[0]._id);
        })
        .catch(err => console.error("Failed to load departments:", err))
        .finally(() => setFetchingDepts(false))
      : setFetchingDepts(false);
    }
  }, [isSuperAdmin]);

  const loadReads = async () => {
    setLoadingReads(true);
    try {
      const res = await api.getAllDailyReads();
      const list = res?.data || res || [];
      setMyReads(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load Daily Read history:", err);
    } finally {
      setLoadingReads(false);
    }
  };

  useEffect(() => { loadReads(); }, []);

  // A superadmin's all-reads response spans every department — scope it down
  // to whichever department is currently selected in the picker above.
  const scopedReads = useMemo(() => {
    if (!isSuperAdmin) return myReads;
    if (!selectedDepartmentId) return [];
    return myReads.filter(r => (r.department || '').toString() === selectedDepartmentId.toString());
  }, [myReads, isSuperAdmin, selectedDepartmentId]);

  const readsByDate = useMemo(() => {
    const map = {};
    scopedReads.forEach(r => {
      const key = dailyReadDateKey(r);
      if (key) map[key] = r;
    });
    return map;
  }, [scopedReads]);

  const selectedRead = readsByDate[selectedDateKey] || null;
  const isSelectedToday = selectedDateKey === todayKey;

  const weeks = useMemo(
    () => getMonthMatrix(monthCursor.getFullYear(), monthCursor.getMonth()),
    [monthCursor]
  );
  const monthLabel = monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const shiftMonth = (delta) => setMonthCursor(prev => { const n = new Date(prev); n.setMonth(n.getMonth() + delta); return n; });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImageSourceType('upload');
    if (imageInputRef.current) imageInputRef.current.value = '';
    setEditingRead(null);
    setFormShown(false);
  };

  const openCreateForm = () => {
    resetForm();
    setFormShown(true);
  };

  const openEditForm = (read) => {
    setEditingRead(read);
    setForm({
      title: read.title || '',
      content: read.content || '',
      imageUrl: read.imageUrl || '',
      referenceLink: read.referenceLink || '',
      tagsInput: (read.tags || []).join(', '),
    });
    setImageSourceType('url');
    setFormShown(true);
    setMessage({ text: '', variant: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setMessage({ text: 'Title and content are required.', variant: 'danger' });
      return;
    }
    if (!editingRead && isSuperAdmin && !selectedDepartmentId) {
      setMessage({ text: 'Please pick a destination department.', variant: 'danger' });
      return;
    }
    setLoading(true);
    setMessage({ text: '', variant: '' });

    try {
      let finalImageUrl = form.imageUrl.trim();
      if (imageSourceType === 'upload' && imageFile) {
        setUploadingAsset(true);
        finalImageUrl = await api.uploadImage(imageFile);
        setUploadingAsset(false);
      }

      const tags = form.tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        imageUrl: finalImageUrl,
        referenceLink: form.referenceLink.trim(),
        tags,
      };

      if (editingRead) {
        await api.updateDailyRead(editingRead._id, payload);
        setMessage({ text: "Today's Daily Read updated.", variant: 'success' });
      } else {
        payload.targetDepartmentId = isSuperAdmin ? selectedDepartmentId : undefined;
        await api.createDailyRead(payload);
        setMessage({ text: 'Daily Read published for today!', variant: 'success' });
      }

      await loadReads();
      resetForm();
      setSelectedDateKey(todayKey);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to save Daily Read.', variant: 'danger' });
    } finally {
      setUploadingAsset(false);
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteDailyRead(deleteTarget._id);
      setMessage({ text: 'Daily Read deleted.', variant: 'success' });
      await loadReads();
      resetForm();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to delete Daily Read.', variant: 'danger' });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Card className="border-0 shadow-sm animate-fade-in" style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <Card.Body className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <h4 className="fw-bold text-dark-title m-0">Daily Reads</h4>
          <Badge bg="success" className="d-flex align-items-center gap-1 font-monospace px-2 py-1" style={{ fontSize: '10px' }}>
            <Building size={10} /> DEPARTMENTAL FEED ONLY
          </Badge>
        </div>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <p className="text-muted small m-0">
            One article per department per day. Only today's post can be edited or deleted — past days are locked archive.
          </p>
          <Button variant="link" size="sm" className="text-decoration-none p-0" onClick={() => setActiveTab('overview')}>
            Back to Overview
          </Button>
        </div>

        {message.text && <Alert variant={message.variant} className="small fw-semibold">{message.text}</Alert>}

        {isSuperAdmin && (
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-dark">Viewing Department</Form.Label>
            {fetchingDepts ? (
              <div className="small text-muted"><Spinner animation="border" size="sm" className="me-2" />Loading departments…</div>
            ) : (
              <Form.Select
                value={selectedDepartmentId}
                onChange={(e) => { setSelectedDepartmentId(e.target.value); resetForm(); }}
                style={{ borderRadius: '6px', fontSize: '13.5px', maxWidth: '360px' }}
              >
                {departmentsList.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name || dept.title}</option>
                ))}
              </Form.Select>
            )}
          </Form.Group>
        )}

        <Row className="g-4">
          {/* ============= CALENDAR COLUMN ============= */}
          <Col md={4}>
            <div className="orbit-card orbit-card--compact">
              <h3 className="orbit-card__title orbit-card__title--tight">
                <Journals size={13} style={{ marginRight: 5, color: 'var(--pastel-reads-text)' }} />
                History
              </h3>

              <div className="orbit-calendar__nav">
                <button type="button" className="orbit-calendar__nav-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                  <ChevronLeft size={12} />
                </button>
                <span className="orbit-calendar__month-label">{monthLabel}</span>
                <button type="button" className="orbit-calendar__nav-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
                  <ChevronRight size={12} />
                </button>
              </div>

              <div className="orbit-calendar__grid">
                {WEEKDAYS.map((w, i) => <div key={`wd-${i}`} className="orbit-calendar__weekday">{w}</div>)}
                {weeks.flat().map(({ date, inMonth }) => {
                  // Grid cells are LOCAL calendar days (matches how the user
                  // reads a calendar); read.dateKey is UTC. They agree for
                  // nearly all hours of the day — see dashboardStorage.js.
                  const key = toDateKey(date);
                  const hasRead = !!readsByDate[key];
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDateKey;
                  return (
                    <div
                      key={key}
                      className={[
                        "orbit-calendar__cell",
                        !inMonth ? "orbit-calendar__cell--out" : "",
                        hasRead ? "orbit-calendar__cell--has-read" : "",
                        isToday ? "orbit-calendar__cell--today" : "",
                      ].join(" ").trim()}
                      style={isSelected ? { outline: '2px solid var(--orbit-brand, #0f256e)', outlineOffset: '1px' } : undefined}
                      role="button"
                      tabIndex={0}
                      title={hasRead ? readsByDate[key].title : (isToday ? "Today — nothing posted yet" : undefined)}
                      onClick={() => { setSelectedDateKey(key); setFormShown(false); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedDateKey(key); setFormShown(false); } }}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>

              <div className="orbit-calendar__legend">
                <span className="orbit-calendar__legend-item">
                  <span className="orbit-calendar__legend-swatch" style={{ background: 'var(--pastel-reads-border)' }} />
                  Posted
                </span>
              </div>
            </div>
          </Col>

          {/* ============= CONTENT COLUMN ============= */}
          <Col md={8}>
            {loadingReads ? (
              <div className="text-center p-5"><Spinner animation="border" size="sm" /></div>
            ) : formShown ? (
              <DailyReadForm
                form={form}
                setForm={setForm}
                imageSourceType={imageSourceType}
                setImageSourceType={setImageSourceType}
                imageFile={imageFile}
                setImageFile={setImageFile}
                imageInputRef={imageInputRef}
                loading={loading}
                uploadingAsset={uploadingAsset}
                isEditing={!!editingRead}
                onSubmit={handleSubmit}
                onCancel={resetForm}
              />
            ) : selectedRead ? (
              <DailyReadPreview
                read={selectedRead}
                canManage={isSelectedToday}
                onEdit={() => openEditForm(selectedRead)}
                onDelete={() => setDeleteTarget(selectedRead)}
              />
            ) : isSelectedToday ? (
              <div className="text-center p-5 border rounded-3" style={{ borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
                <p className="text-muted mb-3">Nothing posted yet today.</p>
                <Button
                  variant="primary"
                  onClick={openCreateForm}
                  disabled={isSuperAdmin && !selectedDepartmentId}
                  style={{ borderRadius: '6px', backgroundColor: '#0f256e', borderColor: '#0f256e', fontWeight: '600', fontSize: '13.5px' }}
                >
                  <SendCheckFill size={14} className="me-2" /> Publish Today's Daily Read
                </Button>
              </div>
            ) : (
              <div className="text-center p-5 border rounded-3" style={{ borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
                <CalendarX size={22} className="text-muted mb-2" />
                <p className="text-muted mb-0">Nothing was posted on this date.</p>
              </div>
            )}
          </Col>
        </Row>
      </Card.Body>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Today's Daily Read"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmButtonText="Delete"
        variant="danger"
        requireTextVerification
      />
    </Card>
  );
}

// ================================================================
// Read-only preview of a selected day's article, with Edit/Delete
// (only rendered enabled for today — the caller gates canManage).
// ================================================================
function DailyReadPreview({ read, canManage, onEdit, onDelete }) {
  return (
    <Card className="border" style={{ borderRadius: '10px', borderColor: '#e2e8f0' }}>
      {read.imageUrl && (
        <Card.Img
          variant="top"
          src={read.imageUrl}
          style={{ maxHeight: '220px', objectFit: 'cover', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}
        />
      )}
      <Card.Body className="p-4">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
          <h5 className="fw-bold m-0">{read.title}</h5>
          {canManage && (
            <div className="d-flex gap-2 flex-shrink-0">
              <Button size="sm" variant="outline-secondary" onClick={onEdit} style={{ borderRadius: '6px' }}>
                <PencilSquare size={13} className="me-1" /> Edit
              </Button>
              <Button size="sm" variant="outline-danger" onClick={onDelete} style={{ borderRadius: '6px' }}>
                <Trash3 size={13} className="me-1" /> Delete
              </Button>
            </div>
          )}
        </div>
        {read.tags && read.tags.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-3">
            {read.tags.map((tag, i) => (
              <Badge key={i} bg="light" text="dark" className="border font-monospace" style={{ fontSize: '10px' }}>#{tag}</Badge>
            ))}
          </div>
        )}
        <p className="text-body" style={{ whiteSpace: 'pre-wrap', fontSize: '13.5px', lineHeight: '1.7' }}>{read.content}</p>
        {read.referenceLink && (
          <div className="mt-3 pt-3 border-top">
            <div className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Reference</div>
            <a href={read.referenceLink} target="_blank" rel="noreferrer" style={{ fontSize: '13px', wordBreak: 'break-all' }}>{read.referenceLink}</a>
          </div>
        )}
        {!canManage && (
          <div className="mt-3 small text-muted fst-italic">Locked archive — only today's post can be edited or deleted.</div>
        )}
      </Card.Body>
    </Card>
  );
}

// ================================================================
// Shared create/edit form
// ================================================================
function DailyReadForm({
  form, setForm, imageSourceType, setImageSourceType, setImageFile,
  imageInputRef, loading, uploadingAsset, isEditing, onSubmit, onCancel,
}) {
  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <Form onSubmit={onSubmit}>
      <h5 className="fw-bold mb-3">{isEditing ? "Edit Today's Daily Read" : "Publish Today's Daily Read"}</h5>

      <Form.Group className="mb-3">
        <Form.Label className="small fw-semibold text-muted">Title</Form.Label>
        <Form.Control
          type="text"
          placeholder="e.g., Understanding XBRL Dimensions and Hypercubes"
          value={form.title}
          onChange={set('title')}
          disabled={loading}
          style={{ borderRadius: '6px', fontSize: '13.5px' }}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label className="small fw-semibold text-muted">Article Content</Form.Label>
        <Form.Control
          as="textarea"
          rows={9}
          placeholder="Supports Markdown — headings, **bold**, lists, links..."
          value={form.content}
          onChange={set('content')}
          disabled={loading}
          style={{ borderRadius: '6px', fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace', fontSize: '13px', lineHeight: '1.6' }}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <Form.Label className="small fw-semibold text-muted mb-0">Banner Image (optional)</Form.Label>
          <ButtonGroup size="sm">
            <Button
              variant={imageSourceType === 'upload' ? 'dark' : 'outline-secondary'}
              onClick={() => setImageSourceType('upload')}
              disabled={loading}
              type="button"
              style={{ fontSize: '11px' }}
            >
              Upload File
            </Button>
            <Button
              variant={imageSourceType === 'url' ? 'dark' : 'outline-secondary'}
              onClick={() => setImageSourceType('url')}
              disabled={loading}
              type="button"
              style={{ fontSize: '11px' }}
            >
              Paste URL
            </Button>
          </ButtonGroup>
        </div>
        {imageSourceType === 'upload' ? (
          <>
            <Form.Control
              type="file"
              accept="image/*"
              ref={imageInputRef}
              onChange={(e) => setImageFile(e.target.files[0])}
              disabled={loading}
              style={{ borderRadius: '6px', fontSize: '13.5px' }}
            />
            {uploadingAsset && (
              <div className="mt-2 small text-muted"><Spinner animation="border" size="sm" className="me-2" />Uploading image…</div>
            )}
          </>
        ) : (
          <Form.Control
            type="text"
            placeholder="https://…/banner.jpg"
            value={form.imageUrl}
            onChange={set('imageUrl')}
            disabled={loading}
            style={{ borderRadius: '6px', fontSize: '13.5px' }}
          />
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label className="small fw-semibold text-muted">Reference Link (optional)</Form.Label>
        <Form.Control
          type="text"
          placeholder="https://… original article source"
          value={form.referenceLink}
          onChange={set('referenceLink')}
          disabled={loading}
          style={{ borderRadius: '6px', fontSize: '13.5px' }}
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label className="small fw-semibold text-muted">Tags (comma-separated, optional)</Form.Label>
        <Form.Control
          type="text"
          placeholder="xbrl, taxonomy, compliance"
          value={form.tagsInput}
          onChange={set('tagsInput')}
          disabled={loading}
          style={{ borderRadius: '6px', fontSize: '13.5px' }}
        />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2 border-top pt-3" style={{ borderColor: '#f1f5f9' }}>
        <Button variant="light" type="button" onClick={onCancel} disabled={loading} style={{ borderRadius: '6px', fontSize: '13.5px', fontWeight: '500' }}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={loading} style={{ borderRadius: '6px', backgroundColor: '#0f256e', borderColor: '#0f256e', fontWeight: '600', fontSize: '13.5px', paddingLeft: '20px', paddingRight: '20px' }}>
          {loading ? <Spinner animation="border" size="sm" /> : <><SendCheckFill size={14} className="me-1.5" /> {isEditing ? 'Save Changes' : 'Publish'}</>}
        </Button>
      </div>
    </Form>
  );
}
