import mongoose, { Schema, Document } from "mongoose";

export interface IIssue extends Document {
  title: string;
  projectId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true }
  },
  { timestamps: true }
);

export const Issue = mongoose.model<IIssue>("Issue", IssueSchema);
