import { model, Schema } from 'mongoose';
import { IPayment, ISubscriptionsModel } from './payments.interface';

// Define the Mongoose schema
const PaymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscriptions',
    },
    orderFuelId: {
      type: Schema.Types.ObjectId,
      ref: 'OrderFuel',
    },
    optionalTipId: {
      type: Schema.Types.ObjectId,
      ref: 'Tip',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentType: {
      type: String,
      enum: ['subscription', 'order', 'tip'],
      default: 'cash',
    },
    paymentIntentId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    tranId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

PaymentSchema.pre('find', function (next) {
  //@ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

PaymentSchema.pre('findOne', function (next) {
  //@ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

// PaymentSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
//   next();
// });
// Create and export the model
const Payment = model<IPayment, ISubscriptionsModel>('Payment', PaymentSchema);

export default Payment;
