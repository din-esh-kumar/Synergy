// import mongoose, { Schema, Document, Types } from 'mongoose';

// export type IssueType = 'BUG' | 'TASK' | 'STORY';
// export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
// export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// export interface IIssue extends Document {
//   _id: Types.ObjectId;
//   title: string;
//   description?: string;
//   type: IssueType;
//   status: IssueStatus;
//   priority: IssuePriority;
//   projectId: Types.ObjectId;
//   reporter: Types.ObjectId;
//   assignee?: Types.ObjectId | null;
//   team?: Types.ObjectId | null;
//   dueDate?: Date | null;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const issueSchema = new Schema<IIssue>(
//   {
//     title: {
//       type: String,
//       required: [true, 'Issue title is required'],
//       trim: true,
//       maxlength: 150,
//     },
//     description: {
//       type: String,
//       default: '',
//     },
//     type: {
//       type: String,
//       enum: ['BUG', 'TASK', 'STORY'],
//       default: 'TASK',
//     },
//     status: {
//       type: String,
//       enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
//       default: 'OPEN',
//     },
//     priority: {
//       type: String,
//       enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
//       default: 'MEDIUM',
//     },
//     projectId: {
//       type: Schema.Types.ObjectId,
//       ref: 'Project',
//       required: true,
//     },
//     reporter: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     assignee: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       default: null,
//     },
//     team: {
//       type: Schema.Types.ObjectId,
//       ref: 'Team',
//       default: null,
//     },
//     dueDate: {
//       type: Date,
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// // Use existing model if already compiled (fixes OverwriteModelError in dev)
// const Issue =
//   (mongoose.models.Issue as mongoose.Model<IIssue>) ||
//   mongoose.model<IIssue>('Issue', issueSchema);

// export default Issue;
// export { Issue };


import mongoose, { Schema, Document } from 'mongoose';

interface Issue extends Document {
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  raisedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  attachments: {
    filename: string;
    url: string;
    fileType: string;
  }[];
  comments: {
    userId: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<Issue>(
  {
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    raisedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    attachments: [
      {
        filename: String,
        url: String,
        fileType: String,
      },
    ],
    comments: [
      {
        userId: {
          type: Schema.Types.ObjectId,
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
  {
    timestamps: true,
  }
);

IssueSchema.index({ raisedBy: 1 });
IssueSchema.index({ assignedTo: 1 });
IssueSchema.index({ projectId: 1 });
IssueSchema.index({ teamId: 1 });

export default mongoose.model<Issue>('Issue', IssueSchema);
