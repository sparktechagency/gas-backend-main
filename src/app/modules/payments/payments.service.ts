import Stripe from 'stripe';
import config from '../../config';
import { IPayment } from './payments.interface';
import { ISubscriptions } from '../subscription/subscription.interface';
import Subscription from '../subscription/subscription.models';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import Payment from './payments.models';
import { User } from '../user/user.models';
import { createCheckoutSession } from './payments.utils';
import { now, startSession } from 'mongoose';
import { IPackage } from '../packages/packages.interface';
import { notificationServices } from '../notification/notification.service';
import { modeType } from '../notification/notification.interface';
import { USER_ROLE } from '../user/user.constants';
import generateRandomString from '../../utils/generateRandomString';
import moment from 'moment';
import { IUser } from '../user/user.interface';
import { Notification } from '../notification/notification.model';
import { subscribe } from 'diagnostics_channel';
import Package from '../packages/packages.models';
import QueryBuilder from '../../builder/QueryBuilder';
import { orderFuel } from '../orderFuel/orderFuel.models';
import { Tip } from '../optionalTip/optionalTip.models';

const stripe = new Stripe(config.stripe?.stripe_api_secret as string, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// const checkout = async (payload: IPayment) => {
//   const tranId = generateRandomString(10);
//   let paymentData: IPayment;
//   const subscription: ISubscriptions | null = await Subscription.findById(
//     payload?.subscription,
//   ).populate('package');

//   if (!subscription) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Subscription Not Found!');
//   }

//   // Check for existing unpaid payment for the subscription
//   const isExistPayment: IPayment | null = await Payment.findOne({
//     subscription: payload?.subscription,
//     isPaid: false,
//     user: payload?.user,
//   });

//   const user = await User.findById(payload?.user);
//   let amount = subscription?.amount;
//   if (isExistPayment) {
//     const payment = await Payment.findByIdAndUpdate(
//       isExistPayment?._id,
//       { tranId },
//       { new: true },
//     );

//     paymentData = payment as IPayment;
//     paymentData.amount = amount;
//     // Add VAT for users with vat_type = "Romania"
//   } else {
//     payload.tranId = tranId;
//     payload.amount = amount;
//     const createdPayment = await Payment.create(payload);
//     if (!createdPayment) {
//       throw new AppError(
//         httpStatus.INTERNAL_SERVER_ERROR,
//         'Failed to create payment',
//       );
//     }
//     paymentData = createdPayment;
//   }
//   // if (!paymentData)
//   //   throw new AppError(httpStatus.BAD_REQUEST, 'payment not found');
//   console.log('paymentData', paymentData);
//   const checkoutSession = await createCheckoutSession({
//     // customerId: customer.id,
//     product: {
//       amount: paymentData?.amount,
//       //@ts-ignore
//       name: subscription?.package?.title,
//       quantity: 1,
//     },

//     //@ts-ignore
//     paymentId: paymentData?._id,
//   });

//   return checkoutSession?.url;
// };

const checkout = async (payload: IPayment) => {
  const tranId = generateRandomString(10);
  let paymentData: IPayment;

  const order = await orderFuel.findById(payload?.orderFuelId);
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
  }

  const user = await User.findById(payload?.user);
  const amount = order.finalAmountOfPayment;

  // Check for existing unpaid payment for the order
  const existingPayment: IPayment | null = await Payment.findOne({
    orderFuelId: order._id,
    isPaid: false,
    user: payload?.user,
  });

  if (existingPayment) {
    const updatedPayment = await Payment.findByIdAndUpdate(
      existingPayment._id,
      { tranId, amount },
      { new: true },
    );
    paymentData = updatedPayment as IPayment;
  } else {
    payload.tranId = tranId;
    payload.amount = amount;
    payload.orderFuelId = order._id as any;

    const createdPayment = await Payment.create(payload);
    if (!createdPayment) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to create payment',
      );
    }
    paymentData = createdPayment;
  }

  const checkoutSession = await createCheckoutSession({
    product: {
      amount: paymentData.amount,
      name: 'Fuel Order Payment',
      quantity: 1,
    },
    paymentId: paymentData._id ? paymentData._id.toString() : '',
  });

  return checkoutSession?.url;
};

const tipCheckout = async (payload: IPayment) => {
  const tranId = generateRandomString(10);
  let paymentData: IPayment;

  const tip = await Tip.findById(payload?.optionalTipId);
  if (!tip) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tip not found!');
  }

  const user = await User.findById(payload?.user);
  const amount = tip.amount;

  // Check for existing unpaid payment for the order
  const existingPayment: IPayment | null = await Payment.findOne({
    orderFuelId: tip._id,
    isPaid: false,
    user: payload?.user,
  });

  if (existingPayment) {
    const updatedPayment = await Payment.findByIdAndUpdate(
      existingPayment._id,
      { tranId, amount },
      { new: true },
    );
    paymentData = updatedPayment as IPayment;
  } else {
    payload.tranId = tranId;
    payload.amount = amount;
    payload.optionalTipId = tip._id as any;

    const createdPayment = await Payment.create(payload);
    if (!createdPayment) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to create payment',
      );
    }
    paymentData = createdPayment;
  }

  const checkoutSession = await createCheckoutSession({
    product: {
      amount: paymentData.amount,
      name: 'tip Payment',
      quantity: 1,
    },
    paymentId: paymentData._id ? paymentData._id.toString() : '',
  });

  return checkoutSession?.url;
};

