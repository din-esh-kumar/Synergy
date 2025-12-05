import { Request, Response } from 'express';
import Project from '../models/Project.model';
import User from '../models/User.model';
import Notification from '../models/Notification.model';

// Create Project
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, startDate, endDate, visibility, team } = req.body;
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

    // ensure owner is always part of team
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

    // 🔔 Send notifications to team members
    const otherTeamMembers = projectTeam.filter(
      (memberId: string) => memberId !== userId
    );
    if (otherTeamMembers.length > 0) {
      const notificationDocs = otherTeamMembers.map((memberId: string) => ({
        user: memberId,
        type: 'project' as const,
        title: 'Added to project',
        message: `You have been added to project: ${name}`,
        data: {
          entityId: project._id.toString(),
          entityType: 'project',
          projectName: name,
          createdBy: userId.toString(),
          createdByName: userName,
        },
      }));

      if (notificationDocs.length > 0) {
        try {
          await Notification.insertMany(notificationDocs as any[]);
        } catch (notifErr) {
          console.error('Failed to create project notifications', notifErr);
        }
      }
    }

    // 🔔 Create notification for project owner
    try {
      await Notification.create({
        user: userId,
        type: 'project',
        title: 'Project created',
        message: `Your project "${name}" was created successfully.`,
        data: {
          entityId: project._id.toString(),
          entityType: 'project',
          projectName: name,
        },
      } as any);
    } catch (notifErr) {
      console.error('Failed to create owner notification', notifErr);
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

// Get All Projects
export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const { status, visibility } = req.query;

    let filter: any = {};

    // ADMIN sees all projects
    if (userRole !== 'ADMIN') {
      // MANAGER and EMPLOYEE see only their projects or where they are in team
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

// Get Single Project
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

    // Check access
    const isOwner = project.owner._id.toString() === userId;
    const isTeamMember = project.team.some(
      (member: any) => member._id.toString() === userId
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

// Update Project
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

    // Check permission: only owner or ADMIN
    if (
      userRole !== 'ADMIN' &&
      project.owner.toString() !== userId
    ) {
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

// Delete Project
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

    // Only ADMIN or project owner can delete
    if (
      userRole !== 'ADMIN' &&
      project.owner.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this project',
      });
    }

    await Project.findByIdAndDelete(id);

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

// Add Team Member
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

    if (
      userRole !== 'ADMIN' &&
      project.owner.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this project',
      });
    }

    if (!project.team.includes(newMemberId)) {
      project.team.push(newMemberId);
      await project.save();
      await project.populate('team', 'name email');

      // 🔔 Send notification to newly added member
      try {
        await Notification.create({
          user: newMemberId,
          type: 'project',
          title: 'Added to project',
          message: `You have been added to project: ${project.name}`,
          data: {
            entityId: project._id.toString(),
            entityType: 'project',
            projectName: project.name,
            addedBy: userId.toString(),
            addedByName: userName,
          },
        } as any);
      } catch (notifErr) {
        console.error('Failed to create member notification', notifErr);
      }
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