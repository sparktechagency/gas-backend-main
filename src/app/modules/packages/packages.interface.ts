import { Model } from 'mongoose';
import { durationType } from './packages.constants';

export interface IPackage {
  _id: string;

  // Basic metadata
  title: string;
  shortTitle: string;
  shortDescription: string;

  // Pricing
  monthlyPrice: number;
  yearlyPrice: number;

  // How popular this package is (e.g. number of sign-ups or a ranking)
  popularity: number;

  // e.g. "MONTHLY", "YEARLY", etc. — whatever values your durationType enum holds
  durationType?: durationType;

  // Soft-delete flag
  isDeleted: boolean;

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
}

export type IPackageModel = Model<IPackage, Record<string, unknown>>;
