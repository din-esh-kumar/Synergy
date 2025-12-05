import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IActivity extends Document {
  activityType: string;
  title: string;
  projectId: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

}
const ActivitySchema = new Schema<IActivity>(
  {
    activityType: { type: String, required: true },
    title: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true }
  },
  { timestamps: true }
);

export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);
