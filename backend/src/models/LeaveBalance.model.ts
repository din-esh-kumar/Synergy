import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILeaveBalance extends Document {
  userId: Types.ObjectId;
  leaveTypeId: Types.ObjectId;
  balance: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaveBalanceSchema = new Schema<ILeaveBalance>(
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
      min: 0,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'leavebalances', // ensures predictable collection name
  },
);

// Compound index for unique user-leaveType-year combination
leaveBalanceSchema.index(
  { userId: 1, leaveTypeId: 1, year: 1 },
  { unique: true },
);

const LeaveBalance = mongoose.model<ILeaveBalance>(
  'LeaveBalance',
  leaveBalanceSchema,
);

export default LeaveBalance;
