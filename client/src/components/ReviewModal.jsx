import React, { useState } from 'react';
import { apiCreateReview } from '../api/client.js';
import { Star, X, CheckCircle } from 'lucide-react';

export const ReviewModal = ({ isOpen, onClose, booking, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [quality, setQuality] = useState(5);
  const [politeness, setPoliteness] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 10) {
      setError('Please provide at least 10 characters in your review feedback.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiCreateReview({
        bookingId: booking._id,
        rating,
        punctuality,
        quality,
        politeness,
        comment: comment.trim(),
      });

      if (res.success) {
        setSuccess(true);
        if (onReviewSubmitted) onReviewSubmitted();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(res.message || 'Failed to submit review.');
      }
    } catch (err) {
      setError(err.message || 'Review submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-surface-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-forest-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-300 hover:text-white p-1 rounded-full hover:bg-forest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            Verified Customer Review
          </span>
          <h3 className="text-base font-bold truncate">{booking.service?.title}</h3>
          <p className="text-xs text-forest-200">
            Booking #{booking.bookingReference} • Completed
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-gray-900">Review Published!</h4>
              <p className="text-xs text-gray-500">Thank you for helping the NEXORA community maintain high quality standards.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Overall Star Rating */}
              <div className="text-center pb-2">
                <span className="block text-xs font-bold uppercase text-gray-600 mb-2">Overall Experience</span>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating ? 'fill-amber-400 text-amber-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-800 mt-1 block">
                  {rating === 5 ? '5.0 - Exceptional' : rating === 4 ? '4.0 - Very Good' : rating === 3 ? '3.0 - Average' : 'Needs Improvement'}
                </span>
              </div>

              {/* Sub-metrics */}
              <div className="grid grid-cols-3 gap-2 bg-surface-50 p-3 rounded-xl border border-surface-200 text-center">
                <div>
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">Punctuality</span>
                  <select
                    value={punctuality}
                    onChange={(e) => setPunctuality(Number(e.target.value))}
                    className="mt-1 text-xs p-1 rounded border border-gray-200 bg-white"
                  >
                    {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s}★</option>)}
                  </select>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">Work Quality</span>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="mt-1 text-xs p-1 rounded border border-gray-200 bg-white"
                  >
                    {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s}★</option>)}
                  </select>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">Politeness</span>
                  <select
                    value={politeness}
                    onChange={(e) => setPoliteness(Number(e.target.value))}
                    className="mt-1 text-xs p-1 rounded border border-gray-200 bg-white"
                  >
                    {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s}★</option>)}
                  </select>
                </div>
              </div>

              {/* Written Feedback */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Written Feedback *
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about punctuality, equipment used, problem resolution, and fairness of charges..."
                  className="w-full text-xs p-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {loading ? 'Submitting review...' : 'Submit Verified Review'}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
