// src/config/Team.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  members: Types.ObjectId[];
  lead: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
    },
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ITeam>('Team', teamSchema);

