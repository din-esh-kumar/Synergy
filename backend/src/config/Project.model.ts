import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },

  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    default: "MEDIUM"
  },

  status: {
    type: String,
    enum: ["PLANNING", "ONGOING", "ON HOLD", "COMPLETED", "CANCELLED"],
    default: "PLANNING"
  },

  description: { type: String },

  assignedManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Project", ProjectSchema)