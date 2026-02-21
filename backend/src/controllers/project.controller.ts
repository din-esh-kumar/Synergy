// src/controllers/project.controller.ts

import { Request, Response } from 'express';
import Project from '../models/Project.model';
import User from '../models/User.model';
import { emitToRoom } from '../utils/socketEmitter';
import {
  createNotification,
  notifyProject,
} from '../utils/notificationEngine';

// ============ CREATE PROJECT ============
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, startDate, endDate, visibility, team } =
      req.body;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const userName = (req as any).user.name || (req as any).user.email;

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

    let projectTeam: string[] = [];
    if (Array.isArray(team) && team.length) {
      projectTeam = Array.from(new Set([...team, userId]));
    } else {
      projectTeam = [userId];
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

    // ✅ EMIT TO PROJECT ROOM
    emitToRoom(`project-${project._id}`, 'project:created', {
      projectId: project._id,
      name: name,
      owner: userId,
      team: projectTeam,
      timestamp: new Date(),
    });

    // ✅ NOTIFY TEAM MEMBERS (excluding creator)
    const otherTeamMembers = projectTeam.filter(
      (memberId: string) => memberId !== userId,
    );

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

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error: any) {
    console.error('createProject error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating project',
    });
  }
};

// ============ GET ALL PROJECTS ============
export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const { status, visibility } = req.query;

    let filter: any = {};

    if (userRole !== 'ADMIN') {
      filter.$or = [
        { owner: userId },
        { team: userId },
        { visibility: 'PUBLIC' },
      ];
    }

    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;

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
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching projects',
    });
  }
};

// ============ GET SINGLE PROJECT ============
export const getProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;

    const project = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('team', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const isOwner = project.owner._id.toString() === userId;
    const isTeamMember = project.team.some(
      (member: any) => member._id.toString() === userId,
    );
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
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching project',
    });
  }
};

// ============ UPDATE PROJECT ============
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;

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

    const {
      name,
      description,
      status,
      startDate,
      endDate,
      visibility,
      team,
    } = req.body;

    const oldName = project.name;
    const oldStatus = project.status;
    const oldTeam = project.team.map((m: any) => m.toString());

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    if (visibility) project.visibility = visibility;
    if (team) project.team = team;

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('team', 'name email');

    // ✅ EMIT UPDATE EVENT
    emitToRoom(`project-${id}`, 'project:updated', {
      projectId: project._id,
      name: project.name,
      status: project.status,
      updatedAt: new Date(),
    });

    // ✅ NOTIFY PROJECT MEMBERS ABOUT UPDATE (excluding owner)
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

    // ✅ If team changed, notify newly added members
    if (team && Array.isArray(team)) {
      const newTeamIds = team.map((t: any) => t.toString());
      const addedMembers = newTeamIds.filter(
        (memberId: string) =>
          !oldTeam.includes(memberId) && memberId !== userId,
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
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating project',
    });
  }
};

// ============ DELETE PROJECT ============
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;

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

    // capture team before delete
    const teamUserIds = project.team.map((m: any) => m.toString());

    await Project.findByIdAndDelete(id);

    // ✅ EMIT DELETE EVENT
    emitToRoom(`project-${id}`, 'project:deleted', {
      projectId: id,
      timestamp: new Date(),
    });

    // ✅ NOTIFY TEAM THAT PROJECT WAS DELETED
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
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting project',
    });
  }
};

// ============ ADD TEAM MEMBER ============
export const addTeamMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: newMemberId } = req.body;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const userName = (req as any).user.name || (req as any).user.email;

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

      // ✅ NOTIFY NEWLY ADDED MEMBER (persist + socket)
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
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding team member',
    });
  }
};
