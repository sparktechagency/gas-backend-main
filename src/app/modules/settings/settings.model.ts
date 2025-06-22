import { model, Schema } from 'mongoose';
import { TSettings } from './settings.interface';

const settingsSchema = new Schema<TSettings>(
  {
    terms_conditions: { type: String, required: true },
    about_us: { type: String, required: true },
    privacy_policy: { type: String, required: true },
    emergencyFuelBanner: {
      type: String,
      default: null,
    },
    discountBanner: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const SettingsModel = model<TSettings>('Settings', settingsSchema);
export default SettingsModel;
