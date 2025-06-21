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
  paymentType: string; // 'subscription' | 'order' | 'tip'
  optionalTipId: ObjectId | ITip;
  amount: number;
  tranId: string;
  paymentIntentId: string;
  isPaid: boolean;
  isDeleted: boolean;
  stripeChId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ISubscriptionsModel = Model<IPayment, Record<string, unknown>>;

export interface DashboardQuery {
  incomeYear?: number;
  joinYear?: number;
  role?: string;
}

export interface MonthlyIncome {
  month: string;
  income: number;
}

export interface MonthlyUsers {
  month: string;
  total: number;
}

export interface DashboardData {
  totalUsers: number;
  totalPayout: number;
  totalCustomers: number;
  totalDriver: number;
  totalIncome: number;
  toDayIncome: number;
  monthlyIncome: MonthlyIncome[];
  monthlyUsers: MonthlyUsers[];
}
