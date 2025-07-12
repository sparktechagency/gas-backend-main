// src/modules/deliveryAndTip/deliveryAndTip.model.ts
import { Schema, model, Document } from 'mongoose';
import {
  IDeliveryAndTip,
  IDeliveryAndTipModels,
} from './deliveryAndTip.interface';

const deliveryAndTipSchema = new Schema<IDeliveryAndTip>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    adminAmount: {
      type: Number,
      require: true,
      min: 0,
      default: 0,
    },
    driverAmount: {
      type: Number,
      require: true,
      min: 0,
      default: 0,
    },
    zipCode: { type: [String], required: true },
  },
  { timestamps: true },
);

export const DeliveryAndTipModel = model<
  IDeliveryAndTip,
  IDeliveryAndTipModels
>('DeliveryAndTip', deliveryAndTipSchema);
