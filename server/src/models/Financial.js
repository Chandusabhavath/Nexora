import mongoose from 'mongoose';

// 1. Payment Record
const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
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
    amount: {
      type: Number,
      required: true, // in INR
    },
    amountPaise: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    commissionRate: {
      type: Number,
      required: true, // snapshot percentage at payment time (e.g. 10)
    },
    platformCommission: {
      type: Number,
      required: true, // platform share in INR
    },
    providerEarnings: {
      type: Number,
      required: true, // provider share in INR
    },
    paymentMethod: {
      type: String,
      enum: ['online_qr', 'online_upi', 'online_card', 'cash', 'upi'],
      default: 'online_qr',
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'created',
    },
    gatewayOrderId: {
      type: String,
      default: '',
    },
    gatewayPaymentId: {
      type: String,
      default: '',
    },
    gatewaySignature: {
      type: String,
      default: '',
    },
    dynamicQrString: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
    },
    receiptNumber: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// 2. Commission Rules Configuration
const commissionRuleSchema = new mongoose.Schema(
  {
    defaultPercentage: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    categoryPercentages: {
      type: Map,
      of: Number,
      default: {},
    },
    providerPercentages: {
      type: Map,
      of: Number,
      default: {},
    },
    fixedFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// 3. Provider Payout Record
const payoutSchema = new mongoose.Schema(
  {
    payoutId: {
      type: String,
      required: true,
      unique: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    gatewayVendorId: {
      type: String,
      default: '',
    },
    gatewayTransferId: {
      type: String,
      default: '',
    },
    beneficiaryName: {
      type: String,
      required: true,
    },
    accountNumberMasked: {
      type: String,
      required: true,
    },
    ifsc: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'successful', 'failed', 'reversed', 'on_hold'],
      default: 'pending',
    },
    failureReason: {
      type: String,
      default: '',
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// 4. Refund Record
const refundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: 'Booking cancelled by user',
    },
    gatewayRefundId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed'],
      default: 'pending',
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// 5. Immutable Financial Ledger (Double-Entry Bookkeeping)
const financialLedgerSchema = new mongoose.Schema(
  {
    entryId: {
      type: String,
      required: true,
      unique: true,
    },
    entryType: {
      type: String,
      enum: [
        'CUSTOMER_PAYMENT',
        'PLATFORM_COMMISSION_EARNED',
        'PROVIDER_EARNINGS_PENDING',
        'PROVIDER_EARNINGS_AVAILABLE',
        'PROVIDER_PAYOUT_DISBURSED',
        'REFUND_REVERSAL',
        'COMPENSATING_ADJUSTMENT',
      ],
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    debit: {
      type: Number,
      default: 0,
    },
    credit: {
      type: Number,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      default: 0,
    },
    referenceId: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export const CommissionRule = mongoose.models.CommissionRule || mongoose.model('CommissionRule', commissionRuleSchema);
export const Payout = mongoose.models.Payout || mongoose.model('Payout', payoutSchema);
export const Refund = mongoose.models.Refund || mongoose.model('Refund', refundSchema);
export const FinancialLedger = mongoose.models.FinancialLedger || mongoose.model('FinancialLedger', financialLedgerSchema);

// Backwards compatibility aliases
export const PaymentRecord = Payment;
export const CommissionRecord = Payout;
