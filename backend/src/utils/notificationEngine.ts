import mongoose from 'mongoose';
import Notification from '../models/Notification.model';
import { emitNotification } from './socketEmitter';

export interface NotificationPayload {
  userId?: string;
  userIds?: string[];
  type: 'team' | 'project' | 'task' | 'subtask' | 'meeting' | 'chat' | 'message' | 'system';
  action?: 'created' | 'updated' | 'deleted' | 'assigned' | 'commented' | 'mentioned' | 'completed';
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  icon?: string;
  color?: string;
  actionUrl?: string;
}

/**
 * Create and broadcast a notification to one or more users
 */
export async function createNotification(payload: NotificationPayload) {
  try {
    const userIds = payload.userIds || (payload.userId ? [payload.userId] : []);
    
    if (userIds.length === 0) {
      console.warn('No users specified for notification');
      return [];
    }

    // Create notifications for all users
    const notificationDocs = await Notification.insertMany(
      userIds.map((userId) => ({
        userId: new mongoose.Types.ObjectId(userId),
        type: payload.type,
        action: payload.action,
        title: payload.title,
        message: payload.message,
        read: false,
        relatedEntity: {
          entityType: payload.entityType,
          entityId: payload.entityId,
        },
        icon: payload.icon,
        color: payload.color,
        actionUrl: payload.actionUrl,
      }))
    );

    // Emit real-time notification via socket for each user
    notificationDocs.forEach((notificationDoc) => {
      emitNotification(notificationDoc.userId.toString(), {
        ...payload,
        _id: notificationDoc._id.toString(),
        id: notificationDoc._id.toString(),
      });
    });

    console.log(`✅ Created ${notificationDocs.length} notifications`);
    return notificationDocs;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const updated = await Notification.findByIdAndUpdate(
      notificationId,
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );
    return updated;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const result = await Notification.updateMany(
      { userId, read: false },
      {
        read: true,
        readAt: new Date(),
      }
    );
    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
    return result;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get notification statistics for a user
 */
export async function getNotificationStats(userId: string) {
  try {
    const unreadCount = await Notification.countDocuments({ 
      userId: new mongoose.Types.ObjectId(userId), 
      read: false 
    });
    
    const typeStats = await Notification.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId), 
          read: false 
        } 
      },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    return {
      unreadCount,
      byType: typeStats.reduce((acc: any, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
    };
  } catch (error) {
    console.error('❌ Error getting notification stats:', error);
    throw error;
  }
}

/**
 * Delete old notifications (older than specified days)
 */
export async function deleteOldNotifications(daysOld: number = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true,
    });
    
    console.log(`✅ Deleted ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error('❌ Error deleting old notifications:', error);
    throw error;
  }
}

/**
 * Create notifications for team members
 */
export async function notifyTeam(
  teamId: string,
  payload: Omit<NotificationPayload, 'userIds'>,
  excludeUserId?: string
) {
  try {
    const Team = require('../models/Team.model').default;
    const team = await Team.findById(teamId).select('members');
    
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    const userIds = team.members
      .map((member: any) => (member.userId || member)?.toString?.() || member)
      .filter((id: string) => id && id !== excludeUserId);

    return createNotification({
      ...payload,
      userIds,
    });
  } catch (error) {
    console.error('❌ Error notifying team:', error);
    throw error;
  }
}

/**
 * Create notifications for project members
 */
export async function notifyProject(
  projectId: string,
  payload: Omit<NotificationPayload, 'userIds'>,
  excludeUserId?: string
) {
  try {
    const Project = require('../models/TeamProject.model').default;
    const project = await Project.findById(projectId).select('teamId');
    
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    return notifyTeam(project.teamId, payload, excludeUserId);
  } catch (error) {
    console.error('❌ Error notifying project:', error);
    throw error;
  }
}

/**
 * Create notifications for task assigned users
 */
export async function notifyTaskAssignees(
  taskId: string,
  payload: Omit<NotificationPayload, 'userIds'>,
  excludeUserId?: string
) {
  try {
    const Task = require('../models/Task.model').default;
    const task = await Task.findById(taskId).select('assignedTo');
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const userIds = (task.assignedTo || [])
      .map((assignee: any) => assignee._id?.toString?.() || assignee)
      .filter((id: string) => id && id !== excludeUserId);

    return createNotification({
      ...payload,
      userIds,
    });
  } catch (error) {
    console.error('❌ Error notifying task assignees:', error);
    throw error;
  }
}