// const confirmPayment = async (query: Record<string, any>) => {
//   const { sessionId, paymentId } = query;

//   const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
//   const paymentIntentId = stripeSession.payment_intent as string;

//   if (stripeSession.status !== 'complete') {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Payment session is not completed',
//     );
//   }

//   const payment = await Payment.findById(paymentId).populate('user');
//   if (!payment) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Payment not found!');
//   }

//   const isOrder = !!payment.orderFuelId;
//   const isSubscription = !!payment.subscription;

//   if (!isOrder && !isSubscription) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Invalid payment type');
//   }

//   if (isOrder) {
//     const order = await orderFuel.findById(payment.orderFuelId);
//     if (!order) {
//       throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
//     }

//     try {
//       payment.isPaid = true;
//       payment.paymentIntentId = paymentIntentId;
//       await payment.save();

//       order.isPaid = true;
//       order.paymentId = payment._id;
//       order.finalAmountOfPayment = payment.amount;
//       await order.save();

//       return payment;
//     } catch (error: any) {
//       if (paymentIntentId) {
//         try {
//           await stripe.refunds.create({ payment_intent: paymentIntentId });
//         } catch (refundError) {
//           console.error('Refund failed');
//         }
//       }
//       throw new AppError(httpStatus.BAD_GATEWAY, error.message);
//     }
//   }

//   if (isSubscription) {
//     const session = await startSession();
//     try {
//       session.startTransaction();

//       const updatedPayment = await Payment.findByIdAndUpdate(
//         paymentId,
//         { isPaid: true, paymentIntentId },
//         { new: true, session },
//       ).populate('user');

//       const oldSubscription = await Subscription.findOneAndUpdate(
//         {
//           user: updatedPayment?.user,
//           isPaid: true,
//           isExpired: false,
//         },
//         {
//           isExpired: true,
//         },
//         { session },
//       );

//       const subscription = await Subscription.findById(
//         updatedPayment?.subscription,
//       )
//         .populate('package')
//         .session(session);

//       let expiredAt = moment();
//       if (
//         oldSubscription?.expiredAt &&
//         moment(oldSubscription.expiredAt).isAfter(moment())
//       ) {
//         const remainingTime = moment(oldSubscription.expiredAt).diff(moment());
//         expiredAt = moment().add(remainingTime, 'milliseconds');
//       }

//       if (subscription?.durationType) {
//         const durationDay =
//           subscription.durationType === 'monthly'
//             ? 30
//             : subscription.durationType === 'yearly'
//               ? 365
//               : 0;
//         expiredAt = expiredAt.add(durationDay, 'days');
//       }

//       await Subscription.findByIdAndUpdate(
//         updatedPayment?.subscription,
//         {
//           isPaid: true,
//           trnId: updatedPayment?.tranId,
//           expiredAt: expiredAt.toDate(),
//         },
//         { session },
//       );

//       const user = await User.findById(updatedPayment?.user).session(session);
//       const pkg = subscription?.package as IPackage;
//       const userUpdatePayload: any = {};

//       if (pkg) {
//         userUpdatePayload.freeDeliverylimit =
//           (user?.freeDeliverylimit || 0) + (pkg.freeDeliverylimit || 0);
//         userUpdatePayload.coverVehiclelimit =
//           (user?.coverVehiclelimit || 0) + (pkg.coverVehiclelimit || 0);
//         userUpdatePayload.durationDay =
//           (user?.durationDay || 0) +
//           (subscription?.durationType === 'monthly'
//             ? 30
//             : subscription?.durationType === 'yearly'
//               ? 365
//               : 0);

//         await User.findByIdAndUpdate(user?._id, userUpdatePayload, {
//           timestamps: false,
//           session,
//         });

//         await Package.findByIdAndUpdate(
//           pkg?._id,
//           { $inc: { popularity: 1 } },
//           { session },
//         );
//       }

//       await session.commitTransaction();
//       return updatedPayment;
//     } catch (error: any) {
//       await session.abortTransaction();
//       if (paymentIntentId) {
//         try {
//           await stripe.refunds.create({ payment_intent: paymentIntentId });
//         } catch (refundError: any) {
//           console.error('Refund failed:', refundError.message);
//         }
//       }
//       throw new AppError(httpStatus.BAD_GATEWAY, error.message);
//     } finally {
//       session.endSession();
//     }
//   }
// };

