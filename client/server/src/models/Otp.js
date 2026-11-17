import mongoose from 'mongoose';

/**
 * OTP Schema for Email Verification and Passwordless Authentication
 * Supports automatic document cleanup via MongoDB TTL index.
 */
const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required for OTP issuance'],
      lowercase: true,
      trim: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: [true, 'Hashed OTP code is required'],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically purged by MongoDB once expiresAt is reached
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    consumed: {
      type: Boolean,
      default: false,
      index: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    lastRequestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for lightning-fast active OTP lookups
otpSchema.index({ email: 1, consumed: 1, expiresAt: 1 });

export const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
export default Otp;
