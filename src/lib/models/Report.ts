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
    reason: {
      type: String,
      enum: ['payment_issue', 'work_not_match', 'no_show', 'contract_breach', 'safety_issue', 'other'],
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
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedUserId: 1 });

const Report = models.Report || mongoose.model('Report', reportSchema);

export default Report;
