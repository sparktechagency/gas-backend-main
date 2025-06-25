import Stripe from 'stripe';
import config from '../../config';
import {
  DashboardData,
  DashboardQuery,
  IPayment,
  MonthlyIncome,
  MonthlyUsers,
} from './payments.interface';
import { ISubscriptions } from '../subscription/subscription.interface';
import Subscription from '../subscription/subscription.models';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import Payment from './payments.models';
import { User } from '../user/user.models';
import { createCheckoutSession, initializeMonthlyData } from './payments.utils';
import { startSession } from 'mongoose';
import { IPackage } from '../packages/packages.interface';
import { USER_ROLE } from '../user/user.constants';
import generateRandomString from '../../utils/generateRandomString';
import moment from 'moment';
import Package from '../packages/packages.models';
import QueryBuilder from '../../builder/QueryBuilder';
import { orderFuel } from '../orderFuel/orderFuel.models';
import { Tip } from '../optionalTip/optionalTip.models';
import { Withdraw } from '../withdraw/withdraw.models';
import { PAYMENT_TYPE } from './payments.constants';
import { CouponModel } from '../coupon/coupon.models';
import dayjs from 'dayjs';

const stripe = new Stripe(config.stripe?.stripe_api_secret as string, {
  apiVersion: '2024-06-20',
  typescript: true,
});

