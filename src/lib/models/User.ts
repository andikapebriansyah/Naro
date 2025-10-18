import mongoose, { Schema, models } from 'mongoose';

const ktpVerificationSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_submitted'],
    default: 'not_submitted',
  },
  ktpImage: String,
  selfieImage: String,
  ktpNumber: String,
  fullName: String,
  dateOfBirth: String,
  address: String,
  submittedAt: { type: Date, default: Date.now },
  verifiedAt: Date,
  reviewedAt: Date,
  reviewedBy: String,
  rejectionReason: String,
  ocrConfidence: {
    type: Number,
    default: 0,
  },
  extractedData: {
    nik: String,
    nama: String,
    tempatLahir: String,
    tanggalLahir: String,
    jenisKelamin: String,
    alamat: String,
    rtRw: String,
    agama: String,
    statusPerkawinan: String,
    pekerjaan: String,
    kewarganegaraan: String,
    berlakuHingga: String,
    rawText: String,
  },
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

const withdrawalMethodSchema = new Schema({
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
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerificationCode: String,
    phoneVerificationExpiry: Date,
    location: String,
    locationCoordinates: {
      lat: Number,
      lng: Number
    },
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
    balance: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    // Profile fields for taskers
    about: String,
    workCategories: [{
      type: String,
      enum: ['kebersihan', 'teknisi', 'renovasi', 'tukang', 'angkut', 'taman', 'lainnya']
    }],
    // AI Embedding vector for smart recommendation (stored as JSON string)
    profileVector: {
      type: String,
      default: null,
      required: false,
    },
    profileVectorLastUpdate: {
      type: Date,
      default: null,
    },
    // Profile completion tracking
    profileComplete: {
      type: Boolean,
      default: false,
    },
    ktpVerification: ktpVerificationSchema,
    paymentMethod: paymentMethodSchema,
    withdrawalMethod: withdrawalMethodSchema,
  },
  {
    timestamps: true,
  }
);

const User = models.User || mongoose.model('User', userSchema);

export default User;