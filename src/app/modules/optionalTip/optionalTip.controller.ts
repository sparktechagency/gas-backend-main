// src/modules/optionalTip/optionalTip.controller.ts

import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { optionalTipService } from './optionalTip.service';

const createoptionalTip = catchAsync(async (req: Request, res: Response) => {
  const result = await optionalTipService.createoptionalTip(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tip created successfully',
    data: result,
  });
});

const getAlloptionalTip = catchAsync(async (req: Request, res: Response) => {
  const result = await optionalTipService.getAlloptionalTip(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tips retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getoptionalTipById = catchAsync(async (req: Request, res: Response) => {
  const result = await optionalTipService.getoptionalTipById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tip retrieved successfully',
    data: result,
  });
});

const updateoptionalTip = catchAsync(async (req: Request, res: Response) => {
  const result = await optionalTipService.updateoptionalTip(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tip updated successfully',
    data: result,
  });
});

const deleteoptionalTip = catchAsync(async (req: Request, res: Response) => {
  const result = await optionalTipService.deleteoptionalTip(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tip deleted successfully',
    data: result,
  });
});

export const optionalTipController = {
  createoptionalTip,
  getAlloptionalTip,
  getoptionalTipById,
  updateoptionalTip,
  deleteoptionalTip,
};
