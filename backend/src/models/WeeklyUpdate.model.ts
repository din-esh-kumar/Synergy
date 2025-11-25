const mongoose = require("mongoose");

const WeeklyReportSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },

  summary: { type: String, required: true },
  progressPercentage: { type: Number, min: 0, max: 100 },

  teamPerformance: { type: String },
  issuesFaced: { type: String },
  nextWeekPlan: { type: String },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WeeklyReport", WeeklyReportSchema);
