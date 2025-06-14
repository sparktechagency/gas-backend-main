import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { IChecklist } from './checklist.interface';
import { Checklist } from './checklist.models';
import QueryBuilder from '../../builder/QueryBuilder';

const createChecklist = async (
  orderId: string,
  userId: string,
  questions: { question: string; answer: string; explanation?: string }[],
): Promise<IChecklist> => {
  const checklist = await Checklist.create({
    orderId,
    userId,
    questions,
  });

  if (!checklist) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Checklist creation failed');
  }

  return checklist;
};

const getAllChecklist = async (query: Record<string, any>) => {
  const checklistQuery = new QueryBuilder(Checklist.find(), query)
    .search(['orderId', 'userId'])
    .filter()
    .paginate()
    .sort();

  const data = await checklistQuery.modelQuery;
  const meta = await checklistQuery.countTotal();

  return {
    data,
    meta,
  };
};

const getChecklistByOrderId = async (
  orderId: string,
): Promise<IChecklist | null> => {
  const checklist = await Checklist.findOne({ orderId });

  if (!checklist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Checklist not found for orderId ${orderId}`,
    );
  }

  return checklist;
};

const updateChecklist = async (
  orderId: string,
  updatedData: {
    questions: { question: string; answer: string; explanation?: string }[];
  },
): Promise<IChecklist | null> => {
  const updated = await Checklist.findOneAndUpdate(
    { orderId },
    { $set: updatedData },
    { new: true },
  );

  if (!updated) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Checklist update failed for orderId ${orderId}`,
    );
  }

  return updated;
};

const deleteChecklist = async (orderId: string): Promise<IChecklist | null> => {
  const deleted = await Checklist.findOneAndDelete({ orderId });

  if (!deleted) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Checklist delete failed for orderId ${orderId}`,
    );
  }

  return deleted;
};

const getAllQuestionAnswersByOrderId = async (
  orderId: string,
): Promise<{ question: string; answer: string; explanation?: string }[]> => {
  const checklist = await Checklist.findOne({ orderId });

  if (!checklist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Checklist not found for orderId ${orderId}`,
    );
  }

  return checklist.questions;
};

export const checklistService = {
  createChecklist,
  getAllChecklist,
  getChecklistByOrderId,
  updateChecklist,
  deleteChecklist,
  getAllQuestionAnswersByOrderId,
};
