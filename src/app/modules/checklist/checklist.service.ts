import { Checklist } from "./checklist.models";

const createchecklist = async (
  orderId: string,
  userId: string,
  questions: { question: string; answer: string; explanation?: string }[],
) => {
  try {
    const checklist = new Checklist({
      orderId,
      userId,
      questions,
    });

    await checklist.save();
    return checklist;
  } catch (error) {
    throw new Error('Error creating checklist');
  }
};

const getAllchecklist = async () => {
  try {
    return await Checklist.find();
  } catch (error) {
    throw new Error('Error fetching all checklists');
  }
};

const getchecklistById = async (orderId: string) => {
  try {
    return await Checklist.findOne({ orderId });
  } catch (error) {
    throw new Error(`Error fetching checklist with orderId ${orderId}`);
  }
};

const updatechecklist = async (
  orderId: string,
  updatedData: {
    questions: { question: string; answer: string; explanation?: string }[];
  },
) => {
  try {
    return await Checklist.findOneAndUpdate(
      { orderId },
      { $set: updatedData },
      { new: true },
    );
  } catch (error) {
    throw new Error(`Error updating checklist with orderId ${orderId}`);
  }
};

const deletechecklist = async (orderId: string) => {
  try {
    return await Checklist.findOneAndDelete({ orderId });
  } catch (error) {
    throw new Error(`Error deleting checklist with orderId ${orderId}`);
  }
};

const getAllQuestionAnswersByOrderId = async (orderId: string) => {
  try {
    const checklist = await Checklist.findOne({ orderId });

    if (!checklist) {
      throw new Error('Checklist not found');
    }

    return checklist.questions; // Return all question-answer pairs
  } catch (error) {
    throw new Error(
      `Error fetching questions and answers for orderId ${orderId}`,
    );
  }
};

export const checklistService = {
  createchecklist,
  getAllchecklist,
  getchecklistById,
  updatechecklist,
  deletechecklist,
  getAllQuestionAnswersByOrderId,
};
