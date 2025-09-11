// src/pages/ResetPassword.jsx

import React, { useState } from 'react';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../admin/services/api'; // Ensure this path is correct
import '../pages/Auth.css'; // Import the same CSS file

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { token } = useParams(); // Get the token from the URL
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Placeholder API call to your backend
      const res = await api.resetPassword(token, newPassword);
      setMessage(res.message);
      // Navigate to login page after a short delay
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-main-content"> {/* This ensures centering */}
      <Card className="auth-card"> {/* Use the consistent auth-card class */}
        <Card.Body>
          {/* You can add the logo here too if desired */}
          {/* <div className="text-center mb-3">
            <img src={irisLogo} alt="Iris Logo" className="auth-logo-img" />
          </div> */}
          
          <h2 className="text-center mb-2 fw-bold">Reset Password</h2>
          <p className="text-center text-muted mb-4">
            Enter your new password below.
          </p>
          {message && <Alert variant="success" className="auth-alert">{message}</Alert>}
          {error && <Alert variant="danger" className="auth-alert">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="auth-input" // Use consistent input class
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Control
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input" // Use consistent input class
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 auth-submit-button" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Reset Password'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ResetPassword;