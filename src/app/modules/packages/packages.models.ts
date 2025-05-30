import { model, Schema } from 'mongoose';
import { IPackage, IPackageModel } from './packages.interface';
import { durationType } from './packages.constants';

const PackageSchema = new Schema<IPackage>(
  {
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    monthlyPrice: { type: Number, required: true, min: 0 },
    yearlyPrice: { type: Number, required: true, min: 0 },
    isDeleted: { type: Boolean, default: false },
    freeDeliverylimit: { type: Number, default: 0, required: true },
    coverVehiclelimit: { type: Number, default: 0, required: true },
  },
  {
    timestamps: true,
  },
);

// Middleware to exclude deleted packages
PackageSchema.pre('find', function (next) {
  //@ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

PackageSchema.pre('findOne', function (next) {
  //@ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

PackageSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

const Package = model<IPackage, IPackageModel>('Package', PackageSchema);

export default Package;
