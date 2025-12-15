// src/models/Leave.model.ts

import mongoose, { Schema, Document, Types } from 'mongoose';

export type LeaveStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ILeave extends Document {
  userId: Types.ObjectId;
  leaveTypeId: Types.ObjectId;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  appliedAt?: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;

  // NEW: add halfDay flag
  halfDay?: boolean;

  duration: number;
  processedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    leaveTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'submitted',
    },
    appliedAt: {
      type: Date,
      default: () => new Date(),
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    // NEW: schema field for halfDay
    halfDay: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      default: 0,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model<ILeave>('Leave', leaveSchema);
