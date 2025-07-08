import { ObjectId } from 'mongoose';

export interface IVehicle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // [x: string]: any;
  make: string;
  model: string;
  year: number;
  carColor: string;
  licenseNumber: string;
  userId: ObjectId;
  isCoveredBySubscription: boolean;
}
