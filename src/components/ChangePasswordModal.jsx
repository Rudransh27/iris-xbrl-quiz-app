// src/components/ChangePasswordModal.jsx
import React, { useState } from "react";
import { PiLockKeyFill, PiX } from "react-icons/pi";
import api from "../admin/services/api";
import "./ChangePasswordModal.css";

export default function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(onClose, 1400);
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cpm-backdrop" onClick={onClose}>
      <div className="cpm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="cpm-header">
          <h3><PiLockKeyFill size={18} /> Change Password</h3>
          <button className="cpm-close" onClick={onClose} aria-label="Close"><PiX size={16} /></button>
        </div>

        {success ? (
          <p className="cpm-success">Password updated successfully.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="cpm-field">
              <span>Current Password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label className="cpm-field">
              <span>New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
            <label className="cpm-field">
              <span>Confirm New Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>

            {error && <p className="cpm-error">{error}</p>}

            <div className="cpm-actions">
              <button type="button" className="cpm-btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="cpm-btn-update" disabled={isSubmitting}>
                {isSubmitting ? "Updating…" : "Update"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
