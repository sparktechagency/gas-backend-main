import { model, Schema } from 'mongoose';
import { IChecklist } from './checklist.interface';
const checklistSchema: Schema = new Schema<IChecklist>(
  {
    orderId: { type: String, required: true },
    userId: { type: String },
    questions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        explanation: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true },
);

export const Checklist = model<IChecklist>('Checklist', checklistSchema);
