import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { IReview } from './review.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { Review } from './review.models';

import { ClientSession, startSession } from 'mongoose';
import { getAverageRating } from './review.utils';
import { User } from '../user/user.models';

// Create a new review
const createreview = async (payload: IReview) => {
  const session: ClientSession = await startSession();
  session.startTransaction();
  try {
    const result: IReview[] = await Review.create([payload], { session });
    if (!result || result?.length === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create review');
    }

    const { averageRating, totalReviews } = await getAverageRating(
      result[0]?.driverId?.toString(),
    );

    const newAvgRating =
      (Number(averageRating) * Number(totalReviews) + Number(payload.rating)) /
      (totalReviews + 1); 
    const user = await User.findByIdAndUpdate(
      result[0]?.driverId,
      {
        avgRating: newAvgRating,
        $addToSet: { reviews: result[0]?._id },
      },
      { session },
    ); 
    await session.commitTransaction();
    session.endSession();

    return result[0];
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(
      httpStatus.BAD_REQUEST,
      error?.message || 'Review creation failed',
    );
  }
};

// Get all reviews with pagination, filter, search, and population
const getAllreview = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(
    Review.find().populate('driverId'),
    query,
  )
    .search(['review']) // allows searching text inside the review
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();
  return { data, meta };
};

// Get review by ID
const getreviewById = async (id: string) => {
  const result = await Review.findById(id).populate(['driverId', 'userId']);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }
  return result;
};

const getreviewByDriverId = async (id: string) => {
  const result = await Review.find({ driverId: id }).populate([
    'driverId',
    'userId',
  ]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }
  return result;
};

// Update review
const updatereview = async (id: string, payload: Partial<IReview>) => {
  const result = await Review.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update review');
  }
  return result;
};

// Delete review
const deletereview = async (id: string) => {
  const result = await Review.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete review');
  }
  return result;
};

export const reviewService = {
  createreview,
  getAllreview,
  getreviewById,
  updatereview,
  deletereview,
  getreviewByDriverId,
};
