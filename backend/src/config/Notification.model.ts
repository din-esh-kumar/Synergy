// backend/src/models/Notification.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'meetinginvite'
  | 'meetingupdate'
  | 'meetingcanceled'
  | 'meetingreminder'
  | 'general';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    meetingId?: string;
    meetingTitle?: string;
    senderId?: string;
    senderName?: string;
    [key: string]: any;
  };
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'meetinginvite',
        'meetingupdate',
        'meetingcanceled',
        'meetingreminder',
        'general',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: {
      meetingId: { type: String },
      meetingTitle: { type: String },
      senderId: { type: String },
      senderName: { type: String },
    },
    read: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Index for clean-up and performance
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
