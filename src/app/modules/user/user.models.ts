import { Error, Query, Schema, model } from 'mongoose';
import config from '../../config';
import bcrypt from 'bcrypt';
import { IUser, UserModel } from './user.interface';
import { Role, USER_ROLE } from './user.constants';

const userSchema: Schema<IUser> = new Schema(
  {
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    fullname: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    zipCode: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Others'],
      default: null,
    },
    dateOfBirth: {
      type: String,
      default: null,
    },
    isGoogleLogin: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: Role,
      default: USER_ROLE.user,
    },
    totalEarning: {
      type: Number,
      default: 0,
    },
    experience: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      default: null,
    },
    needsPasswordChange: {
      type: Boolean,
    },
    passwordChangedAt: {
      type: Date,
    },
    // Subscription
    freeDeliverylimit: { type: Number, default: 0, required: true },
    coverVehiclelimit: { type: Number, default: 0, required: true },
    durationDay: { type: Number, default: 0, required: true },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    verification: {
      otp: {
        type: Schema.Types.Mixed,
        default: 0,
      },
      expiresAt: {
        type: Date,
      },
      status: {
        type: Boolean,
        default: false,
      },
    },
    title: {
      type: String,
    },
    shortTitle: {
      type: String,
    },
    shortDescription: {
      type: String,
    },

    // ───────────────────────────────────────────────────────
    // PRICING
    monthlyPrice: {
      type: Number,

      min: 0,
    },
    yearlyPrice: {
      type: Number,

      min: 0,
    },

    // ───────────────────────────────────────────────────────
    // POPULARITY / DURATION
    popularity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ───────────────────────────────────────────────────────
    // BOOLEAN FLAGS (from the screenshot’s dropdowns)
    fiftyPercentOffDeliveryFeeAfterWaivedTrips: {
      type: Boolean,

      default: false,
    },
    scheduledDelivery: {
      type: Boolean,
      default: false,
    },
    fuelPriceTrackingAlerts: {
      type: Boolean,
      default: false,
    },
    noExtraChargeForEmergencyFuelServiceLimit: {
      type: Boolean,

      default: false,
    },
    freeSubscriptionAdditionalFamilyMember: {
      type: Boolean,

      default: false,
    },
    exclusivePromotionsEarlyAccess: {
      type: Boolean,
      default: false,
    },
    remeningDurationDay: {
      type: Number,
      default: 0,
    },
    familyMember: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function (next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this;
  if (!user?.isGoogleLogin) {
    user.password = await bcrypt.hash(
      user.password,
      Number(config.bcrypt_salt_rounds),
    );
  }
  next();
});

// set '' after saving password
userSchema.post(
  'save',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function (error: Error, doc: any, next: (error?: Error) => void): void {
    doc.password = '';
    next();
  },
);

userSchema.pre<Query<IUser[], IUser>>('find', function (next) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre<Query<IUser | null, IUser>>('findOne', function (next) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

userSchema.statics.isUserExist = async function (email: string) {
  return await User.findOne({ email: email }).select('+password');
};

userSchema.statics.IsUserExistId = async function (id: string) {
  return await User.findById(id).select('+password');
};
userSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashedPassword,
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

export const User = model<IUser, UserModel>('User', userSchema);
