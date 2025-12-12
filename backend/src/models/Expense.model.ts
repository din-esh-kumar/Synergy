import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExpense extends Document {
  userId: Types.ObjectId;
  date: string;
  amount: number;
  description?: string;
  receiptUrl?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    submittedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>('Expense', expenseSchema);
