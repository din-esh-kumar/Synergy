// backend/src/config/Project.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProject extends Document {
  _id: Types.ObjectId; // <- ObjectId, not string
  name: string;
  description: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: Date | null;
  endDate?: Date | null;
  owner: Types.ObjectId;          // <- ObjectId
  team: Types.ObjectId[];        // <- ObjectId[]
  budget?: number | null;
  visibility: 'PRIVATE' | 'PUBLIC';
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
      type: Schema.Types.ObjectId as unknown as typeof Types.ObjectId,
      ref: 'User',
      required: true,
    },
    team: [
      {
        type: Schema.Types.ObjectId as unknown as typeof Types.ObjectId,
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
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', projectSchema);
