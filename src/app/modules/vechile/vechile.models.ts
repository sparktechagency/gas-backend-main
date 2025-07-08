import { Schema, model } from 'mongoose';
import { IVehicle } from './vechile.interface';

const vechileSchema: Schema<IVehicle> = new Schema(
  {
    make: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    carColor: {
      type: String,
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    isCoveredBySubscription: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Vehicle = model<IVehicle>('Vehicle', vechileSchema);
