import { model, Schema } from 'mongoose';
import { IImageUploadSecond } from './imageUploadSecond.interface';


const imageUploadSecondSchema = new Schema<IImageUploadSecond>(
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

const imageUploadSecond = model<IImageUploadSecond>(
  'ImageUploadSecond',
  imageUploadSecondSchema,
);
export default imageUploadSecond;
