import { Router } from 'express';
import settingsController from './settings.controller';
import multer, { memoryStorage } from 'multer';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import parseData from '../../middleware/parseData';

export const settingsRoutes = Router();
const storage = memoryStorage();
const upload = multer({ storage });

settingsRoutes.get('/', settingsController.getSettingsData);
settingsRoutes.put(
  '/',
  auth(USER_ROLE.admin, USER_ROLE.sub_admin),
  upload.fields([
    { name: 'banner', maxCount: 5 },
    { name: 'emergencyFuelBanner', maxCount: 1 },
    { name: 'discountBanner', maxCount: 1 },
  ]),
  parseData(),
  settingsController.updateSettingsData,
);
