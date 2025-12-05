import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// ⚠️ IMPORTANT: Set your backend API base URL
const API_BASE_URL = 'http://localhost:5000/api/auth'; 

const EmailVerificationPage = () => {
    // 1. Get the token from the URL
    const { token } = useParams();
    
    const [verificationStatus, setVerificationStatus] = useState('Verifying...');
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setVerificationStatus('Error: Verification token not found.');
            setLoading(false);
            return;
        }

        const verifyEmail = async () => {
            try {
                // 2. Call the backend API using the token with fetch()
                const response = await fetch(`${API_BASE_URL}/verify-email/${token}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setVerificationStatus('✅ Success! Your email has been verified. You can now log in.');
                    setSuccess(true);
                } else {
                    // Handle server errors (e.g., 400 for expired token)
                    const errorMessage = data.message || 'Verification failed. Invalid response from server.';
                    setVerificationStatus(`❌ ${errorMessage}`);
                    setSuccess(false);
                }

            } catch (error) {
                // Handle network errors
                console.error("Network or parsing error:", error);
                setVerificationStatus(`❌ Network error: Could not reach the server.`);
                setSuccess(false);
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, [token]);

    const getStatusStyle = () => {
        if (loading) return 'text-blue-500';
        if (success) return 'text-green-600';
        return 'text-red-600';
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-xl rounded-lg text-center max-w-md w-full">
                <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
                
                <p className={`text-lg font-semibold ${getStatusStyle()} mb-6`}>
                    {verificationStatus}
                </p>

                {loading && (
                    <div className="loader border-t-4 border-blue-500 rounded-full w-10 h-10 animate-spin mx-auto mb-6"></div>
                )}

                {!loading && success && (
                    <Link 
                        to="/login" 
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300"
                    >
                        Go to Login
                    </Link>
                )}
                
                {!loading && !success && (
                    <p className="text-gray-500 mt-4">
                        Please re-register or request a new verification link.
                    </p>
                )}
            </div>
        </div>
    );
};

export default EmailVerificationPage;