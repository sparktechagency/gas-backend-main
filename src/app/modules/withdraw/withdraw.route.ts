import { Router } from 'express';
import { withdrawController } from './withdraw.controller';

const router = Router();

router.post('/create-withdraw', withdrawController.createwithdraw);
router.patch('/update/:id', withdrawController.updatewithdraw);
router.delete('/:id', withdrawController.deletewithdraw);

router.get('/:id', withdrawController.getwithdrawById); // ✅ fixed
router.get('/', withdrawController.getAllwithdraw); // ✅ fixed

export const withdrawRoutes = router;
