import { Model, ObjectId } from "mongoose";
import { IServices } from "../services/services.interface";

export interface ICoupon {
  couponName: string;
  expiryDate: string; // store as ISO string
  couponCode: string;
  discount: number;
  service: ObjectId | IServices;
  isActive?: boolean;
}

export interface ICouponModel extends Model<ICoupon, Record<string, unknown>> {
  findByCouponCode(email: string): Promise<ICoupon>;
}
