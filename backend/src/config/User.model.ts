// backend/src/config/User.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// User interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  id?: string;
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  managerId?: mongoose.Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// User schema
const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "EMPLOYEE"],
      default: "EMPLOYEE",
    },

    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

// ✅ Prevent OverwriteModelError
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
