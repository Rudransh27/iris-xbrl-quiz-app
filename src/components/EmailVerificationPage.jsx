// src/pages/EmailVerificationPage.jsx
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spinner, Card, Alert } from 'react-bootstrap';
import { ShieldCheck, ExclamationTriangle, CheckCircleFill } from 'react-bootstrap-icons';
import irisLogo from '../assets/irislogo.svg';
import '../pages/Auth.css'; // Synced perfectly to global authentication theme

// ⚠️ API configuration bounds preserved
const API_BASE_URL = 'http://localhost:5000/api/auth'; 

const EmailVerificationPage = () => {
    const { token } = useParams();
    
    const [verificationStatus, setVerificationStatus] = useState('Verifying your verification token...');
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (!token) {
            setVerificationStatus('Verification link token not found. Please return to the registration screen.');
            setLoading(false);
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/verify-email/${token}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setVerificationStatus('Success! Your corporate email address has been verified. Workspace activation complete.');
                    setSuccess(true);
                } else {
                    const errorMessage = data.message || 'Verification failed. The execution link may have expired.';
                    setVerificationStatus(`${errorMessage}`);
                    setSuccess(false);
                }

            } catch (error) {
                console.error("Network or parsing error data streams:", error);
                setVerificationStatus('Network context error: Server cluster unreachable. Check routing paths.');
                setSuccess(false);
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="auth-page-main-content"> {/* Centers everything on the bright background canvas floor */}
            <div className="insta-style-wrapper"> {/* Keeps exactly 350px width constraints mapping */}
                
                {/* 📦 TOP BOX: SECURE NODE VERIFICATION FRAME */}
                <Card className="auth-card border-0">
                  <Card.Body className="d-flex flex-column align-items-center">
                    
                    {/* Clean Corporate Brand Logo */}
                    <div className="text-center mb-1">
                      <img src={irisLogo} alt="Iris Logo" className="auth-logo-img" />
                    </div>

                    <h1 className="text-center mb-3 fs-4 fw-bold text-dark">Email Activation</h1>

                    {/* Dynamic Graphic Status Node Indicator */}
                    <div className="my-3 text-center">
                        {loading && <Spinner animation="border" style={{ color: '#0f256e' }} />}
                        {!loading && success && <CheckCircleFill size={44} className="text-success" />}
                        {!loading && !success && <ExclamationTriangle size={44} className="text-danger" />}
                    </div>

                    {/* Dynamic State Alert Text Stream */}
                    <div className="w-100 mt-2">
                        {loading && (
                            <Alert variant="info" className="auth-alert-compact text-center">
                                {verificationStatus}
                            </Alert>
                        )}
                        {!loading && success && (
                            <Alert variant="success" className="auth-alert-compact text-center mb-4">
                                {verificationStatus}
                            </Alert>
                        )}
                        {!loading && !success && (
                            <Alert variant="danger" className="auth-alert-compact text-center mb-4">
                                {verificationStatus}
                            </Alert>
                        )}
                    </div>

                    {/* Primary Redirect Switch Action Button Block */}
                    {!loading && success && (
                        <Link 
                            to="/login" 
                            className="btn btn-primary w-100 text-decoration-none d-flex align-items-center justify-content-center fw-bold"
                            style={{ height: '36px' }}
                        >
                            Continue to Log In
                        </Link>
                    )}

                    {!loading && !success && (
                        <p className="text-center text-muted m-0 mt-2" style={{ fontSize: '13px', lineSpacing: '1.4' }}>
                            Please request a new validation link node or complete registration configurations again.
                        </p>
                    )}

                  </Card.Body>
                </Card>

                {/* 📦 BOTTOM SEPARATED BOX: TWIN ACTION SLAT */}
                <div className="auth-isolated-switch-box text-center p-3">
                  <span className="auth-switch-card-text">
                    Need help?{" "}
                    <Link to="/register" className="auth-switch-trigger-btn text-decoration-none">
                      Return to Sign Up
                    </Link>
                  </span>
                </div>

            </div>
        </div>
    );
};

export default EmailVerificationPage;