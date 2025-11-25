import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;  // FIXED
  id?: string;   
  name: string;
  email: string;
  password: string;

  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  managerId?: mongoose.Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["ADMIN", "MANAGER", "EMPLOYEE"],
    default: "EMPLOYEE"
  },

  managerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>("User", UserSchema);
