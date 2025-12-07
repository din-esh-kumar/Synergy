// backend/src/controllers/issue.controller.ts
import { Request, Response } from 'express';
import Issue from '../models/Issue.model';
import ProjectModel from '../models/Project.model';
import { Team } from '../models/Team.model';
import UserModel from '../models/User.model';
import { createNotification, notifyTeam } from '../utils/notificationEngine';

const getAuthUserId = (req: Request): string | undefined => {
  const u = (req as any).user;
  if (!u) return undefined;
  return u._id?.toString?.() || u.id || u.userId;
};

interface IssueBody {
  title: string;
  description?: string;
  type?: string;
  status?: string;
  priority?: string;
  projectId?: string;           // optional now
  assignee?: string | null;
  team?: string | null;
  dueDate?: string | null;
}

// Create Issue
export const createIssue = async (req: Request, res: Response) => {
  try {
    const reporterId = getAuthUserId(req);
    if (!reporterId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      title,
      description,
      type,
      priority,
      projectId,
      assignee,
      team,
      dueDate,
    } = req.body as IssueBody;

    // Only title is strictly required now
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    // If projectId was sent, validate it; otherwise allow global issues
    if (projectId) {
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        return res.status(400).json({
          success: false,
          message: 'Project not found',
        });
      }
    }

    if (assignee) {
      const assigneeUser = await UserModel.findById(assignee);
      if (!assigneeUser) {
        return res.status(400).json({
          success: false,
          message: 'Assignee not found',
        });
      }
    }

    if (team) {
      const teamDoc = await Team.findById(team);
      if (!teamDoc) {
        return res.status(400).json({
          success: false,
          message: 'Team not found',
        });
      }
    }

    const payload: any = {
      title,
      description,
      type: (type as any) || 'TASK',
      status: 'OPEN',
      priority: (priority as any) || 'MEDIUM',
      reporter: reporterId as any,
      assignee: (assignee as any) || null,
      team: (team as any) || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    if (projectId) {
      payload.projectId = projectId as any;
    }

    const issue = await Issue.create(payload);

// ✅ NOTIFY ASSIGNEE IF ASSIGNED
if (assignee && assignee !== reporterId) {
  await createNotification({
    userId: assignee,
    type: 'task',
    action: 'assigned',
    title: 'New issue assigned',
    message: `You have been assigned: "${title}"`,
    entityType: 'issue',
    //entityId: issue._id.toString(),
    icon: 'issue',
    color: '#3b82f6',
    actionUrl: '/issues',
  });
}

// ✅ NOTIFY TEAM MEMBERS IF TEAM SPECIFIED (exclude reporter)
if (team) {
  await notifyTeam(
    team,
    {
      type: 'team',
      action: 'created',
      title: 'New issue created',
      message: `New issue "${title}" created in your team`,
      entityType: 'issue',
      //entityId: issueIds._id.toString(),  // ← and here
      icon: 'issue',
      color: '#10b981',
    },
    reporterId,
  );
}


    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: issue,
    });
  } catch (error: any) {
    console.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating issue',
    });
  }
};

// Get Issues
export const getIssues = async (req: Request, res: Response) => {
  try {
    const { projectId, status, priority, assignee, team } = req.query;

    const filter: any = {};

    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (team) filter.team = team;

    const issues = await Issue.find(filter)
      .populate('projectId', 'name')
      .populate('reporter', 'name email')
      .populate('assignee', 'name email')
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error: any) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching issues',
    });
  }
};

// Get Issue by ID
export const getIssueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findById(id)
      .populate('projectId', 'name')
      .populate('reporter', 'name email')
      .populate('assignee', 'name email')
      .populate('team', 'name');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error: any) {
    console.error('Get issue error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching issue',
    });
  }
};

