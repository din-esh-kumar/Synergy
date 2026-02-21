// src/controllers/chat.controller.ts

import { Request, Response } from 'express';
import Chat from '../models/Chat.model';
import { createNotification } from '../utils/notificationEngine';
import { emitToRoom } from '../utils/socketEmitter';

// ============ SEND MESSAGE ============
export async function sendMessage(req: Request, res: Response) {
  try {
    const {
      content,
      teamId,
      projectId,
      taskId,
      toUserId,
      attachments,
      mentions,
    } = req.body;

    const userId = (req as any).userId;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    let roomId = '';
    let roomType: 'team' | 'project' | 'task' | 'direct' = 'team';

    if (teamId) {
      roomId = `team-${teamId}`;
      roomType = 'team';
    } else if (projectId) {
      roomId = `project-${projectId}`;
      roomType = 'project';
    } else if (taskId) {
      roomId = `task-${taskId}`;
      roomType = 'task';
    } else if (toUserId) {
      const ids = [userId.toString(), toUserId.toString()].sort().join('-');
      roomId = `dm-${ids}`;
      roomType = 'direct';
    } else {
      return res
        .status(400)
        .json({ error: 'Team, Project, Task, or toUserId is required' });
    }

    const message = await Chat.create({
      content,
      sender: userId,
      teamId,
      projectId,
      taskId,
      toUserId,
      attachments,
      mentions,
    });

    await message.populate('sender', 'name email avatar');

    // ✅ EMIT TO SOCKET ROOM
    emitToRoom(roomId, 'chat:message_received', message);

    // ✅ CREATE MENTIONS NOTIFICATIONS (persist + socket via notificationEngine)
    if (mentions && mentions.length > 0) {
      await createNotification({
        userIds: mentions.filter((id: string) => id !== userId),
        type: 'chat', // stored as 'chat' notifications
        action: 'mentioned',
        title:
          roomType === 'direct'
            ? 'You were mentioned in a direct message'
            : `You were mentioned in ${roomType} chat`,
        message: (content || '').substring(0, 50) + '...',
        entityType: roomType,
        entityId: teamId || projectId || taskId || toUserId,
        icon: 'chat',
        color: '#3b82f6',
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

// ============ GET MESSAGES ============
export async function getMessages(req: Request, res: Response) {
  try {
    const { teamId, projectId, taskId, toUserId, limit = 50, skip = 0 } =
      req.query as any;

    const userId = (req as any).userId;

    const query: any = {};

    if (teamId) query.teamId = teamId;
    if (projectId) query.projectId = projectId;
    if (taskId) query.taskId = taskId;
    if (toUserId) {
      query.$or = [
        { sender: userId, toUserId },
        { sender: toUserId, toUserId: userId },
      ];
    }

    const messages = await Chat.find(query)
      .populate('sender', 'name email avatar')
      .populate('mentions', 'name email')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Chat.countDocuments(query);

    res.json({
      messages: messages.reverse(),
      total,
      limit: Number(limit),
      skip: Number(skip),
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

// ============ DELETE MESSAGE ============
export async function deleteMessage(req: Request, res: Response) {
  try {
    const { messageId } = req.params;
    const userId = (req as any).userId;

    const message = await Chat.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // ✅ DETERMINE ROOM BEFORE DELETION
    let roomId = '';
    if (message.teamId) roomId = `team-${message.teamId}`;
    else if (message.projectId) roomId = `project-${message.projectId}`;
    else if (message.taskId) roomId = `task-${message.taskId}`;
    else if (message.toUserId) {
      const ids = [userId.toString(), message.toUserId.toString()]
        .sort()
        .join('-');
      roomId = `dm-${ids}`;
    }

    await Chat.findByIdAndDelete(messageId);

    // ✅ EMIT DELETION EVENT TO ROOM
    emitToRoom(roomId, 'chat:message_deleted', { messageId });

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
}

// ============ EDIT MESSAGE ============
export async function editMessage(req: Request, res: Response) {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = (req as any).userId;

    const message = await Chat.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // ✅ DETERMINE ROOM
    let roomId = '';
    if (message.teamId) roomId = `team-${message.teamId}`;
    else if (message.projectId) roomId = `project-${message.projectId}`;
    else if (message.taskId) roomId = `task-${message.taskId}`;
    else if (message.toUserId) {
      const ids = [userId.toString(), message.toUserId.toString()]
        .sort()
        .join('-');
      roomId = `dm-${ids}`;
    }

    message.content = content;
    message.editedAt = new Date();
    await message.save();

    // ✅ EMIT EDIT EVENT TO ROOM
    emitToRoom(roomId, 'chat:message_edited', message);

    res.json(message);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
}
