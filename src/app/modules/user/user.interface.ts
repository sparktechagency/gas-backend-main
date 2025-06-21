import { Model, Types } from 'mongoose';

export interface IUser {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // [x: string]: any;
  _id?: Types.ObjectId;
  status: string;
  username: string;
  fullname: string;
  email: string;
  location: string;
  country: string;
  zipCode: string;
  avgRating: number;
  reviews: Types.ObjectId[];
  phoneNumber: string;
  password: string;
  gender: 'Male' | 'Female' | 'Others';
  dateOfBirth: string;
  image: string;
  role: string;
  isGoogleLogin: boolean;
  address?: string;
  delevaryEarn?: number;
  tip?: number;
  totalEarnings?: number;
  needsPasswordChange: boolean;
  passwordChangedAt?: Date;
  isDeleted: boolean;
  experience: number;
  verification: {
    otp: string | number;
    expiresAt: Date;
    status: boolean;
  };
  // 👇 Subscription fields
  durationDay: Date;
  totalEarning: number;
  title: string;
  shortTitle: string;
  shortDescription: string;
  remeningDurationDay: number;
  AverageRating: number;
  // Pricing
  monthlyPrice: number;
  yearlyPrice: number;

  // How popular this package is (e.g. number of sign-ups or a ranking)
  popularity: number;

  // e.g. "MONTHLY", "YEARLY", etc. — whatever values your durationType enum holds
  // durationType?: durationType;
  // Limits
  freeDeliverylimit: number;
  coverVehiclelimit: number;

  // NEW BOOLEAN FLAGS (shown as dropdowns in the screenshot)
  fiftyPercentOffDeliveryFeeAfterWaivedTrips: boolean;
  scheduledDelivery: boolean;
  fuelPriceTrackingAlerts: boolean;
  noExtraChargeForEmergencyFuelServiceLimit: boolean;
  freeSubscriptionAdditionalFamilyMember: boolean;
  exclusivePromotionsEarlyAccess: boolean;
  familyMember: {
    name: string;
    email: string;
  };
}

export interface UserModel extends Model<IUser> {
  isUserExist(email: string): Promise<IUser>;
  IsUserExistId(id: string): Promise<IUser>;
  IsUserExistUserName(userName: string): Promise<IUser>;

  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
}
