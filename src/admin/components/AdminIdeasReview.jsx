// src/admin/components/AdminIdeasReview.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { CheckCircleFill, SaveFill, BookmarkDashFill, FolderFill } from 'react-bootstrap-icons';
import api from '../services/api';
import AuthContext from '../../context/AuthContext';
import './AdminIdeasReview.css';

export default function AdminIdeasReview() {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === 'superadmin';

  // State Rails
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Superadmin Department Switcher State
  const [departments, setDepartments] = useState([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Local form tracking states mapped to specific Idea IDs
  const [replies, setReplies] = useState({});
  const [statuses, setStatuses] = useState({});
  const [syncingId, setSyncingId] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  // Fetch target department list if superadmin
  useEffect(() => {
    if (isSuperAdmin && api.getDepartments) {
      api.getDepartments()
        .then(res => {
          const list = res?.data || res || [];
          setDepartments(list);
          if (list.length > 0) setSelectedDeptFilter(list[0]._id);
        })
        .catch(err => console.error("Failed to fetch department directory cluster:", err));
    }
  }, [isSuperAdmin]);

  // Fetch Ideas Feed from Server
  const loadIdeasBoard = async () => {
    setLoading(true);
    setError(null);
    try {
      // Council board: every idea in-scope for this admin/superadmin, not
      // just ideas the admin themselves submitted (that's getUserIdeas,
      // used by the regular Ideas & R&D page). The backend already scopes
      // this correctly — admins get their own department, superadmin gets
      // everything — so no further department filtering is needed here.
      const response = await api.getCouncilBoard();
      const data = response?.data || response || [];

      // Superadmin can still narrow the global board down to one department
      // via the dropdown above; admins already only ever receive their own.
      const filteredData = isSuperAdmin && selectedDeptFilter
        ? data.filter(item => item.departmentId?.toString() === selectedDeptFilter)
        : data;

      setIdeas(filteredData);

      // Sync state map indices dynamically for row curation boxes
      const initialReplies = {};
      const initialStatuses = {};
      filteredData.forEach(item => {
        initialReplies[item._id] = item.curatorFeedback || '';
        initialStatuses[item._id] = item.status || 'submitted';
      });
      setReplies(initialReplies);
      setStatuses(initialStatuses);

    } catch (err) {
      console.error("Failed to synchronize Council Review board metrics:", err);
      setError("System Exception: Unable to synchronize live incoming R&D idea records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdeasBoard();
  }, [selectedDeptFilter]);

  // Core Mutation Action Handler
  const handleUpdateCurationRow = async (ideaId, explicitStatus = null, explicitFeedback = null) => {
    const finalStatus = explicitStatus || statuses[ideaId];
    const finalFeedback = explicitFeedback !== null ? explicitFeedback : replies[ideaId];

    setSyncingId(ideaId);
    setSuccessToast('');

    try {
      const res = await api.updateIdeaStatusByCurator(ideaId, {
        status: finalStatus,
        curatorFeedback: finalFeedback.trim()
      });

      // 🎯 THE ACTUAL FIX: this used to only show a toast and never touch
      // `ideas` — every visible bit of UI (status badge, filter-tab counts,
      // the Park/Accept buttons' disabled state) reads from `ideas`, so a
      // successful save looked like it did nothing. Merge the server's
      // returned document (or an optimistic local merge if it's missing)
      // back into the list so the UI actually reflects the change.
      setIdeas(prev => prev.map(item =>
        item._id === ideaId
          ? (res?.data || { ...item, status: finalStatus, curatorFeedback: finalFeedback })
          : item
      ));
      setSuccessToast(res?.message || `Idea status successfully moved to "${finalStatus.toUpperCase()}"!`);

      if (explicitStatus) {
        setStatuses(prev => ({ ...prev, [ideaId]: finalStatus }));
      }
      if (explicitFeedback !== null) {
        setReplies(prev => ({ ...prev, [ideaId]: finalFeedback }));
      }

      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      alert(`Sync Failure: ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  const triggerShortcutAccept = (ideaId) => {
    const feedbackText = replies[ideaId] || "Thanks, this is a very good suggestion and has been approved. FYI: This process has been taken up by the internal committee. As next steps: we will document it and communicate it soon.";
    handleUpdateCurationRow(ideaId, "building", feedbackText);
  };

  const triggerShortcutPark = (ideaId) => {
    handleUpdateCurationRow(ideaId, "parked");
  };

  const getCountsByStatus = (statusKey) => {
    if (statusKey === 'all') return ideas.length;
    return ideas.filter(item => item.status?.toLowerCase() === statusKey.toLowerCase()).length;
  };

  const filteredIdeasFeedList = ideas.filter(item => {
    if (activeFilter === 'all') return true;
    return item.status?.toLowerCase() === activeFilter.toLowerCase();
  });

  const getTagColorClass = (tagValue) => {
    switch (tagValue?.toLowerCase()) {
      case 'product': return 'primary';
      case 'process': return 'warning text-dark';
      case 'technology': return 'info text-dark';
      case 'culture': return 'success';
      // 'market'/'publish' are the old, retired tag values — ideas submitted
      // before this taxonomy change keep displaying their raw tag text fine,
      // they just fall through to this neutral color instead of a mapped one.
      default: return 'secondary';
    }
  };

  return (
    <div className="admin-ideas-review-panel animate-fade-in">

      {/* HEADER ACTION HUB */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold m-0 ideas-heading-text">Admin · Ideas review · {isSuperAdmin ? 'Global' : 'Carbon'}</h4>
          <p className="small m-0 ideas-muted-text">Reply to every idea. No silence. Move statuses, award points, write back.</p>
        </div>

        {/* Superadmin Dynamic Tenant Dropdown Box */}
        {isSuperAdmin && departments.length > 0 && (
          <div className="d-flex align-items-center gap-2 p-2 ideas-dept-picker">
            <Form.Label className="m-0 small fw-bold ideas-muted-text font-monospace"><FolderFill className="me-1"/>VIEW STREAM:</Form.Label>
            <Form.Select
              size="sm" value={selectedDeptFilter} onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="ideas-flat-select"
              style={{ width: '180px', fontSize: '12.5px' }}
            >
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name || d.title}</option>
              ))}
            </Form.Select>
          </div>
        )}
      </div>

      {successToast && <Alert variant="success" className="py-2 small fw-bold mb-3 d-flex align-items-center gap-2 ideas-flat-alert"><CheckCircleFill/> {successToast}</Alert>}
      {error && <Alert variant="danger" className="py-2 small fw-bold mb-3 ideas-flat-alert">{error}</Alert>}

      {/* METRIC COUNTER TAB CHIPS */}
      <div className="d-flex gap-2 mb-4 flex-wrap font-monospace ideas-filter-row" style={{ fontSize: '12.5px' }}>
        {['all', 'submitted', 'in review', 'building', 'shipped', 'parked'].map((statusKey) => {
          const isActive = activeFilter === statusKey;
          return (
            <button
              key={statusKey}
              onClick={() => setActiveFilter(statusKey)}
              className={`ideas-filter-chip ${isActive ? 'ideas-filter-chip--active' : ''} d-flex align-items-center gap-2 text-capitalize`}
            >
              <span>{statusKey === 'all' ? 'All' : statusKey}</span>
              <span className="ideas-filter-count">{getCountsByStatus(statusKey)}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="ideas-spinner" /></div>
      ) : filteredIdeasFeedList.length === 0 ? (
        <div className="text-center p-5 ideas-empty-state small italic">
          No ideas matching "{activeFilter.toUpperCase()}" are currently checked into this department track.
        </div>
      ) : (
        <div className="ideas-curator-review-stack d-flex flex-column gap-3">
          {filteredIdeasFeedList.map((idea) => (
            <div key={idea._id} className="ideas-card">

              {/* Meta Author Strip Section */}
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 flex-wrap gap-2 ideas-card-meta-strip">
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge bg-${getTagColorClass(idea.tag)} text-uppercase font-monospace ideas-flat-badge`} style={{ fontSize: '10px', letterSpacing: '0.3px' }}>
                    {idea.tag}
                  </span>
                  <span className="badge ideas-status-badge text-uppercase font-monospace" style={{ fontSize: '10px', letterSpacing: '0.3px' }}>
                    {idea.status}
                  </span>
                  <span className="fw-bold small ideas-heading-text">{idea.userName}</span>
                  <span className="ideas-muted-text font-monospace" style={{ fontSize: '11px' }}>
                    · {new Date(idea.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <span className="badge ideas-id-badge font-monospace" style={{ fontSize: '9px' }}>ID: {idea._id}</span>
              </div>

              {/* Main Concept Presentation Text Block */}
              <div className="mb-3">
                <h6 className="fw-bold ideas-heading-text mb-2" style={{ lineHeight: '1.45', fontSize: '14.5px' }}>
                  {idea.title}
                </h6>
                {idea.details && <p className="small m-0 ideas-body-text" style={{ lineHeight: '1.6' }}>{idea.details}</p>}
              </div>

              {/* CURATOR SUBMISSION MANAGEMENT CONTROL MATRIX BLOCK */}
              <div className="p-3 ideas-curator-box">
                <Row className="g-3 align-items-end">

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-bold ideas-muted-text font-monospace uppercase mb-1" style={{ fontSize: '10.5px' }}>Status</Form.Label>
                      <Form.Select
                        size="sm"
                        value={statuses[idea._id] || 'submitted'}
                        onChange={(e) => setStatuses(prev => ({ ...prev, [idea._id]: e.target.value }))}
                        disabled={syncingId === idea._id}
                        className="font-monospace fw-semibold ideas-flat-select"
                        style={{ fontSize: '12.5px' }}
                      >
                        {['submitted', 'in review', 'building', 'shipped', 'parked'].map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={5}>
                    <Form.Group>
                      <Form.Label className="small fw-bold ideas-muted-text font-monospace uppercase mb-1" style={{ fontSize: '10.5px' }}>Curator reply</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Leave guidance or notes here..."
                        value={replies[idea._id] || ''}
                        onChange={(e) => setReplies(prev => ({ ...prev, [idea._id]: e.target.value }))}
                        disabled={syncingId === idea._id}
                        className="ideas-flat-input"
                        style={{ fontSize: '13px' }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4} className="d-flex gap-2 justify-content-end flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateCurationRow(idea._id)}
                      disabled={syncingId === idea._id}
                      className="fw-bold px-3 d-flex align-items-center gap-1 ideas-btn ideas-btn-primary"
                      style={{ fontSize: '12.5px' }}
                    >
                      {syncingId === idea._id ? <Spinner animation="border" size="sm"/> : <><SaveFill size={12}/> Save</>}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => triggerShortcutAccept(idea._id)}
                      disabled={syncingId === idea._id || idea.status === 'building'}
                      className="fw-bold px-2.5 d-flex align-items-center gap-1 ideas-btn ideas-btn-accept"
                      style={{ fontSize: '12.5px' }}
                    >
                      Accept (+25 pts)
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => triggerShortcutPark(idea._id)}
                      disabled={syncingId === idea._id || idea.status === 'parked'}
                      className="fw-bold px-2.5 d-flex align-items-center gap-1 ideas-btn ideas-btn-park"
                      style={{ fontSize: '12.5px' }}
                    >
                      <BookmarkDashFill size={12}/> Park
                    </Button>
                  </Col>

                </Row>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
