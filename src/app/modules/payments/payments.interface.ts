import { Model, ObjectId } from 'mongoose';
import { IUser } from '../user/user.interface';
import { ISubscriptions } from '../subscription/subscription.interface';
import { IOrderFuel } from '../orderFuel/orderFuel.interface';
import { ITip } from '../optionalTip/optionalTip.interface';

export interface IPayment {
  _id?: ObjectId;
  user: ObjectId | IUser;
  subscription: ObjectId | ISubscriptions;
  orderFuelId: ObjectId | IOrderFuel;
  optionalTipId: ObjectId | ITip;
  amount: number;
  tranId: string;
  paymentIntentId: string;
  isPaid: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ISubscriptionsModel = Model<IPayment, Record<string, unknown>>;
