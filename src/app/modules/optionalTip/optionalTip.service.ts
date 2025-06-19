// src/modules/optionalTip/optionalTip.service.ts

import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { ITip } from './optionalTip.interface';
import { Tip } from './optionalTip.models';
import { User } from '../user/user.models';

const createoptionalTip = async (payload: ITip) => {
  // Step 1: Create the tip
  const result = await Tip.create(payload);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create tip');
  }

  // Step 2: Add tip amount to the driver's totalEarning
  const updatedDriver = await User.findByIdAndUpdate(
    payload.driverId,
    { $inc: { totalEarning: payload.amount } },
    { new: true }, // Optional: returns the updated user if needed
  );

  console.log('Updated Driver:', updatedDriver); // Debug actual updated driver

  return result;
};

const getAlloptionalTip = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(Tip.find(), query)
    .search(['driverId'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();
  return { data, meta };
};

const getoptionalTipById = async (id: string) => {
  const result = await Tip.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tip not found');
  }
  return result;
};

const updateoptionalTip = async (id: string, payload: Partial<ITip>) => {
  const result = await Tip.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update tip');
  }
  return result;
};

const deleteoptionalTip = async (id: string) => {
  const result = await Tip.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete tip');
  }
  return result;
};

export const optionalTipService = {
  createoptionalTip,
  getAlloptionalTip,
  getoptionalTipById,
  updateoptionalTip,
  deleteoptionalTip,
};
