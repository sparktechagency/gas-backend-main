import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ImageUploadService } from './imageUpload.service';
import httpStatus from 'http-status';

const createimageUpload = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  req.body.userId = userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'User not authenticated.',
      data: {},
    });
  }

  const result = await ImageUploadService.createimageUpload(
    req.body,
    req.files,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'ImageUpload created successfully',
    data: result,
  });
});
const getAllimageUpload = catchAsync(async (req: Request, res: Response) => {
  const result = await ImageUploadService.getAllimageUpload();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All ImageUploads retrieved successfully',
    data: result,
  });
});

const getimageUploadById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ImageUploadService.getimageUploadById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ImageUpload retrieved successfully',
    data: result,
  });
});

const updateimageUpload = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ImageUploadService.updateimageUpload(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ImageUpload updated successfully',
    data: result,
  });
});

const deleteimageUpload = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ImageUploadService.deleteimageUpload(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ImageUpload deleted successfully',
    data: result,
  });
});

export const imageUploadController = {
  createimageUpload,
  getAllimageUpload,
  getimageUploadById,
  updateimageUpload,
  deleteimageUpload,
};
