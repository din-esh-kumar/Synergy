import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'INTERN';
  phone?: string;
  designation?: string;
  status: boolean;
  avatar?: string;
  managerId?: Types.ObjectId; //
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema(
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
      enum: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'INTERN'], // ✅ Added INTERN
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
    managerId: { // ✅ Added manager relationship
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
