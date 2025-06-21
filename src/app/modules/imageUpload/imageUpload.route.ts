import { Router } from 'express';
import { imageUploadController } from './imageUpload.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import parseData from '../../middleware/parseData';
import multer, { memoryStorage } from 'multer';

const router = Router();
const storage = memoryStorage();
const upload = multer({ storage });
router.post(
  '/create-imageUpload',
  auth(USER_ROLE.admin, USER_ROLE.user),
  upload.fields([{ name: 'images', maxCount: 5 }]),
  parseData(),
  imageUploadController.createimageUpload,
);

router.patch('/update/:id', imageUploadController.updateimageUpload);

router.delete('/:id', imageUploadController.deleteimageUpload);

// router.get('/:id', imageUploadController.getimageUpload);
router.get('/', imageUploadController.getAllimageUpload);

export const imageUploadRoutes = router;
