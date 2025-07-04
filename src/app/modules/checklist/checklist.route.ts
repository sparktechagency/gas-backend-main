// routes/checklistRoutes.ts

import { Router } from 'express';
import { checklistController } from './checklist.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

// Route to create a new checklist
router.post(
  '/create-checklist',
  auth(USER_ROLE.driver),
  checklistController.createchecklist,
);

// Route to get all checklists
router.get('/', checklistController.getAllchecklist);

// Route to get a checklist by orderId
router.get('/:orderId', checklistController.getchecklistById);

// Route to update a checklist by orderId
router.patch('/update/:orderId', checklistController.updatechecklist);

// Route to delete a checklist by orderId
router.delete('/:orderId', checklistController.deletechecklist);

// Route to get all questions and answers by orderId
router.get(
  '/:orderId/questions',
  checklistController.getAllQuestionAnswersByOrderId,
);

export const checklistRoutes = router;
