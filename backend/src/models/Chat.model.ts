// backend/src/models/Chat.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ChatMessage extends Document {
  content: string;
  sender: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  toUserId?: mongoose.Types.ObjectId; // ✅ direct DM target
  attachments: {
    filename: string;
    url: string;
    fileType: string;
    size: number;
  }[];
  mentions: mongoose.Types.ObjectId[];
  reactions: Map<string, mongoose.Types.ObjectId[]>;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<ChatMessage>(
  {
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
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
    }, // ✅ DM partner
    attachments: [
      {
        filename: String,
        url: String,
        fileType: String,
        size: Number,
      },
    ],
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reactions: {
      type: Map,
      of: [Schema.Types.ObjectId],
      default: new Map(),
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
ChatSchema.index({ teamId: 1, createdAt: -1 });
ChatSchema.index({ projectId: 1, createdAt: -1 });
ChatSchema.index({ taskId: 1, createdAt: -1 });
// Optional index for DMs
ChatSchema.index({ toUserId: 1, createdAt: -1 });

const Chat = mongoose.model<ChatMessage>('Chat', ChatSchema);
export default Chat;
