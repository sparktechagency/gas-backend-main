import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { IOrderFuel } from './orderFuel.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { orderFuel } from './orderFuel.models';
import { Location } from '../location/location.models';
import { FuelInfoModel } from '../fuelInfo/fuelInfo.models';
import { DeliveryAndTipModel } from '../deliveryAndTip/deliveryAndTip.models';
import { z } from 'zod';
import { Services } from '../services/services.models';
import Subscription from '../subscription/subscription.models';
import { Vehicle } from '../vechile/vechile.models';
import { IPackage } from '../packages/packages.interface';
import { User } from '../user/user.models';
import dayjs from 'dayjs';
import { CouponModel } from '../coupon/coupon.models';
import { notificationServices } from '../notification/notification.service';
import { modeType } from '../notification/notification.interface';

const MILES_TO_METERS = 1609.34;

// const createorderFuel = async (payload: IOrderFuel) => {
//   const user = await User.findById(payload.userId);
//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User not found');
//   }

//   // Step 1: Check if user has an active subscription
//   const subscription = await Subscription.findOne({
//     user: user._id,
//     isExpired: false, // Active subscription
//     isDeleted: false, // Not deleted
//   });

//   const isStillSubscribed =
//     subscription && dayjs().diff(subscription.createdAt, 'month') < 1;
//   const vehicle = await Vehicle.findOne({
//     _id: payload.vehicleId,
//     userId: payload.userId,
//   });

//   if (!vehicle) {
//     throw new AppError(
//       httpStatus.NOT_FOUND,
//       'Vehicle not found or does not belong to the specified user',
//     );
//   }

//   const isSubscriptionVehicle = vehicle.isCoveredBySubscription;
//   const isSubscriber = isStillSubscribed && isSubscriptionVehicle;

//   if (isSubscriptionVehicle && !isStillSubscribed) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Your subscription has expired. Please renew to access benefits.',
//     );
//   }

//   // Step 2: Fuel price calculation if applicable
//   let price = 0;
//   if (payload.orderType !== 'Battery') {
//     const fuelInfo = await FuelInfoModel.findOne({
//       fuelName: payload.fuelType,
//     });
//     if (!fuelInfo) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         `Fuel type "${payload.fuelType}" is not recognized`,
//       );
//     }
//     price = payload.amount * fuelInfo.fuelPrice;
//   }

//   // Step 3: Location check (within 10 miles)
//   const nearbyLocation = await Location.findOne({
//     location: {
//       $near: {
//         $geometry: {
//           type: 'Point',
//           coordinates: payload.location.coordinates,
//         },
//         $maxDistance: 10 * MILES_TO_METERS,
//       },
//     },
//   });
//   if (!nearbyLocation) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Service not available at this location. You must be within 10 miles of a service point.',
//     );
//   }

//   // Step 4: Ensure zipCode is provided and fetch delivery/tip fees
//   const zipCode = String(payload.zipCode).trim();
//   if (!zipCode) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Zip code is required');
//   }

//   const deliveryDoc = await DeliveryAndTipModel.findOne({
//     // name: 'Standard Delivery',
//     zipCode: { $all: [zipCode] },
//   });
//   const deliveryFee = deliveryDoc?.price ?? 0;

//   const tipDoc = await DeliveryAndTipModel.findOne({
//     // name: 'tip Deliveryo',
//     zipCode: { $all: [zipCode] },
//   });
//   const tip = tipDoc?.price ?? 0;

//   // Step 5: Calculate final amount
//   const service = await Services.findOne({ serviceName: 'Battery' });
//   const servicesFee = service?.price ?? 0;

//   let finalAmountOfPayment =
//     payload.orderType === 'Battery'
//       ? servicesFee + deliveryFee + tip
//       : price + deliveryFee + tip;

