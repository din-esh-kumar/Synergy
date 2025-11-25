import mongoose from "mongoose";

const DailyUpdateSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

  date: { type: Date, default: Date.now },

  workDone: { type: String, required: true },
  blockers: { type: String },
  tomorrowPlan: { type: String },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DailyUpdate", DailyUpdateSchema);
