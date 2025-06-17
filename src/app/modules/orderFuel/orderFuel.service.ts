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

const MILES_TO_METERS = 1609.34;

// const createorderFuel = async (payload: IOrderFuel) => {
//   const fuelInfo = await FuelInfoModel.findOne({ fuelName: payload.fuelType });
//   if (!fuelInfo) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       `Fuel type "${payload.fuelType}" is not recognized`,
//     );
//   }

//   // 2. Calculate price based on dynamic price * amount
//   const price = fuelInfo.fuelPrice * payload.amount;

//   // Check if within 10 miles of any registered location
//   const nearbyLocation = await Location.findOne({
//     location: {
//       $near: {
//         $geometry: {
//           type: 'Point',
//           coordinates: payload.location.coordinates,
//         },
//         $maxDistance: 10 * MILES_TO_METERS, // 10 miles in meters
//       },
//     },
//   });

//   if (!nearbyLocation) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Service not available at this location. You must be within 10 miles of a service point.',
//     );
//   }

//   // 3. Extract zipCode from location (assuming payload contains it)
//   const zipCode = payload.zipCode;
//   if (!zipCode) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Zip code is required');
//   }

//   // 4. Get delivery fee
//   const delivery = await DeliveryAndTipModel.findOne({
//     name: 'deliveryFee',
//     zipCode: zipCode,
//   });
//   const deliveryFee = delivery?.price ?? 0;

//   // 5. Get tip
//   const tipData = await DeliveryAndTipModel.findOne({
//     name: 'tip',
//     zipCode: zipCode,
//   });
//   const tip = tipData?.price ?? 0;

//   // 6. Final amount
//   const finalAmountOfPayment = price + deliveryFee + tip;

//   // 7. Create order
//   const result = await orderFuel.create({
//     ...payload,
//     price,
//     deliveryFee,
//     tip,
//     finalAmountOfPayment,
//   });

//   if (!result) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create order');
//   }

//   return result;
// };

// Get All

// const createorderFuel = async (payload: IOrderFuel) => {
//   // console.log('payload', payload);
//   // 1. If this is a fuel order, look up the fuel price and calculate
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
//     // console.log('fuelInfo', fuelInfo);
//     price = payload.amount * fuelInfo.fuelPrice;
//   }
//   // 2. Check if within 10 miles of any registered service point
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

//   // 3. Ensure zipCode is present
//   const zipCode = String(payload.zipCode).trim();
//   if (!zipCode) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Zip code is required');
//   }

//   const deliveryDoc = await DeliveryAndTipModel.findOne({
//     name: 'Standard Delivery',
//     zipCode: { $all: [zipCode] },
//   });

//   const deliveryFee = deliveryDoc?.price ?? 0;

//   const tipDoc = await DeliveryAndTipModel.findOne({
//     name: 'tip Deliveryo',
//     zipCode: { $all: [zipCode] },
//   });
//   const tip = tipDoc?.price ?? 0;

//   // 5. Compute final amount:
//   //    - For battery orders: deliveryFee + tip
//   //    - Otherwise: price + deliveryFee + tip
//   const service = await Services.findOne({
//     serviceName: 'Battery',
//   });
//   const servicesFee = service?.price ?? 0;
//   console.log('servicesFee', servicesFee);
//   const finalAmountOfPayment =
//     payload.orderType === 'Battery'
//       ? servicesFee + deliveryFee + tip
//       : price + deliveryFee + tip;

//   // 6. Create the order record
//   const result = await orderFuel.create({
//     ...payload,
//     price,
//     deliveryFee,
//     tip,
//     finalAmountOfPayment,
//     servicesFee,
//   });
//   if (!result) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create order');
//   }

//   return result;
// };

const createorderFuel = async (payload: IOrderFuel) => {
  // const user = await User.findById(payload.userId);
  // if (!user) {
  //   throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  // }
  // const isStillSubscribed = dayjs().diff(user.createdAt, 'month') < 1;
  // const isSubscriptionVehicle = payload.isSubscriptionVehicle === true;
  // const isSubscriber = isStillSubscribed && isSubscriptionVehicle;
  // // 🚫 Block if subscription vehicle but subscription expired
  // if (isSubscriptionVehicle && !isStillSubscribed) {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     'Your subscription has expired. Please renew to access benefits.',
  //   );
  // }
  // // Step 1: Fuel price (if applicable)
  // let price = 0;
  // if (payload.orderType !== 'Battery') {
  //   const fuelInfo = await FuelInfoModel.findOne({
  //     fuelName: payload.fuelType,
  //   });
  //   if (!fuelInfo) {
  //     throw new AppError(
  //       httpStatus.BAD_REQUEST,
  //       `Fuel type "${payload.fuelType}" is not recognized`,
  //     );
  //   }
  //   price = payload.amount * fuelInfo.fuelPrice;
  // }
  // // Step 2: Location within 10 miles
  // const nearbyLocation = await Location.findOne({
  //   location: {
  //     $near: {
  //       $geometry: {
  //         type: 'Point',
  //         coordinates: payload.location.coordinates,
  //       },
  //       $maxDistance: 10 * MILES_TO_METERS,
  //     },
  //   },
  // });
  // if (!nearbyLocation) {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     'Service not available at this location. You must be within 10 miles of a service point.',
  //   );
  // }
  // // Step 3: Zip code and fees
  // const zipCode = String(payload.zipCode).trim();
  // if (!zipCode) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Zip code is required');
  // }
  // const deliveryDoc = await DeliveryAndTipModel.findOne({
  //   name: 'Standard Delivery',
  //   zipCode: { $all: [zipCode] },
  // });
  // const deliveryFee = deliveryDoc?.price ?? 0;
  // const tipDoc = await DeliveryAndTipModel.findOne({
  //   name: 'tip Deliveryo',
  //   zipCode: { $all: [zipCode] },
  // });
  // const tip = tipDoc?.price ?? 0;
  // const service = await Services.findOne({ serviceName: 'Battery' });
  // const servicesFee = service?.price ?? 0;
  // // Step 4: Final amount with optional benefit for subscriber
  // let finalAmountOfPayment =
  //   payload.orderType === 'Battery'
  //     ? servicesFee + deliveryFee + tip
  //     : price + deliveryFee + tip;
  // if (isSubscriber && user.fiftyPercentOffDeliveryFeeAfterWaivedTrips) {
  //   finalAmountOfPayment -= deliveryFee * 0.5;
  // }
  // // Step 5: Create order
  // const result = await orderFuel.create({
  //   ...payload,
  //   price,
  //   deliveryFee,
  //   tip,
  //   servicesFee,
  //   finalAmountOfPayment,
  // });
  // if (!result) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create order');
  // }
  // // Step 6: Decrease user limits (if valid subscriber)
  // if (isSubscriber) {
  //   await User.findByIdAndUpdate(
  //     user._id,
  //     {
  //       $inc: {
  //         freeDeliverylimit: -1,
  //         coverVehiclelimit: -1,
  //       },
  //     },
  //     { new: true },
  //   );
  // }
  // return result;
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
      .populate([{ path: 'userId' }, { path: 'driverId' }]),
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
