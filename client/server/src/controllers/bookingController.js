import { dataStore } from '../models/dataStore.js';
import { CommissionEngine } from '../services/commissionEngine.js';

export const createBooking = async (req, res) => {
  try {
    const { providerId, serviceId, taskDescription, scheduledDate, scheduledTime, durationHours, serviceLocation, paymentMethod } = req.body;

    if (!providerId || !serviceId || !taskDescription || !scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking parameters (provider, service, task, date, time).',
      });
    }

    const provider = dataStore.getProviderById(providerId);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }

    const service = dataStore.getServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // Availability & Conflict Check
    const existingBookings = dataStore.getBookings({ providerId: provider._id });
    const hasConflict = existingBookings.some(
      (b) =>
        b.scheduledDate === scheduledDate &&
        b.scheduledTime === scheduledTime &&
        ['pending', 'accepted', 'in_progress'].includes(b.status)
    );

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: `Provider already has a scheduled appointment on ${scheduledDate} at ${scheduledTime}. Please choose an alternate slot.`,
      });
    }

    // Dynamic Price & Commission Snapshot
    const estHours = Number(durationHours) || (service.priceType === 'hourly' ? 2 : 1);
    const subtotal = service.priceType === 'hourly' ? service.price * estHours : service.price;

    const commission = CommissionEngine.calculate({
      grossAmount: subtotal,
      category: provider.category,
      providerId: provider._id,
    });

    const totalAmount = subtotal + commission.commissionAmount;

    const customerUser = dataStore.getUserById(req.user.id);

    const booking = dataStore.addBooking({
      customerId: req.user.id,
      customer: customerUser,
      providerId: provider._id,
      provider,
      serviceId: service._id,
      service,
      taskDescription: taskDescription.trim(),
      scheduledDate,
      scheduledTime,
      durationHours: estHours,
      serviceLocation: serviceLocation || customerUser.address,
      agreedPriceSnapshot: {
        baseRate: service.price,
        priceType: service.priceType,
        estimatedDurationHours: estHours,
        subtotal,
        platformFee: commission.commissionAmount,
        commissionRate: commission.commissionRate,
        providerShare: commission.providerAmount,
        totalAmount,
      },
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          changedBy: req.user.id,
          note: 'Booking requested by customer.',
        },
      ],
      paymentMethod: paymentMethod || 'online_qr',
      paymentStatus: 'pending',
      payoutStatus: 'unallocated',
      hasReview: false,
    });

    // Notify Provider
    dataStore.addNotification({
      userId: provider.userId,
      title: 'New Booking Request',
      message: `You have received a new booking request for ${service.title} on ${scheduledDate} at ${scheduledTime}. Total: ₹${totalAmount}`,
      type: 'booking',
      link: `/provider/dashboard`,
    });

    res.status(201).json({
      success: true,
      message: 'Booking request sent to provider successfully.',
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create booking.', error: error.message });
  }
};

