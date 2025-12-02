// backend/src/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../config/User.model';
import ProjectModel, { IProject } from '../config/Project.model';
import TaskModel, { ITask } from '../config/Task.model';
import Meeting from '../config/Meeting.model';
import { Issue as IssueModel } from '../config/Issue.model';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user?.id);

    const [
      totalProjects,
      totalTasks,
      totalMeetings,
      totalIssues,
      upcomingMeetings,
      recentTasks,
      tasksByStatus,
      projectsByStatus,
    ] = await Promise.all([
      ProjectModel.countDocuments({
        $or: [{ owner: userId }, { team: userId }],
      }),

      TaskModel.countDocuments({ assignedTo: userId }),

      Meeting.countDocuments({
        $or: [{ organizer: userId }, { attendees: userId }],
      }),

      IssueModel.countDocuments({ reportedBy: userId }),

      Meeting.find({
        $or: [{ organizer: userId }, { attendees: userId }],
        startTime: { $gte: new Date() },
        status: 'scheduled',
      })
        .populate('organizer', 'name email')
        .populate('attendees', 'name email')
        .sort({ startTime: 1 })
        .limit(5),

      TaskModel.find({ assignedTo: userId })
        .populate('projectId', 'name')
        .populate('assignedTo', 'name email')
        .sort({ updatedAt: -1 })
        .limit(5),

      TaskModel.aggregate([
        { $match: { assignedTo: userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysMeetings = await Meeting.countDocuments({
      $or: [{ organizer: userId }, { attendees: userId }],
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: 'scheduled',
    });

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const completedTasksThisWeek = await TaskModel.countDocuments({
      assignedTo: userId,
      status: 'COMPLETED',
      updatedAt: { $gte: startOfWeek },
    });

    res.status(200).json({
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
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message,
    });
  }
};

export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user?.id);
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const [recentTasks, recentMeetings, recentIssues] = await Promise.all([
      TaskModel.find({ assignedTo: userId })
        .sort({ updatedAt: -1 })
        .limit(Math.ceil(limit / 3))
        .populate('projectId', 'name')
        .populate('assignedTo', 'name')
        .lean(),

      Meeting.find({
        $or: [{ organizer: userId }, { attendees: userId }],
      })
        .sort({ updatedAt: -1 })
        .limit(Math.ceil(limit / 3))
        .populate('organizer', 'name')
        .lean(),

      IssueModel.find({ reportedBy: userId })
        .sort({ updatedAt: -1 })
        .limit(Math.ceil(limit / 3))
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
        new Date(b.updatedAt ?? 0).getTime() -
        new Date(a.updatedAt ?? 0).getTime()
    );

    res.status(200).json({
      success: true,
      count: activities.slice(0, limit).length,
      activities: activities.slice(0, limit),
    });
  } catch (error: any) {
    console.error('Get activity feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity feed',
      error: error.message,
    });
  }
};
