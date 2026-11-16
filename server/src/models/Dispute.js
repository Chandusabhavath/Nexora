import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    raisedAgainst: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['no_show', 'poor_quality', 'pricing_dispute', 'unprofessional_behavior', 'damage_claim', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    evidence: [{
      type: String,
    }],
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved', 'dismissed'],
      default: 'open',
    },
    resolutionNote: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Dispute = mongoose.models.Dispute || mongoose.model('Dispute', disputeSchema);
