import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String },

  oldValues: { type: Object },
  newValues: { type: Object },

  ipAddress: String,
  userAgent: String,

  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);