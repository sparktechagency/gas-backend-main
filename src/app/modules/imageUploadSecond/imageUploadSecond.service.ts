import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../error/AppError';
import { UploadedFiles } from '../../interface/common.interface';
import { uploadManyToS3 } from '../../utils/s3';
import { IImageUploadSecond } from './imageUploadSecond.interface';
import imageUploadSecond from './imageUploadSecond.models';


const createimageUploadSecond = async (
  payload: IImageUploadSecond,
  files: any,
): Promise<IImageUploadSecond> => {
  if (files) {
    const { images } = files as UploadedFiles;

    if (!images || !images.length) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Upload minimum 1 image');
    }

    const imgsArray: { file: any; path: string; key?: string }[] = [];

    for (const image of images) {
      imgsArray.push({
        file: image,
        path: `images/ImageUploadSecond/images/${Math.floor(100000 + Math.random() * 900000)}`,
      });
    }

    const uploadedImages = await uploadManyToS3(imgsArray);
    payload.images = uploadedImages;
  }

  const result = await imageUploadSecond.create(payload);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create ImageUpload');
  }
  return result;
};

const getAllimageUploadSecond = async (): Promise<IImageUploadSecond[]> => {
  return await imageUploadSecond.find().populate('userId');
};

const getimageUploadSecondById = async (
  id: string,
): Promise<IImageUploadSecond | null> => {
  return await imageUploadSecond.findById(id).populate('userId');
};

const updateimageUploadSecond = async (
  id: string,
  updateData: Partial<IImageUploadSecond>,
): Promise<IImageUploadSecond | null> => {
  const updated = await imageUploadSecond.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (!updated) {
    throw new AppError(httpStatus.NOT_FOUND, 'ImageUpload not found');
  }
  return updated;
};

const deleteimageUploadSecond = async (
  id: string,
): Promise<IImageUploadSecond | null> => {
  const deleted = await imageUploadSecond.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'ImageUpload not found');
  }
  return deleted;
};

export const imageUploadSecondService = {
  createimageUploadSecond,
  getAllimageUploadSecond,
  getimageUploadSecondById,
  updateimageUploadSecond,
  deleteimageUploadSecond,
};
