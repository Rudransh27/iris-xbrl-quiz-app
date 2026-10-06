// src/components/AccountSecurityModal.jsx
// "Change password" dialog. The fields are uncontrolled: their values are
// read from the form only on submit and never held in React state.
import React, { useState } from "react";
import { PiLockKeyFill, PiX } from "react-icons/pi";
import api from "../admin/services/api";
import "./AccountSecurityModal.css";

const MIN_LENGTH = 6;

export default function AccountSecurityModal({ onClose }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fields = new FormData(form);
    const current = fields.get("current") || "";
    const next = fields.get("next") || "";

    if (next.length < MIN_LENGTH) {
      setError(`New password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (next !== fields.get("confirm")) {
      setError("New password and confirmation don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.changePassword(current, next);
      form.reset();
      setSuccess(true);
      setTimeout(onClose, 1400);
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ui-modal-overlay cpm-backdrop" onClick={onClose}>
      <div className="ui-modal cpm-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="ui-modal__head">
          <h3 className="ui-h3 cpm-title"><PiLockKeyFill size={18} /> Change Password</h3>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm ui-btn--icon" onClick={onClose} aria-label="Close"><PiX size={16} /></button>
        </div>

        {success ? (
          <div className="ui-modal__body">
            <p className="ui-callout ui-callout--success cpm-success">Password updated successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="cpm-form">
            <div className="ui-modal__body cpm-body">
              <label className="ui-field">
                <span className="ui-label">Current Password</span>
                <input type="password" name="current" className="ui-input" autoComplete="current-password" required autoFocus />
              </label>
              <label className="ui-field">
                <span className="ui-label">New Password</span>
                <input type="password" name="next" className="ui-input" autoComplete="new-password" required minLength={MIN_LENGTH} />
              </label>
              <label className="ui-field">
                <span className="ui-label">Confirm New Password</span>
                <input type="password" name="confirm" className="ui-input" autoComplete="new-password" required minLength={MIN_LENGTH} />
              </label>

              {error && <p className="ui-callout ui-callout--danger cpm-error">{error}</p>}
            </div>

            <div className="ui-modal__foot cpm-actions">
              <button type="button" className="ui-btn ui-btn--secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="ui-btn ui-btn--primary" disabled={isSubmitting}>
                {isSubmitting ? "Updating…" : "Update"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
