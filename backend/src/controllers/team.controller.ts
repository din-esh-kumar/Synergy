// src/controllers/team.controller.ts

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Team } from '../models/Team.model';
import Project from '../models/Project.model';
import Task from '../models/Task.model';
import { emitToRoom } from '../utils/socketEmitter';
import { createNotification, notifyTeam } from '../utils/notificationEngine';

// ============ CREATE TEAM ============
export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, description, leadId, memberIds, projectId } = req.body;
    const user = (req as any).user;

    if (!user?._id) {
      return res.status(401).json({ message: 'Unauthorized: user not found' });
    }

    const team = await Team.create({
      name,
      description,
      lead: leadId ? new Types.ObjectId(leadId) : null,
      members: (memberIds || []).map((id: string) => new Types.ObjectId(id)),
      projects: projectId ? [new Types.ObjectId(projectId)] : [],
      createdBy: user._id,
    });

    const populated = await Team.findById(team._id)
      .populate('lead', 'name email role')
      .populate('members', 'name email role')
      .populate('projects', 'title status')
      .populate('tasks', 'title status');

    // ✅ EMIT TO TEAM ROOM
    if (memberIds && memberIds.length > 0) {
      emitToRoom(`team-${team._id}`, 'team:created', {
        teamId: team._id,
        name: name,
        lead: leadId,
        members: memberIds,
        createdBy: user._id,
        timestamp: new Date(),
      });

      // ✅ NOTIFY EACH MEMBER (persist + socket)
      const otherMembers = (memberIds || []).filter(
        (uid: string) => uid && uid !== user._id.toString()
      );
      if (otherMembers.length > 0) {
        await createNotification({
          userIds: otherMembers,
          type: 'team',
          action: 'assigned',
          title: 'Added to team',
          message: `You have been added to team: ${name}`,
          entityType: 'team',
          entityId: team._id.toString(),
          icon: 'team',
          color: '#8b5cf6',
          actionUrl: '/teams',
        });
      }
    }

    return res.status(201).json(populated);
  } catch (error: any) {
    console.error('createTeam error:', error);
    return res
      .status(500)
      .json({ message: 'Failed to create team', error: error.message });
  }
};

// ============ GET ALL TEAMS ============
export const getTeams = async (req: Request, res: Response) => {
  try {
    const teams = await Team.find()
      .populate('lead', 'name email role')
      .populate('members', 'name email role')
      .populate('projects', 'title status')
      .populate('tasks', 'title status');
    res.json(teams);
  } catch (error: any) {
    console.error('getTeams error:', error);
    res
      .status(500)
      .json({ message: 'Failed to fetch teams', error: error.message });
  }
};

// ============ GET MY TEAMS ============
export const getMyTeams = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const teams = await Team.find({
      members: new Types.ObjectId(userId),
    })
      .populate('lead', 'name email role')
      .populate('members', 'name email role')
      .populate('projects', 'title status')
      .populate('tasks', 'title status');
    return res.json(teams);
  } catch (error: any) {
    console.error('getMyTeams error:', error);
    return res
      .status(500)
      .json({ message: 'Failed to fetch user teams', error: error.message });
  }
};

// ============ GET SINGLE TEAM ============
export const getTeamById = async (req: Request, res: Response) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('lead', 'name email role')
      .populate('members', 'name email role')
      .populate('projects', 'title status')
      .populate('tasks', 'title status');
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (error: any) {
    console.error('getTeamById error:', error);
    res
      .status(500)
      .json({ message: 'Failed to fetch team', error: error.message });
  }
};

