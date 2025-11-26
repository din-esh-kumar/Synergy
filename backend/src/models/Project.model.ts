import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  key: string; // Jira-style key (e.g., "WEB", "API")
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PLANNING' | 'ONGOING' | 'ON HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: Date;
  endDate?: Date;
  assignedManagerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Project name is required'], 
      trim: true 
    },
    // CRITICAL FOR JIRA: The short code for tickets (e.g., "SYN" -> "SYN-101")
    key: { 
      type: String, 
      required: [true, 'Project Key is required (e.g. SYN, WEB)'], 
      unique: true, 
      uppercase: true, 
      trim: true, 
      minlength: 2, 
      maxlength: 10 
    },
    description: { 
      type: String,
      default: ''
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['PLANNING', 'ONGOING', 'ON HOLD', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNING'
    },
    // Timeline Management
    startDate: { type: Date },
    endDate: { type: Date },

    // The "Owner" of the project logic
    assignedManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A project must have an assigned Manager'],
      index: true // Index for faster Manager Dashboard queries
    },
    // Who actually clicked "Create" (Usually Admin)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { 
    timestamps: true // Automatically handles createdAt and updatedAt
  }
);

export default mongoose.model<IProject>('Project', ProjectSchema);



// import mongoose from "mongoose";

// const ProjectSchema = new mongoose.Schema({
//   name: { type: String, required: true },

//   priority: {
//     type: String,
//     enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
//     default: "MEDIUM"
//   },

//   status: {
//     type: String,
//     enum: ["PLANNING", "ONGOING", "ON HOLD", "COMPLETED", "CANCELLED"],
//     default: "PLANNING"
//   },

//   description: { type: String },

//   assignedManagerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true
//   },

//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true
//   },

//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model("Project", ProjectSchema)