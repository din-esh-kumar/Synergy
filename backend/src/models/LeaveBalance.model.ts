import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILeaveBalance extends Document {
  userId: Types.ObjectId;
  leaveTypeId: Types.ObjectId;
  balance: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaveBalanceSchema = new Schema(
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
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for unique user-leaveType-year combination
leaveBalanceSchema.index({ userId: 1, leaveTypeId: 1, year: 1 }, { unique: true });

export default mongoose.model<ILeaveBalance>('LeaveBalance', leaveBalanceSchema);
