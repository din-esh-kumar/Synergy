import { Request, Response } from 'express';
import Task from '../models/Task.model';
import User from '../models/User.model';
import Project from '../models/Project.model';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  };
}

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Admin (assign to Manager) or Manager (assign to Employee)
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, title, description, priority, status, assigneeId, dueDate, estimatedHours, labels } = req.body;

    // 1. Project Validation
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // 2. Generate Task Key (e.g. "WEB-1")
    // Logic: Count existing tasks in this project and increment
    const taskCount = await Task.countDocuments({ projectId });
    const taskKey = `${project.key}-${taskCount + 1}`;

    // 3. Assignment Hierarchy Logic
    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      return res.status(400).json({ msg: 'Assignee user not found' });
    }

    if (req.user!.role === 'ADMIN') {
      // Admins can ONLY assign to Managers
      if (assignee.role !== 'MANAGER') {
        return res.status(400).json({ msg: 'Admins can only assign tasks to Managers.' });
      }
    } else if (req.user!.role === 'MANAGER') {
      // Managers can ONLY assign to their OWN Employees
      // Check 1: Is the assignee an employee?
      if (assignee.role !== 'EMPLOYEE') {
        return res.status(400).json({ msg: 'Managers can only assign tasks to Employees.' });
      }
      // Check 2: Does this employee report to me?
      if (assignee.managerId?.toString() !== req.user!.id) {
        return res.status(403).json({ msg: 'You can only assign tasks to employees who report to you.' });
      }
    } else {
      // Employees cannot create tasks (this should be blocked by route middleware too)
      return res.status(403).json({ msg: 'Employees cannot create tasks.' });
    }

    // 4. Create Task
    const task = new Task({
      projectId,
      taskKey,
      title,
      description,
      priority: priority || 'HIGH', // Default HIGH per requirement
      status,
      assigneeId,
      reporterId: req.user!.id,
      dueDate,
      estimatedHours,
      labels
    });

    await task.save();
    res.status(201).json(task);

  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    let query: any = {};

    // 1. Employee: "My Tasks"
    if (req.user?.role === 'EMPLOYEE') {
      query = { assigneeId: req.user.id };
    }
    // 2. Manager: "Tasks assigned TO me" OR "Tasks created BY me (for my team)"
    else if (req.user?.role === 'MANAGER') {
      query = {
        $or: [
          { assigneeId: req.user.id }, // Tasks from Admin
          { reporterId: req.user.id }  // Tasks I gave to my team
        ]
      };
    }
    // 3. Admin: All tasks (Default empty query)

    // Filter by Project if provided
    if (req.query.projectId) {
      query.projectId = req.query.projectId;
    }

    const tasks = await Task.find(query)
      .populate('assigneeId', 'name email')
      .populate('reporterId', 'name email')
      .populate('projectId', 'name key')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Update task status/details
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Logic:
    // - Admin can update anything.
    // - Manager can update tasks they created OR tasks assigned to them.
    // - Employee can ONLY update status (move to DONE) of tasks assigned to them.

    if (req.user?.role === 'EMPLOYEE') {
      if (task.assigneeId.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Access denied.' });
      }
      // Employee Restriction: Can typically only change Status + Actual Hours
      // (For simplicity here, we allow body updates, but you can restrict fields like 'title' if needed)
    } 
    
    else if (req.user?.role === 'MANAGER') {
      const isAssignedToMe = task.assigneeId.toString() === req.user.id;
      const isCreatedByMe = task.reporterId.toString() === req.user.id;
      
      if (!isAssignedToMe && !isCreatedByMe) {
        return res.status(403).json({ msg: 'Access denied.' });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Admin or Manager (Own created tasks)
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Admin can delete anything
    if (req.user?.role === 'ADMIN') {
      await task.deleteOne();
      return res.json({ msg: 'Task removed' });
    }

    // Manager can delete tasks they created (for their employees)
    if (req.user?.role === 'MANAGER') {
      if (task.reporterId.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Access denied. You did not create this task.' });
      }
      await task.deleteOne();
      return res.json({ msg: 'Task removed' });
    }

    return res.status(403).json({ msg: 'Access denied.' });

  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};