import { Schema, model } from 'mongoose';
import { Idelivery, IDeliveryModel } from './delivery.interface';

const deliverySchema: Schema<Idelivery> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'orderFuel',
    },
    status: {
      type: String,
      enum: ['accept', 'ontheway', 'delivered'],
      required: true,
      default: 'accept',
    },
    proofImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

deliverySchema.statics.getByOrderId = async (orderId: string) => {
  return await Delivery.findOne({ orderId });
};
export const Delivery = model<Idelivery, IDeliveryModel>(
  'Delivery',
  deliverySchema,
);
