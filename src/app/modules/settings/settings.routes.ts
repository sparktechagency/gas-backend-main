import { Router } from 'express';
import settingsController from './settings.controller';
import { updateSettingsSchema } from './settings.validation';

export const settingsRoutes = Router();

settingsRoutes.get('/', settingsController.getSettingsData);
settingsRoutes.put('', settingsController.updateSettingsData);
