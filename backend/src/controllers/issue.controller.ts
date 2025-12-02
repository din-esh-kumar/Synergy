import { Request, Response } from 'express';
import Issue, { IIssue } from '../config/Issue.model';
import ProjectModel from '../config/Project.model';
import TeamModel from '../config/Team.model';
import UserModel from '../config/User.model';

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
  projectId: string;
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

    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Title and project are required',
      });
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Project not found',
      });
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
      const teamDoc = await TeamModel.findById(team);
      if (!teamDoc) {
        return res.status(400).json({
          success: false,
          message: 'Team not found',
        });
      }
    }

    const payload: Partial<IIssue> = {
      title,
      description,
      type: (type as any) || 'TASK',
      priority: (priority as any) || 'MEDIUM',
      projectId: projectId as any,
      reporter: reporterId as any,
      assignee: (assignee as any) || null,
      team: (team as any) || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    const issue = await Issue.create(payload as IIssue);

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
    const updates = req.body as Partial<IssueBody>;

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
      const teamDoc = await TeamModel.findById(updates.team);
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

    const issue = await Issue.findByIdAndUpdate(id, mappedUpdates, {
      new: true,
    })
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
      message: 'Issue updated successfully',
      data: issue,
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

    const issue = await Issue.findByIdAndDelete(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
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
