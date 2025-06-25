// src/modules/coupon/coupon.service.ts
import { Types } from 'mongoose';
import { ICoupon } from './coupon.interface';
import { CouponModel } from './coupon.models';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';

const createCoupon = async (payload: ICoupon): Promise<ICoupon> => {
  return CouponModel.create(payload);
};

const getAllCoupons = async (): Promise<ICoupon[]> => {
  return CouponModel.find().sort({ createdAt: -1 });
};

const getCouponById = async (id: string): Promise<ICoupon | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return CouponModel.findById(id);
};
const checkCouponCode = async (code: string): Promise<ICoupon | null> => {
  const coupon = await CouponModel.findByCouponCode(code);
  if (!coupon) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Coupon not found');
  }

  return coupon;
};

const updateCoupon = async (
  id: string,
  payload: Partial<ICoupon>,
): Promise<ICoupon | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return CouponModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const deleteCoupon = async (id: string): Promise<ICoupon | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return CouponModel.findByIdAndDelete(id);
};

export const couponService = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  checkCouponCode,
};
