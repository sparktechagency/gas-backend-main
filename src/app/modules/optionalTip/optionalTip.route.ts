import { Router } from 'express';
import { optionalTipController } from './optionalTip.controller';

const router = Router();

router.post('/create', optionalTipController.createoptionalTip);
router.patch('/update/:id', optionalTipController.updateoptionalTip);
router.delete('/:id', optionalTipController.deleteoptionalTip);
router.get('/:id', optionalTipController.getoptionalTipById);
router.get('/', optionalTipController.getAlloptionalTip);

export const optionalTipRoutes = router;
