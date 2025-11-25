import { Request, Response } from 'express';
import { User } from "../config/User.model";
import { Project } from "../config/Project.model";
import { Task } from "../config/Task.model";
import Meeting from '../config/Meeting.model';
import { Issue } from "../config/Issue.model";
import mongoose from 'mongoose';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.id);

    // Get various statistics in parallel
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
      // Total projects count
      Project.countDocuments({ 
        $or: [{ owner: userId }, { team: userId }] 
      }),

      // Total tasks count
      Task.countDocuments({ assignedTo: userId }),

      // Total meetings count
      Meeting.countDocuments({ 
        $or: [{ organizer: userId }, { attendees: userId }] 
      }),

      // Total issues count
      Issue.countDocuments({ reportedBy: userId }),

      // Upcoming meetings (next 5)
      Meeting.find({
        $or: [{ organizer: userId }, { attendees: userId }],
        startTime: { $gte: new Date() },
        status: 'scheduled',
      })
        .populate('organizer', 'name email')
        .populate('attendees', 'name email')
        .sort({ startTime: 1 })
        .limit(5),

      // Recent tasks (last 5 updated)
      Task.find({ assignedTo: userId })
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .sort({ updatedAt: -1 })
        .limit(5),

      // Task statistics by status
      Task.aggregate([
        { $match: { assignedTo: userId } },
        { 
          $group: { 
            _id: '$status', 
            count: { $sum: 1 } 
          } 
        },
      ]),

      // Project statistics by status
      Project.aggregate([
        { 
          $match: { 
            $or: [{ owner: userId }, { team: userId }] 
          } 
        },
        { 
          $group: { 
            _id: '$status', 
            count: { $sum: 1 } 
          } 
        },
      ]),
    ]);

    // Get today's meetings
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysMeetings = await Meeting.countDocuments({
      $or: [{ organizer: userId }, { attendees: userId }],
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: 'scheduled',
    });

    // Completed tasks this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const completedTasksThisWeek = await Task.countDocuments({
      assignedTo: userId,
      status: 'done',
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
      error: error.message 
    });
  }
};

export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.id);
    const limit = parseInt(req.query.limit as string) || 20;

    // Get recent activities from different collections
    const [recentTasks, recentMeetings, recentIssues] = await Promise.all([
      Task.find({ assignedTo: userId })
        .sort({ updatedAt: -1 })
        .limit(Math.ceil(limit / 3))
        .populate('project', 'name')
        .populate('assignedTo', 'name')
        .lean(),

      Meeting.find({ 
        $or: [{ organizer: userId }, { attendees: userId }] 
      })
        .sort({ updatedAt: -1 })
        .limit(Math.ceil(limit / 3))
        .populate('organizer', 'name')
        .lean(),

      Issue.find({ reportedBy: userId })
        .sort({ updatedAt: -1 })
        .limit(Math.ceil(limit / 3))
        .populate('project', 'name')
        .populate('reportedBy', 'name')
        .lean(),
    ]);

    // Add activity type to each item
    const taskActivities = recentTasks.map(task => ({
      ...task,
      activityType: 'task',
    }));

    const meetingActivities = recentMeetings.map(meeting => ({
      ...meeting,
      activityType: 'meeting',
    }));

    const issueActivities = recentIssues.map(issue => ({
      ...issue,
      activityType: 'issue',
    }));

    // Combine and sort by update date
    const activities = [
      ...taskActivities,
      ...meetingActivities,
      ...issueActivities,
    ].sort((a, b) => {
      return (
  new Date(b.updatedAt ?? 0).getTime() -
  new Date(a.updatedAt ?? 0).getTime()
     );

    });

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
      error: error.message 
    });
  }
};
