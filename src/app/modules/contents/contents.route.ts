import { Router } from 'express';
import { contentsController } from './contents.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import parseData from '../../middleware/parseData';
import multer, { memoryStorage } from 'multer';

const router = Router();
const storage = memoryStorage();
const upload = multer({ storage });

router.post(
  '/create-content',
  auth(USER_ROLE.super_admin, USER_ROLE.sub_admin, USER_ROLE.admin),
  upload.fields([
    { name: 'banner', maxCount: 5 },
    { name: 'emergencyFuelBanner', maxCount: 1 },
    { name: 'discountBanner', maxCount: 1 },
  ]),
  parseData(),
  // validateRequest(contentsValidator.createContentsZodSchema),
  contentsController.createContents,
);

router.put(
  '/',
  auth(USER_ROLE.super_admin, USER_ROLE.sub_admin, USER_ROLE.admin),
  upload.fields([
    { name: 'banner', maxCount: 5 },
    { name: 'emergencyFuelBanner', maxCount: 1 },
    { name: 'discountBanner', maxCount: 1 },
  ]),
  parseData(),
  contentsController.updateContents,
);

router.delete('/:key', contentsController.deleteBanner);

router.get('/:id', contentsController.getContentsById);

router.get('/', contentsController.getAllContents);

export const contentsRoutes = router;
