import { Model } from 'mongoose';
import { ObjectId } from 'mongoose';

export interface ITip {
  _id: string;
  driverId: ObjectId;
  amount: number;
  paymentId: ObjectId;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}
