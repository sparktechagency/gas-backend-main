import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { withdrawService } from './withdraw.service';
import sendResponse from '../../utils/sendResponse';

const createwithdraw = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  req.body.userId = userId;

  const result = await withdrawService.createwithdraw(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Withdraw request created successfully',
    data: result,
  });
});

const getAllwithdraw = catchAsync(async (req: Request, res: Response) => {
  const result = await withdrawService.getAllwithdraw(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Withdraws retrieved successfully',
    data: result,
  });
});

const getwithdrawById = catchAsync(async (req: Request, res: Response) => {
  const result = await withdrawService.getwithdrawById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Withdraw retrieved successfully',
    data: result,
  });
});

const updatewithdraw = catchAsync(async (req: Request, res: Response) => {
  const result = await withdrawService.updatewithdraw(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Withdraw updated successfully',
    data: result,
  });
});

const deletewithdraw = catchAsync(async (req: Request, res: Response) => {
  const result = await withdrawService.deletewithdraw(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Withdraw deleted successfully',
    data: result,
  });
});

export const withdrawController = {
  createwithdraw,
  getAllwithdraw,
  getwithdrawById,
  updatewithdraw,
  deletewithdraw,
};
