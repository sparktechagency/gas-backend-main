// src/modules/fuelInfo/fuelInfo.service.ts
import { Types } from 'mongoose';
import { IFuelInfo } from './fuelInfo.interface';
import { FuelInfoDocument, FuelInfoModel } from './fuelInfo.models';
import AppError from '../../error/AppError';
import { http } from 'winston';

const createfuelInfo = async (
  payload: IFuelInfo,
): Promise<FuelInfoDocument> => {
  return FuelInfoModel.create(payload);
};

const getAllfuelInfo = async (): Promise<FuelInfoDocument[]> => {
  return FuelInfoModel.find().sort({ createdAt: -1 });
};

const getAllfuelInfoByZip = async (
  userZipCode: string,
): Promise<FuelInfoDocument[]> => {
  return FuelInfoModel.find({ zipCode: userZipCode }).sort({ createdAt: -1 });
};

const getfuelInfoById = async (
  id: string,
): Promise<FuelInfoDocument | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return FuelInfoModel.findById(id);
};

const updatefuelInfo = async (
  id: string,
  payload: Partial<IFuelInfo>,
): Promise<FuelInfoDocument | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return FuelInfoModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const deletefuelInfo = async (id: string): Promise<FuelInfoDocument | null> => {
  const data = await FuelInfoModel.findByIdAndDelete(id);
  if (!data)
    throw new AppError(httpStatus.BAD_REQUEST, 'fuel info deletion failed');
  return data;
};

export const fuelInfoService = {
  createfuelInfo,
  getAllfuelInfo,
  getfuelInfoById,
  updatefuelInfo,
  deletefuelInfo,
  getAllfuelInfoByZip,
};
