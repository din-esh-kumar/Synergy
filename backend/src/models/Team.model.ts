// src/models/Team.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeam extends Document {
  name: string;
  description?: string;
  lead?: Types.ObjectId | null;
  members: Types.ObjectId[];
  projects: Types.ObjectId[];
  tasks: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    lead: { type: Schema.Types.ObjectId, ref: "User", default: null },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Team = mongoose.model<ITeam>("Team", TeamSchema);
