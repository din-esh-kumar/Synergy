import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: string; // Format: YYYY-MM-DD
  description?: string;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    isRecurring: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IHoliday>('Holiday', holidaySchema);