//   // Apply subscriber benefits (if active subscription)
//   if (isSubscriber && user.fiftyPercentOffDeliveryFeeAfterWaivedTrips) {
//     finalAmountOfPayment -= deliveryFee * 0.5; // Discount for subscribers
//   }
//   // Check if subscriber has free delivery limit and apply waiver
//   if (isSubscriber && user.freeDeliverylimit > 0) {
//     finalAmountOfPayment -= deliveryFee; // Waive delivery fee
//     // Decrease the freeDeliveryLimit for the user
//     await User.findByIdAndUpdate(
//       user._id,
//       {
//         $inc: {
//           freeDeliverylimit: -1,
//         },
//       },
//       { new: true },
//     );
//   }

//   // Step 6: Create the fuel order record
//   const result = await orderFuel.create({
//     ...payload,
//     price,
//     deliveryFee,
//     tip,
//     servicesFee,
//     finalAmountOfPayment,
//   });

//   if (!result) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create order');
//   }

//   // Step 7: Decrease user limits if the user has an active subscription
//   if (isSubscriber) {
//     await User.findByIdAndUpdate(
//       user._id,
//       {
//         $inc: {
//           freeDeliveryLimit: -1,
//         },
//       },
//       { new: true },
//     );
//   }

//   return result;
// };

const createorderFuel = async (payload: IOrderFuel) => {
  const user = await User.findById(payload.userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Step 1: Check if user has an active subscription
  const subscription = await Subscription.findOne({
    user: user._id,
    isExpired: false,
    isDeleted: false,
  });

  const isStillSubscribed =
    subscription && dayjs().diff(subscription.createdAt, 'month') < 1;

  const vehicle = await Vehicle.findOne({
    _id: payload.vehicleId,
    userId: payload.userId,
  });

  if (!vehicle) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Vehicle not found or does not belong to the specified user',
    );
  }

  const isSubscriptionVehicle = vehicle.isCoveredBySubscription;
  const isSubscriber = isStillSubscribed && isSubscriptionVehicle;

  if (isSubscriptionVehicle && !isStillSubscribed) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Your subscription has expired. Please renew to access benefits.',
    );
  }

  // Step 2: Fuel price calculation if applicable
  let price = 0;
  if (payload.orderType !== 'Battery') {
    const fuelInfo = await FuelInfoModel.findOne({
      fuelName: payload.fuelType,
    });
    if (!fuelInfo) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Fuel type "${payload.fuelType}" is not recognized`,
      );
    }
    price = payload.amount * fuelInfo.fuelPrice;
  }

  // Step 3: Location check (within 10 miles)
  const nearbyLocation = await Location.findOne({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: payload.location.coordinates,
        },
        $maxDistance: 10 * MILES_TO_METERS,
      },
    },
  });
  if (!nearbyLocation) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Service not available at this location. You must be within 10 miles of a service point.',
    );
  }

  // Step 4: Ensure zipCode is provided and fetch delivery/tip fees
  const zipCode = String(payload.zipCode).trim();
  if (!zipCode) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Zip code is required');
  }

  const deliveryDoc = await DeliveryAndTipModel.findOne({
    zipCode: { $all: [zipCode] },
  });
  const deliveryFee = deliveryDoc?.price ?? 0;

  const tipDoc = await DeliveryAndTipModel.findOne({
    zipCode: { $all: [zipCode] },
  });
  const tip = tipDoc?.price ?? 0;

  // Step 5: Calculate base total
  const service = await Services.findOne({ serviceName: 'Battery' });
  const servicesFee = service?.price ?? 0;

  let finalAmountOfPayment =
    payload.orderType === 'Battery'
      ? servicesFee + deliveryFee + tip
      : price + deliveryFee + tip;

  // Step 5.1: Subscriber benefits
  if (isSubscriber && user.fiftyPercentOffDeliveryFeeAfterWaivedTrips) {
    finalAmountOfPayment -= deliveryFee * 0.5;
  }

  if (isSubscriber && user.freeDeliverylimit > 0) {
    finalAmountOfPayment -= deliveryFee;
    await User.findByIdAndUpdate(
      user._id,
      {
        $inc: {
          freeDeliverylimit: -1,
        },
      },
      { new: true },
    );
  }

  // Step 5.2: Apply coupon discount for non-subscribers
  if (!isSubscriber && payload.cuponCode) {
    const coupon = await CouponModel.findOne({
      couponCode: payload.cuponCode.toUpperCase(),
    });

    if (!coupon) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid coupon code');
    }

    const isExpired = dayjs().isAfter(dayjs(coupon.expiryDate));
    if (isExpired) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Coupon has expired');
    }

    // Optional: Check if the coupon applies to the current service type
    if (
      (coupon.service as any) !== 'ALL' &&
      payload.orderType.toLowerCase() !== String(coupon.service).toLowerCase()
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This coupon is not valid for ${payload.orderType} service`,
      );
    }

    const discountAmount = (finalAmountOfPayment * coupon.discount) / 100;
    finalAmountOfPayment -= discountAmount;
  }

  // Step 6: Create the fuel order record
  const result = await orderFuel.create({
    ...payload,
    price,
    deliveryFee,
    tip,
    servicesFee,
    finalAmountOfPayment,
  });

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create order');
  }

  // Step 7: Decrease user limits if the user has an active subscription
  if (isSubscriber) {
    await User.findByIdAndUpdate(
      user._id,
      {
        $inc: {
          freeDeliveryLimit: -1,
        },
      },
      { new: true },
    );
  }

  return result;
};

