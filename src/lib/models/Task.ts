import mongoose, { Schema, models } from 'mongoose';

const taskApplicantSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  message: String,
});

const agreementClauseSchema = new Schema({
  id: String,
  title: String,
  description: String,
  isRequired: Boolean,
});

const taskAgreementSchema = new Schema({
  clauses: [agreementClauseSchema],
  customClauses: String,
  acceptedByPoster: {
    type: Boolean,
    default: false,
  },
  acceptedByTasker: {
    type: Boolean,
    default: false,
  },
  acceptedByPosterAt: Date,
  acceptedByTaskerAt: Date,
  documentUrl: String,
});

const taskPaymentSchema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  serviceFee: {
    type: Number,
    required: true,
  },
  adminFee: {
    type: Number,
    default: 2500,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'held', 'released', 'refunded', 'failed'],
    default: 'pending',
  },
  method: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'ewallet'],
  },
  midtransOrderId: String,
  midtransTransactionId: String,
  paidAt: Date,
  releasedAt: Date,
});

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['kebersihan', 'teknisi', 'renovasi', 'tukang', 'angkut', 'taman', 'lainnya'],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    locationCoordinates: {
      lat: Number,
      lng: Number,
    },
    workerCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endDate: Date,
    endTime: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    estimatedDuration: String,
    budget: {
      type: Number,
      required: true,
    },
    pricingType: {
      type: String,
      enum: ['fixed', 'hourly', 'daily', 'weekly', 'monthly'],
      default: 'fixed',
    },
    // FIELD BARU: Metode pencarian pekerja
    searchMethod: {
      type: String,
      enum: ['publication', 'find_worker'], // publication = tunggu apply, find_worker = cari pekerja langsung
      default: 'publication',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'pending', 'accepted', 'active', 'completed_worker', 'completed', 'rejected', 'cancelled', 'disputed'],
      default: 'draft',
    },
    photos: [String],
    posterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    applicants: [taskApplicantSchema],
    agreement: taskAgreementSchema,
    payment: taskPaymentSchema,
    // Completion tracking
    completedAt: Date,
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    workerCompletedAt: Date,
    employerCompletedAt: Date,
    employerApprovedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: Date,
    paymentProcessed: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    // Payment fields for simple implementation
    paymentId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank', 'ewallet'],
    },
    paymentAmount: Number,
    paymentDate: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes untuk performa
taskSchema.index({ posterId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ category: 1, status: 1 });
taskSchema.index({ scheduledDate: 1 });

// Force delete existing model if it exists
if (mongoose.models.Task) {
  delete mongoose.models.Task;
}

const Task = mongoose.model('Task', taskSchema);

export default Task;