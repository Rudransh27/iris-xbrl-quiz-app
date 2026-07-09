// src/admin/components/AdminModuleForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import api from '../services/api'; 

export default function AdminModuleForm({ editData = null, onModuleAdded, setActiveTab }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(''); 
  
  // 🔀 UPDATED ENGINE SELECTION MATRIX
  // Reverted back to the two primary structural routing engines.
  // HTML sandbox features will now be built inside these pipelines as custom individual cards!
  const [engineStrategy, setEngineStrategy] = useState('STANDARD'); // Options: 'STANDARD', 'EXPRESS_FLAT'

  // ⏱️ Feeds the backend's computePointsReward() alongside this module's card
  // count — see quiz-backend/src/utils/pointsCalculator.js.
  const [estimatedTime, setEstimatedTime] = useState('');

  // 🔥⭐ CURATION FLAGS — enforced through the dedicated PATCH endpoints (singleton
  // Hot Module, capped-at-4 Popular row), never via the plain create/update payload.
  const [isHotModule, setIsHotModule] = useState(false);
  const [isPopular, setIsPopular] = useState(false);

  // 🛡️ THREE-LAYER VISIBILITY CONTROL STATES
  const [visibility, setVisibility] = useState('Global'); // Options: 'Global', 'Departmental', 'Team-Specific'
  const [selectedDepartment, setSelectedDepartment] = useState(''); // Stores Department ID string
  const [selectedTeams, setSelectedTeamIds] = useState([]); // Array of checked sub-team ID strings

  // 📡 METADATA DICTIONARIES
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loadingStructure, setLoadingStructure] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Hydrate all available company layout paths on initialization
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const data = await api.getDepartments();
        setDepartmentsList(data || []);
      } catch (err) {
        console.error("Failed to sync structural datasets:", err.message);
        setError("System Fault: Failed to initialize company tracking vectors.");
      } finally {
        loadingStructure && setLoadingStructure(false);
      }
    };
    fetchCompanyData();
  }, []);

  // Hydrate form layers cleanly when running edit-mutations
  useEffect(() => {
    if (editData && departmentsList.length > 0) {
      setTitle(editData.title || '');
      setDescription(editData.description || '');
      setImageUrl(editData.imageUrl || '');
      
      // Sync newly injected engine strategy fields smoothly
      const derivedStrategy = editData.engineStrategy || (editData.hasTopics === false ? 'EXPRESS_FLAT' : 'STANDARD');
      // Graceful fallback safeguard if a legacy record has an old strategy value attached
      setEngineStrategy(derivedStrategy === 'HTML_SANDBOX' ? 'EXPRESS_FLAT' : derivedStrategy);
      
      setVisibility(editData.visibility || 'Global');
      setIsHotModule(!!editData.isHotModule);
      setIsPopular(!!editData.isPopular);
      setEstimatedTime(editData.estimatedTime ? String(editData.estimatedTime) : '');

      const deptId = editData.department?._id || editData.department || '';
      setSelectedDepartment(deptId);
      
      const teamIds = Array.isArray(editData.targetTeams) 
        ? editData.targetTeams.map(t => t._id || t) 
        : [];
      setSelectedTeamIds(teamIds);
    }
  }, [editData, departmentsList]);

  // Track checked/unchecked choices inside the team selector grid panel
  const handleTeamCheckboxToggle = (teamId) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    setSuccess('');

    try {
      const returnedCdnUrl = await api.uploadImage(file);
      setImageUrl(returnedCdnUrl); 
      setSuccess('Module illustrative cover uploaded to Cloudinary node successfully!');
    } catch (err) {
      setError('Image parsing failed. Ensure file structure and storage keys are valid.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) { setError('Module core title is mandatory.'); return; }
    if (uploadingImage) { setError('Please wait for the image upload pipeline to finish.'); return; }
    
    // Cross-validate context constraints before dispatching API mutations
    if (visibility !== 'Global' && !selectedDepartment) {
      setError('Validation Error: You must pick a target parent department for this scope selection.');
      return;
    }
    if (visibility === 'Team-Specific' && selectedTeams.length === 0) {
      setError('Validation Error: Select at least one sub-team for Team-Specific target filters.');
      return;
    }

    setLoading(true); setError(''); setSuccess('');

    // Payload compiled tailored explicitly to updated backend schema parameters
    const modulePayload = {
      title,
      description,
      engineStrategy, 
      visibility,
      department: visibility === 'Global' ? null : selectedDepartment,
      targetTeams: visibility === 'Team-Specific' ? selectedTeams : [],
      imageUrl: imageUrl || "https://example.com/images/default-xbrl-module.png",
      estimatedTime: Number(estimatedTime) || 0
    };

    try {
      let savedModule;
      if (editData) {
        savedModule = await api.updateModule(editData._id, modulePayload);
        setSuccess('Core training stream module data elements modified successfully!');
      } else {
        savedModule = await api.createModule(modulePayload);
        setSuccess('Core training stream module established inside repository successfully!');
      }

      // Curation flags are enforced through the dedicated PATCH endpoints (not
      // the plain payload above) so the singleton/cap invariants always run.
      const savedId = savedModule?._id || savedModule?.id || editData?._id;
      if (savedId) {
        const priorHot = !!editData?.isHotModule;
        const priorPopular = !!editData?.isPopular;
        if (isHotModule !== priorHot) {
          await api.setHotModule(savedId, isHotModule);
        }
        if (isPopular !== priorPopular) {
          await api.setPopularModule(savedId, isPopular);
        }
      }

      setTitle(''); setDescription(''); setImageUrl('');
      setSelectedDepartment(''); setSelectedTeamIds([]); setVisibility('Global');
      setEngineStrategy('STANDARD');
      setIsHotModule(false); setIsPopular(false); setEstimatedTime('');

      if (onModuleAdded) onModuleAdded();
      
      setTimeout(() => {
        if (setActiveTab) setActiveTab('overview');
      }, 1200);

    } catch (err) {
      setError(err.message || 'Failed to initialize curriculum track inside database bounds.');
    } finally {
      setLoading(false);
    }
  };

  // Compute sub-team options available for selection depending on parent choice matrix
  const availableTeams = departmentsList.find(d => d._id === selectedDepartment)?.teams || [];

  if (loadingStructure) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" style={{ color: "#0f256e" }} />
        <p className="mt-2 text-muted small">Loading cluster structural parameters...</p>
      </div>
    );
  }

  return (
    <div className="admin-form-surface card border-slate p-4 rounded-3 bg-white animate-fade-in text-start" style={{ borderRadius: '12px' }}>
      <div className="border-bottom pb-2 mb-4">
        <h4 className="fw-bold text-dark m-0">{editData ? 'Modify Course Module Specifications' : 'Establish New Course Module'}</h4>
        <p className="text-muted small m-0 mt-1">Adjust multi-tenant permissions boundaries alongside curriculum specs tracks.</p>
      </div>
      
      {error && <Alert variant="danger" className="admin-alert-compact py-2 small">{error}</Alert>}
      {success && <Alert variant="success" className="admin-alert-compact py-2 small">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row className="g-3 mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Module Core Title</Form.Label>
              <Form.Control 
                type="text" placeholder="e.g., Module 4: XBRL Advanced Dimensions Framework" 
                value={title} onChange={(e) => setTitle(e.target.value)} required 
                className="admin-flat-input"
              />
            </Form.Group>
          </Col>
          
          {/* 🎛️ LAYER 1 VISIBILITY TOGGLE */}
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Access Visibility Scope Tier</Form.Label>
              <Form.Select 
                value={visibility} 
                onChange={(e) => {
                  setVisibility(e.target.value);
                  setSelectedDepartment(''); // Flush stale states
                  setSelectedTeamIds([]);
                }} 
                required
                className="admin-flat-input text-muted"
              >
                <option value="Global">Global (All Corporate Specialist Nodes)</option>
                <option value="Departmental">Departmental (Isolate to Single Business Line)</option>
                <option value="Team-Specific">Team-Specific (Restricted to Sub-Team Branches)</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="g-3 mb-3">
          {/* 🔀 TWO-WAY STRATEGY DROPDOWN SELECTION */}
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Module Pipeline Strategy Engine</Form.Label>
              <Form.Select
                value={engineStrategy}
                onChange={(e) => setEngineStrategy(e.target.value)}
                required
                className="admin-flat-input text-muted"
              >
                <option value="STANDARD">Standard Route (Module ➔ Sub-Topics ➔ Content Cards)</option>
                <option value="EXPRESS_FLAT">Compact / Express (Module ➔ Content Cards Directly)</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">
                Module Cover Image Upload {uploadingImage && <Spinner animation="border" size="sm" className="ms-2 text-primary" />}
              </Form.Label>
              <Form.Control
                type="file" accept="image/*" onChange={handleImageFileChange} disabled={uploadingImage || loading}
                className="admin-flat-input bg-white"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="g-3 mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Estimated Time (minutes)</Form.Label>
              <Form.Control
                type="number" min="0" placeholder="e.g., 25"
                value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)}
                className="admin-flat-input"
              />
              <small className="text-muted d-block mt-1">Feeds the auto-computed points reward shown on module/topic cards.</small>
            </Form.Group>
          </Col>
        </Row>

        {/* 🔥⭐ CURATION FLAGS */}
        <Row className="g-3 mb-3">
          <Col md={6}>
            <Form.Check
              type="switch"
              id="hot-module-switch"
              label="🔥 Mark as platform-wide Hot Module"
              checked={isHotModule}
              onChange={(e) => setIsHotModule(e.target.checked)}
              className="fw-semibold text-dark small"
            />
            <small className="text-muted d-block mt-1">Only one module may hold this at a time — setting it here unsets any previous holder.</small>
          </Col>
          <Col md={6}>
            <Form.Check
              type="switch"
              id="popular-module-switch"
              label="⭐ Feature in Popular Modules row"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="fw-semibold text-dark small"
            />
            <small className="text-muted d-block mt-1">Capped at 4 modules platform-wide.</small>
          </Col>
        </Row>

        {/* 🎛️ LAYER 2 DYNAMIC PARENT SELECTOR */}
        {visibility !== 'Global' && (
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold text-dark small">Target Parent Department</Form.Label>
                <Form.Select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedTeamIds([]); // Clear child check fields when department shifts
                  }}
                  required
                  className="admin-flat-input text-muted"
                >
                  <option value="" disabled>Select Department</option>
                  {departmentsList.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        )}

        {/* 🎛️ LAYER 3 DYNAMIC SUB-TEAM MULTI-SELECT CHECKBOX BOX */}
        {visibility === 'Team-Specific' && selectedDepartment && (
          <div className="mb-3 bg-light p-3 border rounded-3 animate-fade-in">
            <Form.Label className="fw-semibold text-dark small d-block mb-2">Target Teams Boundaries (Select Multiple)</Form.Label>
            {availableTeams.length === 0 ? (
              <small className="text-danger italic ps-1">Notice: Zero sub-teams are currently provisioned under this department asset category directory.</small>
            ) : (
              <Row>
                {availableTeams.map(team => (
                  <Col sm={4} xs={6} key={team._id} className="mb-1">
                    <Form.Check 
                      type="checkbox"
                      id={`team-chk-${team._id}`}
                      label={team.name}
                      checked={selectedTeams.includes(team._id)}
                      onChange={() => handleTeamCheckboxToggle(team._id)}
                      className="small fw-medium text-secondary"
                      style={{ fontSize: '13px', cursor: 'pointer' }}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </div>
        )}

        <Form.Group className="mb-4">
          <Form.Label className="fw-semibold text-dark small">Detailed Module Synopsis Description</Form.Label>
          <Form.Control 
            as="textarea" rows={3} placeholder="Provide structural curriculum trajectory stream context logs metadata..." 
            value={description} onChange={(e) => setDescription(e.target.value)}
            className="admin-flat-input"
          />
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit" className="admin-btn-primary px-4 d-flex align-items-center justify-content-center" disabled={loading || uploadingImage} style={{ backgroundColor: '#0f256e', borderColor: '#0f256e' }}>
            {loading ? <Spinner animation="border" size="sm" /> : editData ? 'Apply Variations Changes' : 'Instantiate Module Root'}
          </Button>
          <Button type="button" variant="light" className="border px-4 fw-semibold btn-sm text-secondary" onClick={() => setActiveTab('overview')} disabled={loading || uploadingImage} style={{ borderRadius: '6px' }}>
            Cancel Allocation
          </Button>
        </div>
      </Form>
    </div>
  );
}