const getAllorderFuel = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(
    orderFuel.find({ isPaid: true }).populate(['userId', 'driverId']),
    query,
  )
    .search(['location', 'fuelType'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();
  return { data, meta };
};

const getInProgressorderFuel = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(
    orderFuel.find({ orderStatus: 'InProgress' }).populate(['userId']),
    query,
  )
    .search(['location', 'fuelType'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();
  return { data, meta };
};

const getActiveOrderFuel = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(
    orderFuel.find({ orderStatus: 'active' }).populate(['userId']),
    query,
  )
    .search(['location', 'fuelType'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();
  return { data, meta };
};

const getDeliveredorderFuel = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(
    orderFuel.find({ orderStatus: 'Delivered' }).populate(['userId']),
    query,
  )
    .search(['location', 'fuelType'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();
  return { data, meta };
};

// Get By ID
const getorderFuelById = async (id: string) => {
  const result = await orderFuel.findById(id).populate(['userId', 'driverId']);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }
  return result;
};

const getorderFuelByDriverId = async (
  driverId: string,
  query: Record<string, any>,
) => {
  const queryBuilder = new QueryBuilder(
    orderFuel.find({ driverId }).populate('userId'),
    query,
  )
    .search(['location', 'fuelType']) // optional: include searchable fields
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  if (!data || data.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order driver not found');
  }

  return { data, meta };
};

const getorderFuelByUserId = async (
  userId: string,
  query: Record<string, any>,
) => {
  const queryBuilder = new QueryBuilder(
    orderFuel
      .find({ userId })
      .populate([
        { path: 'userId' },
        { path: 'driverId', populate: [{ path: 'reviews' }] },
      ]),
    query,
  )
    .search(['location', 'fuelType'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  // No error thrown, just return empty array and meta
  return { data, meta };
};

// Update
const updateorderFuel = async (id: string, payload: Partial<IOrderFuel>) => {
  const result = await orderFuel.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order update failed');
  }
  if (result?.driverId) {
    await notificationServices.insertNotificationIntoDb({
      receiver: result?.driverId,
      message: 'You have a new order request',
      description: `Your have a new tour request for "${result?.orderType}".`,
      refference: result._id,
      model_type: modeType.fuelOrder,
    });
  }
  return result;
};

// Delete (Soft delete or hard delete as needed)
const deleteorderFuel = async (id: string) => {
  const result = await orderFuel.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order delete failed');
  }
  return result;
};

export const orderFuelService = {
  createorderFuel,
  getAllorderFuel,
  getorderFuelById,
  updateorderFuel,
  deleteorderFuel,
  getDeliveredorderFuel,
  getInProgressorderFuel,
  getActiveOrderFuel,
  getorderFuelByDriverId,
  getorderFuelByUserId,
};
