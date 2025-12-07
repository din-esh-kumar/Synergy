// src/models/Chat.model.ts

import { Schema, model, Document } from 'mongoose';

interface IChat extends Document {
  content: string;
  sender: any;
  teamId?: any;
  projectId?: any;
  taskId?: any;
  toUserId?: any;
  attachments?: any[];
  mentions?: any[];
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    editedAt: Date,
  },
  { timestamps: true }
);

export default model<IChat>('Chat', ChatSchema);
