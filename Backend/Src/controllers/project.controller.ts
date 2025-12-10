// backend/src/controllers/project.controller.ts
import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project.model';
import User from '../models/User.model';
import { emitToRoom } from '../utils/socketEmitter';
import {
  createNotification,
  notifyProject,
} from '../utils/notificationEngine';

// Extended Request interface
interface UserRequest extends Request {
  user?: { id: string; _id: string; role: string; name?: string; email: string };
}

// ==================== SYNERGY FEATURES (Enhanced MongoDB + Socket + Notifications) ====================

// Create Project (MERGED: Synergy advanced + Leave service)
export const createProject = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, startDate, endDate, visibility, team } = req.body;
    const userId = req.user!._id || req.user!.id;
    const userRole = req.user!.role;
    const userName = req.user!.name || req.user!.email;

    // Synergy: Role validation
    if (userRole === 'EMPLOYEE') {
      return res.status(403).json({
        success: false,
        message: 'Employees cannot create projects',
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    // Synergy: Team handling (creator always included)
    let projectTeam: string[] = [userId];
    if (Array.isArray(team) && team.length) {
      projectTeam = Array.from(new Set([...team, userId]));
    }

    const project = new Project({
      name,
      description,
      startDate,
      endDate,
      visibility: visibility || 'PRIVATE',
      owner: userId,
      team: projectTeam,
    });

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('team', 'name email');

    // ✅ SYNERGY: Real-time socket emit
    emitToRoom(`project-${project._id}`, 'project:created', {
      projectId: project._id,
      name: project.name,
      owner: userId,
      team: projectTeam,
      timestamp: new Date(),
    });

    // ✅ SYNERGY: Notify team members (excluding creator)
    const otherTeamMembers = projectTeam.filter((memberId: string) => memberId !== userId);
    if (otherTeamMembers.length > 0) {
      await createNotification({
        userIds: otherTeamMembers,
        type: 'project',
        action: 'created',
        title: 'Added to project',
        message: `You have been added to project: ${name}`,
        entityType: 'project',
        entityId: project._id.toString(),
        icon: 'project',
        color: '#06b6d4',
        actionUrl: '/projects',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    next(error);
  }
};

// Get All Projects (MERGED: Role-based access + filters)
export const getProjects = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id || req.user!.id;
    const userRole = req.user!.role;
    const { status, visibility, isActive } = req.query;

    let filter: any = {};

    // Synergy: Role-based visibility
    if (userRole !== 'ADMIN') {
      filter.$or = [
        { owner: userId },
        { team: userId },
        { visibility: 'PUBLIC' },
      ];
    }

    // Leave: Filter support
    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const projects = await Project.find(filter)
      .populate('owner', 'name email')
      .populate('team', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error: any) {
    console.error('Get projects error:', error);
    next(error);
  }
};

// Get Single Project (MERGED: Access control)
export const getProject = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id || req.user!.id;
    const userRole = req.user!.role;

    const project = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('team', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Synergy: Advanced access control
    const isOwner = project.owner._id.toString() === userId;
    const isTeamMember = project.team.some((member: any) => member._id.toString() === userId);
    const isPublic = project.visibility === 'PUBLIC';

    if (userRole !== 'ADMIN' && !isOwner && !isTeamMember && !isPublic) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    console.error('Get project error:', error);
    next(error);
  }
};

// Update Project (MERGED: Socket + Notifications)
export const updateProject = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id || req.user!.id;
    const userRole = req.user!.role;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (userRole !== 'ADMIN' && project.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this project',
      });
    }

    const { name, description, status, startDate, endDate, visibility, team, isActive } = req.body;

    const oldName = project.name;
    const oldTeam = project.team.map((m: any) => m.toString());

    // Leave: Simple fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (isActive !== undefined) project.isActive = isActive;

    // Synergy: Advanced fields
    if (status) project.status = status;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    if (visibility) project.visibility = visibility;
    if (team) project.team = team;

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('team', 'name email');

    // ✅ SYNERGY: Real-time updates
    emitToRoom(`project-${id}`, 'project:updated', {
      projectId: project._id,
      name: project.name,
      status: project.status,
      updatedAt: new Date(),
    });

    // ✅ SYNERGY: Notify team about updates
    await notifyProject(project._id.toString(), {
      type: 'project',
      action: 'updated',
      title: 'Project updated',
      message: `Project "${project.name}" was updated`,
      entityType: 'project',
      entityId: project._id.toString(),
      icon: 'project',
      color: '#0ea5e9',
      actionUrl: '/projects',
    }, userId);

    // ✅ SYNERGY: Notify newly added team members
    if (team && Array.isArray(team)) {
      const newTeamIds = team.map((t: any) => t.toString());
      const addedMembers = newTeamIds.filter(
        (memberId: string) => !oldTeam.includes(memberId) && memberId !== userId,
      );

      if (addedMembers.length > 0) {
        await createNotification({
          userIds: addedMembers,
          type: 'project',
          action: 'assigned',
          title: 'Added to project',
          message: `You have been added to project: ${project.name}`,
          entityType: 'project',
          entityId: project._id.toString(),
          icon: 'project',
          color: '#22c55e',
          actionUrl: '/projects',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    next(error);
  }
};

// Delete Project (MERGED: Socket + Notifications)
export const deleteProject = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id || req.user!.id;
    const userRole = req.user!.role;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (userRole !== 'ADMIN' && project.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this project',
      });
    }

    const teamUserIds = project.team.map((m: any) => m.toString());

    await Project.findByIdAndDelete(id);

    // ✅ SYNERGY: Real-time delete event
    emitToRoom(`project-${id}`, 'project:deleted', {
      projectId: id,
      timestamp: new Date(),
    });

    // ✅ SYNERGY: Notify team
    if (teamUserIds.length > 0) {
      await createNotification({
        userIds: teamUserIds.filter((memberId) => memberId !== userId),
        type: 'project',
        action: 'deleted',
        title: 'Project deleted',
        message: `Project "${project.name}" has been deleted`,
        entityType: 'project',
        entityId: id,
        icon: 'project',
        color: '#ef4444',
        actionUrl: '/projects',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete project error:', error);
    next(error);
  }
};

// Add Team Member (Synergy)
export const addTeamMember = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId: newMemberId } = req.body;
    const userId = req.user!._id || req.user!.id;
    const userRole = req.user!.role;
    const userName = req.user!.name || req.user!.email;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (userRole !== 'ADMIN' && project.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this project',
      });
    }

    if (!project.team.includes(newMemberId)) {
      project.team.push(newMemberId);
      await project.save();
      await project.populate('team', 'name email');

      // ✅ NOTIFY NEW MEMBER
      await createNotification({
        userId: newMemberId,
        type: 'project',
        action: 'assigned',
        title: 'Added to project',
        message: `You have been added to project: ${project.name}`,
        entityType: 'project',
        entityId: project._id.toString(),
        icon: 'project',
        color: '#06b6d4',
        actionUrl: '/projects',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Team member added successfully',
      data: project,
    });
  } catch (error: any) {
    console.error('Add team member error:', error);
    next(error);
  }
};

// ==================== CLASS EXPORT (Leave Style) ====================
export class ProjectController {
  static async create(req: UserRequest, res: Response, next: NextFunction) {
    return createProject(req, res, next);
  }

  static async update(req: UserRequest, res: Response, next: NextFunction) {
    return updateProject(req, res, next);
  }

  static async delete(req: UserRequest, res: Response, next: NextFunction) {
    return deleteProject(req, res, next);
  }

  static async listAll(req: UserRequest, res: Response, next: NextFunction) {
    return getProjects(req, res, next);
  }

  static async getById(req: UserRequest, res: Response, next: NextFunction) {
    return getProject(req, res, next);
  }
}

// ==================== DEFAULT EXPORT (Synergy Style) ====================
export default {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addTeamMember,
};
