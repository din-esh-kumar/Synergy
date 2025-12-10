// src/models/Expense.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface IExpense extends Document {
  userId: Types.ObjectId;
  date: Date;
  amount: number;
  description?: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    receiptUrl: { type: String },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
