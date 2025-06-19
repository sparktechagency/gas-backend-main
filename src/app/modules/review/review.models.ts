import { Schema, model } from 'mongoose';
import { IReview } from './review.interface';

const reviewSchema: Schema<IReview> = new Schema(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Replace with actual model name
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Replace with actual user model if needed
    },
    rating: {
      type: Number,
      required: true,
    },
    review: {
      type: String,
      required: true,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Review = model<IReview>('Review', reviewSchema);
