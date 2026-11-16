import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: 150,
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
    description: {
      type: String,
      required: [true, 'Service description is required'],
      maxlength: 2000,
    },
    priceType: {
      type: String,
      enum: ['hourly', 'fixed'],
      default: 'hourly',
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: [50, 'Minimum price is ₹50'],
    },
    durationMinutes: {
      type: Number,
      default: 60,
      min: 15,
    },
    includedItems: [{
      type: String,
      trim: true,
    }],
    excludedItems: [{
      type: String,
      trim: true,
    }],
    images: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

export const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
