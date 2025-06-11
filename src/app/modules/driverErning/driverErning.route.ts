import { Router } from 'express';
import { driverEarningController } from './driverErning.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router.post(
  '/create-driverErning',
  driverEarningController.createDriverEarning,
);
router.get(
  '/driver-erning',
  auth(USER_ROLE.driver),
  driverEarningController.getUserEarningSummary,
);
router.get('/summary/global', driverEarningController.getGlobalEarningsSummary);

router.patch('/update/:id', driverEarningController.updateDriverEarning);

router.delete('/:id', driverEarningController.deleteDriverEarning);
router.get('/summary/:userId?', driverEarningController.getEarningsSummary);
router.get('/:id', driverEarningController.getDriverEarningById);
router.get('/', driverEarningController.getAllDriverEarnings);

export const driverErningRoutes = router;
