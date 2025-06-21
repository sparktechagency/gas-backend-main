import { Iwithdraw } from './withdraw.interface';

import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { User } from '../user/user.models';
import { Withdraw } from './withdraw.models';
import QueryBuilder from '../../builder/QueryBuilder';

 

const createwithdraw = async (payload: Iwithdraw) => {
  const user = await User.findById(payload.userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if ((user.totalEarning || 0) < payload.withdrawAmount) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Insufficient balance');
  }

  const withdraw = await Withdraw.create(payload);

  // Subtract from totalEarning using $inc
  await User.findByIdAndUpdate(payload.userId, {
    $inc: { totalEarning: -payload.withdrawAmount },
  });

  return withdraw;
};

const getAllwithdraw = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(
    Withdraw.find().populate('userId'),
    query,
  )
    .search(['status']) // optional: add searchable fields if applicable
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();
  return { data, meta };
};

const getwithdrawById = async (id: string) => {
  return Withdraw.findById(id).populate('userId');
};

const updatewithdraw = async (id: string, payload: Partial<Iwithdraw>) => {
  return Withdraw.findByIdAndUpdate(id, payload, { new: true });
};

const deletewithdraw = async (id: string) => {
  return Withdraw.findByIdAndDelete(id);
};

export const withdrawService = {
  createwithdraw,
  getAllwithdraw,
  getwithdrawById,
  updatewithdraw,
  deletewithdraw,
};
