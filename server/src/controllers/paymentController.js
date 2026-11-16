import { dataStore } from '../models/dataStore.js';
import { cashfreeService } from '../services/cashfreeService.js';

/**
 * Create dynamic payment order with UPI QR and marketplace split
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    const booking = dataStore.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Permission check: only booking customer or admin
    if (booking.customerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to initiate payment for this booking.' });
    }

    const { payment, order } = await dataStore.createOnlinePaymentOrder(bookingId, paymentMethod || 'online_qr');

    res.status(201).json({
      success: true,
      message: 'Dynamic QR Payment Order initialized with Cashfree marketplace split.',
      payment,
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create payment order.' });
  }
};

/**
 * Verify payment with signature check and allocate balances
 */
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, gatewayPaymentId, gatewaySignature, paymentMethod } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    const result = await dataStore.verifyAndRecordPayment({
      orderId,
      gatewayPaymentId,
      gatewaySignature,
      paymentMethod,
    });

    res.json({
      success: true,
      message: result.alreadyProcessed ? 'Payment was already verified and recorded.' : 'Payment verified successfully. Booking marked as Paid.',
      payment: result.payment,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Payment verification failed.' });
  }
};

/**
 * Signed Cashfree Gateway Webhook handler
 */
export const cashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = JSON.stringify(req.body);

    const isValid = cashfreeService.verifyWebhookSignature(rawBody, signature, timestamp);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const eventData = req.body.data || {};
    const orderId = eventData.order?.order_id || req.body.order_id;
    const paymentId = eventData.payment?.payment_id || req.body.payment_id;
    const eventType = req.body.type || 'PAYMENT_SUCCESS_WEBHOOK';

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType.includes('SUCCESS')) {
      if (orderId) {
        await dataStore.verifyAndRecordPayment({
          orderId,
          gatewayPaymentId: paymentId || `cf_hook_${Date.now()}`,
          gatewaySignature: signature || 'sig_webhook_verified',
          paymentMethod: 'online_qr',
        });
      }
    }

    res.json({ success: true, message: 'Webhook processed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Webhook processing error', error: error.message });
  }
};

/**
 * Retrieve transaction receipt
 */
export const getPaymentReceipt = (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = dataStore.getPaymentByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const booking = dataStore.getBookingById(payment.bookingId);

    res.json({
      success: true,
      receipt: {
        receiptNumber: payment.receiptNumber,
        orderId: payment.orderId,
        bookingRef: payment.bookingRef,
        customerName: payment.customerName,
        providerName: payment.providerName,
        totalAmount: payment.amount,
        platformFee: payment.platformCommission,
        providerEarnings: payment.providerEarnings,
        commissionRate: payment.commissionRate,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        paidAt: payment.paidAt,
        gatewayPaymentId: payment.gatewayPaymentId,
        booking: booking || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve receipt.' });
  }
};
