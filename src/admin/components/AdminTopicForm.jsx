// src/admin/components/AdminTopicForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import api from '../services/api'; 

export default function AdminTopicForm({ modules = [], initialModuleId = '', suggestedOrder = '1', editData = null, onTopicAdded, setActiveTab }) {
  const [selectedModule, setSelectedModule] = useState(initialModuleId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topicOrder, setTopicOrder] = useState(suggestedOrder);
  // ⏱️ Feeds the backend's computePointsReward() alongside this topic's own
  // card count — see quiz-backend/src/utils/pointsCalculator.js.
  const [estimatedTime, setEstimatedTime] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 🎛️ FILTER: Extract only modules that support explicit sub-topics
  const validTopicModules = modules.filter(m => m.hasTopics !== false);

  // 🎯 DUAL-MODE DETECTION LAYER
  useEffect(() => {
    if (editData) {
      console.log("📝 [Edit Mode Active] Hydrating topic values:", editData);
      setSelectedModule(editData.module_id || '');
      setTitle(editData.title || '');
      setDescription(editData.description || '');
      setTopicOrder((editData.topicOrder || '1').toString());
      setEstimatedTime(editData.estimatedTime ? String(editData.estimatedTime) : '');
    } else {
      // Normal Creation Sync Tracker
      // Ensure the initial fallback module target actually supports topics before binding state
      if (initialModuleId) {
        const matchingModule = modules.find(m => m._id === initialModuleId);
        if (matchingModule && matchingModule.hasTopics !== false) {
          setSelectedModule(initialModuleId);
        } else {
          setSelectedModule(''); // Clear stale fallback if module is marked direct-to-card
        }
      }
      if (suggestedOrder) setTopicOrder(suggestedOrder);
    }
  }, [editData, initialModuleId, suggestedOrder, modules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedModule) { setError('Parent module context scoping is required.'); return; }
    if (!title || !topicOrder) { setError('Title and sequence parameters are mandatory.'); return; }
    
    // 🛡️ SUBMISSION GUARD CHECK
    const targetModuleDoc = modules.find(m => m._id === selectedModule);
    if (targetModuleDoc && targetModuleDoc.hasTopics === false) {
      setError('System Violation: Cannot add sub-topics to an Express/Compact module format configured for direct content card pipelines.');
      return;
    }

    setLoading(true); setError(''); setSuccess('');

    const topicPayload = {
      module_id: selectedModule,
      title,
      description,
      topicOrder: Number(topicOrder), // Mongoose type Number cast validation safe
      estimatedTime: Number(estimatedTime) || 0
    };

    try {
      if (editData) {
        console.log(`🚀 [API Handshake] Routing PUT adjustments to Topic ID: ${editData._id}`, topicPayload);
        await api.updateTopic(editData._id, topicPayload);
        setSuccess('Sub-topic properties mapped inside repository database bounds successfully!');
      } else {
        console.log("🚀 [API Handshake] Submitting brand new topic mapping node:", topicPayload);
        await api.createTopic(topicPayload);
        setSuccess('Technical topic node mounted and bound to structural core module successfully!');
      }

      setTitle(''); setDescription(''); setEstimatedTime('');
      if (onTopicAdded) onTopicAdded();
      
      setTimeout(() => {
        if (setActiveTab) setActiveTab('overview');
      }, 1200);

    } catch (err) {
      console.error("❌ Topic runtime transaction failure:", err);
      setError(err.message || 'The index serialization rejected topic parameters initialization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-surface card border-slate p-4 rounded-3 bg-white animate-fade-in text-start" style={{ borderRadius: '12px' }}>
      <div className="border-bottom pb-2 mb-4">
        <h4 className="fw-bold text-dark m-0">{editData ? 'Modify Sub-Topic Architecture Specs' : 'Map Sub-Topic Core Node'}</h4>
        <p className="text-muted small m-0 mt-1">Bind or adjust sequential database technical syllabus topic node paths under a parent trajectory module track.</p>
      </div>

      {error && <Alert variant="danger" className="admin-alert-compact py-2 small">{error}</Alert>}
      {success && <Alert variant="success" className="admin-alert-compact py-2 small">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row className="g-3 mb-3">
          <Col md={8} xs={12}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Parent Module Context Target</Form.Label>
              <Form.Select 
                value={selectedModule} 
                onChange={(e) => setSelectedModule(e.target.value)} 
                required
                className="admin-flat-input text-muted"
                disabled={loading || !!editData} 
              >
                <option value="">Choose target module trajectory track</option>
                {/* ⚡ Dynamic Filtration Loop applied to avoid rendering direct-to-card modules */}
                {validTopicModules.map((m) => (
                  <option key={m._id} value={m._id}>{m.title}</option>
                ))}
              </Form.Select>
              {validTopicModules.length === 0 && modules.length > 0 && (
                <Form.Text className="text-danger small mt-1 d-block">
                  ⚠️ Error: All currently loaded training modules are flagged as Compact/Express paths. Establish a 'Standard' format module first.
                </Form.Text>
              )}
            </Form.Group>
          </Col>
          <Col md={4} xs={12}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Sequence Order Index (`topicOrder`)</Form.Label>
              <Form.Control
                type="number" min="1"
                value={topicOrder} onChange={(e) => setTopicOrder(e.target.value)} required
                className="admin-flat-input fw-bold text-primary bg-light"
                disabled={loading}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="g-3 mb-3">
          <Col md={4} xs={12}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Estimated Time (minutes)</Form.Label>
              <Form.Control
                type="number" min="0" placeholder="e.g., 10"
                value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)}
                className="admin-flat-input"
                disabled={loading}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold text-dark small">Topic Title Header Name</Form.Label>
          <Form.Control 
            type="text" placeholder="e.g., Topic 3: Parsing Dimensional Tables Taxonomy Formats" 
            value={title} onChange={(e) => setTitle(e.target.value)} required 
            className="admin-flat-input"
            disabled={loading}
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label className="fw-semibold text-dark small">Brief Topic Synopsis Description (Optional)</Form.Label>
          <Form.Control 
            as="textarea" rows={3} placeholder="Provide concise documentation structural data parameters logs summary for this node tracking..." 
            value={description} onChange={(e) => setDescription(e.target.value)}
            className="admin-flat-input"
            disabled={loading}
          />
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit" className="admin-btn-primary px-4 d-flex align-items-center justify-content-center" disabled={loading || validTopicModules.length === 0} style={{ backgroundColor: '#0f256e', borderColor: '#0f256e' }}>
            {loading ? <Spinner animation="border" size="sm" /> : editData ? 'Apply Node Alterations' : 'Map Topic Node'}
          </Button>
          <Button type="button" variant="light" className="border px-4 fw-semibold btn-sm text-secondary" onClick={() => setActiveTab('overview')} disabled={loading} style={{ borderRadius: '6px' }}>
            Cancel Mappings
          </Button>
        </div>
      </Form>
    </div>
  );
}