import mongoose, { Schema, models } from 'mongoose';

const reportSchema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporterType: {
      type: String,
      enum: ['employer', 'worker'],
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'worker_no_show',
        'work_quality_poor',
        'work_incomplete',
        'unprofessional',
        'damage_property',
        'late_arrival',
        'payment_not_received',
        'payment_less',
        'unsafe_workplace',
        'job_not_match',
        'harassment',
        'unreasonable_demand',
        'no_show_employer',
        'contract_breach',
        'safety_issue',
        'safety_violation',
        'other'
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    evidence: [String],
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'rejected'],
      default: 'pending',
    },
    resolution: String,
    resolvedAt: Date,
    adminNotes: String,
    // ✅ NEW: Add action field to store what admin did
    action: {
      type: String,
      enum: ['warning', 'suspend_reported', 'refund', 'no_action'],
      default: 'no_action',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedUserId: 1 });
reportSchema.index({ taskId: 1 });
reportSchema.index({ reporterType: 1 });

// Force delete existing model if it exists
if (mongoose.models.Report) {
  delete mongoose.models.Report;
}

const Report = mongoose.model('Report', reportSchema);

export default Report;