export const getBookings = (req, res) => {
  try {
    const { status } = req.query;
    let filters = { status };

    if (req.user.role === 'customer') {
      filters.customerId = req.user.id;
    } else if (req.user.role === 'provider') {
      const provider = dataStore.getProviderByUserId(req.user.id);
      if (!provider) {
        return res.json({ success: true, count: 0, bookings: [] });
      }
      filters.providerId = provider._id;
    }

    const bookings = dataStore.getBookings(filters);

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
};

export const getBookingById = (req, res) => {
  try {
    const booking = dataStore.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isCustomer = booking.customerId.toString() === req.user.id.toString();
    const isProvider = booking.provider?.userId?.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access to this booking is unauthorized.' });
    }

    const conversation = dataStore.getConversationByBooking(booking._id);
    const reviews = dataStore.reviews.find((r) => r.bookingId.toString() === booking._id.toString());
    const payment = dataStore.payments.find((p) => p.bookingId.toString() === booking._id.toString());

    res.json({
      success: true,
      booking,
      conversation,
      review: reviews || null,
      payment: payment || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking details.' });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status, note, cancellationReason } = req.body;
    const booking = dataStore.getBookingById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const validTransitions = ['accepted', 'in_progress', 'completed', 'rejected', 'cancelled'];
    if (!validTransitions.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status transition: ${status}` });
    }

    const isCustomer = booking.customerId.toString() === req.user.id.toString();
    const isProvider = booking.provider?.userId?.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    // Provider actions
    if (['accepted', 'rejected', 'in_progress'].includes(status) && !isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the assigned provider can perform this status update.' });
    }

    // Customer cancellation
    if (status === 'cancelled' && !isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized cancellation request.' });
    }

    const updates = {
      status,
      statusHistory: [
        ...booking.statusHistory,
        {
          status,
          timestamp: new Date().toISOString(),
          changedBy: req.user.id,
          note: note || `Status updated to ${status}.`,
        },
      ],
    };

    if (status === 'cancelled') {
      updates.cancellationReason = cancellationReason || 'Cancelled by user.';
      updates.cancelledBy = req.user.id;

      // MODULE 8: If booking was paid online, initiate refund
      if (booking.paymentStatus === 'paid') {
        try {
          await dataStore.processRefund({
            bookingId: booking._id,
            reason: cancellationReason || 'Booking cancelled',
            adminId: req.user.id,
          });
          updates.paymentStatus = 'refunded';
        } catch (rfErr) {
          console.error('[Refund Error]', rfErr);
        }
      }
    }

    // MODULE 5: If marked completed, release provider share from pending escrow to availableBalance
    if (status === 'completed' && booking.status !== 'completed') {
      dataStore.releaseJobEscrowToAvailableBalance(booking._id);
      updates.payoutStatus = 'pending'; // ready for payout transfer

      // Update provider completed count
      const prov = dataStore.getProviderById(booking.providerId);
      if (prov) {
        prov.completedBookingsCount = (prov.completedBookingsCount || 0) + 1;
      }
    }

    const updated = dataStore.updateBooking(booking._id, updates);

    // Notify other party
    const targetUserId = isCustomer ? booking.provider?.userId : booking.customerId;
    if (targetUserId) {
      dataStore.addNotification({
        userId: targetUserId,
        title: `Booking ${status.toUpperCase()}`,
        message: `Booking #${booking.bookingReference} status changed to ${status}.`,
        type: 'booking',
        link: `/bookings/${booking._id}`,
      });
    }

    res.json({
      success: true,
      message: `Booking status updated to ${status}.`,
      booking: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
};

export const reportPayment = (req, res) => {
  try {
    const { amount, paymentMethod, upiTransactionId, note } = req.body;
    const booking = dataStore.getBookingById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isProvider = booking.provider?.userId?.toString() === req.user.id.toString();
    if (!isProvider && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the provider can report payment receipt.' });
    }

    const updates = {
      paymentStatus: 'provider_reported',
      paymentMethod: paymentMethod || booking.paymentMethod,
      paymentDetails: {
        reportedAt: new Date().toISOString(),
        reportedAmount: Number(amount) || booking.agreedPriceSnapshot.totalAmount,
        upiTransactionId: upiTransactionId || '',
        note: note || 'Provider recorded payment collection.',
      },
    };

    const updated = dataStore.updateBooking(booking._id, updates);

    // Notify Customer to confirm
    dataStore.addNotification({
      userId: booking.customerId,
      title: 'Payment Reported',
      message: `Provider reported receipt of ₹${updates.paymentDetails.reportedAmount} via ${updates.paymentMethod.toUpperCase()}. Please confirm receipt on your dashboard.`,
      type: 'payment',
      link: `/bookings/${booking._id}`,
    });

    res.json({
      success: true,
      message: 'Payment report logged. Awaiting customer confirmation.',
      booking: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record payment.' });
  }
};

export const confirmPayment = (req, res) => {
  try {
    const booking = dataStore.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isCustomer = booking.customerId.toString() === req.user.id.toString();
    if (!isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only customer can confirm payment receipt.' });
    }

    const updates = {
      paymentStatus: 'customer_confirmed',
      paymentDetails: {
        ...(booking.paymentDetails || {}),
        confirmedAt: new Date().toISOString(),
      },
    };

    const updated = dataStore.updateBooking(booking._id, updates);

    res.json({
      success: true,
      message: 'Payment confirmed successfully by customer.',
      booking: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to confirm payment.' });
  }
};
