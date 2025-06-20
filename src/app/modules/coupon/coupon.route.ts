// src/modules/coupon/coupon.routes.ts
import { Router } from 'express';
import { couponController } from './coupon.controller';

const router = Router();

router.post('/create', couponController.createCoupon);
router.patch('/update/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);
router.get('/check/:code', couponController.checkCouponCode);
router.get('/:id', couponController.getCouponById);
router.get('/', couponController.getAllCoupons);

export const couponRoutes = router;
