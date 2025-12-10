// src/models/User.model.ts - PERFECT + managerId added
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  phone?: string;
  designation?: string;
  status: boolean;
  avatar?: string;
  managerId?: Types.ObjectId;  // ✅ ADDED for manager hierarchy
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      default: 'EMPLOYEE',
    },
    phone: {
      type: String,
      default: '',
    },
    designation: {
      type: String,
      default: '',
    },
    status: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    managerId: {                 // ✅ ADDED
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
