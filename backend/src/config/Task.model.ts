import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  projectId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true }
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>("Task", TaskSchema);
