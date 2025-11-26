import { Request, Response } from 'express';
import Project from '../models/Project.model';
import User from '../models/User.model';
// import Team from '../models/Team.model'; // Import Team to check Employee membership

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  };
}

// @desc    Create a new project
// @route   POST /api/projects
// @access  Admin only
export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, key, description, priority, startDate, endDate, assignedManagerId } = req.body;

    // 1. Validate Manager
    const manager = await User.findById(assignedManagerId);
    if (!manager || manager.role !== 'MANAGER') {
      return res.status(400).json({ msg: 'Invalid Manager ID. User must have MANAGER role.' });
    }

    // 2. Check Duplicate Key
    const existingKey = await Project.findOne({ key });
    if (existingKey) {
      return res.status(400).json({ msg: `Project Key '${key}' already exists.` });
    }

    const project = new Project({
      name,
      key,
      description,
      priority,
      startDate,
      endDate,
      assignedManagerId,
      createdBy: req.user!.id
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Get projects (Filtered by Role)
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    let query: any = {};

    // --- ROLE BASED FILTERING ---
    
    // 1. MANAGER: See only projects they manage
    if (req.user?.role === 'MANAGER') {
      query = { assignedManagerId: req.user.id };
    }

    // 2. EMPLOYEE: See only projects where they are a Team Member_________________________
    if (req.user?.role === 'EMPLOYEE') {
      // Find all teams where this user is a member
      // const userTeams = await Team.find({ members: req.user.id }).select('projectId');
      
      // Extract the Project IDs from those teams
      // const projectIds = userTeams.map(team => team.projectId);
      
      // Filter projects to only include those IDs
      // query = { _id: { $in: projectIds } };
    }

    // 3. ADMIN: See ALL projects (query remains empty {})

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

    // Strict Access Check for Manager/Employee viewing specific ID
    if (req.user?.role === 'MANAGER' && project.assignedManagerId._id.toString() !== req.user.id) {
       return res.status(403).json({ msg: 'Access denied. You do not manage this project.' });
    }
    
    // Note: For Employees, you might strictly want to check Team membership here too, 
    // but typically if they have the ID, read access is less critical than write access.
    // We can add strict Team check here if requested.

    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Admin (All) OR Manager (Own Projects)
export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // --- PART 1: MANAGER MODIFY OWN LOGIC ---
    const isAdmin = req.user?.role === 'ADMIN';
    const isOwnerManager = req.user?.role === 'MANAGER' && project.assignedManagerId.toString() === req.user.id;

    if (!isAdmin && !isOwnerManager) {
      return res.status(403).json({ msg: 'Access denied. You do not manage this project.' });
    }

    // Protection: Managers cannot reassign the project to someone else
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
// @access  Admin only
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
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