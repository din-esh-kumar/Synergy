import mongoose from "mongoose";

const IssueSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },

  issueType: {
    type: String,
    enum: ["BUG", "TASK", "STORY", "EPIC"],
    default: "TASK"
  },

  title: { type: String, required: true },
  description: { type: String },

  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    default: "MEDIUM"
  },

  status: {
    type: String,
    enum: ["OPEN", "IN PROGRESS", "REVIEW", "BLOCKED", "RESOLVED", "CLOSED"],
    default: "OPEN"
  },

  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true // Admin/Manager only
  },

  assignedToUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  assignedToTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    default: null
  },

  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],

  attachments: [
    {
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Issue", IssueSchema);
