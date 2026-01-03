import mongoose from 'mongoose';

const vendorApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    businessAddress: {
      type: String,
      required: [true, 'Business address is required'],
      trim: true,
    },
    businessLicense: {
      type: String,
      required: [true, 'Business license is required'],
      trim: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    reviewedDate: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectedReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
vendorApplicationSchema.index({ status: 1 });
vendorApplicationSchema.index({ userId: 1 });

export const VendorApplication = mongoose.model('VendorApplication', vendorApplicationSchema);
