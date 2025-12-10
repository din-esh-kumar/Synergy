// src/controllers/task.controller.ts

import { Request, Response } from 'express';
import Task from '../models/Task.model';
import User from '../models/User.model';
import { emitToRoom } from '../utils/socketEmitter';
import {
  createNotification,
} from '../utils/notificationEngine';

// ============ CREATE TASK ============
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, priority, assignedTo, dueDate, projectId } =
      req.body;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const userName = (req as any).user.name || (req as any).user.email;

    if (!title || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Title and assignedTo are required',
      });
    }

    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found',
      });
    }

    if (userRole === 'EMPLOYEE' && assignedTo !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Employees can only create tasks for themselves',
      });
    }

    const task = new Task({
      title,
      description,
      priority,
      assignedTo,
      dueDate,
      projectId,
      createdBy: userId,
    });

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    // ✅ EMIT TASK CREATED EVENT TO PROJECT ROOM
    if (projectId) {
      emitToRoom(`project-${projectId}`, 'task:created', {
        taskId: task._id,
        title: task.title,
        assignedTo: assignedTo,
        priority: task.priority,
        createdBy: userId,
        timestamp: new Date(),
      });
    }

    // ✅ CREATE + EMIT NOTIFICATION TO ASSIGNEE (persists + socket)
    if (assignedTo !== userId) {
      await createNotification({
        userId: assignedTo,
        type: 'task',
        action: 'assigned',
        title: 'New task assigned',
        message: `You have been assigned: "${title}"`,
        entityType: 'task',
        entityId: task._id.toString(),
        icon: 'task',
        color: '#3b82f6',
        actionUrl: '/tasks', // adjust route if you have a detail page
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating task',
    });
  }
};

// ============ GET ALL TASKS ============
export const getTasks = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const { status, priority, assignedTo, projectId } = req.query;

    let filter: any = {};

    if (userRole !== 'ADMIN') {
      if (userRole === 'MANAGER') {
        filter.$or = [{ createdBy: userId }, { assignedTo: userId }];
      } else {
        filter.assignedTo = userId;
      }
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (projectId) filter.projectId = projectId;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching tasks',
    });
  }
};

// ============ GET SINGLE TASK ============
export const getTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;

    const task = await Task.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.userId', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (
      userRole !== 'ADMIN' &&
      task.assignedTo.toString() !== userId &&
      task.createdBy.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this task',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching task',
    });
  }
};

// ============ UPDATE TASK ============
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const userName = (req as any).user.name || (req as any).user.email;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (
      userRole !== 'ADMIN' &&
      task.createdBy.toString() !== userId &&
      task.assignedTo.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this task',
      });
    }

    const { title, description, status, priority, assignedTo, dueDate } =
      req.body;

    const oldAssignee = task.assignedTo.toString();
    const oldStatus = task.status;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = dueDate;

    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      task.completedDate = new Date();
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    // ✅ EMIT TASK UPDATE EVENT TO PROJECT ROOM
    if (task.projectId) {
      emitToRoom(`project-${task.projectId}`, 'task:updated', {
        taskId: task._id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        updatedBy: userId,
        timestamp: new Date(),
      });
    }

    // ✅ NOTIFY NEW ASSIGNEE IF REASSIGNED
    if (
      assignedTo &&
      oldAssignee !== assignedTo &&
      assignedTo !== userId
    ) {
      await createNotification({
        userId: assignedTo,
        type: 'task',
        action: 'assigned',
        title: 'Task reassigned',
        message: `You have been assigned: "${task.title}"`,
        entityType: 'task',
        entityId: task._id.toString(),
        icon: 'task',
        color: '#f59e0b',
        actionUrl: '/tasks',
      });
    }

    // ✅ NOTIFY ORIGINAL ASSIGNEE WHEN TASK COMPLETED BY SOMEONE ELSE
    if (status === 'COMPLETED' && oldAssignee !== userId) {
      await createNotification({
        userId: oldAssignee,
        type: 'task',
        action: 'completed',
        title: 'Task completed',
        message: `"${task.title}" has been completed`,
        entityType: 'task',
        entityId: task._id.toString(),
        icon: 'task',
        color: '#10b981',
        actionUrl: '/tasks',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating task',
    });
  }
};

// ============ DELETE TASK ============
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (userRole !== 'ADMIN' && task.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this task',
      });
    }

    const projectId = task.projectId;
    await Task.findByIdAndDelete(id);

    // ✅ EMIT DELETE EVENT TO PROJECT ROOM
    if (projectId) {
      emitToRoom(`project-${projectId}`, 'task:deleted', {
        taskId: id,
        title: task.title,
        deletedBy: userId,
        timestamp: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting task',
    });
  }
};

// ============ ADD COMMENT TO TASK ============
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = (req as any).user._id;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    task.comments = task.comments || [];
    task.comments.push({
      userId,
      text,
      createdAt: new Date(),
    });

    await task.save();
    await task.populate('comments.userId', 'name email');

    // ✅ EMIT COMMENT TO TASK ROOM
    emitToRoom(`task-${id}`, 'task:comment_added', {
      taskId: id,
      comment: task.comments[task.comments.length - 1],
      timestamp: new Date(),
    });

    // Optional: notify assignee about new comment (uncomment if you want)
    // if (task.assignedTo && task.assignedTo.toString() !== userId) {
    //   await createNotification({
    //     userId: task.assignedTo.toString(),
    //     type: 'task',
    //     action: 'commented',
    //     title: 'New comment on task',
    //     message: `New comment on "${task.title}"`,
    //     entityType: 'task',
    //     entityId: task._id.toString(),
    //     icon: 'chat',
    //     color: '#6366f1',
    //     actionUrl: '/tasks',
    //   });
    // }

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding comment',
    });
  }
};
