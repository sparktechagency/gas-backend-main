import { Schema, model } from 'mongoose';
import { ITip } from './optionalTip.interface';

const tipSchema: Schema<ITip> = new Schema(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Assuming 'User' is your driver model
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment', // Assuming 'Payment' is your payment model
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

export const Tip = model<ITip>('Tip', tipSchema);
