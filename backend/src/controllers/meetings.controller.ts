import { Request, Response } from 'express';
import Meeting from '../config/Meeting.model';
import User from '../config/User.model';
import { Notification } from '../config/Notification.model';

// helper to get current user id safely
const getAuthUserId = (req: Request): string | undefined => {
  const u = (req as any).user;
  if (!u) return undefined;
  return u._id?.toString?.() || u.id || u.userId;
};

// Create a new meeting
export const createMeeting = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      joinLink,
      attendees,
    } = req.body;

    const organizerId = getAuthUserId(req);
    const organizerName =
      (req as any).user?.name ||
      (req as any).user?.fullName ||
      (req as any).user?.email ||
      'Organizer';

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    if (attendees && attendees.length > 0) {
      const existingUsers = await User.find({ _id: { $in: attendees } });
      if (existingUsers.length !== attendees.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more attendees not found',
        });
      }
    }

    const meeting = new Meeting({
      title,
      description,
      startTime: start,
      endTime: end,
      location,
      joinLink,
      organizer: organizerId,
      attendees: attendees || [],
    });

    await meeting.save();
    await meeting.populate('organizer attendees', 'name email');

    // attendee notifications
    if (Array.isArray(attendees) && attendees.length > 0) {
      const attendeeIds = attendees
        .map((id: any) => id?.toString?.() || id)
        .filter((id: string) => !!id && id !== organizerId);

      if (attendeeIds.length > 0) {
        const docs = attendeeIds.map((uid) => ({
          userId: uid,
          type: 'meeting' as const,
          title: 'New meeting scheduled',
          message: `You have been invited to "${meeting.title}".`,
          data: {
            entityId: meeting._id.toString(),
            entityType: 'meeting',
            status: 'success',
            organizerId,
            organizerName,
          },
        }));

        try {
          await Notification.insertMany(docs);
        } catch (notifErr) {
          console.error('Failed to create attendee notifications:', notifErr);
        }
      }
    }

    // organizer notification
    try {
      await Notification.create({
        userId: organizerId,
        type: 'meeting' as const,
        title: 'Meeting created',
        message: `Your meeting "${meeting.title}" was created successfully.`,
        data: {
          entityId: meeting._id.toString(),
          entityType: 'meeting',
          status: 'success',
        },
      });
    } catch (notifErr) {
      console.error('Failed to create organizer notification:', notifErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting,
    });
  } catch (error: any) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating meeting',
      error: error.message,
    });
  }
};

// Get all meetings with filters
export const getMeetings = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const { status, startDate, endDate, search } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const query: any = {
      $or: [{ organizer: userId }, { attendees: userId }],
    };

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } },
          { location: { $regex: search as string, $options: 'i' } },
        ],
      });
    }

    const meetings = await Meeting.find(query)
      .populate('organizer attendees', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    console.error('Get meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meetings',
      error: error.message,
    });
  }
};

// Get single meeting by ID
export const getMeetingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const meeting: any = await Meeting.findById(id).populate(
      'organizer attendees',
      'name email'
    );

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    const hasAccess =
      meeting.organizer._id.toString() === userId ||
      meeting.attendees.some(
        (attendee: any) => attendee._id.toString() === userId
      );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.status(200).json({
      success: true,
      meeting,
    });
  } catch (error: any) {
    console.error('Get meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meeting',
      error: error.message,
    });
  }
};

// Update meeting
export const updateMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const meeting: any = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    if (meeting.organizer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the organizer can update this meeting',
      });
    }

    if (updates.startTime || updates.endTime) {
      const startTime = updates.startTime
        ? new Date(updates.startTime)
        : meeting.startTime;
      const endTime = updates.endTime
        ? new Date(updates.endTime)
        : meeting.endTime;

      if (startTime >= endTime) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time',
        });
      }
    }

    if (updates.attendees && updates.attendees.length > 0) {
      const existingUsers = await User.find({
        _id: { $in: updates.attendees },
      });
      if (existingUsers.length !== updates.attendees.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more attendees not found',
        });
      }
    }

    Object.assign(meeting, updates);
    await meeting.save();
    await meeting.populate('organizer attendees', 'name email');

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      meeting,
    });
  } catch (error: any) {
    console.error('Update meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating meeting',
      error: error.message,
    });
  }
};

// Delete meeting
export const deleteMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const meeting: any = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    if (meeting.organizer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the organizer can delete this meeting',
      });
    }

    await meeting.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting meeting',
      error: error.message,
    });
  }
};

// Get upcoming meetings
export const getUpcomingMeetings = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const limit = parseInt(req.query.limit as string) || 10;
    const now = new Date();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const meetings = await Meeting.find({
      $or: [{ organizer: userId }, { attendees: userId }],
      startTime: { $gte: now },
    })
      .populate('organizer attendees', 'name email')
      .sort({ startTime: 1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    console.error('Get upcoming meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming meetings',
      error: error.message,
    });
  }
};

// Get meetings for calendar view (monthly)
export const getMonthlyMeetings = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const { year, month } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required',
      });
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const meetings = await Meeting.find({
      $or: [{ organizer: userId }, { attendees: userId }],
      startTime: { $gte: startDate, $lte: endDate },
    })
      .populate('organizer attendees', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    console.error('Get monthly meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly meetings',
      error: error.message,
    });
  }
};
