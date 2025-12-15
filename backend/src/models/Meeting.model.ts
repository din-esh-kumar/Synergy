// src/config/Meeting.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export type MeetingMode = 'scheduled' | 'instant' | 'link-only';
export type MeetingStatus = 'scheduled' | 'live' | 'ended';

export interface IMeeting extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  location?: string;
  joinLink?: string;          // Google Meet link or internal room URL
  startTime: Date;
  endTime: Date;
  organizer: Types.ObjectId;
  attendees: Types.ObjectId[];
  mode: MeetingMode;          // scheduled = calendar; instant = start now; link-only = just URL
  status: MeetingStatus;      // scheduled/live/ended for real-time UI
  googleEventId?: string;     // Calendar API event id (optional)
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    joinLink: {
      type: String,
      default: '',
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    mode: {
      type: String,
      enum: ['scheduled', 'instant', 'link-only'],
      default: 'scheduled',
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
    },
    googleEventId: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IMeeting>('Meeting', meetingSchema);
