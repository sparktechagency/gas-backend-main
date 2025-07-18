import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { IVehicle } from './vechile.interface';
import { Vehicle } from './vechile.models';
import { User } from '../user/user.models';
import Subscription from '../subscription/subscription.models';

// Create a new vehicle
const createvechile = async (payload: IVehicle) => {
  // Check if the user exists
  const user = await User.findById(payload.userId);
  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const subscription = await Subscription.findOne({ user: payload.userId });

  // Check if the user is a subscriber
  const isSubscriber = subscription !== null;

  if (isSubscriber) {
    // Check the user's coverVehicleLimit if they are a subscriber
    if (user.coverVehiclelimit <= 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'User has no available vehicle limit',
      );
    }

    // Decrease the coverVehicleLimit if the user is a subscriber
    await User.findByIdAndUpdate(
      user._id,
      { $inc: { coverVehiclelimit: -1 } }, // Decrement by 1
      { new: true }, // Optional: returns the updated document
    );
  }

  // Create the vehicle data
  const vehicleData = {
    ...payload,
    isCoveredBySubscription: isSubscriber && user.coverVehiclelimit > 0,
  };

  const result = await Vehicle.create(vehicleData);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create vehicle');
  }

  return result;
};

// Get all vehicles with filters, pagination, sorting
const getAllvechile = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(
    Vehicle.find().populate('userId'),
    query,
  )
    .search(['make', 'model'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();
  return { data, meta };
};

// Get vehicle by ID
const getvechileById = async (id: string) => {
  const result = await Vehicle.findById(id).populate('userId');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Vehicle not found');
  }
  return result;
};

const getVechileByUser = async (userId: string) => {
  const result = await Vehicle.findById({ userId: userId });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Vehicle not found');
  }
  return result;
};

// Update vehicle
const updatevechile = async (id: string, payload: Partial<IVehicle>) => {
  const result = await Vehicle.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update vehicle');
  }
  return result;
};

// Delete vehicle
const deletevechile = async (id: string) => {
  const result = await Vehicle.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete vehicle');
  }
  return result;
};

const getMyVechiles = async (userId: string, query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(Vehicle.find({ userId }), query)
    .search(['make', 'model'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();
  return { data, meta };
};

const getSubscriptionVehicles = async (userId: string) => {
  const result = await Vehicle.find({
    userId: userId,
    isCoveredBySubscription: true,
  }).populate('userId');
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You have no vehicles');
  }
  return result;
};

export const vechileService = {
  createvechile,
  getAllvechile,
  getvechileById,
  updatevechile,
  deletevechile,
  getMyVechiles,
  getVechileByUser,
  getSubscriptionVehicles,
};