const checkout = async (payload: IPayment) => {
  const tranId = generateRandomString(10);
  let paymentData: IPayment;
  console.log('🚀 ~ checkout ~ payload:', payload);
  if (payload?.couponCode) {
    const order = await orderFuel.findById(payload?.orderFuelId);
    console.log('🚀 ~ checkout ~ order:', order);
    if (!order) {
      throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
    }
    if (order?.cuponCode) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Coupon code already applied to this order',
      );
    }
    const coupon = await CouponModel.findByCouponCode(payload?.couponCode);
    if (!coupon) {
      throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found!');
    }

    const isExpired = dayjs().isAfter(dayjs(coupon.expiryDate));
    if (isExpired) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Coupon has expired');
    }

    if (
      (coupon.service as any) !== 'ALL' &&
      order.orderType.toLowerCase() !== String(coupon.service).toLowerCase()
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This coupon is not valid for ${order.orderType} service`,
      );
    }
    const discountAmount = (order.finalAmountOfPayment * coupon.discount) / 100;
    await orderFuel.findByIdAndUpdate(
      order._id,
      {
        $inc: { finalAmountOfPayment: -discountAmount },
        cuponCode: payload?.couponCode,
      },
      { new: true },
    );
  }
  const order = await orderFuel.findById(payload?.orderFuelId);
  console.log('🚀 ~ checkout ~ new Orders:', order);
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
      { tranId, finalAmountOfPayment: amount },
      { new: true },
    );
    paymentData = updatedPayment as IPayment;
  } else {
    payload.tranId = tranId;
    payload.amount = amount;
    payload.paymentType = PAYMENT_TYPE.order;
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
    payload.paymentType = PAYMENT_TYPE.tip;
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
      payment.status = 'paid';
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
      payment.status = 'paid';
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
        { isPaid: true, status: 'paid', paymentIntentId },
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

const dashboardData = async (query: DashboardQuery): Promise<DashboardData> => {
  // Normalize query parameters
  const incomeYear = query.incomeYear || moment().year();
  const userYear = query.joinYear || moment().year();
  const roleFilter = query.role
    ? { role: query.role }
    : { role: { $in: [USER_ROLE.user, USER_ROLE.driver] } };

  console.log(roleFilter);
  // Aggregate user data
  const usersData = await User.aggregate([
    {
      $facet: {
        totalUsers: [
          { $match: { 'verification.status': true } },
          { $count: 'count' },
        ],
        totalDrivers: [
          { $match: { 'verification.status': true, role: USER_ROLE.driver } },
          { $count: 'count' },
        ],
        totalCustomers: [
          { $match: { 'verification.status': true, role: USER_ROLE.user } },
          { $count: 'count' },
        ],
        monthlyUsers: [
          {
            $match: {
              'verification.status': true,
              ...roleFilter,
              createdAt: {
                $gte: moment().year(userYear).startOf('year').toDate(),
                $lte: moment().year(userYear).endOf('year').toDate(),
              },
            },
          },
          {
            $group: {
              _id: { month: { $month: '$createdAt' } },
              total: { $sum: 1 },
            },
          },
          { $sort: { '_id.month': 1 } },
        ],
      },
    },
  ]).then(data => data[0]);

  //total payout
  const totalPayout = await Withdraw.aggregate([
    {
      $match: {
        status: 'Approved',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$withdrawAmount' },
      },
    },
  ]).then(data => (data.length > 0 ? data[0].total : 0));
  // Aggregate payment data
  const earnings = await Payment.aggregate([
    {
      $match: { isPaid: true },
    },
    {
      $facet: {
        totalEarnings: [
          {
            $group: { _id: null, total: { $sum: '$amount' } },
          },
        ],
        toDayEarnings: [
          {
            $match: {
              createdAt: {
                $gte: moment().startOf('day').toDate(),
                $lte: moment().endOf('day').toDate(),
              },
            },
          },
          {
            $group: { _id: null, total: { $sum: '$amount' } },
          },
        ],
        monthlyIncome: [
          {
            $match: {
              createdAt: {
                $gte: moment().year(incomeYear).startOf('year').toDate(),
                $lte: moment().year(incomeYear).endOf('year').toDate(),
              },
            },
          },
          {
            $group: {
              _id: { month: { $month: '$createdAt' } },
              income: { $sum: '$amount' },
            },
          },
          { $sort: { '_id.month': 1 } },
        ],
      },
    },
  ]).then(data => data[0]);

  // Extract user counts
  const totalUsers = usersData.totalUsers[0]?.count || 0;
  const totalDriver = usersData.totalDrivers[0]?.count || 0;
  const totalCustomers = usersData.totalCustomers[0]?.count || 0;

  // Format monthly income
  const monthlyIncome = initializeMonthlyData('income') as MonthlyIncome[];
  earnings.monthlyIncome.forEach(
    ({ _id, income }: { _id: { month: number }; income: number }) => {
      monthlyIncome[_id.month - 1].income = Math.round(income);
    },
  );

  // Format monthly users
  const monthlyUsers = initializeMonthlyData('total') as MonthlyUsers[];
  usersData.monthlyUsers.forEach(
    ({ _id, total }: { _id: { month: number }; total: number }) => {
      monthlyUsers[_id.month - 1].total = Math.round(total);
    },
  );

  return {
    totalUsers,
    totalCustomers,
    totalDriver,
    totalPayout,
    toDayIncome: earnings.toDayEarnings[0]?.total || 0,
    totalIncome: earnings.totalEarnings[0]?.total || 0,
    monthlyIncome,
    monthlyUsers,
  };
};

const getAllPayments = async () => {
  const result = await Payment.find({ isPaid: true }).populate('user');
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

const refundPayment = async (id: string): Promise<void> => {
  const payment = await Payment.findById(id);

  if (!payment || payment.paymentType !== PAYMENT_TYPE.order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }
  if (!payment?.paymentIntentId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment intent ID not found');
  }

  if (payment.status === 'refunded') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment already refunded');
  }

  try {
    await stripe.refunds.create({
      payment_intent: payment.paymentIntentId,
      amount: Math.round(payment.amount * 100), // Convert to cents
    });

    await Payment.findByIdAndUpdate(id, { status: 'refunded' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refund failed';
    throw new AppError(httpStatus.BAD_REQUEST, message);
  }
};

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
    payload.paymentType = PAYMENT_TYPE.subscription;
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
  refundPayment,
};
