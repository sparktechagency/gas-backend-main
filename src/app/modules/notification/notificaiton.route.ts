import { Router } from 'express';
import auth from '../../middleware/auth';
import { notificationControllers } from './notification.controller';
import { USER_ROLE } from '../user/user.constants';

const router = Router();
// router.post("/",)
router.get(
  '/',
  auth(USER_ROLE.user, USER_ROLE.driver, USER_ROLE.admin),
  notificationControllers.getAllNotifications,
);
router.patch(
  '/',
  auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.driver),
  notificationControllers.markAsDone,
);

export const notificationRoutes = router;
