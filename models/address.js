import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    label: {
      type: String,
      required: [true, 'Address label is required'],
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      enum: {
        values: ['Kathmandu', 'Bhaktapur', 'Lalitpur', 'Kritipur'],
        message: 'City must be one of: Kathmandu, Bhaktapur, Lalitpur, Kritipur',
      },
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
    },
    nearestLandmark: {
      type: String,
      required: [true, 'Nearest landmark is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      default: null,
      trim: true,
    },
    coordinates: {
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
// Composite index can handle both userId-only and userId+city queries efficiently
addressSchema.index({ userId: 1, city: 1 }); // Composite index for city filtering (can also be used for userId queries)

// Ensure only one default address per user
addressSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('Address').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export const Address = mongoose.model('Address', addressSchema);


