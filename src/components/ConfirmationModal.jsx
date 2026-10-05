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
    <div className="ui-modal-overlay confirm-overlay" onClick={onClose}>
      <div className="ui-modal confirm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {/* ================= MODAL HEADER ================= */}
        <div className="ui-modal__head">
          <h3 className={`ui-h3 ${variant === 'danger' ? 'confirm-title--danger' : ''}`}>
            {title}
          </h3>
          {/* ⚡ FIXED: Added explicit e.stopPropagation() to cut off structural click bubbling loops */}
          <button
            type="button"
            className="ui-btn ui-btn--ghost ui-btn--sm ui-btn--icon"
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
        <div className="ui-modal__body confirm-body">
          <p className="confirm-text">{message}</p>

          {/* 🎯 VERIFICATION LAYER CHECK ENGINE */}
          {requireTextVerification && (
            <div className="ui-field confirm-verify">
              <label className="ui-label">
                Type <span className="confirm-token">DELETE</span> to confirm permanent destructive actions:
              </label>
              <input
                type="text"
                className="ui-input"
                placeholder="Type DELETE in capital letters"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ACTION ROW ================= */}
        <div className="ui-modal__foot">
          <button type="button" className="ui-btn ui-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`ui-btn ${variant === 'danger' ? 'ui-btn--danger' : 'ui-btn--primary'}`}
            onClick={onConfirm}
            disabled={isButtonDisabled}
          >
            {confirmButtonText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmationModal;