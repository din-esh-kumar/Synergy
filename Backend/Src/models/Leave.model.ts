// src/models/Leave.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export type LeaveStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending';

export interface ILeave extends Document {
  userId: Types.ObjectId;
  leaveTypeId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: LeaveStatus;
  appliedAt?: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    leaveTypeId: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'pending'],
      default: 'draft',
    },
    appliedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ILeave>('Leave', LeaveSchema);
