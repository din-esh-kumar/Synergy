// backend/src/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.model';
import ProjectModel from '../models/Project.model';
import TaskModel from '../models/Task.model';
import Meeting from '../models/Meeting.model';
import IssueModel from '../models/Issue.model';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const rawUserId = (req as any).user?.id || (req as any).user?._id;
    if (!rawUserId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user id missing',
      });
    }

    const userId = new mongoose.Types.ObjectId(rawUserId);

    const [
      totalProjects,
      totalTasks,
      totalMeetings,
      totalIssues,
      upcomingMeetings,
      recentTasks,
      rawTasksByStatus,
      rawProjectsByStatus,
    ] = await Promise.all([
      // Projects where user is owner or member of team
      ProjectModel.countDocuments({
        $or: [{ owner: userId }, { team: userId }],
      }),

      // Tasks assigned to user
      TaskModel.countDocuments({ assignedTo: userId }),

      // Meetings where user is organizer or attendee
      Meeting.countDocuments({
        $or: [{ organizer: userId }, { attendees: userId }],
      }),

      // Issues reported by this user
      IssueModel.countDocuments({ reportedBy: userId }),

      // Upcoming meetings (next 5)
      Meeting.find({
        $or: [{ organizer: userId }, { attendees: userId }],
        startTime: { $gte: new Date() },
        status: 'SCHEDULED', // ensure matches Meeting.model values
      })
        .populate('organizer', 'name email')
        .populate('attendees', 'name email')
        .sort({ startTime: 1 })
        .limit(5)
        .lean(),

      // Recent tasks (last 5)
      TaskModel.find({ assignedTo: userId })
        .populate('projectId', 'name')
        .populate('assignedTo', 'name email')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),

      // Task counts by status
      TaskModel.aggregate([
        { $match: { assignedTo: userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Project counts by status
      ProjectModel.aggregate([
        {
          $match: {
            $or: [{ owner: userId }, { team: userId }],
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Map aggregates to cleaner objects
    const tasksByStatus = rawTasksByStatus.map((row: any) => ({
      status: row._id,
      count: row.count,
    }));

    const projectsByStatus = rawProjectsByStatus.map((row: any) => ({
      status: row._id,
      count: row.count,
    }));

    // Today window
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysMeetings = await Meeting.countDocuments({
      $or: [{ organizer: userId }, { attendees: userId }],
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: 'SCHEDULED',
    });

    // Start of current week (Sunday)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const completedTasksThisWeek = await TaskModel.countDocuments({
      assignedTo: userId,
      status: 'COMPLETED', // ensure matches Task.model values
      updatedAt: { $gte: startOfWeek },
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        totalMeetings,
        totalIssues,
        todaysMeetings,
        completedTasksThisWeek,
        tasksByStatus,
        projectsByStatus,
      },
      upcomingMeetings,
      recentTasks,
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message,
    });
  }
};

export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const rawUserId = (req as any).user?.id || (req as any).user?._id;
    if (!rawUserId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user id missing',
      });
    }

    const userId = new mongoose.Types.ObjectId(rawUserId);
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const perTypeLimit = Math.max(1, Math.ceil(limit / 3));

    const [recentTasks, recentMeetings, recentIssues] = await Promise.all([
      TaskModel.find({ assignedTo: userId })
        .sort({ updatedAt: -1 })
        .limit(perTypeLimit)
        .populate('projectId', 'name')
        .populate('assignedTo', 'name')
        .lean(),

      Meeting.find({
        $or: [{ organizer: userId }, { attendees: userId }],
      })
        .sort({ updatedAt: -1 })
        .limit(perTypeLimit)
        .populate('organizer', 'name')
        .lean(),

      IssueModel.find({ reportedBy: userId })
        .sort({ updatedAt: -1 })
        .limit(perTypeLimit)
        .populate('projectId', 'name')
        .populate('reportedBy', 'name')
        .lean(),
    ]);

    const taskActivities = recentTasks.map((task: any) => ({
      ...task,
      activityType: 'task' as const,
    }));

    const meetingActivities = recentMeetings.map((meeting: any) => ({
      ...meeting,
      activityType: 'meeting' as const,
    }));

    const issueActivities = recentIssues.map((issue: any) => ({
      ...issue,
      activityType: 'issue' as const,
    }));

    const activities = [
      ...taskActivities,
      ...meetingActivities,
      ...issueActivities,
    ].sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
        new Date(a.updatedAt ?? a.createdAt ?? 0).getTime(),
    );

    const sliced = activities.slice(0, limit);

    return res.status(200).json({
      success: true,
      count: sliced.length,
      activities: sliced,
    });
  } catch (error: any) {
    console.error('Get activity feed error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching activity feed',
      error: error.message,
    });
  }
};
