import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveType extends Document {
  name: string;
  code: string;
  description?: string;
  maxDays: number;
  isActive: boolean;
  hasDefaultBalance: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leaveTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    maxDays: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    hasDefaultBalance: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ILeaveType>('LeaveType', leaveTypeSchema);
