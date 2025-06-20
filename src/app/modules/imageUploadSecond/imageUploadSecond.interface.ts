import { Model, ObjectId } from 'mongoose';

interface IImage {
  url: string;
  key: string;
}

export interface IImageUploadSecond {
  userId: ObjectId;
  images: IImage[];
}

