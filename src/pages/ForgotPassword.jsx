// src/pages/ForgotPassword.jsx

import React, { useState } from 'react';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../admin/services/api'; // Ensure this path is correct
import '../pages/Auth.css'; // Import the same CSS file

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Placeholder API call to your backend for sending the reset link
      const res = await api.forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setError(err.message || 'Failed to send password reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-main-content"> {/* This ensures centering */}
    <div className='auth-card-wrapper'>
      <Card className="auth-card"> {/* Use the consistent auth-card class */}
        <Card.Body>
          {/* You can add the logo here too if desired, using auth-logo-img class */}
          {/* <div className="text-center mb-3">
            <img src={irisLogo} alt="Iris Logo" className="auth-logo-img" />
          </div> */}

          <h2 className="text-center mb-2 fw-bold">Forgot Password</h2>
          <p className="text-center text-muted mb-4">
            Enter your email address to receive a password reset link.
          </p>
          {message && <Alert variant="success" className="auth-alert">{message}</Alert>}
          {error && <Alert variant="danger" className="auth-alert">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input" // Use consistent input class
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 auth-submit-button" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Send Reset Link'}
            </Button>
          </Form>
          <div className="w-100 text-center mt-3">
            <Link to="/login" className="text-muted text-decoration-none auth-link">
              Back to Sign In
            </Link>
          </div>
        </Card.Body>
      </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;