const confirmPayment = async (query: Record<string, any>) => {
  const { sessionId, paymentId } = query;
  // Retrieve the Stripe session
  const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntentId = stripeSession.payment_intent as string;

  if (stripeSession.status !== 'complete') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment session is not completed',
    );
  }

  // Start a session for transaction
  const session = await startSession();
  session.startTransaction();
  try {
    // Fetch the payment document
    const payment = await Payment.findById(paymentId)
      .populate('user')
      .session(session);
    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payment not found!');
    }
    const isOptionalTip = !!payment.optionalTipId;
    const isOrder = !!payment.orderFuelId;
    const isSubscription = !!payment.subscription;

    if (!isOrder && !isSubscription && !isOptionalTip) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid payment type');
    }

    if (isOrder) {
      const order = await orderFuel
        .findById(payment.orderFuelId)
        .session(session);
      if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
      }

      payment.isPaid = true;
      payment.paymentIntentId = paymentIntentId;
      await payment.save({ session });

      order.isPaid = true;
      order.paymentId = payment._id;
      order.finalAmountOfPayment = payment.amount;
      await order.save({ session });

      await session.commitTransaction();
      return payment;
    }

    if (isOptionalTip) {
      const tip = await Tip.findById(payment.optionalTipId).session(session);
      if (!tip) {
        throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
      }

      payment.isPaid = true;
      payment.paymentIntentId = paymentIntentId;
      await payment.save({ session });

      tip.isPaid = true;
      tip.paymentId = payment._id;
      tip.amount = payment.amount;
      await tip.save({ session });

      const user = await User.findById(payment.user).session(session);
      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
      }
      user.totalEarning = user.totalEarning + payment.amount;
      await user.save({ session });

      await session.commitTransaction();
      return payment;
    }

    if (isSubscription) {
      const updatedPayment = await Payment.findByIdAndUpdate(
        paymentId,
        { isPaid: true, paymentIntentId },
        { new: true, session },
      ).populate('user');

      const oldSubscription = await Subscription.findOneAndUpdate(
        {
          user: updatedPayment?.user,
          isPaid: true,
          isExpired: false,
        },
        { isExpired: true },
        { session },
      );

      const subscription = await Subscription.findById(
        updatedPayment?.subscription,
      )
        .populate('package')
        .session(session);

      let expiredAt = moment();
      if (
        oldSubscription?.expiredAt &&
        moment(oldSubscription.expiredAt).isAfter(moment())
      ) {
        const remainingTime = moment(oldSubscription.expiredAt).diff(moment());
        expiredAt = moment().add(remainingTime, 'milliseconds');
      }

      if (subscription?.durationType) {
        const durationDay =
          subscription.durationType === 'monthly'
            ? 30
            : subscription.durationType === 'yearly'
              ? 365
              : 0;
        expiredAt = expiredAt.add(durationDay, 'days');
      }

      await Subscription.findByIdAndUpdate(
        updatedPayment?.subscription,
        {
          isPaid: true,
          trnId: updatedPayment?.tranId,
          expiredAt: expiredAt.toDate(),
        },
        { session },
      );

      const user = await User.findById(updatedPayment?.user).session(session);
      const pkg = subscription?.package as IPackage;
      const userUpdatePayload: any = {};

      if (pkg) {
        // Update user fields based on the package
        userUpdatePayload.freeDeliverylimit =
          (user?.freeDeliverylimit || 0) + (pkg.freeDeliverylimit || 0);
        userUpdatePayload.coverVehiclelimit =
          (user?.coverVehiclelimit || 0) + (pkg.coverVehiclelimit || 0);
        userUpdatePayload.durationDay = userUpdatePayload.durationDay =
          subscription?.expiredAt;

        // Additional benefits from the package
        userUpdatePayload.noExtraChargeForEmergencyFuelServiceLimit =
          pkg.noExtraChargeForEmergencyFuelServiceLimit || false;
        userUpdatePayload.fiftyPercentOffDeliveryFeeAfterWaivedTrips =
          pkg.fiftyPercentOffDeliveryFeeAfterWaivedTrips || false;
        userUpdatePayload.freeSubscriptionAdditionalFamilyMember =
          pkg.freeSubscriptionAdditionalFamilyMember || false;
        userUpdatePayload.scheduledDelivery = pkg.scheduledDelivery || false;
        userUpdatePayload.fuelPriceTrackingAlerts =
          pkg.fuelPriceTrackingAlerts || false;
        userUpdatePayload.exclusivePromotionsEarlyAccess =
          pkg.exclusivePromotionsEarlyAccess || false;
        userUpdatePayload.title = pkg.title;

        // Update the user document with new package benefits
        await User.findByIdAndUpdate(user?._id, userUpdatePayload, {
          timestamps: false,
          session,
        });

        // Increment package popularity
        await Package.findByIdAndUpdate(
          pkg?._id,
          { $inc: { popularity: 1 } },
          { session },
        );
      }

      await session.commitTransaction();
      return updatedPayment;
    }
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(httpStatus.BAD_GATEWAY, error.message);
  } finally {
    session.endSession();
  }
};

