// src/models/LeaveType.model.ts
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

const LeaveTypeSchema = new Schema<ILeaveType>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    maxDays: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    hasDefaultBalance: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ILeaveType>('LeaveType', LeaveTypeSchema);
