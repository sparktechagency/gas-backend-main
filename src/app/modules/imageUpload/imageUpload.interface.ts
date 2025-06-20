import { Model, ObjectId } from 'mongoose';

interface IImage {
  url: string;
  key: string;
}

export interface IImageUpload {
  userId: ObjectId;
  images: IImage[];
}
export type IImageUploadModules = Model<IImageUpload, Record<string, unknown>>;