const getEarnings = async () => {
  const today = moment().startOf('day');

  const earnings = await Payment.aggregate([
    {
      $match: {
        isPaid: true,
      },
    },
    {
      $facet: {
        totalEarnings: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ],
        todayEarnings: [
          {
            $match: {
              isDeleted: false,
              createdAt: {
                $gte: today.toDate(),
                $lte: today.endOf('day').toDate(),
              },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }, // Sum of today's earnings
            },
          },
        ],
        allData: [
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'userDetails',
            },
          },
          {
            $lookup: {
              from: 'subscriptions',
              localField: 'subscription',
              foreignField: '_id',
              as: 'subscriptionDetails',
            },
          },
          {
            $unwind: {
              path: '$subscriptionDetails',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'packages', // Name of the package collection
              localField: 'subscriptionDetails.package', // Field in the subscription referring to package
              foreignField: '_id', // Field in the package collection
              as: 'packageDetails',
            },
          },
          {
            $project: {
              user: { $arrayElemAt: ['$userDetails', 0] }, // Extract first user if multiple exist
              subscription: '$subscriptionDetails', // Already an object, no need for $arrayElemAt
              package: { $arrayElemAt: ['$packageDetails', 0] }, // Extract first package
              amount: 1,
              tranId: 1,
              status: 1,
              isPaid: 1,
              id: 1,
              _id: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ],
      },
    },
  ]);

  const totalEarnings =
    (earnings?.length > 0 &&
      earnings[0]?.totalEarnings?.length > 0 &&
      earnings[0]?.totalEarnings[0]?.total.toFixed(2)) ||
    0;
  const todayEarnings =
    (earnings?.length > 0 &&
      earnings[0]?.todayEarnings?.length > 0 &&
      earnings[0]?.todayEarnings[0]?.total.toFixed(2)) ||
    0;

  const allData = earnings[0]?.allData || [];

  return { totalEarnings, todayEarnings, allData };
};

// const dashboardData = async (query: Record<string, any>) => {
//   const usersData = await User.aggregate([
//     {
//       $facet: {
//         totalUsers: [{ $match: { status: 'active' } }, { $count: 'count' }],
//         userDetails: [
//           { $match: { role: { $ne: USER_ROLE.admin } } },
//           {
//             $project: {
//               _id: 1,
//               name: 1,
//               email: 1,
//               coin: 1,
//               role: 1,
//               referenceId: 1,
//               createdAt: 1,
//             },
//           },
//           {
//             $sort: { createdAt: -1 },
//           },
//           {
//             $limit: 15,
//           },
//         ],
//       },
//     },
//   ]);

//   // const today = moment().startOf('day');

//   // Calculate today's income
//   const earnings = await Payment.aggregate([
//     {
//       $match: {
//         isPaid: true,
//       },
//     },
//     {
//       $facet: {
//         totalEarnings: [
//           {
//             $group: {
//               _id: null,
//               total: { $sum: '$amount' },
//             },
//           },
//         ],
//         allData: [
//           {
//             $lookup: {
//               from: 'users',
//               localField: 'user',
//               foreignField: '_id',
//               as: 'userDetails',
//             },
//           },
//           {
//             $lookup: {
//               from: 'subscription',
//               localField: 'subscription',
//               foreignField: '_id',
//               as: 'subscription',
//             },
//           },
//           {
//             $project: {
//               user: { $arrayElemAt: ['$userDetails', 0] },
//               subscription: { $arrayElemAt: ['$subscription', 0] },
//               amount: 1,
//               tranId: 1,
//               status: 1,
//               id: 1,
//               createdAt: 1,
//               updatedAt: 1,
//             },
//           },
//           {
//             $sort: { createdAt: -1 },
//           },
//           {
//             $limit: 10,
//           },
//         ],
//       },
//     },
//   ]);

//   const totalEarnings =
//     (earnings?.length > 0 &&
//       earnings[0]?.totalEarnings?.length > 0 &&
//       earnings[0]?.totalEarnings[0]?.total) ||
//     0;

//   const totalCustomer = await User.countDocuments({ role: USER_ROLE?.user });
//   const totalServiceProvider = await User.countDocuments({
//     role: USER_ROLE?.dealer,
//   });

//   const transitionData = earnings[0]?.allData || [];

//   // Calculate monthly income
//   const year = query.incomeYear ? query.incomeYear : moment().year();
//   const startOfYear = moment().year(year).startOf('year');
//   const endOfYear = moment().year(year).endOf('year');

//   const monthlyIncome = await Payment.aggregate([
//     {
//       $match: {
//         isPaid: true,
//         createdAt: {
//           $gte: startOfYear.toDate(),
//           $lte: endOfYear.toDate(),
//         },
//       },
//     },
//     {
//       $group: {
//         _id: { month: { $month: '$createdAt' } },
//         income: { $sum: '$amount' },
//       },
//     },
//     {
//       $sort: { '_id.month': 1 },
//     },
//   ]);

