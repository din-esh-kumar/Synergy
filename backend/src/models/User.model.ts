import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGoogleTokens {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

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
  managerId?: Types.ObjectId;
  googleTokens?: IGoogleTokens;   // ← add this
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
      enum: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'INTERN'],
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
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    googleTokens: {
      access_token: String,
      refresh_token: String,
      scope: String,
      token_type: String,
      expiry_date: Number,
    }, // ← new field
  },
  { timestamps: true },
);

export default mongoose.model<IUser>('User', userSchema);
