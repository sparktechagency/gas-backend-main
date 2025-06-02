import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import settingsServices from './settings.service';

const getSettingsData = catchAsync(async (req, res) => {
  const result = await settingsServices.getSettingsData();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'get successfully',
    data: result,
  });
});

const updateSettingsData = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await settingsServices.updateSettingsData(payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Updated successfully',
    data: result,
  });
});

const settingsController = {
  getSettingsData,
  updateSettingsData,
};

export default settingsController;
