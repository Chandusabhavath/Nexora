import mongoose from 'mongoose';

const providerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Electrical',
        'Plumbing',
        'Home Cleaning',
        'Carpentry',
        'Painting',
        'Appliance Repair',
        'Gardening',
        'Moving & Helpers',
      ],
    },
    skills: [{
      type: String,
      trim: true,
    }],
    experienceYears: {
      type: Number,
      default: 1,
      min: 0,
      max: 50,
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: [100, 'Minimum hourly rate is ₹100'],
    },
    serviceArea: {
      city: { type: String, default: 'Mumbai' },
      localities: [{ type: String }],
      radiusKm: { type: Number, default: 15, min: 1, max: 100 },
      lat: { type: Number, default: 19.0596 },
      lng: { type: Number, default: 72.8295 },
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'unsubmitted'],
      default: 'unsubmitted',
    },
    verificationDocuments: [
      {
        docType: { type: String, enum: ['Aadhaar', 'PAN', 'Trade License', 'Passport', 'Other'] },
        docNumber: { type: String },
        submittedAt: { type: Date, default: Date.now },
        verifiedAt: { type: Date },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    verificationFeedback: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    completedBookingsCount: {
      type: Number,
      default: 0,
    },
    workingHours: {
      monday: { start: { type: String, default: '09:00' }, end: { type: String, default: '19:00' }, active: { type: Boolean, default: true } },
      tuesday: { start: { type: String, default: '09:00' }, end: { type: String, default: '19:00' }, active: { type: Boolean, default: true } },
      wednesday: { start: { type: String, default: '09:00' }, end: { type: String, default: '19:00' }, active: { type: Boolean, default: true } },
      thursday: { start: { type: String, default: '09:00' }, end: { type: String, default: '19:00' }, active: { type: Boolean, default: true } },
      friday: { start: { type: String, default: '09:00' }, end: { type: String, default: '19:00' }, active: { type: Boolean, default: true } },
      saturday: { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' }, active: { type: Boolean, default: true } },
      sunday: { start: { type: String, default: '10:00' }, end: { type: String, default: '16:00' }, active: { type: Boolean, default: false } },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredUntil: {
      type: Date,
      default: null,
    },
    commissionRate: {
      type: Number,
      default: 0.10, // 10% platform fee
    },
    
    // --- Bank Details & Payout Settings (Module 2) ---
    bankAccount: {
      accountHolderName: { type: String, default: '' },
      accountNumberMasked: { type: String, default: '' },
      accountNumberHash: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      bankName: { type: String, default: '' },
      upiId: { type: String, default: '' },
      panNumberMasked: { type: String, default: '' },
      businessType: { type: String, enum: ['individual', 'enterprise'], default: 'individual' },
      gatewayVendorId: { type: String, default: '' },
      payoutStatus: {
        type: String,
        enum: ['not_submitted', 'verification_pending', 'verified', 'rejected', 'suspended'],
        default: 'not_submitted',
      },
      verifiedAt: { type: Date },
      rejectionReason: { type: String, default: '' },
    },

    // --- Provider Financial Balances ---
    totalEarnings: {
      type: Number,
      default: 0,
    },
    availableBalance: {
      type: Number,
      default: 0, // ready for payout
    },
    pendingBalance: {
      type: Number,
      default: 0, // held until service completion
    },
    paidAmount: {
      type: Number,
      default: 0, // successfully disbursed payouts
    },
    unpaidCommission: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const ProviderProfile = mongoose.models.ProviderProfile || mongoose.model('ProviderProfile', providerProfileSchema);
