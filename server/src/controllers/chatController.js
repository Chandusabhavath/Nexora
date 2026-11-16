import { dataStore } from '../models/dataStore.js';

export const getConversation = (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = dataStore.getBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isCustomer = booking.customerId.toString() === req.user.id.toString();
    const isProvider = booking.provider?.userId?.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access to this chat is unauthorized.' });
    }

    let conversation = dataStore.getConversationByBooking(bookingId);
    if (!conversation) {
      conversation = {
        bookingId,
        customerId: booking.customerId,
        providerId: booking.provider?.userId,
        messages: [],
      };
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve conversation.' });
  }
};

export const sendMessage = (req, res) => {
  try {
    const { bookingId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
    }

    const booking = dataStore.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isCustomer = booking.customerId.toString() === req.user.id.toString();
    const isProvider = booking.provider?.userId?.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to send message to this chat.' });
    }

    const senderRole = isAdmin ? 'admin' : (isProvider ? 'provider' : 'customer');

    const msg = dataStore.addMessageToConversation(bookingId, {
      senderId: req.user.id,
      senderRole,
      text: text.trim(),
    });

    // Notify the other party
    const recipientId = isCustomer ? booking.provider?.userId : booking.customerId;
    if (recipientId) {
      dataStore.addNotification({
        userId: recipientId,
        title: 'New Message',
        message: `${req.user.name}: "${text.trim().substring(0, 60)}..."`,
        type: 'message',
        link: `/bookings/${bookingId}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message delivered.',
      data: msg,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};
