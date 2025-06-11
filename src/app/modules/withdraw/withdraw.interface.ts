import { ObjectId } from 'mongoose';

export interface Iwithdraw {
  userId: ObjectId;
  withdrawAmount: number;
  totalWithdrawAmount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}
