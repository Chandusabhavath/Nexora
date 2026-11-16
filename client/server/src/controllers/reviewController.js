import { dataStore } from '../models/dataStore.js';

export const createReview = (req, res) => {
  try {
    const { bookingId, rating, comment, punctuality, quality, politeness } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID, rating (1-5), and comment are required.',
      });
    }

    const booking = dataStore.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found.' });
    }

    // Eligibility check 1: Only the customer who booked can review
    if (booking.customerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the customer who completed this booking is eligible to submit a review.',
      });
    }

    // Eligibility check 2: Booking must be in completed state
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted after a booking has been marked Completed.',
      });
    }

    // Eligibility check 3: No duplicate review
    const existing = dataStore.reviews.find((r) => r.bookingId.toString() === bookingId.toString());
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A review has already been submitted for this booking.',
      });
    }

    const review = dataStore.addReview({
      bookingId: booking._id,
      customerId: req.user.id,
      customer: dataStore.getUserById(req.user.id),
      providerId: booking.providerId,
      serviceId: booking.serviceId,
      rating: Math.max(1, Math.min(5, Number(rating))),
      comment: comment.trim(),
      metrics: {
        punctuality: Number(punctuality) || 5,
        quality: Number(quality) || 5,
        politeness: Number(politeness) || 5,
      },
      isModerated: false,
      isHidden: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Thank you for rating your experience!',
      review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit review.', error: error.message });
  }
};

export const getProviderReviews = (req, res) => {
  try {
    const reviews = dataStore.getReviewsByProvider(req.params.providerId);
    res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
};
