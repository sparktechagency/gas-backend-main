import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { imageUploadSecondService } from './imageUploadSecond.service';
import sendResponse from '../../utils/sendResponse';

const createimageUploadSecond = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: 'User not authenticated.',
        data: {},
      });
    }

    req.body.userId = userId;

    const result = await imageUploadSecondService.createimageUploadSecond(
      req.body,
      req.files,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'ImageUpload created successfully',
      data: result,
    });
  },
);

const getAllimageUploadSecond = catchAsync(
  async (req: Request, res: Response) => {
    const result = await imageUploadSecondService.getAllimageUploadSecond();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'All image uploads retrieved',
      data: result,
    });
  },
);

const getimageUploadSecondById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await imageUploadSecondService.getimageUploadSecondById(id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Image upload retrieved',
      data: result,
    });
  },
);

const updateimageUploadSecond = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await imageUploadSecondService.updateimageUploadSecond(
      id,
      req.body,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Image upload updated',
      data: result,
    });
  },
);

const deleteimageUploadSecond = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await imageUploadSecondService.deleteimageUploadSecond(id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Image upload deleted',
      data: result,
    });
  },
);

export const imageUploadSecondController = {
  createimageUploadSecond,
  getAllimageUploadSecond,
  getimageUploadSecondById,
  updateimageUploadSecond,
  deleteimageUploadSecond,
};
