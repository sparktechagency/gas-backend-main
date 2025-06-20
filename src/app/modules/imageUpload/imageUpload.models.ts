import { model, Schema } from 'mongoose';
import { IImageUpload, IImageUploadModules } from './imageUpload.interface';

const imageUploadSchema = new Schema<IImageUpload>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    images: {
      type: [
        {
          url: { type: String },
          key: { type: String },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const ImageUpload = model<IImageUpload, IImageUploadModules>(
  'ImageUpload',
  imageUploadSchema,
);
export default ImageUpload;
