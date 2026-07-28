// src/admin/components/ModuleReviewsModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import StarRating from '../../components/StarRating';
import api from '../services/api';

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

// Read-only review listing for admins/superadmins — reuses the exact same
// GET /:id/reviews endpoint (and its access gate) that the learner-facing
// ModuleReviews.jsx calls, so a Department Admin only ever sees reviews for
// modules already visible to them; no separate frontend scoping needed.
export default function ModuleReviewsModal({ moduleId, moduleTitle, show, onHide }) {
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show || !moduleId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    api.getModuleReviews(moduleId)
      .then((res) => {
        if (cancelled) return;
        if (res?.success) {
          setAvgRating(res.avgRating || 0);
          setTotalReviews(res.totalReviews || 0);
          setReviews(res.reviews || []);
        }
      })
      .catch((err) => !cancelled && setError(err.message || 'Failed to load reviews.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [show, moduleId]);

  return (
    <Modal show={show} onHide={onHide} centered scrollable>
      <Modal.Header closeButton className="admin-flat-modal-header">
        <Modal.Title style={{ fontSize: 16 }}>
          Reviews — {moduleTitle}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
        ) : error ? (
          <div className="text-danger small">{error}</div>
        ) : (
          <>
            <div className="d-flex align-items-center gap-2 mb-3 pb-3" style={{ borderBottom: '1px solid var(--orbit-border)' }}>
              <StarRating value={avgRating} size={18} />
              <strong style={{ color: 'var(--orbit-text-heading)' }}>{avgRating.toFixed(1)}</strong>
              <span className="small" style={{ color: 'var(--orbit-text-muted)' }}>({totalReviews} review{totalReviews === 1 ? '' : 's'})</span>
            </div>
            {reviews.length === 0 ? (
              <div className="small text-center py-4" style={{ color: 'var(--orbit-text-muted)' }}>No reviews yet for this module.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reviews.map((r) => (
                  <div key={r._id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--orbit-border)' }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <strong className="small" style={{ color: 'var(--orbit-text-heading)' }}>{r.user?.username || 'Former member'}</strong>
                      <StarRating value={r.rating} size={12} />
                      <span className="small ms-auto" style={{ color: 'var(--orbit-text-muted)' }}>{timeAgo(r.createdAt)}</span>
                    </div>
                    {r.reviewText && <p className="small mb-0" style={{ color: 'var(--orbit-text-body)' }}>{r.reviewText}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
