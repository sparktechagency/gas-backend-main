import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { checklistService } from './checklist.service';

// Create checklist
const createchecklist = catchAsync(async (req: Request, res: Response) => {
  const { orderId, questions } = req.body;
  const userId = req?.user?.id; // Assuming the user is authenticated and available via req.user

  const checklist = await checklistService.createchecklist(
    orderId,
    userId,
    questions,
  );

  res.status(201).json({
    message: 'Checklist created successfully',
    checklist,
  });
});

// Get all checklists
const getAllchecklist = catchAsync(async (req: Request, res: Response) => {
  const checklists = await checklistService.getAllchecklist();

  res.status(200).json({
    message: 'All checklists fetched successfully',
    checklists,
  });
});

// Get checklist by orderId
const getchecklistById = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const checklist = await checklistService.getchecklistById(orderId);

  if (!checklist) {
    return res.status(404).json({ message: 'Checklist not found' });
  }

  res.status(200).json({
    message: 'Checklist fetched successfully',
    checklist,
  });
});

// Update checklist
const updatechecklist = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const updatedData = req.body;

  const updatedChecklist = await checklistService.updatechecklist(
    orderId,
    updatedData,
  );

  if (!updatedChecklist) {
    return res.status(404).json({ message: 'Checklist not found' });
  }

  res.status(200).json({
    message: 'Checklist updated successfully',
    updatedChecklist,
  });
});

// Delete checklist
const deletechecklist = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const deletedChecklist = await checklistService.deletechecklist(orderId);

  if (!deletedChecklist) {
    return res.status(404).json({ message: 'Checklist not found' });
  }

  res.status(200).json({
    message: 'Checklist deleted successfully',
    deletedChecklist,
  });
});

const getAllQuestionAnswersByOrderId = catchAsync(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const questionAnswers =
      await checklistService.getAllQuestionAnswersByOrderId(orderId);

    res.status(200).json({
      message: 'Questions and answers fetched successfully',
      questionAnswers,
    });
  },
);

export const checklistController = {
  createchecklist,
  getAllchecklist,
  getchecklistById,
  updatechecklist,
  deletechecklist,
  getAllQuestionAnswersByOrderId,
};
