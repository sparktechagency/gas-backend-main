// src/modules/coupon/coupon.model.ts
import { Schema, model } from 'mongoose';
import { ICoupon, ICouponModel } from './coupon.interface';

const couponSchema: Schema<ICoupon> = new Schema<ICoupon>(
  {
    couponName: { type: String, required: true, trim: true },
    expiryDate: { type: String, required: true }, // store as ISO string
    couponCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discount: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    service: {
      type: Schema.Types.Mixed,
      required: true,
      ref: 'Services',
    },
  },
  {
    timestamps: true,
  },
);

couponSchema.statics.findByCouponCode = async function (code: string) {
  return await CouponModel.findOne({ couponCode: code });
};

export const CouponModel = model<ICoupon, ICouponModel>('Coupon', couponSchema);
