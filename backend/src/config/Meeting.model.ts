import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingLink?: string;
  organizer: mongoose.Types.ObjectId;
  attendees: mongoose.Types.ObjectId[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  reminder?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (this: IMeeting, value: Date) {
          return value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    meetingLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Meeting link must be a valid URL',
      },
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
      index: true,
    },
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    reminder: {
      type: Number,
      default: 15,
      min: [0, 'Reminder cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
MeetingSchema.index({ organizer: 1, startTime: 1 });
MeetingSchema.index({ attendees: 1, startTime: 1 });
MeetingSchema.index({ status: 1, startTime: 1 });

// Virtual for meeting duration
MeetingSchema.virtual('duration').get(function (this: IMeeting) {
  return Math.abs(this.endTime.getTime() - this.startTime.getTime()) / 60000; // in minutes
});

export default mongoose.model<IMeeting>('Meeting', MeetingSchema);
