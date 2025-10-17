import mongoose, { Schema, models } from 'mongoose';

const ktpVerificationSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  ktpImage: String,
  selfieImage: String,
  ktpNumber: String,
  fullName: String,
  dateOfBirth: String,
  address: String,
  submittedAt: { type: Date, default: Date.now },
  verifiedAt: Date,
  rejectionReason: String,
});

const paymentMethodSchema = new Schema({
  type: { type: String, enum: ['bank', 'ewallet'] },
  bankName: String,
  accountNumber: String,
  accountName: String,
  ewalletType: {
    type: String,
    enum: ['gopay', 'ovo', 'dana', 'shopeepay'],
  },
  ewalletNumber: String,
});

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: String,
    role: {
      type: String,
      enum: ['user', 'tasker', 'admin'],
      default: 'user',
    },
    phone: String,
    location: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    // Profile fields for taskers
    about: String,
    workCategories: [{
      type: String,
      enum: ['kebersihan', 'teknisi', 'renovasi', 'tukang', 'angkut', 'taman', 'lainnya']
    }],
    // Profile completion tracking
    profileComplete: {
      type: Boolean,
      default: false,
    },
    ktpVerification: ktpVerificationSchema,
    paymentMethod: paymentMethodSchema,
  },
  {
    timestamps: true,
  }
);

const User = models.User || mongoose.model('User', userSchema);

export default User;