// ============ UPDATE TEAM ============
export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { name, description, leadId, memberIds, projectId } = req.body as {
      name?: string;
      description?: string;
      leadId?: string;
      memberIds?: string[];
      projectId?: string;
    };

    const userId = (req as any).user._id.toString();

    const oldTeam = await Team.findById(req.params.id);
    if (!oldTeam) return res.status(404).json({ message: 'Team not found' });

    const oldMemberIds = oldTeam.members.map((m: any) => m.toString());

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (leadId !== undefined)
      update.lead = leadId ? new Types.ObjectId(leadId) : null;
    if (memberIds !== undefined) {
      update.members = memberIds.map((id) => new Types.ObjectId(id));
    }
    if (projectId !== undefined) {
      update.projects = projectId ? [new Types.ObjectId(projectId)] : [];
    }

    const team = await Team.findByIdAndUpdate(req.params.id, update, {
      new: true,
    })
      .populate('lead', 'name email role')
      .populate('members', 'name email role')
      .populate('projects', 'title status')
      .populate('tasks', 'title status');

    if (!team) return res.status(404).json({ message: 'Team not found' });

    // ✅ EMIT UPDATE EVENT
    emitToRoom(`team-${team._id}`, 'team:updated', {
      teamId: team._id,
      name: team.name,
      updatedAt: new Date(),
    });

    // ✅ NOTIFY TEAM MEMBERS ABOUT UPDATE (exclude updater)
    await notifyTeam(team._id.toString(), {
      type: 'team',
      action: 'updated',
      title: 'Team updated',
      message: `Team "${team.name}" was updated`,
      entityType: 'team',
      entityId: team._id.toString(),
      icon: 'team',
      color: '#0ea5e9',
      actionUrl: '/teams',
    }, userId);

    // ✅ NOTIFY NEWLY ADDED MEMBERS
    if (memberIds && Array.isArray(memberIds)) {
      const newMemberIds = memberIds.map((id: string) => id.toString());
      const addedMembers = newMemberIds.filter(
        (id) => !oldMemberIds.includes(id) && id !== userId
      );
      if (addedMembers.length > 0) {
        await createNotification({
          userIds: addedMembers,
          type: 'team',
          action: 'assigned',
          title: 'Added to team',
          message: `You have been added to team: ${team.name}`,
          entityType: 'team',
          entityId: team._id.toString(),
          icon: 'team',
          color: '#8b5cf6',
          actionUrl: '/teams',
        });
      }
    }

    res.json(team);
  } catch (error: any) {
    console.error('updateTeam error:', error);
    res
      .status(500)
      .json({ message: 'Failed to update team', error: error.message });
  }
};

// ============ DELETE TEAM ============
export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const deleterId = (req as any).user._id.toString();
    const memberIds = team.members.map((m: any) => m.toString());

    await Team.findByIdAndDelete(req.params.id);

    // ✅ EMIT DELETE EVENT
    emitToRoom(`team-${team._id}`, 'team:deleted', {
      teamId: team._id,
      timestamp: new Date(),
    });

    // ✅ NOTIFY TEAM MEMBERS ABOUT DELETION (exclude deleter)
    if (memberIds.length > 0) {
      await createNotification({
        userIds: memberIds.filter((id) => id !== deleterId),
        type: 'team',
        action: 'deleted',
        title: 'Team deleted',
        message: `Team "${team.name}" has been deleted`,
        entityType: 'team',
        entityId: team._id.toString(),
        icon: 'team',
        color: '#ef4444',
        actionUrl: '/teams',
      });
    }

    res.json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    console.error('deleteTeam error:', error);
    res
      .status(500)
      .json({ message: 'Failed to delete team', error: error.message });
  }
};