//   // Format monthly income to have an entry for each month
//   const formattedMonthlyIncome = Array.from({ length: 12 }, (_, index) => ({
//     month: moment().month(index).format('MMM'),
//     income: 0,
//   }));

//   monthlyIncome.forEach(entry => {
//     formattedMonthlyIncome[entry._id.month - 1].income = Math.round(
//       entry.income,
//     );
//   });

//   // Calculate monthly income
//   // JoinYear: '2022', role: ''
//   const userYear = query?.JoinYear ? query?.JoinYear : moment().year();
//   const startOfUserYear = moment().year(userYear).startOf('year');
//   const endOfUserYear = moment().year(userYear).endOf('year');

//   const monthlyUser = await User.aggregate([
//     {
//       $match: {
//         status: 'active',
//         createdAt: {
//           $gte: startOfUserYear.toDate(),
//           $lte: endOfUserYear.toDate(),
//         },
//       },
//     },
//     {
//       $group: {
//         _id: { month: { $month: '$createdAt' } },
//         total: { $sum: 1 }, // Corrected to count the documents
//       },
//     },
//     {
//       $sort: { '_id.month': 1 },
//     },
//   ]);

//   // Format monthly income to have an entry for each month
//   const formattedMonthlyUsers = Array.from({ length: 12 }, (_, index) => ({
//     month: moment().month(index).format('MMM'),
//     total: 0,
//   }));

//   monthlyUser.forEach(entry => {
//     formattedMonthlyUsers[entry._id.month - 1].total = Math.round(entry.total);
//   });

//   return {
//     totalUsers: usersData[0]?.totalUsers[0]?.count || 0,
//     totalCustomer,
//     totalServiceProvider,
//     transitionData,
//     totalIncome: totalEarnings,

//     // toDayIncome: todayEarnings,

//     monthlyIncome: formattedMonthlyIncome,
//     monthlyUsers: formattedMonthlyUsers,
//     userDetails: usersData[0]?.userDetails,
//   };
// };

// const dashboardData = async (query: Record<string, any>) => {
//   // Query for totalUsers and userDetails separately
//   const totalUsers = await User.aggregate([
//     { $match: { status: 'active' } },
//     { $count: 'count' },
//   ]);

//   const userDetails = await User.aggregate([
//     { $match: { role: { $ne: USER_ROLE.admin } } },
//     {
//       $project: {
//         _id: 1,
//         name: 1,
//         email: 1,
//         coin: 1,
//         role: 1,
//         referenceId: 1,
//         createdAt: 1,
//       },
//     },
//     { $sort: { createdAt: -1 } },
//     { $limit: 15 },
//   ]);

//   // Calculate today's earnings
//   const earnings = await Payment.aggregate([
//     { $match: { isPaid: true } },
//     {
//       $lookup: {
//         from: 'users',
//         localField: 'user',
//         foreignField: '_id',
//         as: 'userDetails',
//       },
//     },
//     {
//       $lookup: {
//         from: 'subscription',
//         localField: 'subscription',
//         foreignField: '_id',
//         as: 'subscription',
//       },
//     },
//     {
//       $project: {
//         user: { $arrayElemAt: ['$userDetails', 0] },
//         subscription: { $arrayElemAt: ['$subscription', 0] },
//         amount: 1,
//         tranId: 1,
//         status: 1,
//         id: 1,
//         createdAt: 1,
//         updatedAt: 1,
//       },
//     },
//     { $sort: { createdAt: -1 } },
//     { $limit: 10 },
//   ]);

//   const totalEarnings =
//     (earnings?.length > 0 &&
//       earnings[0]?.totalEarnings?.length > 0 &&
//       earnings[0]?.totalEarnings[0]?.total) ||
//     0;

//   const totalCustomer = await User.countDocuments({ role: USER_ROLE?.user });
//   const totalServiceProvider = await User.countDocuments({
//     role: USER_ROLE?.user,
//   });

//   const transitionData = earnings || [];

//   // Calculate monthly income
//   const year = query.incomeYear ? query.incomeYear : moment().year();
//   const startOfYear = moment().year(year).startOf('year');
//   const endOfYear = moment().year(year).endOf('year');

//   const monthlyIncome = await Payment.aggregate([
//     {
//       $match: {
//         isPaid: true,
//         createdAt: {
//           $gte: startOfYear.toDate(),
//           $lte: endOfYear.toDate(),
//         },
//       },
//     },
//     {
//       $group: {
//         _id: { month: { $month: '$createdAt' } },
//         income: { $sum: '$amount' },
//       },
//     },
//     { $sort: { '_id.month': 1 } },
//   ]);

//   // Format monthly income to have an entry for each month
//   const formattedMonthlyIncome = Array.from({ length: 12 }, (_, index) => ({
//     month: moment().month(index).format('MMM'),
//     income: 0,
//   }));

