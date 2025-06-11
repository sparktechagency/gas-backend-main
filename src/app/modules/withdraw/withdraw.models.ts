import { Schema, model } from 'mongoose';
import { Iwithdraw } from './withdraw.interface';

const withdrawSchema = new Schema<Iwithdraw>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    withdrawAmount: { type: Number, required: true },
    totalWithdrawAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true },
);

export const Withdraw = model<Iwithdraw>('Withdraw', withdrawSchema);
