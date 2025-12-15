import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveType extends Document {
  name: string;
  code: string;
  description?: string;
  maxDays: number;          // used as "Default Days" in UI
  isActive: boolean;
  hasDefaultBalance: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leaveTypeSchema = new Schema<ILeaveType>(
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
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    maxDays: {
      type: Number,
      default: 0,
      min: 0,
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
  { timestamps: true },
);

export default mongoose.model<ILeaveType>('LeaveType', leaveTypeSchema);
