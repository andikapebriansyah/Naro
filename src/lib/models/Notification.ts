import mongoose, { Schema, models } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_completed',
        'task_cancelled',
        'payment_received',
        'new_applicant',
        'application_accepted',
        'application_rejected',
        'task_completion_request',
        'verification_status',
        'new_message',
        'system',
      ],
      required: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
    },
    relatedModel: {
      type: String,
      enum: ['Task', 'User', 'Payment', 'Report'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
