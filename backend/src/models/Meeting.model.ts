import mongoose from "mongoose";

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  agenda: { type: String },

  // When the meeting happens
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },

  // Who created the meeting (any role)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Link to project / team (optional but useful)
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },

  // Participants
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Meeting metadata
  location: { type: String, default: null }, // room / zoom / gmeet
  meetingLink: { type: String, default: null },

  status: {
    type: String,
    enum: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED'
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Meeting', MeetingSchema);
