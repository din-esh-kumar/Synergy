import { Request, Response } from 'express';
import Project from '../models/Project.model';
import User from '../models/User.model';

// Extend Request to include user info (populated by auth middleware)
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  };
}

// @desc    Create a new project
// @route   POST /api/projects
// @access  Admin only (Protected by Middleware)
export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    // NOTE: Role check removed here because router.post('/', authorize('ADMIN'), ...) handles it.

    const { name, key, description, priority, startDate, endDate, assignedManagerId } = req.body;

    // 1. Validate Manager Existence
    const manager = await User.findById(assignedManagerId);
    if (!manager || manager.role !== 'MANAGER') {
      return res.status(400).json({ msg: 'Invalid Manager ID provided. User must have MANAGER role.' });
    }

    // 2. Check for Duplicate Key
    const existingKey = await Project.findOne({ key });
    if (existingKey) {
      return res.status(400).json({ msg: `Project Key '${key}' already exists.` });
    }

    // 3. Create Project
    const project = new Project({
      name,
      key,
      description,
      priority,
      startDate,
      endDate,
      assignedManagerId,
      createdBy: req.user!.id // ! is safe because auth middleware guarantees user exists
    });

    await project.save();
    res.status(201).json(project);

  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    let query = {};

    // Logic: 
    // - Admins: View ALL.
    // - Managers: View ONLY projects they manage.
    // - Employees: View ALL (Open directory) - *Can be restricted later via Team logic*
    
    if (req.user?.role === 'MANAGER') {
      query = { assignedManagerId: req.user.id };
    }

    const projects = await Project.find(query)
      .populate('assignedManagerId', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('assignedManagerId', 'name email');

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Optional: If you want to restrict Managers from seeing details of projects they don't own
    if (req.user?.role === 'MANAGER' && project.assignedManagerId.id.toString() !== req.user.id) {
       return res.status(403).json({ msg: 'Access denied.' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Admin (All) OR Manager (Own Projects) - (Protected by Middleware)
export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Resource-Level Authorization
    // Middleware lets any 'MANAGER' in, but we must ensure they own THIS project.
    const isAdmin = req.user?.role === 'ADMIN';
    const isOwnerManager = req.user?.role === 'MANAGER' && project.assignedManagerId.toString() === req.user.id;

    if (!isAdmin && !isOwnerManager) {
      return res.status(403).json({ msg: 'Access denied. You do not manage this project.' });
    }

    // Prevent Manager from changing the Project Owner (ManagerId)
    if (req.body.assignedManagerId && !isAdmin) {
      return res.status(403).json({ msg: 'Only Admins can reassign project managers.' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Admin only (Protected by Middleware)
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    // NOTE: Role check removed here because router.delete('/:id', authorize('ADMIN'), ...) handles it.

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    await project.deleteOne();
    res.json({ msg: 'Project removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};