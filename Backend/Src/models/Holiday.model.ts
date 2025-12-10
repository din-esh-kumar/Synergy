// src/models/Holiday.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  description?: string;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HolidaySchema = new Schema<IHoliday>(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, default: '' },
    isRecurring: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IHoliday>('Holiday', HolidaySchema);
