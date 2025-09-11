// src/pages/Auth.jsx

import React from 'react';
import AuthCard from '../components/auth/AuthCard';
import './Auth.css'; // Ensure this CSS file is correctly imported

const AuthPage = () => {
  return (
    // This div will act as the main content area, taking up space between navbar and footer.
    // Its CSS will center the AuthCard.
    <div className="auth-page-main-content">
      <div className="auth-card-wrapper"> {/* This wrapper helps center the card */}
        <AuthCard />
      </div>
    </div>
  );
};

export default AuthPage;