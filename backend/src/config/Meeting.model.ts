// src/config/Meeting.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMeeting extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  location?: string;
  joinLink?: string;
  startTime: Date;
  endTime: Date;
  organizer: Types.ObjectId;
  attendees: Types.ObjectId[];
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
  },
  { timestamps: true }
);

export default mongoose.model<IMeeting>('Meeting', meetingSchema);
