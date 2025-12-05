import mongoose, { Schema, Document } from 'mongoose';

interface ProjectDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  fileType: string;
  size: number;
  url: string;
  uploadedBy: mongoose.Types.ObjectId;
  tags: string[];
  uploadedAt: Date;
}

const DocumentSchema = new Schema<ProjectDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif'],
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

DocumentSchema.index({ projectId: 1 });

export default mongoose.model<ProjectDocument>('Document', DocumentSchema);
