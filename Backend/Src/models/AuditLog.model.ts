// src/models/AuditLog.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  entity: string;
  entityId: string;
  action: string;
  userId: string;
  details?: string;        // <- optional, not null
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    action: { type: String, required: true },
    userId: { type: String, required: true },
    details: { type: String },   // <- no required, no default null
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
