// src/modules/fuelInfo/fuelInfo.controller.ts
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { fuelInfoService } from './fuelInfo.service';
import sendResponse from '../../utils/sendResponse';
import { User } from '../user/user.models';

const createfuelInfo = catchAsync(async (req: Request, res: Response) => {
  const data = await fuelInfoService.createfuelInfo(req.body);
  res.status(201).json({ status: 'success', data });
});

const getAllfuelInfo = catchAsync(async (req: Request, res: Response) => {
  const data = await fuelInfoService.getAllfuelInfo();
  res.status(200).json({ status: 'success', results: data.length, data });
});

const getAllfuelInfoByZip = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  // if (!userId) {
  //   return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
  // }

  // Fetch user zip code
  const user = await User.findById(userId).select('zipCode');
  if (!user || !user.zipCode) {
    return res
      .status(404)
      .json({ status: 'fail', message: 'User zip code not found' });
  }

  const data = await fuelInfoService.getAllfuelInfoByZip(user.zipCode);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data,
  });
});

const getfuelInfoById = catchAsync(async (req: Request, res: Response) => {
  const data = await fuelInfoService.getfuelInfoById(req.params.id);
  if (!data) {
    return res
      .status(404)
      .json({ status: 'fail', message: 'FuelInfo not found' });
  }
  res.status(200).json({ status: 'success', data });
});

const updatefuelInfo = catchAsync(async (req: Request, res: Response) => {
  const data = await fuelInfoService.updatefuelInfo(req.params.id, req.body);
  if (!data) {
    return res
      .status(404)
      .json({ status: 'fail', message: 'FuelInfo not found or invalid data' });
  }
  res.status(200).json({ status: 'success', data });
});

const deletefuelInfo = catchAsync(async (req: Request, res: Response) => {
  const data = await fuelInfoService.deletefuelInfo(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'fuelInfoService deleted successfully',
    data: data,
  });
});

export const fuelInfoController = {
  createfuelInfo,
  getAllfuelInfo,
  getfuelInfoById,
  updatefuelInfo,
  deletefuelInfo,
  getAllfuelInfoByZip,
};