//   monthlyIncome.forEach(entry => {
//     formattedMonthlyIncome[entry._id.month - 1].income = Math.round(
//       entry.income,
//     );
//   });

//   // Calculate monthly user registrations
//   const userYear = query?.JoinYear ? query?.JoinYear : moment().year();
//   const startOfUserYear = moment().year(userYear).startOf('year');
//   const endOfUserYear = moment().year(userYear).endOf('year');

//   const monthlyUser = await User.aggregate([
//     {
//       $match: {
//         status: 'active',
//         createdAt: {
//           $gte: startOfUserYear.toDate(),
//           $lte: endOfUserYear.toDate(),
//         },
//       },
//     },
//     {
//       $group: {
//         _id: { month: { $month: '$createdAt' } },
//         total: { $sum: 1 }, // Corrected to count the documents
//       },
//     },
//     { $sort: { '_id.month': 1 } },
//   ]);

//   // Format monthly users to have an entry for each month
//   const formattedMonthlyUsers = Array.from({ length: 12 }, (_, index) => ({
//     month: moment().month(index).format('MMM'),
//     total: 0,
//   }));

//   monthlyUser.forEach(entry => {
//     formattedMonthlyUsers[entry._id.month - 1].total = Math.round(entry.total);
//   });

//   return {
//     totalUsers: totalUsers[0]?.count || 0,
//     totalCustomer,
//     totalServiceProvider,
//     transitionData,
//     totalIncome: totalEarnings,
//     monthlyIncome: formattedMonthlyIncome,
//     monthlyUsers: formattedMonthlyUsers,
//     userDetails,
//   };
// };

const dashboardData = async (query: Record<string, any>) => {
  const usersData = await User.aggregate([
    {
      $facet: {
        totalUsers: [
          { $match: { 'verification.status': true } },
          { $count: 'count' },
        ],
        userDetails: [
          { $match: { role: { $ne: USER_ROLE.admin } } },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              coin: 1,
              role: 1,
              referenceId: 1,
              createdAt: 1,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 15,
          },
        ],
      },
    },
  ]);

  // const today = moment().startOf('day');

  // Calculate today's income
  const earnings = await Payment.aggregate([
    {
      $match: {
        isPaid: true,
      },
    },
    {
      $facet: {
        totalEarnings: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ],
        allData: [
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'userDetails',
            },
          },
          {
            $lookup: {
              from: 'subscription',
              localField: 'subscription',
              foreignField: '_id',
              as: 'subscription',
            },
          },
          {
            $project: {
              user: { $arrayElemAt: ['$userDetails', 0] },
              subscription: { $arrayElemAt: ['$subscription', 0] },
              amount: 1,
              tranId: 1,
              status: 1,
              id: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 10,
          },
        ],
      },
    },
  ]);

  const totalEarnings =
    (earnings?.length > 0 &&
      earnings[0]?.totalEarnings?.length > 0 &&
      earnings[0]?.totalEarnings[0]?.total) ||
    0;

  const totalMember = await User.countDocuments({ role: USER_ROLE?.user });
  const totalAdministrator = await User.countDocuments({
    role: USER_ROLE?.driver,
  });

  const transitionData = earnings[0]?.allData || [];

  // Calculate monthly income
  const year = query.incomeYear ? query.incomeYear : moment().year();
  const startOfYear = moment().year(year).startOf('year');
  const endOfYear = moment().year(year).endOf('year');

  const monthlyIncome = await Payment.aggregate([
    {
      $match: {
        isPaid: true,
        createdAt: {
          $gte: startOfYear.toDate(),
          $lte: endOfYear.toDate(),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        income: { $sum: '$amount' },
      },
    },
    {
      $sort: { '_id.month': 1 },
    },
  ]);

  // Format monthly income to have an entry for each month
  const formattedMonthlyIncome = Array.from({ length: 12 }, (_, index) => ({
    month: moment().month(index).format('MMM'),
    income: 0,
  }));

  monthlyIncome.forEach(entry => {
    formattedMonthlyIncome[entry._id.month - 1].income = Math.round(
      entry.income,
    );
  });

  // Calculate monthly income
  // JoinYear: '2022', role: ''
  const userYear = query?.JoinYear ? query?.JoinYear : moment().year();
  const startOfUserYear = moment().year(userYear).startOf('year');
  const endOfUserYear = moment().year(userYear).endOf('year');

  const roleFilter = query.role
    ? { role: query.role }
    : { role: { $in: [USER_ROLE.user, USER_ROLE.driver] } };

  const monthlyUser = await User.aggregate([
    {
      $match: {
        'verification.status': true,
        ...roleFilter, // Include both 'member' and 'administrator'
        createdAt: {
          $gte: startOfUserYear.toDate(),
          $lte: endOfUserYear.toDate(),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } }, // Group by month
        total: { $sum: 1 }, // Count users
      },
    },
    {
      $sort: { '_id.month': 1 }, // Ensure sorting from Jan-Dec
    },
  ]);
  // return monthlyUser;
  // Format monthly income to have an entry for each month
  const formattedMonthlyUsers = Array.from({ length: 12 }, (_, index) => ({
    month: moment().month(index).format('MMM'),
    total: 0,
  }));

  monthlyUser.forEach(entry => {
    formattedMonthlyUsers[entry._id.month - 1].total = Math.round(entry.total);
  });

  return {
    totalUsers: usersData[0]?.totalUsers[0]?.count || 0,
    totalMember,
    totalAdministrator,
    // transitionData,
    totalIncome: totalEarnings,

    // toDayIncome: todayEarnings,

    // monthlyIncome: formattedMonthlyIncome,
    monthlyUsers: formattedMonthlyUsers,
    // userDetails: usersData[0]?.userDetails,
  };
};

