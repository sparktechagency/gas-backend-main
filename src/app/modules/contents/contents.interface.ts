import { Model, ObjectId } from 'mongoose';

export interface IContents {
  deleteKey?: string[];
  _id?: string;
  createdBy: ObjectId;
  discountBanner?: string;
  emergencyFuelBanner?: string;
  aboutUs?: string;
  termsAndConditions?: string;
  banner: { key: string; url: string }[];
  privacyPolicy?: string;
  supports?: string;
  faq?: string;
  isDeleted?: boolean;
}

export type IContentsModel = Model<IContents, Record<string, unknown>>;
