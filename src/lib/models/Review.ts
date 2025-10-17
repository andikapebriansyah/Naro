import mongoose, { Schema, models } from 'mongoose';

const reviewSchema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ taskId: 1, fromUserId: 1 }, { unique: true });
reviewSchema.index({ toUserId: 1 });

const Review = models.Review || mongoose.model('Review', reviewSchema);

export default Review;