const getAllPayments = async () => {
  // Ensure that year and month are valid numbers
  // const parsedYear = Number(year);
  // const parsedMonth = Number(month);

  // if (
  //   isNaN(parsedYear) ||
  //   isNaN(parsedMonth) ||
  //   parsedMonth < 0 ||
  //   parsedMonth > 11
  // ) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Invalid year or month');
  // }

  // console.log('Parsed year:', parsedYear, 'Parsed month:', parsedMonth); // Debugging logs

  // const startDate = new Date(parsedYear, parsedMonth, 1); // Start of the given month
  // const endDate = new Date(parsedYear, parsedMonth + 1, 1); // Start of the next month

  // if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Invalid date range');
  // }

  const result = await Payment.find({ isPaid: true })
    // createdAt: { $gte: startDate, $lt: endDate }, // Payments within the month
    .populate('user');

  return result;
};

const getPaymentsByUserId = async (
  userId: string,
  query: Record<string, any>,
) => {
  const paymentQueryBuilder = new QueryBuilder(
    Payment.find({ user: userId, isPaid: true })
      .populate({
        path: 'subscription',
        populate: { path: 'package' },
      })
      .populate('user'),
    query,
  )
    .search(['paymentStatus', 'transactionId', 'subscription.name'])
    .filter()
    .paginate()
    .sort();

  const data: any = await paymentQueryBuilder.modelQuery;
  const meta = await paymentQueryBuilder.countTotal();

  // if (!data || data.length === 0) {
  //   throw new AppError(httpStatus.NOT_FOUND, 'No payments found for the user');
  // }

  return {
    data,
    meta,
  };
};

// Get a payment by ID
const getPaymentsById = async (id: string) => {
  const payment = await Payment.findById(id);
  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }
  return payment;
};

// Update a payment by ID
const updatePayments = async (id: string, updatedData: IPayment) => {
  const updatedPayment = await Payment.findByIdAndUpdate(id, updatedData, {
    new: true,
  });
  if (!updatedPayment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found to update');
  }
  return updatedPayment;
};

// Delete a payment by ID
const deletePayments = async (id: string) => {
  const deletedPayment = await Payment.findByIdAndDelete(id);
  if (!deletedPayment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found to delete');
  }
  return deletedPayment;
};

// const generateInvoice = async (payload: any) => {
//   const existingInvoice = await invoice
//     .findOne({ paymentId: payload })
//     .populate([
//       {
//         path: 'paymentId',
//         populate: [
//           {
//             path: 'user',
//           },
//           {
//             path: 'subscription',
//             populate: { path: 'package', model: 'Package' },
//           },
//         ],
//       },
//     ]);
//   if (existingInvoice) {
//     return existingInvoice;
//   }
//   const payment = await Payment.findById(payload)
//     .populate({
//       path: 'user',
//       model: User,
//       strictPopulate: false,
//     })
//     .populate({
//       path: 'subscription',
//       model: Subscription,
//       strictPopulate: false,
//       populate: {
//         path: 'package',
//         model: 'Package',
//       },
//     });
//   if (!payment) {
//     throw new Error('Payment not found');
//   }
//   const users = payment.user as IUser;
//   // if (users.vat_status !== 'valid') {
//   //   throw new Error('VAT status is not valid for the user');
//   // }
//   const vatAmount = users.vat_type === 'Romania' ? 0.19 : 0;

//   const packageAmount =
//     ((payment.subscription as ISubscriptions).package as IPackage)?.price || 0;
//   const totalAmount = packageAmount * (1 + vatAmount);
//   const invoiceNumber = `INV-${Date.now()}`;
//   const invoiceDate = new Date();
//   const invoices = new invoice({
//     paymentId: payment._id,
//     invoiceNumber,
//     invoiceDate,
//     totalAmount: totalAmount.toFixed(2), // Store total amount as a string
//   });

//   const result = await (
//     await invoice.create(invoices)
//   ).populate([
//     {
//       path: 'paymentId',
//       populate: [
//         {
//           path: 'user',
//           select: 'name phoneNumber companyName dealership vat_type vat_status',
//         },
//         { path: 'subscription', populate: { path: 'package' } },
//       ],
//     },
//   ]);
//   // Respond with the invoice details
//   return result;
// };

