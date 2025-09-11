// src/admin/components/CardModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../services/api';
// Import toast and the CSS for react-toastify
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CardModal = ({ show, handleClose, card, topicId, fetchModules }) => {
  const [cardType, setCardType] = useState('knowledge');
  const [cardOrder, setCardOrder] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [content, setContent] = useState({ title: '', body: '', question: '', options: ['', '', '', ''], answer: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Removed the local 'error' state as we'll use toast for errors

  useEffect(() => {
    if (card) {
      setCardType(card.card_type);
      setCardOrder(card.cardOrder);
      setImageUrl(card.imageUrl || '');
      setContent(card.content);
      setImageFile(null); // Reset file input
    } else {
      setCardType('knowledge');
      setCardOrder('');
      setImageUrl('');
      setImageFile(null);
      setContent({ title: '', body: '', question: '', options: ['', '', '', ''], answer: '' });
    }
    // Removed setError('') as it's no longer needed here
  }, [card]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...content.options];
    newOptions[index] = value;
    setContent({ ...content, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Removed setError('')

    try {
      let finalImageUrl = imageUrl;

      // If a new image file is selected, upload it first
      if (imageFile) {
        setUploading(true);
        try {
          finalImageUrl = await api.uploadImage(imageFile);
          setImageUrl(finalImageUrl);
          // Display success toast for image upload
          toast.success('Image uploaded successfully!');
        } catch (uploadError) {
          // Use toast.error for API errors
          toast.error('Failed to upload image. Please try again.');
          console.error("Image upload error:", uploadError);
          setLoading(false);
          setUploading(false);
          return; // Stop execution if image upload fails
        } finally {
          setUploading(false);
        }
      }

      const cardData = {
        card_type: cardType,
        cardOrder: parseInt(cardOrder),
        imageUrl: finalImageUrl,
        content,
        topic_id: topicId,
      };

      if (card) {
        await api.updateCard(card._id, cardData);
        // Success toast for update
        toast.success('Card updated successfully!');
      } else {
        await api.createCard(topicId, cardData);
        // Success toast for creation
        toast.success('Card created successfully!');
      }

      fetchModules();
      handleClose();
    } catch (apiError) {
      // Use toast.error for API errors
      const errorMessage = apiError.message || 'An unknown error occurred.';
      toast.error(`Failed to ${card ? 'save changes to' : 'create'} card: ${errorMessage}`);
      console.error("API error:", apiError);
    } finally {
      setLoading(false);
    }
  };

  const renderCardContentForm = () => {
    switch (cardType) {
      case 'knowledge':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control type="text" value={content.title} onChange={(e) => setContent({ ...content, title: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Body</Form.Label>
              <Form.Control as="textarea" rows={5} value={content.body} onChange={(e) => setContent({ ...content, body: e.target.value })} required />
            </Form.Group>
          </>
        );
      case 'quiz':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Question</Form.Label>
              <Form.Control type="text" value={content.question} onChange={(e) => setContent({ ...content, question: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Options</Form.Label>
              {content.options.map((option, index) => (
                <Form.Control
                  key={index}
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="mb-2"
                  required
                />
              ))}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Correct Answer</Form.Label>
              <Form.Control type="number" min="0" max="3" value={content.answer} onChange={(e) => setContent({ ...content, answer: e.target.value })} required />
              <Form.Text className="text-muted">
                Enter the index of the correct option (0, 1, 2, or 3).
              </Form.Text>
            </Form.Group>
          </>
        );
      case 'code':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Question</Form.Label>
              <Form.Control type="text" value={content.question} onChange={(e) => setContent({ ...content, question: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Starter Code</Form.Label>
              <Form.Control as="textarea" rows={5} value={content.starterCode} onChange={(e) => setContent({ ...content, starterCode: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Solution Code</Form.Label>
              <Form.Control as="textarea" rows={5} value={content.solutionCode} onChange={(e) => setContent({ ...content, solutionCode: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Validator Code</Form.Label>
              <Form.Control as="textarea" rows={5} value={content.validatorCode} onChange={(e) => setContent({ ...content, validatorCode: e.target.value })} required />
            </Form.Group>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{card ? 'Edit Card' : 'Create Card'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Removed the Alert component since we're using toast */}
          
          <Form.Group className="mb-3">
            <Form.Label>Card Type</Form.Label>
            <Form.Select
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              disabled={!!card} // Disable if editing an existing card
            >
              <option value="knowledge">Knowledge</option>
              <option value="quiz">Quiz</option>
              <option value="code">Code</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Card Order</Form.Label>
            <Form.Control type="number" value={cardOrder} onChange={(e) => setCardOrder(e.target.value)} required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Card Image</Form.Label>
            <Form.Control type="file" onChange={handleFileChange} />
            {imageUrl && !imageFile && (
              <div className="mt-2">
                <p>Current Image:</p>
                <img src={imageUrl} alt="Current Card" style={{ maxWidth: '100px', height: 'auto' }} />
              </div>
            )}
            {imageFile && (
                <div className="mt-2">
                    <p>New image selected: {imageFile.name}</p>
                </div>
            )}
            {uploading && (
                <div className="mt-2 d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Uploading...</span>
                </div>
            )}
          </Form.Group>

          {renderCardContentForm()}

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading || uploading}>
            Close
          </Button>
          <Button variant="primary" type="submit" disabled={loading || uploading}>
            {loading ? <Spinner animation="border" size="sm" /> : (card ? 'Save Changes' : 'Create Card')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CardModal;