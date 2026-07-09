// src/admin/components/AdminIdeasReview.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Badge, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { CheckCircleFill, SaveFill, BookmarkDashFill, FolderFill } from 'react-bootstrap-icons';
import api from '../services/api';
import AuthContext from '../../context/AuthContext';

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
      let data = [];
      
      // 🚀 CONNECTING THE LIVE BRIDGE:
      if (typeof api.getUserIdeas === 'function') {
        const response = await api.getUserIdeas();
        data = response?.data || response || [];
      } else {
        // Fallback matrix if network calls are offline during local assembly builds
        data = [
          {
            _id: "idea-1",
            userName: "Thomas PKX",
            createdAt: "2026-04-29T10:00:00.000Z",
            tag: "product",
            title: "hands on play with AI session for 3 hrs. to solve a practical problem using AI only approach",
            details: "A raw prototyping sprint.",
            status: "parked",
            departmentId: user?.department || "dept-carbon"
          }
        ];
      }

      // Enforce SaaS Department-Wise Multi-Tenant Filter safely
      let filteredData = data;
      if (!isSuperAdmin && user?.department) {
        const adminDeptStr = user.department.toString();
        filteredData = data.filter(item => 
          item.departmentId?.toString() === adminDeptStr || 
          item.departmentId === adminDeptStr ||
          item.userId === user.id
        );
      } else if (isSuperAdmin && selectedDeptFilter) {
        filteredData = data.filter(item => item.departmentId?.toString() === selectedDeptFilter);
      }

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
      if (api.updateIdeaStatusByCurator) {
        const res = await api.updateIdeaStatusByCurator(ideaId, {
          status: finalStatus,
          curatorFeedback: finalFeedback.trim()
        });
        
        // Dynamic success message from backend reward engine parameters
        setSuccessToast(res?.message || `🎯 Idea status successfully moved to "${finalStatus.toUpperCase()}"!`);
      } else {
        setIdeas(prev => prev.map(item => 
          item._id === ideaId 
            ? { ...item, status: finalStatus, curatorFeedback: finalFeedback } 
            : item
        ));
        setSuccessToast(`🎯 Idea status successfully moved to "${finalStatus.toUpperCase()}"!`);
      }

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
      case 'market': return 'info text-dark';
      case 'process': return 'warning text-dark';
      case 'publish': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div className="admin-ideas-review-panel animate-fade-in" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* HEADER ACTION HUB */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark m-0">Admin · Ideas review · {isSuperAdmin ? 'Global' : 'Carbon'}</h4>
          <p className="text-muted small m-0">Reply to every idea. No silence. Move statuses, award points, write back.</p>
        </div>

        {/* Superadmin Dynamic Tenant Dropdown Box */}
        {isSuperAdmin && departments.length > 0 && (
          <div className="d-flex align-items-center gap-2 bg-white p-2 border rounded-3 shadow-sm">
            <Form.Label className="m-0 small fw-bold text-muted font-monospace"><FolderFill className="me-1"/>VIEW STREAM:</Form.Label>
            <Form.Select 
              size="sm" value={selectedDeptFilter} onChange={(e) => setSelectedDeptFilter(e.target.value)}
              style={{ width: '180px', borderRadius: '6px', fontSize: '12.5px' }}
            >
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name || d.title}</option>
              ))}
            </Form.Select>
          </div>
        )}
      </div>

      {successToast && <Alert variant="success" className="py-2 small fw-bold mb-3 shadow-sm d-flex align-items-center gap-2"><CheckCircleFill/> {successToast}</Alert>}
      {error && <Alert variant="danger" className="py-2 small fw-bold mb-3">{error}</Alert>}

      {/* METRIC COUNTER TAB CHIPS */}
      <div className="d-flex gap-2 mb-4 border-bottom pb-2 flex-wrap font-monospace" style={{ fontSize: '12.5px' }}>
        {['all', 'submitted', 'in review', 'building', 'shipped', 'parked'].map((statusKey) => {
          const isActive = activeFilter === statusKey;
          return (
            <button
              key={statusKey}
              onClick={() => setActiveFilter(statusKey)}
              className={`btn btn-sm d-flex align-items-center gap-2 border-0 px-3 py-1.5 transition-all text-capitalize ${isActive ? 'fw-bold bg-dark text-white rounded-3' : 'text-muted bg-transparent'}`}
            >
              <span>{statusKey === 'all' ? 'All' : statusKey}</span>
              <Badge bg={isActive ? 'primary' : 'light'} className={isActive ? 'text-white' : 'text-muted border'}>
                {getCountsByStatus(statusKey)}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* ✅ FIXED: Cleaned bare comment wrapper syntax error out of JSX thread */}
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" style={{ color: '#0f256e' }} /></div>
      ) : filteredIdeasFeedList.length === 0 ? (
        <div className="text-center p-5 bg-white border rounded-3 border-slate text-muted small italic">
          No ideas matching "{activeFilter.toUpperCase()}" are currently checked into this department track.
        </div>
      ) : (
        <div className="ideas-curator-review-stack d-flex flex-column gap-4">
          {filteredIdeasFeedList.map((idea) => (
            <Card key={idea._id} className="border-slate rounded-3 bg-white p-2 shadow-sm transition-all position-relative">
              <Card.Body>
                
                {/* Meta Author Strip Section */}
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={getTagColorClass(idea.tag)} className="text-uppercase font-monospace px-2 py-1" style={{ fontSize: '10px', letterSpacing: '0.3px' }}>
                      {idea.tag}{idea.status === 'parked' || idea.status === 'in review' ? idea.status.replace(' ', '') : idea.status}
                    </Badge>
                    <span className="fw-bold text-dark small text-sans-serif">{idea.userName}</span>
                    <span className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                      · {new Date(idea.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <span className="badge bg-light border text-muted font-monospace" style={{ fontSize: '9px' }}>ID: {idea._id}</span>
                </div>

                {/* Main Concept Presentation Text Block */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark text-sans-serif mb-2" style={{ lineHeight: '1.45', fontSize: '14.5px' }}>
                    {idea.title}
                  </h6>
                  {idea.details && <p className="text-secondary small m-0 text-sans-serif" style={{ lineHeight: '1.6' }}>{idea.details}</p>}
                </div>

                {/* CURATOR SUBMISSION MANAGEMENT CONTROL MATRIX BLOCK */}
                <div className="p-3 bg-light rounded-3 border border-slate" style={{ backgroundColor: '#f8fafc' }}>
                  <Row className="g-3 align-items-end">
                    
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted font-monospace uppercase mb-1" style={{ fontSize: '10.5px' }}>Status</Form.Label>
                        <Form.Select
                          size="sm"
                          value={statuses[idea._id] || 'submitted'}
                          onChange={(e) => setStatuses(prev => ({ ...prev, [idea._id]: e.target.value }))}
                          disabled={syncingId === idea._id}
                          className="font-monospace fw-semibold"
                          style={{ borderRadius: '6px', fontSize: '12.5px' }}
                        >
                          {['submitted', 'in review', 'building', 'shipped', 'parked'].map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={5}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted font-monospace uppercase mb-1" style={{ fontSize: '10.5px' }}>Curator reply</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Leave guidance or notes here..."
                          value={replies[idea._id] || ''}
                          onChange={(e) => setReplies(prev => ({ ...prev, [idea._id]: e.target.value }))}
                          disabled={syncingId === idea._id}
                          style={{ borderRadius: '6px', fontSize: '13px' }}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4} className="d-flex gap-1.5 justify-content-end flex-wrap">
                      <Button
                        size="sm" variant="primary"
                        onClick={() => handleUpdateCurationRow(idea._id)}
                        disabled={syncingId === idea._id}
                        className="fw-bold px-3 d-flex align-items-center gap-1 font-sans-serif"
                        style={{ backgroundColor: '#0f256e', borderColor: '#0f256e', borderRadius: '6px', fontSize: '12.5px' }}
                      >
                        {syncingId === idea._id ? <Spinner animation="border" size="sm"/> : <><SaveFill size={12}/> Save</>}
                      </Button>
                      
                      <Button
                        size="sm" variant="success"
                        onClick={() => triggerShortcutAccept(idea._id)}
                        disabled={syncingId === idea._id || idea.status === 'building'}
                        className="fw-bold px-2.5 d-flex align-items-center gap-1 font-sans-serif text-white"
                        style={{ borderRadius: '6px', fontSize: '12.5px' }}
                      >
                        Accept (+25 pts)
                      </Button>

                      <Button
                        size="sm" variant="light"
                        onClick={() => triggerShortcutPark(idea._id)}
                        disabled={syncingId === idea._id || idea.status === 'parked'}
                        className="fw-bold px-2.5 d-flex align-items-center gap-1 border border-slate font-sans-serif text-secondary"
                        style={{ borderRadius: '6px', fontSize: '12.5px' }}
                      >
                        <BookmarkDashFill size={12}/> Park
                      </Button>
                    </Col>

                  </Row>
                </div>

              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}