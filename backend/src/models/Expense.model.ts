import mongoose, { Schema, Document, Types } from 'mongoose';

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface IReceipt {
  url: string;
  filename: string;
}

export interface IExpense extends Document {
  // who created / owns the expense (for EMS this is usually the employee)
  employeeId: Types.ObjectId;

  // optional project the expense is booked against
  projectId?: Types.ObjectId | null;

  date: string; // keep as string if that is what you already store
  amount: number;
  description?: string;

  // simple category + currency metadata
  category: string; // e.g. 'travel', 'meal', 'office', 'other'
  currency: string; // e.g. 'INR', 'USD'

  // merchant / vendor info
  merchantName?: string;

  // either keep old receiptUrl for compatibility or use rich receipt object
  receiptUrl?: string;
  receipt?: IReceipt | null;

  status: ExpenseStatus;

  // workflow timestamps & approver
  submittedAt?: Date | null;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  processedAt?: Date | null;

  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const receiptSchema = new Schema<IReceipt>(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
  },
  { _id: false }
);

const expenseSchema = new Schema<IExpense>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
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

    category: {
      type: String,
      default: 'other',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    merchantName: {
      type: String,
      default: '',
    },

    // keep old field for backward compatibility if you already stored URLs as a plain string
    receiptUrl: {
      type: String,
      default: '',
    },
    // newer richer receipt shape used by controller
    receipt: {
      type: receiptSchema,
      default: null,
    },

    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },

    submittedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>('Expense', expenseSchema);
