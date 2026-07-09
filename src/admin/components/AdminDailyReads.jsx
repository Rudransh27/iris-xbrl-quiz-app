// src/admin/components/AdminDailyReadForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Alert, Spinner, Card, Badge } from 'react-bootstrap';
import { Building, Globe2, SendCheckFill } from 'react-bootstrap-icons';
import api from '../services/api';
import AuthContext from '../../context/AuthContext'; // ✅ Synced correct context relative path reference lookups

export default function AdminDailyReadForm({ setActiveTab }) {
  const { user } = useContext(AuthContext);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', variant: '' });

  // 🏢 DEPARTMENT REGISTRY STORAGE METRICS (Strictly for Superadmins)
  const [departmentsList, setDepartmentsList] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [fetchingDepts, setFetchingDepts] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';

  // ⚡ DYNAMIC LOOKUP LAYER: Hydrate the dropdown menu streams on component load if user is a superadmin
  useEffect(() => {
    if (isSuperAdmin) {
      setFetchingDepts(true);
      // Fallback fallback loop mappings to avoid dashboard rendering crash states
      api.getDepartments ? api.getDepartments()
        .then(res => {
          const list = res?.data || res || [];
          setDepartmentsList(list);
          if (list.length > 0) setSelectedDepartmentId(list[0]._id);
        })
        .catch(err => console.error("Failed to load SaaS organization department arrays:", err))
        .finally(() => setFetchingDepts(false))
      : setFetchingDepts(false);
    }
  }, [isSuperAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setMessage({ text: 'All tracking payload parameters are required.', variant: 'danger' });
      return;
    }

    // Determine target department context
    let targetDeptToSend = null;
    if (isSuperAdmin) {
      if (!selectedDepartmentId) {
        setMessage({ text: 'Validation Error: Please pick a destination target department.', variant: 'danger' });
        return;
      }
      targetDeptToSend = selectedDepartmentId;
    } else {
      targetDeptToSend = user?.department;
    }

    setLoading(true);
    setMessage({ text: '', variant: '' });

    // Package explicit data boundaries directly mapped to backend requirements
    const postPayload = {
      title: title.trim(),
      content: content.trim(),
      imageUrl: "", // Base default fallback matching your route models structures
      referenceLink: "",
      tags: [],
      targetDepartmentId: targetDeptToSend
    };

    try {
      await api.createDailyRead(postPayload);
      setMessage({ text: 'Daily Read article successfully targeted to target department stream feed!', variant: 'success' });
      setTitle('');
      setContent('');
      setTimeout(() => setActiveTab('overview'), 1500);
    } catch (err) {
      setMessage({ text: err.message || 'System failed to publish Daily Read document.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm animate-fade-in" style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <Card.Body className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <h4 className="fw-bold text-dark-title m-0">Publish Departmental Daily Read</h4>
          <Badge bg="success" className="d-flex align-items-center gap-1 font-monospace px-2 py-1" style={{ fontSize: '10px' }}>
            <Building size={10} /> DEPARTMENTAL FEED ONLY
          </Badge>
        </div>
        <p className="text-muted small mb-4">Broadcast a targeted structural technical update article context directly into isolated trainee workspace clusters.</p>

        {message.text && <Alert variant={message.variant} className="small fw-semibold">{message.text}</Alert>}

        <Form onSubmit={handleSubmit}>
          
          {/* =========================================================================
              🏢 LAYER 2 CONDITIONAL VISIBILITY ROUTER DESIGN 
             ========================================================================= */}
          {isSuperAdmin ? (
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-dark">Target Destination Department</Form.Label>
              {fetchingDepts ? (
                <div className="small text-muted font-monospace"><Spinner animation="border" size="sm" className="me-2"/>Compiling SaaS tenant nodes...</div>
              ) : (
                <Form.Select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  disabled={loading}
                  style={{ borderRadius: '6px', fontSize: '13.5px' }}
                  required
                >
                  {departmentsList.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name || dept.title}</option>
                  ))}
                </Form.Select>
              )}
              <Form.Text className="text-muted font-monospace" style={{ fontSize: '10px' }}>Superadmin access: Pick which isolated group feed ingests this newsletter matrix.</Form.Text>
            </Form.Group>
          ) : (
            <div className="p-3 mb-3 border rounded-3 bg-light d-flex align-items-center justify-content-between" style={{ borderColor: '#cbd5e1' }}>
              <div className="d-flex align-items-center gap-2">
                <Building size={16} className="text-success" />
                <div>
                  <div className="fw-bold small text-dark">Automated Stream Locking</div>
                  <div className="text-muted font-monospace" style={{ fontSize: '11px' }}>Bound permanently to your native administrator domain context.</div>
                </div>
              </div>
              <Badge bg="dark" className="text-sans-serif text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                Secure Tenant Mode
              </Badge>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-muted">Document Title</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="e.g., Understanding XBRL Dimensions and Hypercubes" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              style={{ borderRadius: '6px', fontSize: '13.5px' }}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="small fw-semibold text-muted">Article Markdown Content Body</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={9} 
              placeholder="Type or paste the corporate technical disclosure article body context tracking guidelines here..." 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              style={{ borderRadius: '6px', fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace', fontSize: '13px', lineHeight: '1.6' }}
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2 border-top pt-3" style={{ borderColor: '#f1f5f9' }}>
            <Button variant="light" onClick={() => setActiveTab('overview')} disabled={loading} style={{ borderRadius: '6px', fontSize: '13.5px', fontWeight: '500' }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading || (isSuperAdmin && departmentsList.length === 0)} style={{ borderRadius: '6px', backgroundColor: '#0f256e', borderColor: '#0f256e', fontWeight: '600', fontSize: '13.5px', paddingLeft: '20px', paddingRight: '20px' }}>
              {loading ? <Spinner animation="border" size="sm" /> : <><SendCheckFill size={14} className="me-1.5" /> Deploy Broadcast</>}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}