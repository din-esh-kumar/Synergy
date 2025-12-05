import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  data?: {
    entityId?: string;
    entityType?: string;
    status?: string;
    organizerId?: string;
    organizerName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['meeting', 'task', 'project', 'system', 'chat'], // add more if needed
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      entityId: { type: String },
      entityType: { type: String },
      status: { type: String },
      organizerId: { type: String },
      organizerName: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