const SubscriptionCheckout = async (payload: IPayment) => {
  const tranId = generateRandomString(10);
  let paymentData: IPayment;
  const subscription: ISubscriptions | null = await Subscription.findById(
    payload?.subscription,
  ).populate('package');

  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription Not Found!');
  }

  // Check for existing unpaid payment for the subscription
  const isExistPayment: IPayment | null = await Payment.findOne({
    subscription: payload?.subscription,
    isPaid: false,
    user: payload?.user,
  });

  const user = await User.findById(payload?.user);
  let amount = 0;
  amount = subscription?.amount;
  // if (subscription?.durationType === 'monthly') {
  //   amount = subscription?.package?.monthlyPrice || 0;
  // } else if (subscription?.durationType === 'yearly') {
  //   amount = subscription?.package?.yearlyPrice || 0;
  // }

  if (isExistPayment) {
    const payment = await Payment.findByIdAndUpdate(
      isExistPayment?._id,
      { tranId },
      { new: true },
    );

    paymentData = payment as IPayment;
    paymentData.amount = amount;
  } else {
    payload.tranId = tranId;
    payload.amount = amount;
    const createdPayment = await Payment.create(payload);
    if (!createdPayment) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to create payment',
      );
    }
    paymentData = createdPayment;
  }

  const checkoutSession = await createCheckoutSession({
    product: {
      amount: paymentData?.amount,
      //@ts-ignore
      name: subscription?.package?.title,
      quantity: 1,
    },
    //@ts-ignore
    paymentId: paymentData?._id,
  });

  return checkoutSession?.url;
};

const SubscriptionConfirmPayment = async (query: Record<string, any>) => {
  const { sessionId, paymentId } = query;
  const session = await startSession();
  const PaymentSession = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntentId = PaymentSession.payment_intent as string;

  if (PaymentSession.status !== 'complete') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment session is not completed',
    );
  }

  try {
    session.startTransaction();

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { isPaid: true, paymentIntentId: paymentIntentId },
      { new: true, session },
    ).populate('user');

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payment Not Found!');
    }

    const oldSubscription = await Subscription.findOneAndUpdate(
      {
        user: payment?.user,
        isPaid: true,
        isExpired: false,
      },
      {
        isExpired: true,
      },
      { upsert: false, session },
    );

    const subscription: ISubscriptions | null = await Subscription.findById(
      payment?.subscription,
    )
      .populate('package')
      .session(session);

    let expiredAt = moment();

    if (
      oldSubscription?.expiredAt &&
      moment(oldSubscription.expiredAt).isAfter(moment())
    ) {
      const remainingTime = moment(oldSubscription.expiredAt).diff(moment());
      expiredAt = moment().add(remainingTime, 'milliseconds');
    }

    if (subscription?.durationType) {
      expiredAt = expiredAt;
    }

    await Subscription.findByIdAndUpdate(
      payment?.subscription,
      {
        isPaid: true,
        trnId: payment?.tranId,
        expiredAt: expiredAt.toDate(),
      },
      { session },
    ).populate('package');

    const user = await User.findById(payment?.user).session(session);

    const packageDetails = subscription?.package as IPackage;
    const newUser: any = {};
    if (packageDetails) {
      newUser['freeDeliverylimit'] =
        (user?.freeDeliverylimit || 0) +
        (packageDetails.freeDeliverylimit || 0);
      newUser['coverVehiclelimit'] =
        (user?.coverVehiclelimit || 0) +
        (packageDetails.coverVehiclelimit || 0);

      let additionalDays = 0;
      if (subscription?.durationType === 'monthly') {
        additionalDays = 30;
      } else if (subscription?.durationType === 'yearly') {
        additionalDays = 365;
      }

      // newUser['durationDay'] = (user?.durationDay || 0) + additionalDays;

      await User.findByIdAndUpdate(user?._id, newUser, {
        timestamps: false,
        session,
      });
    }

    await Package.findByIdAndUpdate(
      packageDetails?._id,
      { $inc: { popularity: 1 } },
      { upsert: false, new: true, session },
    );
    await session.commitTransaction();
    return payment;
  } catch (error: any) {
    console.error('Error processing payment:', error);
    await session.abortTransaction();

    if (paymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: paymentIntentId });
      } catch (refundError: any) {
        console.error('Error processing refund:', refundError.message);
      }
    }

    throw new AppError(httpStatus.BAD_GATEWAY, error.message);
  } finally {
    session.endSession();
  }
};
export const paymentsService = {
  // createPayments,
  getAllPayments,
  getPaymentsById,
  updatePayments,
  deletePayments,
  checkout,
  confirmPayment,
  dashboardData,
  getEarnings,
  getPaymentsByUserId,
  // generateInvoice,
  SubscriptionConfirmPayment,
  SubscriptionCheckout,
  tipCheckout,
};
