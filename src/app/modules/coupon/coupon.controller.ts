// src/modules/coupon/coupon.controller.ts
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { couponService } from './coupon.service';
import sendResponse from '../../utils/sendResponse';

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.createCoupon(req.body);
  res.status(201).json({ success: true, data: result });
});

const getAllCoupons = catchAsync(async (_req: Request, res: Response) => {
  const result = await couponService.getAllCoupons();
  res.status(200).json({ success: true, data: result });
});

const getCouponById = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.getCouponById(req.params.id);
  if (!result) {
    return res
      .status(404)
      .json({ success: false, message: 'Coupon not found' });
  }
  res.status(200).json({ success: true, data: result });
});

const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.updateCoupon(req.params.id, req.body);
  if (!result) {
    return res
      .status(404)
      .json({ success: false, message: 'Coupon not found or update failed' });
  }
  res.status(200).json({ success: true, data: result });
});

const checkCouponCode = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.checkCouponCode(req.params.code);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'coupon data get successfully',
    data: result,
  });
});
const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.deleteCoupon(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'coupon deleted successfully',
    data: result,
  });
});

export const couponController = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  checkCouponCode,
};
