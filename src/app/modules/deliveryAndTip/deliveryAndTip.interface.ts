import { Model, ObjectId } from 'mongoose';
export interface IDeliveryAndTip {
  name: string;
  price: number;
  driverAmount: number;
  adminAmount: number;
  zipCode: string[];
}

export type IDeliveryAndTipModels = Model<
  IDeliveryAndTip,
  Record<string, unknown>
>;
