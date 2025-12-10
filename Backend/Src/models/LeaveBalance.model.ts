// src/models/LeaveBalance.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILeaveBalance extends Document {
  userId: Types.ObjectId;
  leaveTypeId: Types.ObjectId;
  balance: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    leaveTypeId: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    balance: { type: Number, required: true },
    year: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
