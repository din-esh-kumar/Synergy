import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  _id: Types.ObjectId; // ObjectId, not string
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId?: Types.ObjectId | null;
  assignedTo: Types.ObjectId;      // ObjectId
  createdBy: Types.ObjectId;       // ObjectId
  dueDate?: Date | null;
  startDate?: Date | null;
  completedDate?: Date | null;
  tags?: string[];
  attachments?: string[];
  comments?: Array<{
    userId: Types.ObjectId;
    text: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
      default: 'TODO',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    projectId: {
      type: Schema.Types.ObjectId as unknown as typeof Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    assignedTo: {
      type: Schema.Types.ObjectId as unknown as typeof Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned to someone'],
    },
    createdBy: {
      type: Schema.Types.ObjectId as unknown as typeof Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    tags: [String],
    attachments: [String],
    comments: [
      {
        userId: {
          type: Schema.Types.ObjectId as unknown as typeof Types.ObjectId,
          ref: 'User',
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ITask>('Task', taskSchema);
