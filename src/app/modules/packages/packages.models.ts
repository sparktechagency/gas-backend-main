import { model, Schema } from 'mongoose';
import { IPackage } from './packages.interface';
import { durationType } from './packages.constants';

const PackageSchema = new Schema<IPackage>(
  {
    // ───────────────────────────────────────────────────────
    // REQUIRED TEXT FIELDS
    title: {
      type: String,
      required: true,
    },
    shortTitle: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },

    // ───────────────────────────────────────────────────────
    // PRICING
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    yearlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // ───────────────────────────────────────────────────────
    // POPULARITY / DURATION
    popularity: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationType: {
      type: String,
      enum: Object.values(durationType),
      required: false,
    },

    // ───────────────────────────────────────────────────────
    // SOFT DELETE
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // ───────────────────────────────────────────────────────
    // LIMITS
    freeDeliverylimit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    coverVehiclelimit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // ───────────────────────────────────────────────────────
    // BOOLEAN FLAGS (from the screenshot’s dropdowns)
    fiftyPercentOffDeliveryFeeAfterWaivedTrips: {
      type: Boolean,
      required: true,
      default: false,
    },
    scheduledDelivery: {
      type: Boolean,
      required: true,
      default: false,
    },
    fuelPriceTrackingAlerts: {
      type: Boolean,
      required: true,
      default: false,
    },
    noExtraChargeForEmergencyFuelServiceLimit: {
      type: Boolean,
      required: true,
      default: false,
    },
    freeSubscriptionAdditionalFamilyMember: {
      type: Boolean,
      required: true,
      default: false,
    },
    exclusivePromotionsEarlyAccess: {
      type: Boolean,
      required: true,
      default: false,
    },
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

const Package = model<IPackage>('Package', PackageSchema);

export default Package;
