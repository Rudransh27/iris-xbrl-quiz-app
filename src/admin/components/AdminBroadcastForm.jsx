// src/admin/components/AdminBroadcastForm.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Form, Button, Alert, Spinner, Card, Badge, ButtonGroup } from 'react-bootstrap';
import { Broadcast, Globe2, Building, SendCheckFill } from 'react-bootstrap-icons';
import api from '../services/api';
import AuthContext from '../../context/AuthContext';

export default function AdminBroadcastForm({ setActiveTab }) {
  const { user } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', variant: '' });

  // Media can be either an uploaded file (image/video, stored via
  // Cloudinary — same pattern AdminCardForm.jsx uses for module content) or
  // a pasted URL — a per-type source toggle, matching that existing form's
  // "Upload File" vs "Paste URL" convention rather than inventing a new one.
  const [imageSourceType, setImageSourceType] = useState('upload');
  const [videoSourceType, setVideoSourceType] = useState('upload');
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Scope: "Global" or "Departmental". Departmental target department is
  // resolved differently by role — see the RBAC-aware dropdown below, same
  // pattern as AdminDailyReads.jsx's existing department picker.
  const [scope, setScope] = useState('Global');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [fetchingDepts, setFetchingDepts] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setMessage({ text: 'Title and content are required.', variant: 'danger' });
      return;
    }
    if (scope === 'Departmental' && isSuperAdmin && !selectedDepartmentId) {
      setMessage({ text: 'Please select a target department.', variant: 'danger' });
      return;
    }
    if (contentType === 'image') {
      if (imageSourceType === 'upload' && !imageFile) {
        setMessage({ text: 'Please choose an image file to upload.', variant: 'danger' });
        return;
      }
      if (imageSourceType === 'url' && !mediaUrl.trim()) {
        setMessage({ text: 'Please provide an image URL.', variant: 'danger' });
        return;
      }
    }
    if (contentType === 'video') {
      if (videoSourceType === 'upload' && !videoFile) {
        setMessage({ text: 'Please choose a video file to upload.', variant: 'danger' });
        return;
      }
      if (videoSourceType === 'url' && !mediaUrl.trim()) {
        setMessage({ text: 'Please provide a video URL.', variant: 'danger' });
        return;
      }
    }

    setLoading(true);
    setMessage({ text: '', variant: '' });

    try {
      // Resolve the actual media URL first — either an uploaded file's
      // Cloudinary URL, or the pasted URL, depending on the chosen source.
      let finalMediaUrl = contentType === 'text' ? '' : mediaUrl.trim();

      if (contentType === 'image' && imageSourceType === 'upload') {
        setUploadingAsset(true);
        finalMediaUrl = await api.uploadImage(imageFile);
      } else if (contentType === 'video' && videoSourceType === 'upload') {
        setUploadingAsset(true);
        finalMediaUrl = await api.uploadBroadcastVideo(videoFile);
      }
      setUploadingAsset(false);

      // 🔒 For a regular admin choosing Departmental, no departmentId is sent
      // at all — the backend always uses the authenticated admin's OWN
      // department for that role, never trusting a client-supplied one. Only
      // superadmin requests include an explicit departmentId.
      const payload = {
        title: title.trim(),
        content: content.trim(),
        contentType,
        mediaUrl: finalMediaUrl,
        isBreaking,
        scope,
        ...(scope === 'Departmental' && isSuperAdmin ? { departmentId: selectedDepartmentId } : {}),
      };

      await api.createNewsPost(payload);
      setMessage({ text: 'Broadcast published successfully!', variant: 'success' });
      setTitle('');
      setContent('');
      setMediaUrl('');
      setImageFile(null);
      setVideoFile(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      setIsBreaking(false);
      setContentType('text');
      setTimeout(() => setActiveTab('overview'), 1500);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to publish broadcast.', variant: 'danger' });
    } finally {
      setUploadingAsset(false);
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm animate-fade-in" style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <Card.Body className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <h4 className="fw-bold text-dark-title m-0">Publish Broadcast</h4>
          <Badge bg="secondary" className="d-flex align-items-center gap-1 font-monospace px-2 py-1" style={{ fontSize: '10px' }}>
            <Broadcast size={10} /> NEWS / BROADCAST
          </Badge>
        </div>
        <p className="text-muted small mb-4">Announce news, updates, or breaking alerts to your department or the whole platform.</p>

        {message.text && <Alert variant={message.variant} className="small fw-semibold">{message.text}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-dark">Broadcast Scope</Form.Label>
            <Form.Select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              disabled={loading}
              style={{ borderRadius: '6px', fontSize: '13.5px' }}
            >
              <option value="Global">Global — visible to everyone</option>
              <option value="Departmental">
                {isSuperAdmin ? 'Departmental — pick a department below' : 'Departmental — your department only'}
              </option>
            </Form.Select>
            <Form.Text className="text-muted" style={{ fontSize: '10px' }}>
              {isSuperAdmin
                ? 'As Superadmin, you may broadcast Globally or to any specific department.'
                : 'As a Department Admin, you may broadcast Globally or to your own department only.'}
            </Form.Text>
          </Form.Group>

          {/* Follow-up dropdown, superadmin-only — a regular admin's
              "Departmental" already implicitly means their own department
              (enforced server-side regardless), so they never see this. */}
          {scope === 'Departmental' && isSuperAdmin && (
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">Target Department</Form.Label>
              {fetchingDepts ? (
                <div className="small text-muted"><Spinner animation="border" size="sm" className="me-2" />Loading departments…</div>
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
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-muted">Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Platform Maintenance This Weekend"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              style={{ borderRadius: '6px', fontSize: '13.5px' }}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-muted">Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              placeholder="What do you want to announce?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              style={{ borderRadius: '6px', fontSize: '13px', lineHeight: '1.6' }}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-muted">Content Type</Form.Label>
            <Form.Select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              disabled={loading}
              style={{ borderRadius: '6px', fontSize: '13.5px' }}
            >
              <option value="text">Text / Article</option>
              <option value="image">Image Banner</option>
              <option value="video">Embedded Video</option>
            </Form.Select>
          </Form.Group>

          {contentType === 'image' && (
            <Form.Group className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <Form.Label className="small fw-semibold text-muted mb-0">Image</Form.Label>
                <ButtonGroup size="sm">
                  <Button
                    variant={imageSourceType === 'upload' ? 'dark' : 'outline-secondary'}
                    onClick={() => setImageSourceType('upload')}
                    disabled={loading}
                    style={{ fontSize: '11px' }}
                  >
                    Upload File
                  </Button>
                  <Button
                    variant={imageSourceType === 'url' ? 'dark' : 'outline-secondary'}
                    onClick={() => setImageSourceType('url')}
                    disabled={loading}
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
                  {uploadingAsset && contentType === 'image' && (
                    <div className="mt-2 small text-muted"><Spinner animation="border" size="sm" className="me-2" />Uploading image…</div>
                  )}
                </>
              ) : (
                <Form.Control
                  type="text"
                  placeholder="https://…/banner.jpg"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  disabled={loading}
                  style={{ borderRadius: '6px', fontSize: '13.5px' }}
                />
              )}
            </Form.Group>
          )}

          {contentType === 'video' && (
            <Form.Group className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <Form.Label className="small fw-semibold text-muted mb-0">Video</Form.Label>
                <ButtonGroup size="sm">
                  <Button
                    variant={videoSourceType === 'upload' ? 'dark' : 'outline-secondary'}
                    onClick={() => setVideoSourceType('upload')}
                    disabled={loading}
                    style={{ fontSize: '11px' }}
                  >
                    Upload File
                  </Button>
                  <Button
                    variant={videoSourceType === 'url' ? 'dark' : 'outline-secondary'}
                    onClick={() => setVideoSourceType('url')}
                    disabled={loading}
                    style={{ fontSize: '11px' }}
                  >
                    YouTube / URL
                  </Button>
                </ButtonGroup>
              </div>
              {videoSourceType === 'upload' ? (
                <>
                  <Form.Control
                    type="file"
                    accept="video/*"
                    ref={videoInputRef}
                    onChange={(e) => setVideoFile(e.target.files[0])}
                    disabled={loading}
                    style={{ borderRadius: '6px', fontSize: '13.5px' }}
                  />
                  {uploadingAsset && contentType === 'video' && (
                    <div className="mt-2 small text-muted"><Spinner animation="border" size="sm" className="me-2" />Uploading video…</div>
                  )}
                </>
              ) : (
                <Form.Control
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  disabled={loading}
                  style={{ borderRadius: '6px', fontSize: '13.5px' }}
                />
              )}
            </Form.Group>
          )}

          <Form.Group className="mb-4">
            <Form.Check
              type="switch"
              id="is-breaking-switch"
              label="Mark as Breaking News (glowing banner + scrolling ticker)"
              checked={isBreaking}
              onChange={(e) => setIsBreaking(e.target.checked)}
              disabled={loading}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2 border-top pt-3" style={{ borderColor: '#f1f5f9' }}>
            <Button variant="light" onClick={() => setActiveTab('overview')} disabled={loading} style={{ borderRadius: '6px', fontSize: '13.5px', fontWeight: '500' }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading} style={{ borderRadius: '6px', backgroundColor: '#0f256e', borderColor: '#0f256e', fontWeight: '600', fontSize: '13.5px', paddingLeft: '20px', paddingRight: '20px' }}>
              {loading ? <Spinner animation="border" size="sm" /> : <><SendCheckFill size={14} className="me-1.5" /> Publish Broadcast</>}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
