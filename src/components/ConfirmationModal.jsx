// src/components/ConfirmationModal.jsx
import React, { useState, useEffect } from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmButtonText = "Confirm", 
  variant = "primary", // primary, danger
  requireTextVerification = false 
}) => {
  const [verificationInput, setVerificationInput] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setVerificationInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isButtonDisabled = requireTextVerification && verificationInput.trim() !== "DELETE";

  return (
    <div className="duo-modal-overlay" onClick={onClose}>
      <div className="duo-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="duo-card-shine"></div>
        
        {/* ================= MODAL HEADER ================= */}
        <div className="duo-modal-header">
          <h3 className={`duo-modal-title ${variant === 'danger' ? 'text-danger-title' : ''}`}>
            {title}
          </h3>
          {/* ⚡ FIXED: Added explicit e.stopPropagation() to cut off structural click bubbling loops */}
          <button 
            type="button" 
            className="duo-modal-close-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        
        {/* ================= MODAL BODY ================= */}
        <div className="duo-modal-body">
          <p className="duo-modal-text">{message}</p>
          
          {/* 🎯 VERIFICATION LAYER CHECK ENGINE */}
          {requireTextVerification && (
            <div className="duo-modal-verification-wrapper">
              <label className="duo-verification-label">
                Type <span className="destructive-token">DELETE</span> to confirm permanent destructive actions:
              </label>
              <input 
                type="text" 
                className="duo-verification-input"
                placeholder="Type DELETE in capital letters"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>
        
        {/* ================= MODAL FOOTER CHUNKY ACTION ROW ================= */}
        <div className="duo-modal-footer">
          <button type="button" className="duo-modal-btn duo-modal-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="button"
            className={`duo-modal-btn duo-modal-btn-confirm ${variant === 'danger' ? 'btn-danger-fill' : 'btn-primary-fill'}`} 
            onClick={onConfirm}
            disabled={isButtonDisabled}
            style={{
              opacity: isButtonDisabled ? 0.4 : 1,
              cursor: isButtonDisabled ? 'not-allowed' : 'pointer'
            }}
          >
            {confirmButtonText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmationModal;