// src/models/Timesheet.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ITimesheet extends Document {
  userId: Types.ObjectId;
  date: Date;
  projectId?: Types.ObjectId;
  hours: number;
  description?: string;
  status: TimesheetStatus;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimesheetSchema = new Schema<ITimesheet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    hours: { type: Number, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITimesheet>('Timesheet', TimesheetSchema);
