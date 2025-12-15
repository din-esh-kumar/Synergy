import mongoose, { Schema, Document, Types } from 'mongoose';

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ITimesheet extends Document {
  employeeId: Types.ObjectId;
  projectId: Types.ObjectId;
  date: Date;
  hoursWorked: number;
  description?: string;
  status: TimesheetStatus;
  submittedAt?: Date | null;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  processedAt?: Date | null;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const timesheetSchema = new Schema<ITimesheet>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    hoursWorked: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    submittedAt: {
      type: Date,
      default: null,
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
    processedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITimesheet>('Timesheet', timesheetSchema);
