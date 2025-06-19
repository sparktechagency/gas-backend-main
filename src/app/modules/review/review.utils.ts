 
import { Types } from 'mongoose';
import { Review } from './review.models';

interface IReturn {
  averageRating: number;
  totalReviews: number;
}
export const getAverageRating = async (driverId: string):Promise<IReturn> => {
  const result = await Review.aggregate([
    {
        //@ts-ignore
      $match: { driverId: new Types.ObjectId(driverId) }, // Filter by reference ID
    },
    {
      $group: {
        _id: '$driverId',
        averageRating: { $avg: '$rating' }, // Calculate average rating
        totalReviews: { $sum: 1 }, // Count total reviews
      },
    },
  ]);

  if (result.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  return result[0]; // Return the first result
};
