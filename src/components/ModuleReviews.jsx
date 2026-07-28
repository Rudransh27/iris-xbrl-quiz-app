// src/components/ModuleReviews.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Spinner, Form, Button, Alert } from 'react-bootstrap';
import StarRating from './StarRating';
import api from '../admin/services/api';
import './ModuleReviews.css';

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

export default function ModuleReviews({ moduleId }) {
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [myRating, setMyRating] = useState(0);
  const [myReviewText, setMyReviewText] = useState('');
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadReviews = useCallback(async () => {
    try {
      const res = await api.getModuleReviews(moduleId);
      if (res?.success) {
        setAvgRating(res.avgRating || 0);
        setTotalReviews(res.totalReviews || 0);
        setReviews(res.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load module reviews:', err.message);
    }
  }, [moduleId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadReviews();
      try {
        const mine = await api.getMyModuleReview(moduleId);
        if (!cancelled && mine?.success && mine.review) {
          setMyRating(mine.review.rating);
          setMyReviewText(mine.review.reviewText || '');
          setHasExistingReview(true);
        }
      } catch (err) {
        console.error('Failed to load your existing review:', err.message);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [moduleId, loadReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (myRating < 1) { setError('Please pick a star rating before submitting.'); return; }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.rateModule(moduleId, { rating: myRating, reviewText: myReviewText.trim() });
      setHasExistingReview(true);
      setSuccess(hasExistingReview ? 'Your review has been updated.' : 'Thanks for reviewing this module!');
      await loadReviews();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="module-reviews-section">
      <div className="module-reviews-header">
        <h3 className="module-reviews-title">Ratings &amp; Reviews</h3>
        <div className="module-reviews-aggregate">
          <StarRating value={avgRating} size={18} />
          <span className="module-reviews-avg-number">{avgRating.toFixed(1)}</span>
          <span className="module-reviews-count">({totalReviews} review{totalReviews === 1 ? '' : 's'})</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="module-reviews-form">
        <div className="mb-2">
          <span className="module-reviews-form-label">{hasExistingReview ? 'Update your review' : 'Rate this module'}</span>
        </div>
        <StarRating value={myRating} onChange={setMyRating} interactive size={24} />
        <Form.Control
          as="textarea"
          rows={2}
          placeholder="What did you think of this module? (optional)"
          value={myReviewText}
          onChange={(e) => setMyReviewText(e.target.value)}
          className="module-reviews-textarea mt-2"
        />
        {error && <Alert variant="danger" className="py-2 small mt-2 mb-0">{error}</Alert>}
        {success && <Alert variant="success" className="py-2 small mt-2 mb-0">{success}</Alert>}
        <Button type="submit" disabled={submitting} className="module-reviews-submit-btn mt-2">
          {submitting ? <Spinner animation="border" size="sm" /> : (hasExistingReview ? 'Update Review' : 'Submit Review')}
        </Button>
      </form>

      <div className="module-reviews-list">
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
        ) : reviews.length === 0 ? (
          <div className="module-reviews-empty">No reviews yet — be the first to share your thoughts.</div>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="module-review-card">
              <div className="module-review-card-header">
                <span className="module-review-author">{r.user?.username || 'Former member'}</span>
                <StarRating value={r.rating} size={13} />
                <span className="module-review-date">{timeAgo(r.createdAt)}</span>
              </div>
              {r.reviewText && <p className="module-review-text">{r.reviewText}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
