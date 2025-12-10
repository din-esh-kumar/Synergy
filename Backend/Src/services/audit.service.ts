// src/services/audit.service.ts
import { AuditLog } from '../models/AuditLog.model';

export class AuditService {
  static async logAction(data: {
    entity: string;
    entityId: string;
    action: string;
    userId: string;
    details?: string;
  }) {
    await AuditLog.create({
      entity: data.entity,
      entityId: data.entityId,
      action: data.action,
      userId: data.userId,
      ...(data.details ? { details: data.details } : {}), // no null
    });
  }
}
