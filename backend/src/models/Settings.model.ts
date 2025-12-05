import mongoose, { Schema, Document } from 'mongoose';

interface UserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  notifications: {
    email: boolean;
    push: boolean;
    teamChat: boolean;
    projectChat: boolean;
    taskChat: boolean;
    meetings: boolean;
    issues: boolean;
    dailyDigest: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  privacy: {
    profileVisibility: 'public' | 'private';
    showOnlineStatus: boolean;
  };
  updatedAt: Date;
}

const SettingsSchema = new Schema<UserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      teamChat: {
        type: Boolean,
        default: true,
      },
      projectChat: {
        type: Boolean,
        default: true,
      },
      taskChat: {
        type: Boolean,
        default: true,
      },
      meetings: {
        type: Boolean,
        default: true,
      },
      issues: {
        type: Boolean,
        default: true,
      },
      dailyDigest: {
        type: Boolean,
        default: false,
      },
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto',
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public',
      },
      showOnlineStatus: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<UserSettings>('Settings', SettingsSchema);
