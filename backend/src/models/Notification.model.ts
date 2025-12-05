import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'team' | 'project' | 'task' | 'subtask' | 'meeting' | 'chat' | 'message' | 'system';
  action?: 'created' | 'updated' | 'deleted' | 'assigned' | 'commented' | 'mentioned' | 'completed';
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
  icon?: string;
  color?: string;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
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
      required: true,
      enum: ['team', 'project', 'task', 'subtask', 'meeting', 'chat', 'message', 'system'],
      index: true,
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted', 'assigned', 'commented', 'mentioned', 'completed'],
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
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    relatedEntity: {
      entityType: String,
      entityId: String,
    },
    icon: String,
    color: String,
    actionUrl: String,
  },
  { timestamps: true }
);

// Indexes for optimization
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

export default mongoose.model<INotification>('Notification', notificationSchema);
