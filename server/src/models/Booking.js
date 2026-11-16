import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      unique: true,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    taskDescription: {
      type: String,
      required: [true, 'Task description is required'],
      maxlength: 1000,
    },
    scheduledDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    scheduledTime: {
      type: String, // HH:mm
      required: true,
    },
    durationHours: {
      type: Number,
      default: 2,
      min: 1,
    },
    serviceLocation: {
      street: { type: String, default: '' },
      locality: { type: String, required: true },
      city: { type: String, default: 'Mumbai' },
      pincode: { type: String, default: '' },
      lat: { type: Number, default: 19.0596 },
      lng: { type: Number, default: 72.8295 },
    },
    agreedPriceSnapshot: {
      baseRate: { type: Number, required: true },
      priceType: { type: String, enum: ['hourly', 'fixed'], required: true },
      estimatedDurationHours: { type: Number, default: 2 },
      subtotal: { type: Number, required: true },
      platformFee: { type: Number, required: true }, // Commission in INR
      commissionRate: { type: Number, default: 10 }, // Commission %
      providerShare: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, default: '' },
      },
    ],
    paymentMethod: {
      type: String,
      enum: ['online_qr', 'online_upi', 'cash', 'upi'],
      default: 'online_qr',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'provider_reported', 'customer_confirmed', 'refunded', 'partially_refunded', 'failed'],
      default: 'pending',
    },
    paymentDetails: {
      orderId: { type: String, default: '' },
      gatewayPaymentId: { type: String, default: '' },
      reportedAt: { type: Date },
      reportedAmount: { type: Number },
      upiTransactionId: { type: String, default: '' },
      confirmedAt: { type: Date },
      paidAt: { type: Date },
      note: { type: String, default: '' },
    },
    payoutStatus: {
      type: String,
      enum: ['unallocated', 'pending', 'processing', 'successful', 'reversed'],
      default: 'unallocated',
    },
    payoutId: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    refundDetails: {
      refundId: { type: String, default: '' },
      amount: { type: Number, default: 0 },
      status: { type: String, default: 'none' },
      refundedAt: { type: Date },
    },
    rescheduleRequest: {
      requestedDate: { type: String },
      requestedTime: { type: String },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['none', 'pending', 'accepted', 'declined'], default: 'none' },
    },
    hasReview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
