import { Request, Response } from 'express';
import Task from '../models/Task.model';
import User from '../models/User.model';
import Notification from '../models/Notification.model';

// Create Task
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, priority, assignedTo, dueDate, projectId } =
      req.body;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const userName = (req as any).user.name || (req as any).user.email;

    // Validate required fields
    if (!title || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Title and assignedTo are required',
      });
    }

    // Check if assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found',
      });
    }

    // Only ADMIN and MANAGER can create tasks for others
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

    // 🔔 Send notification to assigned user (if not the creator)
    if (assignedTo !== userId) {
      try {
        await Notification.create({
          user: assignedTo,
          type: 'task',
          title: 'New task assigned',
          message: `You have been assigned task: ${title}`,
          data: {
            entityId: task._id.toString(),
            entityType: 'task',
            taskTitle: title,
            projectId: projectId || null,
            assignedBy: userId.toString(),
            assignedByName: userName,
            priority: priority || 'MEDIUM',
            dueDate: dueDate || null,
          },
        } as any);
      } catch (notifErr) {
        console.error('Failed to create task notification', notifErr);
      }
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

// Get All Tasks (with filters)
export const getTasks = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const { status, priority, assignedTo, projectId } = req.query;

    let filter: any = {};

    // ADMIN sees all tasks
    if (userRole !== 'ADMIN') {
      // MANAGER sees tasks in their projects or assigned to their team
      if (userRole === 'MANAGER') {
        filter.$or = [
          { createdBy: userId },
          { assignedTo: userId },
        ];
      } else {
        // EMPLOYEE sees only their own tasks
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

// Get Single Task
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

    // Check access
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

// Update Task
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

    // Check permission: ADMIN, task creator, or assigned user can update
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

    // Track if assignee changed
    const oldAssignee = task.assignedTo.toString();
    const newAssignee = assignedTo;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = dueDate;

    if (status === 'COMPLETED' && !task.completedDate) {
      task.completedDate = new Date();
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    // 🔔 Send notification if task is reassigned
    if (newAssignee && oldAssignee !== newAssignee && newAssignee !== userId) {
      try {
        await Notification.create({
          user: newAssignee,
          type: 'task',
          title: 'Task reassigned',
          message: `You have been assigned task: ${task.title}`,
          data: {
            entityId: task._id.toString(),
            entityType: 'task',
            taskTitle: task.title,
            projectId: task.projectId || null,
            reassignedBy: userId.toString(),
            reassignedByName: userName,
            priority: task.priority,
            dueDate: task.dueDate || null,
          },
        } as any);
      } catch (notifErr) {
        console.error('Failed to create reassignment notification', notifErr);
      }
    }

    // 🔔 Send notification when task is completed
    if (status === 'COMPLETED' && oldAssignee !== userId) {
      try {
        await Notification.create({
          user: oldAssignee,
          type: 'task',
          title: 'Task completed',
          message: `Task "${task.title}" has been marked as completed`,
          data: {
            entityId: task._id.toString(),
            entityType: 'task',
            taskTitle: task.title,
            projectId: task.projectId || null,
            completedBy: userId.toString(),
            completedByName: userName,
          },
        } as any);
      } catch (notifErr) {
        console.error('Failed to create completion notification', notifErr);
      }
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

// Delete Task
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

    // Only ADMIN or task creator can delete
    if (userRole !== 'ADMIN' && task.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this task',
      });
    }

    await Task.findByIdAndDelete(id);

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

// Add Comment to Task
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

    task.comments?.push({
      userId,
      text,
      createdAt: new Date(),
    });

    await task.save();
    await task.populate('comments.userId', 'name email');

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