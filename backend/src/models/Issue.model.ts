import mongoose, { Schema, Document, Types } from 'mongoose';

export type IssueType = 'BUG' | 'TASK' | 'STORY';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IIssue extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  projectId?: Types.ObjectId;        // made optional for global issues
  reporter: Types.ObjectId;
  assignee?: Types.ObjectId | null;
  team?: Types.ObjectId | null;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const issueSchema = new Schema<IIssue>(
  {
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['BUG', 'TASK', 'STORY'],
      default: 'TASK',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: false,               // not required now
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Use existing model if already compiled (fixes OverwriteModelError in dev)
const Issue =
  (mongoose.models.Issue as mongoose.Model<IIssue>) ||
  mongoose.model<IIssue>('Issue', issueSchema);

export default Issue;
export { Issue };
