// src/models/Project.model.ts (MOVE FROM config/)
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProject extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: Date | null;
  endDate?: Date | null;
  owner: Types.ObjectId;
  team: Types.ObjectId[];
  budget?: number | null;
  visibility: 'PRIVATE' | 'PUBLIC';
  isActive: boolean;  // ✅ ADDED for controller
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNING',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    team: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    budget: {
      type: Number,
      default: null,
    },
    visibility: {
      type: String,
      enum: ['PRIVATE', 'PUBLIC'],
      default: 'PRIVATE',
    },
    isActive: {     // ✅ ADDED
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', projectSchema);
