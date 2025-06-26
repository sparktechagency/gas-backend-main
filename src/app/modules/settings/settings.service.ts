import { UploadedFiles } from '../../interface/common.interface';
import { uploadToS3 } from '../../utils/s3';
import { TSettings } from './settings.interface';
import SettingsModel from './settings.model';

const getSettingsData = async () => {
  const settings = await SettingsModel.find();
  return settings;
};

const updateSettingsData = async (payload: TSettings, files: any) => {
  if (files) {
    const {
      emergencyFuelBanner,
      discountBanner,
      fuelTypeBanner,
      orderHistoryBanner,
    } = files as UploadedFiles;

    if (emergencyFuelBanner?.length) {
      payload.emergencyFuelBanner = (await uploadToS3({
        file: emergencyFuelBanner[0],
        fileName: `images/banner/${emergencyFuelBanner[0].originalname}`,
      })) as string;
    }

    if (discountBanner?.length) {
      payload.discountBanner = (await uploadToS3({
        file: discountBanner[0],
        fileName: `images/banner/${discountBanner[0].originalname}`,
      })) as string;
    }
    if (fuelTypeBanner?.length) {
      payload.fuelTypeBanner = (await uploadToS3({
        file: fuelTypeBanner[0],
        fileName: `images/banner/${fuelTypeBanner[0].originalname}`,
      })) as string;
    }
    if (orderHistoryBanner?.length) {
      payload.orderHistoryBanner = (await uploadToS3({
        file: orderHistoryBanner[0],
        fileName: `images/banner/${orderHistoryBanner[0].originalname}`,
      })) as string;
    }
  }
  const result = await SettingsModel.findOneAndUpdate({}, payload, {
    new: true,
    upsert: true,
  });
  return result;
};

const settingsServices = {
  getSettingsData,
  updateSettingsData,
};

export default settingsServices;
