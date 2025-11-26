import { Request, Response } from 'express';
import DailyUpdate from '../models/DailyUpdate.model';
import User from '../models/User.model';
import Project from '../models/Project.model';

// Extend Request to include user info
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  };
}

// @desc    Create a daily update
// @route   POST /api/daily-updates
// @access  Employee only
export const createDailyUpdate = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, workDone, blockers, tomorrowPlan } = req.body;

    // 1. Get Employee Details (to find Manager)
    const employee = await User.findById(req.user!.id);
    
    if (!employee) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // 2. Validation: Does Employee have a Manager?
    if (!employee.managerId) {
      return res.status(400).json({ 
        msg: 'You do not have a manager assigned. Please contact Admin.' 
      });
    }

    // 3. Validation: Is Project Valid?
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // 4. Create Update
    const dailyUpdate = new DailyUpdate({
      employeeId: req.user!.id,
      managerId: employee.managerId, // Auto-filled
      projectId,
      workDone,
      blockers,
      tomorrowPlan,
      date: new Date().setHours(0,0,0,0) // Store as start of day for easier querying
    });

    await dailyUpdate.save();
    res.status(201).json(dailyUpdate);

  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Get daily updates
// @route   GET /api/daily-updates
// @access  Private
export const getDailyUpdates = async (req: AuthRequest, res: Response) => {
  try {
    let query: any = {};

    // 1. Manager: See updates assigned to them
    if (req.user?.role === 'MANAGER') {
      query = { managerId: req.user.id };
    }
    // 2. Employee: See only their own updates
    else if (req.user?.role === 'EMPLOYEE') {
      query = { employeeId: req.user.id };
    }
    // 3. Admin: See all (Optional, usually Admins don't check daily minutiae)

    // Optional Filtering by Date or Project via query params
    if (req.query.projectId) query.projectId = req.query.projectId;
    if (req.query.status) query.status = req.query.status; // e.g. ?status=PENDING

    const updates = await DailyUpdate.find(query)
      .populate('employeeId', 'name email')
      .populate('projectId', 'name key')
      .sort({ date: -1, createdAt: -1 });

    res.json(updates);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Review a daily update (Manager)
// @route   PATCH /api/daily-updates/:id/review
// @access  Manager only
export const reviewDailyUpdate = async (req: AuthRequest, res: Response) => {
  try {
    const { status, managerComment } = req.body;
    const updateId = req.params.id;

    const dailyUpdate = await DailyUpdate.findById(updateId);

    if (!dailyUpdate) {
      return res.status(404).json({ msg: 'Daily update not found' });
    }

    // Authorization: Only the assigned manager can review this
    if (dailyUpdate.managerId.toString() !== req.user!.id) {
      return res.status(403).json({ msg: 'Access denied. You are not the manager for this update.' });
    }

    // Update fields
    if (status) dailyUpdate.status = status;
    if (managerComment) dailyUpdate.managerComment = managerComment;

    await dailyUpdate.save();
    res.json(dailyUpdate);

  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};