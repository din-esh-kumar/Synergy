import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  projectId: mongoose.Types.ObjectId;
  taskKey: string; // e.g., "WEB-12"
  title: string;
  description?: string;
  
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  
  assigneeId: mongoose.Types.ObjectId; // REQUIRED: Hierarchy enforced in Controller
  reporterId: mongoose.Types.ObjectId; // Who created it
  
  dueDate?: Date;
  labels: string[];
  
  estimatedHours?: number; 
  actualHours?: number;

  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },

    taskKey: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    title: { 
      type: String, 
      required: [true, 'Task title is required'], 
      trim: true 
    },
    description: { type: String, default: '' },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH', // CHANGED: Default is now HIGH per requirement
      index: true
    },

    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
      default: 'TODO',
      index: true
    },

    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned to someone'], // Enforcing assignment
      index: true
    },

    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    dueDate: { type: Date },

    labels: [{ type: String, trim: true }],

    estimatedHours: { type: Number, min: 0 },
    actualHours: { type: Number, min: 0, default: 0 }
  },
  { 
    timestamps: true 
  }
);

// Compound index for dashboards: "Show me my TODO tasks"
TaskSchema.index({ assigneeId: 1, status: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);