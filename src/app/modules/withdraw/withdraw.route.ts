import { Router } from 'express';
import { withdrawController } from './withdraw.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router.post(
  '/create-withdraw',
  auth(USER_ROLE.driver),
  withdrawController.createwithdraw,
);
router.patch('/update/:id', withdrawController.updatewithdraw);
router.delete('/:id', withdrawController.deletewithdraw);

router.get('/:id', withdrawController.getwithdrawById); // ✅ fixed
router.get('/', withdrawController.getAllwithdraw); // ✅ fixed

export const withdrawRoutes = router;
