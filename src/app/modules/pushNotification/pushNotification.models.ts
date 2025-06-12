// src/modules/pushNotification/pushNotification.model.ts
import { Schema, model, Document } from 'mongoose';
import { IpushNotification } from './pushNotification.interface';

export interface PushNotificationDocument extends IpushNotification, Document {}

const pushNotificationSchema = new Schema<PushNotificationDocument>(
  {
    title: { type: String },
    message: { type: String },
    targetAudience: { type: String },
  },
  { timestamps: true },
);

export const PushNotificationModel = model<PushNotificationDocument>(
  'PushNotification',
  pushNotificationSchema,
);
