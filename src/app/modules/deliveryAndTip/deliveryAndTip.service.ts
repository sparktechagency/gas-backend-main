// src/modules/deliveryAndTip/deliveryAndTip.service.ts
import { Types } from 'mongoose';
import { IDeliveryAndTip } from './deliveryAndTip.interface';
import {
  DeliveryAndTipDocument,
  DeliveryAndTipModel,
} from './deliveryAndTip.models';
import AppError from '../../error/AppError';

const createDeliveryAndTip = async (
  payload: IDeliveryAndTip,
): Promise<DeliveryAndTipDocument> => {
  return DeliveryAndTipModel.create(payload);
};

const getAllDeliveryAndTip = async (): Promise<DeliveryAndTipDocument[]> => {
  return DeliveryAndTipModel.find().sort({ createdAt: -1 });
};

const getDeliveryAndTipById = async (
  id: string,
): Promise<DeliveryAndTipDocument | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return DeliveryAndTipModel.findById(id);
};

const updateDeliveryAndTip = async (
  id: string,
  payload: Partial<IDeliveryAndTip>,
): Promise<DeliveryAndTipDocument | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return DeliveryAndTipModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const deleteDeliveryAndTip = async (
  id: string,
): Promise<DeliveryAndTipDocument | null> => {
  const data = await DeliveryAndTipModel.findByIdAndDelete(id);
  if (!data)
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'delivery and tip deletion failed!',
    );
  return data;
};

export const deliveryAndTipService = {
  createDeliveryAndTip,
  getAllDeliveryAndTip,
  getDeliveryAndTipById,
  updateDeliveryAndTip,
  deleteDeliveryAndTip,
};
