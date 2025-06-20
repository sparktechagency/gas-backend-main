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
const getAllimageUpload = async () => {};
const getimageUploadById = async () => {};
const updateimageUpload = async () => {};
const deleteimageUpload = async () => {};

export const ImageUploadService = {
  createimageUpload,
  getAllimageUpload,
  getimageUploadById,
  updateimageUpload,
  deleteimageUpload,
};
