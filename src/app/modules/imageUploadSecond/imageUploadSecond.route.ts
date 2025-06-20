import { Router } from 'express';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import parseData from '../../middleware/parseData';
import multer, { memoryStorage } from 'multer';
import { imageUploadSecondController } from './imageUploadSecond.controller';

const router = Router();
const storage = memoryStorage();
const upload = multer({ storage });

router.post(
  '/',
  auth(USER_ROLE.admin, USER_ROLE.user),
  upload.fields([{ name: 'images', maxCount: 5 }]),
  parseData(),
  imageUploadSecondController.createimageUploadSecond,
);
router.get('/', imageUploadSecondController.getAllimageUploadSecond);
router.get('/:id', imageUploadSecondController.getimageUploadSecondById);
router.patch('/:id', imageUploadSecondController.updateimageUploadSecond);
router.delete('/:id', imageUploadSecondController.deleteimageUploadSecond);

export const imageUploadSecondRoutes = router;
