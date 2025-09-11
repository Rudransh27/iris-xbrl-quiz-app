// src/admin/components/TopicModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Card } from 'react-bootstrap';
import api from '../services/api';
import { FaSave, FaTimes, FaUpload } from 'react-icons/fa';

const TopicModal = ({ show, handleClose, topic, moduleId, fetchModules }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [topicOrder, setTopicOrder] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (topic) {
      setTitle(topic.title);
      setDescription(topic.description);
      setImageUrl(topic.imageUrl);
      setTopicOrder(topic.topicOrder);
      setImageFile(null);
    } else {
      setTitle('');
      setDescription('');
      setImageUrl('');
      setTopicOrder('');
      setImageFile(null);
    }
    setError('');
  }, [topic]);

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
      
      const topicData = { 
        title, 
        description, 
        imageUrl: finalImageUrl,
        topicOrder: parseInt(topicOrder),
        module_id: moduleId
      };
      
      if (topic) {
        await api.updateTopic(topic._id, topicData);
      } else {
        await api.createTopic(topicData);
      }
      
      fetchModules();
      handleClose();
    } catch (apiError) {
      setError(`Failed to ${topic ? 'save changes to' : 'create'} topic: ${apiError.message}`);
      console.error("API error:", apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="bg-primary text-white border-0">
        <Modal.Title>{topic ? 'Edit Topic' : 'Create Topic'}</Modal.Title>
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
            <Form.Label className="fw-bold">Topic Image</Form.Label>
            <div className="input-group">
                <Form.Control type="file" onChange={handleFileChange} className="form-control" />
            </div>
            {imageUrl && !imageFile && (
              <Card className="mt-3 p-2">
                <p className="mb-1">Current Image:</p>
                <img src={imageUrl} alt="Current Topic" className="img-thumbnail" style={{ maxWidth: '100px', height: 'auto' }} />
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
          
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Order</Form.Label>
            <Form.Control type="number" value={topicOrder} onChange={(e) => setTopicOrder(e.target.value)} required />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={handleClose} disabled={loading || uploading}>
            <FaTimes className="me-1" /> Close
          </Button>
          <Button variant="primary" type="submit" disabled={loading || uploading}>
            {loading ? <Spinner animation="border" size="sm" /> : <FaSave className="me-1" />} {topic ? 'Save Changes' : 'Create Topic'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TopicModal;