// ============ UPDATE TEAM MEMBERS ============
export const updateTeamMembers = async (req: Request, res: Response) => {
  try {
    const { memberIds } = req.body as { memberIds: string[] };
    const user = (req as any).user;
    const userId = user._id.toString();

    const oldTeam = await Team.findById(req.params.id);
    const oldMemberIds = oldTeam?.members.map((m: any) => m.toString()) || [];
    const newMemberIds = memberIds || [];
    const addedMembers = newMemberIds.filter(
      (id) => !oldMemberIds.includes(id)
    );

    const membersObjectIds = (memberIds || []).map(
      (id) => new Types.ObjectId(id)
    );

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { members: membersObjectIds },
      { new: true }
    )
      .populate('lead', 'name email role')
      .populate('members', 'name email role')
      .populate('projects', 'title status')
      .populate('tasks', 'title status');

    if (!team) return res.status(404).json({ message: 'Team not found' });

    // ✅ NOTIFY NEWLY ADDED MEMBERS (persist + socket)
    if (addedMembers.length > 0) {
      const notifyMembers = addedMembers.filter((uid: string) => uid !== userId);
      if (notifyMembers.length > 0) {
        await createNotification({
          userIds: notifyMembers,
          type: 'team',
          action: 'assigned',
          title: 'Added to team',
          message: `You have been added to team: ${team.name}`,
          entityType: 'team',
          entityId: team._id.toString(),
          icon: 'team',
          color: '#8b5cf6',
          actionUrl: '/teams',
        });
      }
    }

    res.json(team);
  } catch (error: any) {
    console.error('updateTeamMembers error:', error);
    res.status(500).json({
      message: 'Failed to update team members',
      error: error.message,
    });
  }
};

// ============ ASSIGN PROJECTS TO TEAM ============
export const assignProjectsToTeam = async (req: Request, res: Response) => {
  try {
    const { projectIds } = req.body as { projectIds: string[] };
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const userId = (req as any).user._id.toString();

    if (projectIds && projectIds.length > 0) {
      const count = await Project.countDocuments({ _id: { $in: projectIds } });
      if (count !== projectIds.length) {
        return res.status(400).json({ message: 'Some projects not found' });
      }

      const projectObjectIds = (projectIds || []).map(
        (id) => new Types.ObjectId(id)
      );

      team.projects = projectObjectIds;
      await team.save();

      // ✅ NOTIFY TEAM ABOUT NEW PROJECT ASSIGNMENT
      await notifyTeam(team._id.toString(), {
        type: 'team',
        action: 'assigned',
        title: 'Projects assigned to team',
        message: `${projectIds.length} project(s) assigned to your team`,
        entityType: 'project',
        entityId: projectIds[0],
        icon: 'project',
        color: '#22c55e',
      }, userId);
    }

    const populated = await Team.findById(team._id)
      .populate('lead', 'name email role')
      .populate('members', 'name email role')
      .populate('projects', 'title status')
      .populate('tasks', 'title status');
    res.json(populated);
  } catch (error: any) {
    console.error('assignProjectsToTeam error:', error);
    res.status(500).json({
      message: 'Failed to assign projects',
      error: error.message,
    });
  }
};

// ============ ASSIGN TASKS TO TEAM ============
export const assignTasksToTeam = async (req: Request, res: Response) => {
  try {
    const { taskIds } = req.body as { taskIds: string[] };
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const userId = (req as any).user._id.toString();

    if (taskIds && taskIds.length > 0) {
      const count = await Task.countDocuments({ _id: { $in: taskIds } });
      if (count !== taskIds.length) {
        return res.status(400).json({ message: 'Some tasks not found' });
      }

      const taskObjectIds = (taskIds || []).map(
        (id) => new Types.ObjectId(id)
      );

      team.tasks = taskObjectIds;
      await team.save();

      // ✅ NOTIFY TEAM ABOUT NEW TASK ASSIGNMENT
      await notifyTeam(team._id.toString(), {
        type: 'team',
        action: 'assigned',
        title: 'Tasks assigned to team',
        message: `${taskIds.length} task(s) assigned to your team`,
        entityType: 'task',
        entityId: taskIds[0],
        icon: 'task',
        color: '#3b82f6',
      }, userId);
    }

    const populated = await Team.findById(team._id)
      .populate('lead', 'name email role')
      .populate('members', 'name email role')
      .populate('projects', 'title status')
      .populate('tasks', 'title status');
    res.json(populated);
  } catch (error: any) {
    console.error('assignTasksToTeam error:', error);
    res
      .status(500)
      .json({ message: 'Failed to assign tasks', error: error.message });
  }
};
