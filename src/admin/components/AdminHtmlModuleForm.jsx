// src/admin/components/AdminHtmlModuleForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';
import api from '../services/api';
import AuthContext from '../../context/AuthContext';

export default function AdminHtmlModuleForm({ editData = null, onModuleAdded, setActiveTab }) {
  // 🔐 Same RBAC mirror as AdminModuleForm.jsx — see that file's comment for
  // full reasoning. Backend (moduleRoutes.js) remains the actual authority.
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === 'superadmin';
  // 👤 OWNERSHIP — see AdminModuleForm.jsx's identical comment for full
  // reasoning: creating a new module trivially makes the current user its
  // owner; editing one requires its recorded creator to match.
  const isOwner = !editData || (
    !!editData.createdBy &&
    !!user?._id &&
    (editData.createdBy._id || editData.createdBy).toString() === user._id.toString()
  );
  const canUseGlobalScope = isSuperAdmin || isOwner;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [visibility, setVisibility] = useState('Global');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTeams, setSelectedTeamIds] = useState([]);

  const [htmlSource, setHtmlSource] = useState('');
  const [baseTimeThresholdSec, setBaseTimeThresholdSec] = useState('');
  const [estimatedDurationMin, setEstimatedDurationMin] = useState('');
  const [maxPoints, setMaxPoints] = useState('10');

  const [departmentsList, setDepartmentsList] = useState([]);
  const [loadingStructure, setLoadingStructure] = useState(true);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const data = await api.getDepartments();
        setDepartmentsList(data || []);
      } catch (err) {
        setError('System Fault: Failed to initialize company tracking vectors.');
      } finally {
        setLoadingStructure(false);
      }
    };
    fetchCompanyData();
  }, []);

  useEffect(() => {
    if (!editData || departmentsList.length === 0) return;

    setTitle(editData.title || '');
    setDescription(editData.description || '');
    setImageUrl(editData.imageUrl || '');
    setVisibility(editData.visibility || 'Global');

    const deptId = editData.department?._id || editData.department || '';
    setSelectedDepartment(deptId);

    const teamIds = Array.isArray(editData.targetTeams)
      ? editData.targetTeams.map(t => t._id || t)
      : [];
    setSelectedTeamIds(teamIds);

    // Module list responses don't include card content — fetch the full module to hydrate it.
    const hydrateCardContent = async () => {
      try {
        const fullModule = await api.getModule(editData._id);
        const sandboxCard = (fullModule.cards || []).find(c => c.card_type === 'html_sandbox');
        if (sandboxCard) {
          setHtmlSource(sandboxCard.content?.htmlSource || '');
          setMaxPoints(String(sandboxCard.content?.maxPoints ?? 10));
          setBaseTimeThresholdSec(String(sandboxCard.content?.baseTimeThresholdSec ?? ''));
          setEstimatedDurationMin(String(sandboxCard.content?.estimatedDurationMin ?? ''));
        }
      } catch (err) {
        setError('Failed to hydrate existing HTML payload for edit mode.');
      }
    };
    hydrateCardContent();
  }, [editData, departmentsList]);

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
      setSuccess('Banner thumbnail uploaded successfully!');
    } catch (err) {
      setError('Image upload failed. Ensure the file is a valid image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) { setError('Module name is mandatory.'); return; }
    if (!htmlSource.trim()) { setError('The raw HTML payload cannot be empty.'); return; }
    if (uploadingImage) { setError('Please wait for the image upload to finish.'); return; }

    if (visibility !== 'Global' && !selectedDepartment) {
      setError('Validation Error: You must pick a target department for this scope.');
      return;
    }
    if (visibility === 'Team-Specific' && selectedTeams.length === 0) {
      setError('Validation Error: Select at least one team for Team-Specific scope.');
      return;
    }

    setLoading(true); setError(''); setSuccess('');

    const modulePayload = {
      title,
      description,
      moduleType: 'html_sandbox',
      engineStrategy: 'EXPRESS_FLAT',
      hasTopics: false,
      visibility,
      department: visibility === 'Global' ? null : selectedDepartment,
      targetTeams: visibility === 'Team-Specific' ? selectedTeams : [],
      imageUrl: imageUrl || 'https://example.com/images/default-xbrl-module.png',
      htmlSource,
      baseTimeThresholdSec: Number(baseTimeThresholdSec) || 0,
      estimatedDurationMin: Number(estimatedDurationMin) || 0,
      maxPoints: Number(maxPoints) || 10,
    };

    try {
      if (editData) {
        await api.updateModule(editData._id, modulePayload);
        setSuccess('HTML Sandbox Module updated successfully!');
      } else {
        await api.createModule(modulePayload);
        setSuccess('HTML Sandbox Module created successfully!');
      }

      setTitle(''); setDescription(''); setImageUrl('');
      setSelectedDepartment(''); setSelectedTeamIds([]); setVisibility('Global');
      setHtmlSource(''); setBaseTimeThresholdSec(''); setEstimatedDurationMin(''); setMaxPoints('10');

      if (onModuleAdded) onModuleAdded();

      setTimeout(() => {
        if (setActiveTab) setActiveTab('overview');
      }, 1200);

    } catch (err) {
      setError(err.message || 'Failed to save the HTML Sandbox Module.');
    } finally {
      setLoading(false);
    }
  };

  // 🔐 A Department Admin only ever sees their OWN department here — never
  // the full company directory. Super Admins see everything.
  const visibleDepartmentsList = isSuperAdmin
    ? departmentsList
    : departmentsList.filter(d => (d._id || '').toString() === (user?.department || '').toString());

  const availableTeams = visibleDepartmentsList.find(d => d._id === selectedDepartment)?.teams || [];

  // 🔐 Keep selectedDepartment permanently locked to the Department Admin's
  // own department once a non-Global scope is chosen — same rule as
  // AdminModuleForm.jsx, matching the backend's forced-own-department logic.
  useEffect(() => {
    if (isSuperAdmin) return;
    if (visibility === 'Global') return;
    if (user?.department && selectedDepartment !== user.department) {
      setSelectedDepartment(user.department);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, visibility, user?.department]);

  // 👤 See AdminModuleForm.jsx's identical comment for full reasoning.
  const showGlobalOption = canUseGlobalScope || visibility === 'Global';
  const lockVisibilityDropdown = !isSuperAdmin && !isOwner && visibility === 'Global';

  if (loadingStructure) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" style={{ color: '#0f256e' }} />
        <p className="mt-2 text-muted small">Loading cluster structural parameters...</p>
      </div>
    );
  }

  return (
    <div className="admin-form-surface card border-slate p-4 rounded-3 bg-white animate-fade-in text-start" style={{ borderRadius: '12px' }}>
      <div className="border-bottom pb-2 mb-4">
        <h4 className="fw-bold text-dark m-0">🌐 {editData ? 'Modify HTML Sandbox Module' : 'Create HTML Sandbox Module'}</h4>
        <p className="text-muted small m-0 mt-1">Register a standalone raw HTML/CSS/JS interactive asset as its own full-screen module.</p>
      </div>

      {error && <Alert variant="danger" className="admin-alert-compact py-2 small">{error}</Alert>}
      {success && <Alert variant="success" className="admin-alert-compact py-2 small">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row className="g-3 mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Module Name</Form.Label>
              <Form.Control
                type="text" placeholder="e.g., Detect My Anomalies — Interactive Simulation"
                value={title} onChange={(e) => setTitle(e.target.value)} required
                className="admin-flat-input"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Access Visibility Scope Tier</Form.Label>
              <Form.Select
                value={visibility}
                onChange={(e) => {
                  setVisibility(e.target.value);
                  setSelectedDepartment('');
                  setSelectedTeamIds([]);
                }}
                required
                disabled={lockVisibilityDropdown}
                className="admin-flat-input text-muted"
              >
                {showGlobalOption && <option value="Global">Global (All Corporate Specialist Nodes)</option>}
                <option value="Departmental">Departmental (Isolate to Single Business Line)</option>
                <option value="Team-Specific">Team-Specific (Restricted to Sub-Team Branches)</option>
              </Form.Select>
              {lockVisibilityDropdown && (
                <small className="text-danger d-block mt-1">
                  This module is Global and was created by someone else — only its creator or a Super Admin can change its scope.
                </small>
              )}
              {!isSuperAdmin && !isOwner && !lockVisibilityDropdown && (
                <small className="text-muted d-block mt-1">
                  You didn't create this module, so it can't be set to Global — you can still adjust its scope within your own department.
                </small>
              )}
            </Form.Group>
          </Col>
        </Row>

        {visibility !== 'Global' && (
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold text-dark small">Target Parent Department</Form.Label>
                <Form.Select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedTeamIds([]);
                  }}
                  required
                  disabled={!isSuperAdmin}
                  className="admin-flat-input text-muted"
                >
                  <option value="" disabled>Select Department</option>
                  {visibleDepartmentsList.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </Form.Select>
                {!isSuperAdmin && (
                  <small className="text-muted d-block mt-1">
                    Locked to your own department — Department Admins cannot assign modules to other departments.
                  </small>
                )}
              </Form.Group>
            </Col>
          </Row>
        )}

        {visibility === 'Team-Specific' && selectedDepartment && (
          <div className="mb-3 bg-light p-3 border rounded-3 animate-fade-in">
            <Form.Label className="fw-semibold text-dark small d-block mb-2">Target Teams (Select Multiple)</Form.Label>
            {availableTeams.length === 0 ? (
              <small className="text-danger italic ps-1">Notice: Zero sub-teams are currently provisioned under this department.</small>
            ) : (
              <Row>
                {availableTeams.map(team => (
                  <Col sm={4} xs={6} key={team._id} className="mb-1">
                    <Form.Check
                      type="checkbox"
                      id={`html-team-chk-${team._id}`}
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

        <Row className="g-3 mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">
                Banner Image Thumbnail {uploadingImage && <Spinner animation="border" size="sm" className="ms-2 text-primary" />}
              </Form.Label>
              <Form.Control
                type="file" accept="image/*" onChange={handleImageFileChange} disabled={uploadingImage || loading}
                className="admin-flat-input bg-white"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Maximum Base Points / Plasma</Form.Label>
              <Form.Control
                type="number" min="0" value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)}
                className="admin-flat-input" required
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="g-3 mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Base Time-on-Page Threshold (seconds)</Form.Label>
              <Form.Control
                type="number" min="0" value={baseTimeThresholdSec} onChange={(e) => setBaseTimeThresholdSec(e.target.value)}
                className="admin-flat-input" placeholder="e.g., 60"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold text-dark small">Estimated Duration (minutes)</Form.Label>
              <Form.Control
                type="number" min="0" value={estimatedDurationMin} onChange={(e) => setEstimatedDurationMin(e.target.value)}
                className="admin-flat-input" placeholder="e.g., 10"
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold text-dark small">Detailed Module Synopsis Description</Form.Label>
          <Form.Control
            as="textarea" rows={2} placeholder="Briefly describe what this interactive simulation covers..."
            value={description} onChange={(e) => setDescription(e.target.value)}
            className="admin-flat-input"
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label className="fw-semibold text-dark small">Raw HTML Payload (with integrated &lt;style&gt;/&lt;script&gt;)</Form.Label>
          <div className="border rounded-3 overflow-hidden">
            <AceEditor
              mode="html"
              theme="github"
              name="html_sandbox_payload_editor"
              editorProps={{ $blockScrolling: true }}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: false,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 2,
              }}
              value={htmlSource}
              onChange={setHtmlSource}
              width="100%"
              height="360px"
            />
          </div>
          <small className="text-muted">Paste the complete standalone HTML document — including &lt;style&gt; and &lt;script&gt; blocks — exactly as it should run inside the sandboxed iframe.</small>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit" className="admin-btn-primary px-4 d-flex align-items-center justify-content-center" disabled={loading || uploadingImage} style={{ backgroundColor: '#0f256e', borderColor: '#0f256e' }}>
            {loading ? <Spinner animation="border" size="sm" /> : editData ? 'Apply Changes' : 'Create HTML Sandbox Module'}
          </Button>
          <Button type="button" variant="light" className="border px-4 fw-semibold btn-sm text-secondary" onClick={() => setActiveTab('overview')} disabled={loading || uploadingImage} style={{ borderRadius: '6px' }}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}
