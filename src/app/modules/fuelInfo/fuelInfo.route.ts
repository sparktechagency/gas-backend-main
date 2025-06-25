import { Router } from 'express';
import { fuelInfoController } from './fuelInfo.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router.post('/create', fuelInfoController.createfuelInfo);
router.patch('/update/:id', fuelInfoController.updatefuelInfo);
router.delete('/:id', fuelInfoController.deletefuelInfo);

// Fix: Use correct handlers
router.get('/:id', fuelInfoController.getfuelInfoById);
router.get('/', auth(USER_ROLE.user), fuelInfoController.getAllfuelInfo);

export const fuelInfoRoutes = router;
