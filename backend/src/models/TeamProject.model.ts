import mongoose, { Schema, Document } from 'mongoose';

interface TeamProject extends Document {
  teamId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  allocatedBy: mongoose.Types.ObjectId;
  allocatedDate: Date;
  permissions: string[];
  status: 'active' | 'inactive' | 'archived';
}

const TeamProjectSchema = new Schema<TeamProject>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    allocatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    allocatedDate: {
      type: Date,
      default: Date.now,
    },
    permissions: {
      type: [String],
      default: ['view', 'edit', 'comment'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index (teamId + projectId must be unique)
TeamProjectSchema.index({ teamId: 1, projectId: 1 }, { unique: true });

export default mongoose.model<TeamProject>('TeamProject', TeamProjectSchema);
