import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../error/AppError';
import { UploadedFiles } from '../../interface/common.interface';
import { uploadManyToS3 } from '../../utils/s3';
import ImageUpload from './imageUpload.models';
import { IImageUpload } from './imageUpload.interface';

const createimageUpload = async (
  payload: IImageUpload,
  files: any,
): Promise<IImageUpload> => {
  if (files) {
    const { images } = files as UploadedFiles;
    payload.images = [{ url: '', key: '' }];

    if (images?.length) {
      const imgsArray: { file: any; path: string; key?: string }[] = [];

      images?.map(async image => {
        imgsArray.push({
          file: image,
          path: `images/ImageUpload/images/${Math.floor(100000 + Math.random() * 900000)}`,
        });
      });

      payload.images = await uploadManyToS3(imgsArray);
    } else {
      throw new AppError(httpStatus.BAD_REQUEST, 'Upload minimum 1 image');
    }
  }
  const result = await ImageUpload.create(payload);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create ImageUpload');
  }
  return result;
};
const getAllimageUpload = async (): Promise<IImageUpload[]> => {
  return await ImageUpload.find();
};

const getimageUploadById = async (id: string): Promise<IImageUpload | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid imageUpload ID');
  }
  const result = await ImageUpload.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'ImageUpload not found');
  }
  return result;
};

const updateimageUpload = async (
  id: string,
  payload: Partial<IImageUpload>,
): Promise<IImageUpload | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid imageUpload ID');
  }

  const updated = await ImageUpload.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updated) {
    throw new AppError(httpStatus.NOT_FOUND, 'ImageUpload not found');
  }

  return updated;
};

const deleteimageUpload = async (id: string): Promise<IImageUpload | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid imageUpload ID');
  }

  const deleted = await ImageUpload.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'ImageUpload not found');
  }

  return deleted;
};

export const ImageUploadService = {
  createimageUpload,
  getAllimageUpload,
  getimageUploadById,
  updateimageUpload,
  deleteimageUpload,
};
