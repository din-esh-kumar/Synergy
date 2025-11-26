import mongoose, { Document, Schema } from 'mongoose';

export interface IWeeklyReport extends Document {
  managerId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  weekStart: Date;
  weekEnd: Date;
  weekNumber?: number; // ISO week number (1-52)
  summary: string;
  progressPercentage: number;
  teamPerformance?: string;
  issuesFaced?: string;
  nextWeekPlan?: string;
  status: 'DRAFT' | 'SUBMITTED';
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyReportSchema: Schema = new Schema(
  {
    // The manager creating the report
    managerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },

    // The project being reported on
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Project', 
      required: true,
      index: true 
    },

    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    
    // Useful for dashboard graphs (e.g. "Week 12 vs Week 13")
    weekNumber: { type: Number }, 

    summary: { 
      type: String, 
      required: [true, 'Weekly summary is required'],
      trim: true 
    },

    progressPercentage: { 
      type: Number, 
      required: true,
      min: 0, 
      max: 100,
      default: 0
    },

    // Qualitative metrics
    teamPerformance: { type: String, default: '' },
    issuesFaced: { type: String, default: '' },
    nextWeekPlan: { type: String, default: '' },

    // Draft mode allows managers to save work before Admin sees it
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED'],
      default: 'DRAFT'
    }
  },
  { 
    timestamps: true 
  }
);

// Prevent duplicate reports for the same project/week combination? 
// Optional: WeeklyReportSchema.index({ projectId: 1, weekStart: 1 }, { unique: true });

export default mongoose.model<IWeeklyReport>('WeeklyReport', WeeklyReportSchema);