// Update Issue
export const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reporterId = getAuthUserId(req);
    const updates = req.body as Partial<IssueBody>;

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    const oldAssignee = issue.assignee?.toString();
    const oldStatus = issue.status;

    if (updates.assignee) {
      const assigneeUser = await UserModel.findById(updates.assignee);
      if (!assigneeUser) {
        return res.status(400).json({
          success: false,
          message: 'Assignee not found',
        });
      }
    }

    if (updates.team) {
      const teamDoc = await Team.findById(updates.team);
      if (!teamDoc) {
        return res.status(400).json({
          success: false,
          message: 'Team not found',
        });
      }
    }

    const mappedUpdates: any = { ...updates };

    if (updates.dueDate !== undefined) {
      mappedUpdates.dueDate = updates.dueDate
        ? new Date(updates.dueDate)
        : null;
    }

    const updatedIssue = await Issue.findByIdAndUpdate(id, mappedUpdates, {
      new: true,
    })
      .populate('projectId', 'name')
      .populate('reporter', 'name email')
      .populate('assignee', 'name email')
      .populate('team', 'name');

    if (!updatedIssue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    const updaterId = reporterId;

    // ✅ NOTIFY NEW ASSIGNEE IF REASSIGNED
    if (
      updates.assignee &&
      oldAssignee !== updates.assignee &&
      updates.assignee !== updaterId
    ) {
      await createNotification({
        userId: updates.assignee,
        type: 'task',
        action: 'assigned',
        title: 'Issue reassigned',
        message: `You have been assigned: "${updatedIssue.title}"`,
        entityType: 'issue',
        entityId: updatedIssue._id.toString(),
        icon: 'issue',
        color: '#f59e0b',
        actionUrl: '/issues',
      });
    }

    // ✅ NOTIFY ORIGINAL ASSIGNEE IF UNASSIGNED
    if (updates.assignee === null && oldAssignee && oldAssignee !== updaterId) {
      await createNotification({
        userId: oldAssignee,
        type: 'task',
        action: 'updated',
        title: 'Issue unassigned',
        message: `You are no longer assigned to "${updatedIssue.title}"`,
        entityType: 'issue',
        entityId: updatedIssue._id.toString(),
        icon: 'issue',
        color: '#ef4444',
        actionUrl: '/issues',
      });
    }

    // ✅ NOTIFY TEAM IF TEAM CHANGED
    if (updates.team && updates.team !== issue.team?.toString()) {
      await notifyTeam(
        updates.team,
        {
          type: 'team',
          action: 'updated',
          title: 'Issue updated',
          message: `Issue "${updatedIssue.title}" was updated and assigned to your team`,
          entityType: 'issue',
          entityId: updatedIssue._id.toString(),
          icon: 'issue',
          color: '#0ea5e9',
        },
        updaterId,
      );
    }

    // ✅ NOTIFY IF STATUS CHANGED TO COMPLETED
    if (
      updates.status === 'CLOSED' &&
      oldStatus !== 'CLOSED' &&
      oldAssignee &&
      oldAssignee !== updaterId
    ) {
      await createNotification({
        userId: oldAssignee,
        type: 'task',
        action: 'completed',
        title: 'Issue closed',
        message: `"${updatedIssue.title}" has been closed`,
        entityType: 'issue',
        entityId: updatedIssue._id.toString(),
        icon: 'issue',
        color: '#10b981',
        actionUrl: '/issues',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Issue updated successfully',
      data: updatedIssue,
    });
  } catch (error: any) {
    console.error('Update issue error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating issue',
    });
  }
};

// Delete Issue
export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleterId = getAuthUserId(req);

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    const assigneeId = issue.assignee?.toString();
    const teamId = issue.team?.toString();

    await Issue.findByIdAndDelete(id);

    // ✅ NOTIFY ASSIGNEE IF THEY WERE ASSIGNED
    if (assigneeId && assigneeId !== deleterId) {
      await createNotification({
        userId: assigneeId,
        type: 'task',
        action: 'deleted',
        title: 'Issue deleted',
        message: `Issue "${issue.title}" has been deleted`,
        entityType: 'issue',
        entityId: id,
        icon: 'issue',
        color: '#ef4444',
        actionUrl: '/issues',
      });
    }

    // ✅ NOTIFY TEAM IF ASSOCIATED WITH TEAM
    if (teamId) {
      await notifyTeam(
        teamId,
        {
          type: 'team',
          action: 'deleted',
          title: 'Issue deleted',
          message: `Issue "${issue.title}" was deleted from your team`,
          entityType: 'issue',
          entityId: id,
          icon: 'issue',
          color: '#ef4444',
        },
        deleterId,
      );
    }

    res.status(200).json({
      success: true,
      message: 'Issue deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete issue error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting issue',
    });
  }
};
