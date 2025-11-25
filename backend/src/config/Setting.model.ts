import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema({
  settingKey: { type: String, required: true },
  settingValue: { type: mongoose.Schema.Types.Mixed },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Setting", SettingSchema);
