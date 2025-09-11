// src/admin/components/ModuleModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Card } from 'react-bootstrap';
import api from '../services/api';
import { FaSave, FaTimes, FaUpload } from 'react-icons/fa';

const ModuleModal = ({ show, handleClose, module, fetchModules }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description);
      setDepartment(module.department);
      setImageUrl(module.imageUrl);
      setImageFile(null);
    } else {
      setTitle('');
      setDescription('');
      setDepartment('');
      setImageUrl('');
      setImageFile(null);
    }
    setError('');
  }, [module]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        setUploading(true);
        try {
          finalImageUrl = await api.uploadImage(imageFile);
          setImageUrl(finalImageUrl);
        } catch (uploadError) {
          setError('Failed to upload image. Please try again.');
          console.error("Image upload error:", uploadError);
          setLoading(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      const moduleData = {
        title,
        description,
        department,
        imageUrl: finalImageUrl
      };

      if (module) {
        await api.updateModule(module._id, moduleData);
      } else {
        await api.createModule(moduleData);
      }

      fetchModules();
      handleClose();
    } catch (apiError) {
      setError(`Failed to ${module ? 'save changes to' : 'create'} module: ${apiError.message}`);
      console.error("API error:", apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="bg-primary text-white border-0">
        <Modal.Title>{module ? 'Edit Module' : 'Create Module'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {error && <Alert variant="danger" className="text-center">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Title</Form.Label>
            <Form.Control type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Description</Form.Label>
            <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Department</Form.Label>
            <Form.Select value={department} onChange={(e) => setDepartment(e.target.value)} required>
              <option value="">Select Department</option>
              <option value="ifile">ifile</option>
              <option value="ideal">ideal</option>
              <option value="carbon">carbon</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Module Image</Form.Label>
            <div className="input-group">
                <Form.Control type="file" onChange={handleFileChange} className="form-control" />
            </div>
            {imageUrl && !imageFile && (
              <Card className="mt-3 p-2">
                <p className="mb-1">Current Image:</p>
                <img src={imageUrl} alt="Current Module" className="img-thumbnail" style={{ maxWidth: '100px', height: 'auto' }} />
              </Card>
            )}
            {imageFile && (
                <Alert variant="info" className="mt-3 mb-0">
                    <FaUpload className="me-2" />
                    New image selected: {imageFile.name}
                </Alert>
            )}
            {uploading && (
                <div className="mt-3 d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Uploading...</span>
                </div>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={handleClose} disabled={loading || uploading}>
            <FaTimes className="me-1" /> Close
          </Button>
          <Button variant="primary" type="submit" disabled={loading || uploading}>
            {loading ? <Spinner animation="border" size="sm" /> : <FaSave className="me-1" />} {module ? 'Save Changes' : 'Create Module'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ModuleModal;