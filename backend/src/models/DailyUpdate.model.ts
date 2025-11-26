import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyUpdate extends Document {
  employeeId: mongoose.Types.ObjectId;
  managerId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  date: Date;
  workDone: string;
  blockers?: string;
  tomorrowPlan?: string;
  status: 'PENDING' | 'REVIEWED' | 'FLAGGED'; // New field for Manager workflow
  managerComment?: string; // Optional feedback from manager
  createdAt: Date;
  updatedAt: Date;
}

const DailyUpdateSchema: Schema = new Schema(
  {
    // The employee submitting the update
    employeeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    
    // The manager responsible for reviewing this (Auto-filled by backend)
    managerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },

    // The project context
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Project', 
      required: true,
      index: true
    },

    // We will store this as YYYY-MM-DD (start of day) to make querying easier
    date: { 
      type: Date, 
      default: Date.now,
      index: true 
    },

    // Core content
    workDone: { 
      type: String, 
      required: [true, 'Please specify what you worked on today'],
      trim: true 
    },
    
    blockers: { type: String, default: '' },
    
    tomorrowPlan: { type: String, default: '' },

    // Workflow: Manager reviews the update
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'FLAGGED'],
      default: 'PENDING',
      index: true // Useful for "Show me pending updates"
    },

    // Manager can reply directly to an update
    managerComment: { type: String }
  },
  { 
    timestamps: true 
  }
);

// Optional: Prevent duplicate updates for the same project on the same day
// DailyUpdateSchema.index({ employeeId: 1, projectId: 1, date: 1 }, { unique: true });

export default mongoose.model<IDailyUpdate>('DailyUpdate', DailyUpdateSchema);